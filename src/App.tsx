/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Plus, 
  MessageSquare, 
  User, 
  Leaf, 
  Menu, 
  X, 
  ChevronRight,
  Sparkles,
  Info,
  AlertCircle,
  Settings,
  Activity,
  Trash2,
  Square,
  Copy,
  Check,
  GraduationCap,
  Stethoscope,
  Moon,
  Sun,
  LogOut,
  Coins,
  Crown,
  PlayCircle
} from 'lucide-react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { gemini } from './services/gemini';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Auth/Login';
import { DeleteConfirmModal } from './components/Modals/DeleteConfirmModal';
import { motion, AnimatePresence } from 'motion/react';
import { AdComponent } from './components/Ads/AdComponent';
import { InterstitialAd } from './components/Ads/InterstitialAd';
import { SliderAd } from './components/Ads/SliderAd';
import { PaymentModal } from './components/Modals/PaymentModal';
import { BrandLogo } from './components/BrandLogo';

const sliderAds = [
  {
    id: '1',
    title: 'Pure Ayurvedic Herbs',
    description: 'Discover the power of nature with our ethically sourced Ayurvedic herbs.',
    image: 'https://picsum.photos/seed/herbs/400/300',
    link: '#'
  },
  {
    id: '2',
    title: 'Wellness Consultation',
    description: 'Book a session with our expert Ayurvedic practitioners today.',
    image: 'https://picsum.photos/seed/consult/400/300',
    link: '#'
  },
  {
    id: '3',
    title: 'AyurAi Pro',
    description: 'Get unlimited access and ad-free experience for just ₹99/month.',
    image: 'https://picsum.photos/seed/pro/400/300',
    link: '#'
  }
];

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  mode: 'education' | 'clinical';
}

export default function App() {
  const { user, userProfile, loading, error: authError, storageMode, logout, updateCoins, upgradeToPro, resetDailyCoins } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: '1', title: 'New Chat', messages: [], mode: 'education' }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('1');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<'education' | 'clinical'>('education');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [interstitialType, setInterstitialType] = useState<'reward' | 'interstitial'>('interstitial');
  const [interstitialDuration, setInterstitialDuration] = useState(15);
  const [showErrorBanner, setShowErrorBanner] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isPro = userProfile?.subscription === 'pro';
  const coins = userProfile?.coins ?? 20;

  // Handle Payment Redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    
    if (paymentStatus === 'success') {
      // In a real app, we'd verify the session ID here
      upgradeToPro();
      // Clear the URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      alert("Success! You are now a Pro member. Enjoy unlimited Ayurvedic wisdom.");
    } else if (paymentStatus === 'failed') {
      window.history.replaceState({}, document.title, window.location.pathname);
      alert("Payment failed or was cancelled. You are still on the Free plan.");
    }
  }, [user]);

  // Reset coins daily
  useEffect(() => {
    if (user && userProfile) {
      const today = new Date().toISOString().split('T')[0];
      if (userProfile.lastCoinReset !== today) {
        resetDailyCoins();
      }
    }
  }, [user, userProfile?.lastCoinReset]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions.find(s => s.mode === aiMode) || sessions[0];

  const handleModeSwitch = (newMode: 'education' | 'clinical') => {
    setAiMode(newMode);
    const modeSessions = sessions.filter(s => s.mode === newMode);
    if (modeSessions.length > 0) {
      setActiveSessionId(modeSessions[0].id);
    } else {
      const newId = Date.now().toString();
      const defaultTitle = newMode === 'education' ? 'New Chat' : 'New Consultation';
      setSessions(prev => [{ id: newId, title: defaultTitle, messages: [], mode: newMode }, ...prev]);
      setActiveSessionId(newId);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession.messages, isLoading]);

  // Open sidebar by default on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Coin check for free users
    if (!isPro && coins <= 0) {
      setInterstitialType('reward');
      setInterstitialDuration(30);
      setShowInterstitial(true);
      return;
    }

    // Interstitial ad check for free users (every 5 questions)
    if (!isPro && questionCount > 0 && questionCount % 5 === 0) {
      setInterstitialType('interstitial');
      setInterstitialDuration(15);
      setShowInterstitial(true);
      setQuestionCount(prev => prev + 1); // Increment so we don't loop on the same question
      return;
    }

    const isFirstMessage = activeSession.messages.length === 0;
    const currentInput = input;

    // Deduct coin for free users
    if (!isPro) {
      updateCoins(coins - 1);
      setQuestionCount(prev => prev + 1);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      timestamp: Date.now()
    };

    const updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [...s.messages, userMessage] };
      }
      return s;
    });

    setSessions(updatedSessions);
    setInput('');
    setIsLoading(true);
    
    abortControllerRef.current = new AbortController();

    // Generate dynamic title if it's the first message
    if (isFirstMessage) {
      const tempTitle = currentInput.slice(0, 30) + (currentInput.length > 30 ? '...' : '');
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title: tempTitle } : s));
      
      gemini.generateTitle(currentInput).then(aiTitle => {
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title: aiTitle } : s));
      });
    }

    try {
      const history = activeSession.messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      let fullResponse = '';
      const modelMessageId = (Date.now() + 1).toString();
      
      // Add initial empty model message
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { 
            ...s, 
            messages: [...s.messages, { id: modelMessageId, role: 'model', content: '', timestamp: Date.now() }] 
          };
        }
        return s;
      }));

      const stream = gemini.chatStream(currentInput, history, aiMode, abortControllerRef.current.signal);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            const newMessages = [...s.messages];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.id === modelMessageId) {
              lastMsg.content = fullResponse;
            }
            return { ...s, messages: newMessages };
          }
          return s;
        }));
      }

    } catch (error) {
      console.error('Chat error:', error);
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { 
            ...s, 
            messages: [...s.messages, { 
              id: Date.now().toString(), 
              role: 'model', 
              content: 'I apologize, but I encountered an error. Please try again.', 
              timestamp: Date.now() 
            }] 
          };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createNewSession = () => {
    const newId = Date.now().toString();
    const defaultTitle = aiMode === 'education' ? 'New Chat' : 'New Consultation';
    setSessions(prev => [{ id: newId, title: defaultTitle, messages: [], mode: aiMode }, ...prev]);
    setActiveSessionId(newId);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      const modeSessions = filtered.filter(s => s.mode === aiMode);
      
      if (modeSessions.length === 0) {
        const newId = Date.now().toString();
        setActiveSessionId(newId);
        return [{ id: newId, title: 'New Chat', messages: [], mode: aiMode }, ...filtered];
      }
      if (activeSessionId === id) {
        setActiveSessionId(modeSessions[0].id);
      }
      return filtered;
    });
  };

  const educationSuggestions = [
    "What is the history of Ayurveda?",
    "Explain the concept of Tridosha.",
    "What are the five elements (Panchamahabhuta)?",
    "How does Ayurveda view the mind?"
  ];

  const clinicalSuggestions = [
    "I have a headache and poor digestion.",
    "I'm feeling very anxious and having trouble sleeping.",
    "I want to consult about my skin issues.",
    "I have joint pain that gets worse in the cold."
  ];

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-ayur-bg">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-16 h-16 rounded-full bg-ayur-accent/20 flex items-center justify-center"
        >
          <Leaf className="text-ayur-accent" size={32} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-ayur-bg text-ayur-text font-sans">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        id="sidebar"
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-ayur-sidebar border-r border-ayur-border md:relative shadow-2xl md:shadow-none flex flex-col"
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Branding */}
          <BrandLogo 
            className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 px-1 md:px-2 mt-1 md:mt-2"
            icon={Leaf}
            iconClassName="text-ayur-accent md:w-5 md:h-5"
            iconContainerClassName="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-ayur-accent/10 flex items-center justify-center"
            textClassName="font-serif font-bold text-xl md:text-2xl tracking-tight text-ayur-accent"
          />

          {/* Mode Switcher */}
          <div className="flex bg-ayur-bg/50 p-1 rounded-xl mb-4 md:mb-6 border border-ayur-border/50">
            <button
              onClick={() => handleModeSwitch('education')}
              className={cn(
                "flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-lg transition-all",
                aiMode === 'education' ? "bg-ayur-surface shadow-sm text-ayur-accent" : "text-ayur-text/50 hover:text-ayur-text"
              )}
            >
              Education
            </button>
            <button
              onClick={() => handleModeSwitch('clinical')}
              className={cn(
                "flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-lg transition-all",
                aiMode === 'clinical' ? "bg-ayur-surface shadow-sm text-ayur-accent" : "text-ayur-text/50 hover:text-ayur-text"
              )}
            >
              Clinical
            </button>
          </div>

          {/* New Chat Button */}
          <button 
            onClick={createNewSession}
            className="w-full flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-ayur-surface border border-ayur-border-strong rounded-xl hover:bg-ayur-hover hover:border-ayur-accent/30 transition-all text-xs md:text-sm font-medium shadow-sm mb-4 md:mb-6 group"
          >
            <Plus size={14} className="text-ayur-accent group-hover:rotate-90 transition-transform duration-300 md:w-4 md:h-4" />
            <span>{aiMode === 'education' ? 'New Chat' : 'New Consultation'}</span>
          </button>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
            <div className="flex items-center justify-between px-2 mb-3">
              <h3 className="text-[10px] font-bold text-ayur-text/40 uppercase tracking-widest">Recent Sessions</h3>
              <span className="text-[9px] bg-ayur-accent/10 text-ayur-accent px-1.5 py-0.5 rounded-full font-bold">{sessions.filter(s => s.mode === aiMode).length}</span>
            </div>
            {sessions.filter(s => s.mode === aiMode).map((session) => (
              <div 
                key={session.id}
                className={cn(
                  "group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                  activeSessionId === session.id 
                    ? "bg-ayur-accent/10 text-ayur-accent font-medium border border-ayur-accent/20" 
                    : "hover:bg-ayur-hover text-ayur-text/70 border border-transparent"
                )}
                onClick={() => {
                  setActiveSessionId(session.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={14} className={activeSessionId === session.id ? "text-ayur-accent" : "text-ayur-text/40"} />
                  <span className="truncate text-sm">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSessionToDelete(session.id);
                  }}
                  className={cn(
                    "p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100",
                    activeSessionId === session.id && "opacity-100 text-ayur-text/40"
                  )}
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Ad in Sidebar */}
          {!isPro && (
            <div className="mt-4 px-2">
              <AdComponent slot="sidebar-ad" format="rectangle" />
            </div>
          )}

          {/* User Profile & Subscription */}
          <div className="pt-3 md:pt-4 border-t border-ayur-border mt-auto">
            {!isPro && (
              <div className="mb-3 md:mb-4 p-3 md:p-4 bg-gradient-to-br from-ayur-accent/10 to-transparent rounded-2xl border border-ayur-accent/20">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="flex items-center gap-1.5 md:gap-2 text-ayur-accent">
                    <Coins size={14} className="md:w-4 md:h-4" />
                    <span className="text-xs md:text-sm font-bold">{coins} Coins</span>
                  </div>
                  <button 
                    onClick={() => {
                      setInterstitialType('reward');
                      setInterstitialDuration(30);
                      setShowInterstitial(true);
                    }}
                    className="text-[9px] md:text-[10px] bg-ayur-accent text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg font-bold hover:scale-105 transition-transform flex items-center gap-1"
                  >
                    <PlayCircle size={10} />
                    Get Coins
                  </button>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-2 md:py-2.5 bg-ayur-accent text-white rounded-xl text-[10px] md:text-xs font-bold shadow-lg shadow-ayur-accent/20 hover:bg-ayur-accent-dark transition-all flex items-center justify-center gap-1.5 md:gap-2"
                >
                  <Crown size={12} className="md:w-3.5 md:h-3.5" />
                  Upgrade to Pro (₹99/mo)
                </button>
              </div>
            )}
            
            {isPro && (
              <div className="mb-3 md:mb-4 p-3 md:p-4 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-2xl border border-yellow-500/20">
                <div className="flex items-center gap-2 text-yellow-600 font-bold text-xs md:text-sm">
                  <Crown size={14} className="md:w-4 md:h-4" />
                  Pro Member
                </div>
                <p className="text-[9px] md:text-[10px] text-yellow-600/60 mt-1 uppercase tracking-widest font-bold">Unlimited Access</p>
              </div>
            )}

            <div className="flex flex-col gap-2 w-full p-2.5 md:p-3 rounded-xl bg-ayur-surface border border-ayur-border-strong shadow-sm">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-ayur-accent/10 flex items-center justify-center text-ayur-accent shadow-inner shrink-0 overflow-hidden border border-ayur-accent/20">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={16} className="md:w-[18px] md:h-[18px]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-semibold text-xs md:text-sm text-ayur-text">
                    {userProfile?.name || user.displayName || user.email?.split('@')[0] || user.phoneNumber || 'User'}
                  </div>
                  <div className="truncate text-[10px] md:text-[11px] text-ayur-text/60 font-medium mt-0.5">
                    {userProfile?.profession ? `${userProfile.profession}` : 'Member'}
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className="p-1.5 md:p-2 text-ayur-text/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={14} className="md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-ayur-surface md:bg-ayur-bg md:rounded-l-[2rem] md:shadow-[-20px_0_40px_rgba(0,0,0,0.03)] md:border-l border-ayur-border">
        {/* Error Banner */}
        <AnimatePresence>
          {(authError || storageMode === 'local') && showErrorBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "text-white text-[10px] md:text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 z-50 relative",
                storageMode === 'local' ? "bg-amber-500" : "bg-red-500"
              )}
            >
              <AlertCircle size={14} className="shrink-0" />
              <span className="flex-1">
                {storageMode === 'local' 
                  ? "Cloud Sync Disabled (Local Mode). Your data is safe in this browser." 
                  : authError}
              </span>
              <button 
                onClick={() => {
                  alert("To enable Cloud Sync, update your Firestore Security Rules:\n\nmatch /users/{userId} {\n  allow read, write: if request.auth != null && request.auth.uid == userId;\n}");
                }}
                className="underline hover:text-white/80 transition-colors"
              >
                How to fix?
              </button>
              <button 
                onClick={() => setShowErrorBanner(false)}
                className="p-1 hover:bg-white/20 rounded-md transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="shrink-0 h-16 md:h-20 border-b border-ayur-border flex items-center justify-between px-4 md:px-8 bg-ayur-surface/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 hover:bg-ayur-hover rounded-xl transition-colors md:hidden text-ayur-text"
              title="Toggle Menu"
            >
              <Menu size={20} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-ayur-accent/10 flex items-center justify-center hidden sm:flex">
              <Leaf className="text-ayur-accent" size={20} />
            </div>
            <div>
              <BrandLogo textClassName="font-serif font-bold text-xl md:text-2xl tracking-tight text-ayur-accent" />
              <p className="text-[10px] md:text-[11px] text-ayur-text/50 font-bold uppercase tracking-widest">
                {aiMode === 'education' ? 'Education Mode' : 'Clinical Mode'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 hover:bg-ayur-hover rounded-xl transition-colors text-ayur-text/60 hover:text-ayur-accent"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2.5 hover:bg-ayur-hover rounded-xl transition-colors text-ayur-text/60 hover:text-ayur-accent hidden md:flex" title="Information">
              <Info size={20} />
            </button>
          </div>
        </header>

        {/* Small Banner Ad above chat */}
        {!isPro && (
          <div className="shrink-0 px-4 pt-2">
            <div className="max-w-4xl mx-auto">
              <AdComponent slot="top-banner-ad" format="fluid" style={{ display: 'block', height: '60px', minHeight: '60px' }} />
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto scroll-smooth pb-12 md:pb-20">
          <AnimatePresence mode="wait">
            {activeSession.messages.length === 0 ? (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="min-h-full flex flex-col items-center justify-center p-4 md:p-6 text-center max-w-2xl mx-auto"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[2rem] bg-ayur-accent/10 flex items-center justify-center text-ayur-accent mb-4 md:mb-6 shadow-inner rotate-3">
                  <Sparkles size={24} className="-rotate-3 md:w-7 md:h-7" />
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold mb-3 md:mb-4 text-ayur-accent">
                  {aiMode === 'education' ? 'Explore Ayurvedic Wisdom' : 'How can I assist your wellness today?'}
                </h2>
                <p className="text-sm md:text-[15px] text-ayur-text/70 mb-8 md:mb-10 max-w-md leading-relaxed px-4 font-medium">
                  {aiMode === 'education' 
                    ? 'Learn about the history, philosophy, and foundational concepts of Ayurveda.'
                    : 'Start a conversation to begin your personalized Ayurvedic wellness consultation.'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 w-full max-w-xl px-2">
                  {(aiMode === 'education' ? educationSuggestions : clinicalSuggestions).slice(0, 4).map((suggestion, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => setInput(suggestion)}
                      className="p-3 md:p-4 text-left rounded-2xl border border-ayur-border bg-ayur-surface hover:bg-ayur-sidebar hover:border-ayur-accent/30 hover:shadow-md transition-all text-xs md:text-sm group flex items-center justify-between"
                    >
                      <span className="text-ayur-text/80 font-medium line-clamp-2 pr-4">{suggestion}</span>
                      <ChevronRight size={14} className="text-ayur-accent opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 shrink-0 md:w-4 md:h-4" />
                    </motion.button>
                  ))}
                </div>

                {/* Slider Ad in Empty State */}
                {!isPro && (
                  <div className="mt-12 w-full max-w-xl px-2">
                    <SliderAd ads={sliderAds} />
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="max-w-4xl mx-auto py-8 px-4 md:px-6 space-y-8">
                {activeSession.messages.map((message, index) => (
                  <React.Fragment key={message.id}>
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex gap-4 md:gap-6",
                        message.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 flex items-center justify-center text-white shadow-md mt-1",
                        message.role === 'user' ? "bg-ayur-text" : "bg-ayur-accent"
                      )}>
                        {message.role === 'user' ? <User size={16} className="md:w-5 md:h-5" /> : <Leaf size={16} className="md:w-5 md:h-5" />}
                      </div>
                      <div className={cn(
                        "flex-1 max-w-[88%] md:max-w-[80%] rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-sm",
                        message.role === 'user' 
                          ? "bg-ayur-surface border border-ayur-border-strong text-ayur-text rounded-tr-sm" 
                          : "bg-ayur-accent/5 border border-ayur-accent/10 rounded-tl-sm"
                      )}>
                        <div className="markdown-body">
                          <Markdown>{message.content}</Markdown>
                        </div>
                        {message.role === 'model' && message.content && (
                          <div className="mt-4 flex justify-end">
                            <button 
                              onClick={() => copyToClipboard(message.id, message.content)} 
                              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ayur-text/40 hover:text-ayur-accent transition-colors p-2 rounded-lg hover:bg-ayur-accent/10"
                            >
                              {copiedId === message.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                              {copiedId === message.id ? <span className="text-green-500">Copied</span> : "Copy"}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Ad in Chat Flow (Every 2 messages for free users) */}
                    {!isPro && index > 0 && index % 2 === 0 && (
                      <div className="max-w-2xl mx-auto py-4">
                        <AdComponent slot="chat-ad" format="fluid" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-4 md:gap-6"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-ayur-accent shrink-0 flex items-center justify-center text-white shadow-md mt-1">
                      <Leaf size={16} className="md:w-5 md:h-5" />
                    </div>
                    <div className="flex-1 pt-3 md:pt-4">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-ayur-accent/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-ayur-accent/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-ayur-accent/40 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} className="h-4 md:h-8" />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-4 md:p-6 bg-ayur-surface border-t border-ayur-border z-10">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative group shadow-lg shadow-ayur-border-strong/20 rounded-[2rem] bg-ayur-surface border border-ayur-border-strong focus-within:border-ayur-accent/40 focus-within:ring-4 focus-within:ring-ayur-accent/10 transition-all">
              <textarea
                id="chat-input"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask AyurAi anything..."
                className="w-full p-4 md:p-5 pr-14 md:pr-16 rounded-[2rem] focus:outline-none resize-none bg-transparent text-[15px] md:text-base text-ayur-text placeholder:text-ayur-text/40"
                style={{ minHeight: '60px', maxHeight: '200px' }}
              />
              {isLoading ? (
                <button
                  id="stop-btn"
                  onClick={stopGeneration}
                  className="absolute right-2 md:right-3 bottom-2 md:bottom-3 p-2.5 md:p-3 rounded-xl transition-all bg-red-500 text-white shadow-md hover:scale-105 active:scale-95"
                  title="Stop generating"
                >
                  <Square size={18} className="md:w-5 md:h-5" fill="currentColor" />
                </button>
              ) : (
                <button
                  id="send-btn"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={cn(
                    "absolute right-2 md:right-3 bottom-2 md:bottom-3 p-2.5 md:p-3 rounded-xl transition-all",
                    input.trim() 
                      ? "bg-ayur-accent text-white shadow-md hover:scale-105 active:scale-95" 
                      : "bg-ayur-hover text-ayur-text/30"
                  )}
                >
                  <Send size={18} className="md:w-5 md:h-5" />
                </button>
              )}
            </div>
            <p className="text-[10px] md:text-[11px] text-center mt-3 md:mt-4 text-ayur-text/50 font-medium tracking-wide px-2">
              AyurAi can provide general Ayurvedic wisdom but is not a substitute for professional medical advice.
            </p>
          </div>
        </div>
      </main>

      {/* Modals */}
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        userId={user?.uid || ''}
        userEmail={user?.email || ''}
        onSuccess={() => {
          setShowPaymentModal(false);
          upgradeToPro();
        }}
      />

      <DeleteConfirmModal 
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={() => {
          if (sessionToDelete) {
            deleteSession(sessionToDelete);
          }
        }}
        title={sessions.find(s => s.id === sessionToDelete)?.title}
      />
    </div>
  );
}
