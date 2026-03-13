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
  PlayCircle,
  Download
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import { InChatAd } from './components/Ads/InChatAd';
import { CompactAd } from './components/Ads/CompactAd';
import { PaymentModal } from './components/Modals/PaymentModal';
import { BrandLogo } from './components/BrandLogo';

// Add PWA install prompt logic
interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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

const chatAds = [
  {
    title: "Organic Ashwagandha",
    description: "Reduce stress and boost energy with our premium organic Ashwagandha capsules.",
    image: "https://picsum.photos/seed/ashwagandha/400/400",
    cta: "Shop Now",
    link: "#"
  },
  {
    title: "Ayurvedic Detox Tea",
    description: "Cleanse your body naturally with our blend of 12 sacred Himalayan herbs.",
    image: "https://picsum.photos/seed/tea/400/400",
    cta: "Get 20% Off",
    link: "#"
  },
  {
    title: "Personalized Dosha Kit",
    description: "Everything you need to balance your specific Vata, Pitta, or Kapha constitution.",
    image: "https://picsum.photos/seed/kit/400/400",
    cta: "Build My Kit",
    link: "#"
  }
];

const responseAds = [
  {
    title: "Triphala Digestive Support",
    description: "Gentle daily detoxification and colon cleanse.",
    link: "#"
  },
  {
    title: "Brahmi Brain Booster",
    description: "Enhance memory, focus, and cognitive function.",
    link: "#"
  },
  {
    title: "Neem Skin Purifier",
    description: "Natural support for clear and healthy skin.",
    link: "#"
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
  const [showSplash, setShowSplash] = useState(true);
  const [unauthQuestionCount, setUnauthQuestionCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPromptDismissed, setInstallPromptDismissed] = useState(
    localStorage.getItem('installPromptDismissed') === 'true'
  );

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    const isIOSDevice = 
      (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
      
    setIsIOS(isIOSDevice && !isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if already installed
      if (isStandalone) {
        return;
      }
      
      // Show custom prompt if not dismissed previously
      if (localStorage.getItem('installPromptDismissed') !== 'true') {
        setShowInstallPrompt(true);
      }
    };

    // For iOS, show the prompt manually since beforeinstallprompt doesn't fire
    if (isIOSDevice && !isStandalone) {
      if (localStorage.getItem('installPromptDismissed') !== 'true') {
        setShowInstallPrompt(true);
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setShowInstallPrompt(false);
        setInstallPromptDismissed(true);
        localStorage.setItem('installPromptDismissed', 'true');
        setDeferredPrompt(null);
      });
    } else if (isIOS) {
      alert('To install, tap the Share button and then "Add to Home Screen".');
      setShowInstallPrompt(false);
      setInstallPromptDismissed(true);
      localStorage.setItem('installPromptDismissed', 'true');
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    setInstallPromptDismissed(true);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: '1', title: 'New Chat', messages: [], mode: 'education' }
  ]);

  // Load sessions on mount
  useEffect(() => {
    const key = user ? `ayurai_sessions_${user.uid}` : 'ayurai_sessions_guest';
    const savedSessions = localStorage.getItem(key);
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, [user]);

  // Save sessions on change
  useEffect(() => {
    const key = user ? `ayurai_sessions_${user.uid}` : 'ayurai_sessions_guest';
    localStorage.setItem(key, JSON.stringify(sessions));
  }, [sessions, user]);

  const [activeSessionId, setActiveSessionId] = useState<string>('1');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
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

  // Reset unauth state when user logs in
  useEffect(() => {
    if (user) {
      setUnauthQuestionCount(0);
      setShowLoginModal(false);
    }
  }, [user]);

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
      if (userProfile?.lastCoinReset !== today) {
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
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

    // Check for unauthenticated users
    if (!user) {
      if (unauthQuestionCount >= 2) {
        setShowLoginModal(true);
        return;
      }
      setUnauthQuestionCount(prev => prev + 1);
    } else {
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
    }

    const isFirstMessage = activeSession.messages.length === 0;
    const currentInput = input;

    // Deduct coin for free users
    if (user && !isPro) {
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
    const textarea = document.getElementById('chat-input');
    if (textarea) {
      textarea.style.height = 'auto';
    }
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
      
      let lastUpdateTime = Date.now();
      for await (const chunk of stream) {
        fullResponse += chunk;
        
        // Update state at most every 50ms to prevent UI lag
        if (Date.now() - lastUpdateTime > 50) {
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
          lastUpdateTime = Date.now();
        }
      }
      
      // Final update to ensure we have the complete response
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

    } catch (error: any) {
      console.error('Chat error:', error);
      
      let message = error?.message || 'Failed to send message. Please try again.';
      
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        message = 'You have reached your daily limit. Please try again later.';
      }
      
      setFeedback({ message, type: 'error' });
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { 
            ...s, 
            messages: [...s.messages, { 
              id: Date.now().toString(), 
              role: 'model', 
              content: message, 
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

  // Removed forced login check

  return (
    <div className="flex h-full w-full overflow-hidden bg-ayur-bg text-ayur-text font-sans relative">
      {/* Splash Screen & Loading Overlay */}
      <AnimatePresence>
        {(showSplash || loading) && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ayur-bg text-ayur-text font-sans"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-ayur-accent/10 flex items-center justify-center">
                  <Leaf className="text-ayur-accent w-12 h-12 md:w-16 md:h-16" />
                </div>
                <h1 className="font-serif font-bold text-5xl md:text-6xl tracking-tight text-ayur-accent">
                  AyurAi
                </h1>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="pb-12 safe-area-bottom flex flex-col items-center gap-2"
            >
              <span className="text-xs md:text-sm text-ayur-text/60 font-medium uppercase tracking-widest">Powered by</span>
              <span className="font-serif font-bold text-xl md:text-2xl text-ayur-accent">AyurLifeCare</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Banner */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-4 left-4 right-4 z-50 p-4 rounded-xl shadow-lg text-sm font-medium flex items-center justify-between",
              feedback.type === 'success' ? "bg-green-500 text-white" : "bg-red-500 text-white"
            )}
          >
            {feedback.message}
            <button onClick={() => setFeedback(null)}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 px-1 md:px-2 mt-1 md:mt-2"
            icon={Leaf}
            iconClassName="text-ayur-accent md:w-6 md:h-6"
            iconContainerClassName="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-ayur-accent/10 flex items-center justify-center"
            textClassName="font-serif font-bold text-2xl md:text-3xl tracking-tight text-ayur-accent"
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
                  {user?.photoURL ? (
                    <img src={user?.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={16} className="md:w-[18px] md:h-[18px]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-semibold text-xs md:text-sm text-ayur-text">
                    {userProfile?.name || user?.displayName || user?.email?.split('@')[0] || user?.phoneNumber || 'Guest'}
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
        <header className="shrink-0 h-14 md:h-20 border-b border-ayur-border flex items-center justify-between px-3 md:px-8 bg-ayur-surface/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-1 hover:bg-ayur-hover rounded-xl transition-colors md:hidden text-ayur-text"
              title="Toggle Menu"
            >
              <Menu size={20} />
            </button>
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-ayur-accent/10 flex items-center justify-center">
              <Leaf className="text-ayur-accent w-4 h-4 md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col justify-center">
              <BrandLogo textClassName="font-serif font-bold text-xl md:text-3xl tracking-tight text-ayur-accent leading-none" />
              <p className="text-[9px] md:text-[11px] text-ayur-text/50 font-bold uppercase tracking-widest mt-0.5 md:mt-1">
                {aiMode === 'education' ? 'Education' : 'Clinical'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 md:p-2.5 hover:bg-ayur-hover rounded-xl transition-colors text-ayur-text/60 hover:text-ayur-accent"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={18} className="md:w-5 md:h-5" /> : <Moon size={18} className="md:w-5 md:h-5" />}
            </button>
            {(deferredPrompt || isIOS) && !installPromptDismissed && (
              <button 
                onClick={handleInstall}
                className="flex p-2 md:p-2.5 hover:bg-ayur-hover rounded-xl transition-colors text-ayur-text/60 hover:text-ayur-accent"
                title="Install App"
              >
                <Download size={18} className="md:w-5 md:h-5" />
              </button>
            )}
            <button className="p-2 md:p-2.5 hover:bg-ayur-hover rounded-xl transition-colors text-ayur-text/60 hover:text-ayur-accent hidden md:flex" title="Information">
              <Info size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        </header>

        {/* Custom Install Prompt Banner */}
        <AnimatePresence>
          {showInstallPrompt && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="shrink-0 bg-ayur-accent/10 border-b border-ayur-accent/20 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 z-10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ayur-accent flex items-center justify-center shrink-0">
                  <Leaf className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ayur-text">Install AyurAi</h3>
                  <p className="text-xs text-ayur-text/70">Add to your home screen for a faster, app-like experience.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={dismissInstallPrompt}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-ayur-text/70 hover:text-ayur-text hover:bg-ayur-hover rounded-lg transition-colors"
                >
                  Not Now
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-ayur-accent hover:bg-ayur-accent/90 rounded-lg transition-colors shadow-sm"
                >
                  Install
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Small Banner Ad above chat */}
        {!isPro && (
          <div className="shrink-0 px-4 pt-2">
            <div className="max-w-4xl mx-auto">
              <AdComponent slot="top-banner-ad" format="fluid" style={{ display: 'block', height: '60px', minHeight: '60px' }} />
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto scroll-smooth pb-4 md:pb-8 relative">
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
              <div className="max-w-4xl mx-auto py-4 px-3 md:px-6 space-y-6">
                {activeSession.messages.map((message, index) => (
                  <React.Fragment key={message.id}>
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex gap-3 md:gap-6",
                        message.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 md:w-10 md:h-10 rounded-full shrink-0 flex items-center justify-center text-white shadow-md mt-1",
                        message.role === 'user' ? "bg-ayur-text" : "bg-ayur-accent"
                      )}>
                        {message.role === 'user' ? <User size={14} className="md:w-5 md:h-5" /> : <Leaf size={14} className="md:w-5 md:h-5" />}
                      </div>
                      <div className={cn(
                        "flex-1 max-w-[90%] md:max-w-[80%] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm",
                        message.role === 'user' 
                          ? "bg-ayur-surface border border-ayur-border-strong text-ayur-text rounded-tr-sm" 
                          : "bg-ayur-accent/5 border border-ayur-accent/10 rounded-tl-sm"
                      )}>
                        <div className="markdown-body text-xs md:text-sm">
                          {message.content === '' && message.role === 'model' ? (
                            <div className="flex items-center gap-3 py-1">
                              <div className="flex gap-1.5 items-center">
                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-ayur-accent/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-ayur-accent/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-ayur-accent/60 rounded-full animate-bounce"></div>
                              </div>
                              <span className="text-xs md:text-sm font-medium text-ayur-accent/70 animate-pulse">
                                {activeSession.mode === 'clinical' ? 'Vaidya is analyzing...' : 'AyurAi is thinking...'}
                              </span>
                            </div>
                          ) : (
                            <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
                          )}
                        </div>
                        
                        {!isPro && message.role === 'model' && message.content && (index + 1) % 3 === 0 && (
                          <CompactAd {...responseAds[Math.floor(index / 3) % responseAds.length]} />
                        )}

                        {message.role === 'model' && message.content && (
                          <div className="mt-3 flex justify-end">
                            <button 
                              onClick={() => copyToClipboard(message.id, message.content)} 
                              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ayur-text/40 hover:text-ayur-accent transition-colors p-1.5 rounded-lg hover:bg-ayur-accent/10"
                            >
                              {copiedId === message.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                              {copiedId === message.id ? <span className="text-green-500">Copied</span> : "Copy"}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                    {!isPro && message.role === 'model' && index > 0 && (index + 1) % 4 === 0 && (
                      <InChatAd 
                        {...chatAds[Math.floor(index / 4) % chatAds.length]} 
                        onRemoveAds={() => setShowPaymentModal(true)}
                      />
                    )}
                  </React.Fragment>
                ))}
                <div ref={messagesEndRef} className="h-4 md:h-8" />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-3 md:p-6 bg-ayur-surface/80 backdrop-blur-md border-t border-ayur-border z-10 safe-area-bottom">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative group shadow-sm rounded-2xl md:rounded-[2rem] bg-ayur-surface border border-ayur-border-strong focus-within:border-ayur-accent focus-within:ring-4 focus-within:ring-ayur-accent/10 transition-all">
              <textarea
                id="chat-input"
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask AyurAi anything..."
                className="w-full p-3 md:p-5 pr-12 md:pr-16 rounded-2xl md:rounded-[2rem] focus:outline-none resize-none bg-transparent text-sm md:text-base text-ayur-text placeholder:text-ayur-text/40"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              {isLoading ? (
                <button
                  id="stop-btn"
                  onClick={stopGeneration}
                  className="absolute right-2 md:right-3 bottom-1.5 md:bottom-3 p-2 md:p-3 rounded-xl transition-all bg-red-500 text-white shadow-md hover:scale-105 active:scale-95"
                  title="Stop generating"
                >
                  <Square size={16} className="md:w-5 md:h-5" fill="currentColor" />
                </button>
              ) : (
                <button
                  id="send-btn"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={cn(
                    "absolute right-2 md:right-3 bottom-1.5 md:bottom-3 p-2 md:p-3 rounded-xl transition-all",
                    input.trim() 
                      ? "bg-ayur-accent text-white shadow-md hover:scale-105 active:scale-95" 
                      : "bg-ayur-hover text-ayur-text/30"
                  )}
                >
                  <Send size={16} className="md:w-5 md:h-5" />
                </button>
              )}
            </div>
            <p className="text-[9px] md:text-[11px] text-center mt-2 md:mt-4 text-ayur-text/50 font-medium tracking-wide px-2">
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
        onSuccess={async () => {
          try {
            await upgradeToPro();
            setShowPaymentModal(false);
            setFeedback({ message: 'Successfully upgraded to Pro!', type: 'success' });
          } catch (error) {
            setFeedback({ message: 'Failed to upgrade to Pro. Please try again.', type: 'error' });
          }
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

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md">
            <Login />
          </div>
        </div>
      )}

      {(deferredPrompt || isIOS) && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-ayur-surface border border-ayur-border-strong p-4 rounded-2xl shadow-2xl z-[1000] flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-ayur-accent/10 flex items-center justify-center text-ayur-accent shrink-0">
            <Leaf size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-ayur-text">Install AyurAi</h3>
            <p className="text-sm text-ayur-text/60">Install AyurAi for a better experience.</p>
          </div>
          <button 
            onClick={handleInstall}
            className="px-4 py-2 bg-ayur-accent text-white rounded-xl font-bold hover:bg-ayur-accent-dark transition-colors"
          >
            Install
          </button>
        </motion.div>
      )}
    </div>
  );
}
