import React, { useState } from 'react';
import { Leaf, Mail, Lock, AlertCircle, User, Briefcase } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLogo } from '../BrandLogo';

export function Login() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, error: configError } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailMode, setEmailMode] = useState<'password' | 'otp'>('password');
  
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const displayError = error || configError;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (emailMode === 'otp' && !isRegistering) {
        if (!otpSent) {
          const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setOtpSent(true);
        } else {
          const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          
          alert("OTP Verified! In a production app, you would now be signed in.");
          window.location.reload(); 
        }
      } else {
        if (isRegistering) {
          if (!name.trim() || !profession.trim()) {
            throw new Error('Please fill in all details.');
          }
          await registerWithEmail(email, password, name, profession);
        } else {
          await loginWithEmail(email, password);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-ayur-bg p-4 text-ayur-text relative overflow-hidden rounded-[2rem]">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-ayur-accent/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-ayur-accent/5 blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-ayur-surface/80 backdrop-blur-xl rounded-[2rem] shadow-xl overflow-hidden p-6 md:p-8 border border-ayur-border relative z-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-center mb-4 md:mb-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-ayur-accent/10 flex items-center justify-center rotate-3"
          >
            <Leaf className="text-ayur-accent -rotate-3" size={28} />
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-2"
        >
          <BrandLogo textClassName="text-3xl md:text-4xl font-serif font-semibold text-center text-ayur-accent" />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-ayur-text/60 mb-6 md:mb-8 font-medium text-sm md:text-base"
        >
          {isRegistering ? 'Create your account' : (emailMode === 'otp' ? 'Sign in with OTP' : 'Sign in with password')}
        </motion.p>

        {!isRegistering && (
          <div className="flex bg-ayur-bg/50 p-1.5 rounded-xl mb-8 border border-ayur-border/50">
            <button
              type="button"
              onClick={() => { setEmailMode('password'); setError(null); setOtpSent(false); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${emailMode === 'password' ? 'bg-ayur-surface shadow-sm text-ayur-accent' : 'text-ayur-text/50 hover:text-ayur-text'}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setEmailMode('otp'); setError(null); setOtpSent(false); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${emailMode === 'otp' ? 'bg-ayur-surface shadow-sm text-ayur-accent' : 'text-ayur-text/50 hover:text-ayur-text'}`}
            >
              OTP
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {displayError && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-600 text-sm overflow-hidden"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{displayError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.form 
            key="email-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleEmailSubmit} 
            className="space-y-5"
          >
            <AnimatePresence>
              {isRegistering && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-ayur-text/50 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ayur-text/40 group-focus-within:text-ayur-accent transition-colors" size={18} />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full pl-11 p-3.5 rounded-xl border border-ayur-border-strong focus:outline-none focus:border-ayur-accent focus:ring-1 focus:ring-ayur-accent bg-ayur-surface/50 text-ayur-text transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-ayur-text/50 uppercase tracking-wider mb-1.5 ml-1">Profession</label>
                    <div className="relative group">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ayur-text/40 group-focus-within:text-ayur-accent transition-colors" size={18} />
                      <input 
                        type="text" 
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        required
                        className="w-full pl-11 p-3.5 rounded-xl border border-ayur-border-strong focus:outline-none focus:border-ayur-accent focus:ring-1 focus:ring-ayur-accent bg-ayur-surface/50 text-ayur-text transition-all"
                        placeholder="Ayurvedic Practitioner, Student, etc."
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[11px] font-bold text-ayur-text/50 uppercase tracking-wider mb-1.5 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ayur-text/40 group-focus-within:text-ayur-accent transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={otpSent}
                  className="w-full pl-11 p-3.5 rounded-xl border border-ayur-border-strong focus:outline-none focus:border-ayur-accent focus:ring-1 focus:ring-ayur-accent bg-ayur-surface/50 text-ayur-text transition-all disabled:opacity-50"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            
            {emailMode === 'password' || isRegistering ? (
              <div>
                <label className="block text-[11px] font-bold text-ayur-text/50 uppercase tracking-wider mb-1.5 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ayur-text/40 group-focus-within:text-ayur-accent transition-colors" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-11 p-3.5 rounded-xl border border-ayur-border-strong focus:outline-none focus:border-ayur-accent focus:ring-1 focus:ring-ayur-accent bg-ayur-surface/50 text-ayur-text transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            ) : (
              otpSent && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-[11px] font-bold text-ayur-text/50 uppercase tracking-wider mb-1.5 ml-1">Enter OTP</label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ayur-text/40 group-focus-within:text-ayur-accent transition-colors" size={18} />
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className="w-full pl-11 p-3.5 rounded-xl border border-ayur-border-strong focus:outline-none focus:border-ayur-accent focus:ring-1 focus:ring-ayur-accent bg-ayur-surface/50 text-ayur-text transition-all"
                      placeholder="123456"
                    />
                  </div>
                  <p className="text-[10px] text-ayur-accent mt-2 font-bold uppercase tracking-widest">Check server console for OTP</p>
                </motion.div>
              )
            )}

            <button 
              type="submit" 
              disabled={isLoading || !!configError}
              className="w-full py-3.5 bg-ayur-accent text-white rounded-xl font-semibold shadow-lg shadow-ayur-accent/20 hover:shadow-ayur-accent/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 mt-4"
            >
              {isLoading ? 'Please wait...' : (isRegistering ? 'Sign Up' : (emailMode === 'otp' ? (!otpSent ? 'Send OTP' : 'Verify OTP') : 'Sign In'))}
            </button>
          </motion.form>
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-ayur-border-strong"></div>
          <span className="text-[10px] font-bold text-ayur-text/40 uppercase tracking-widest">Or continue with</span>
          <div className="flex-1 h-px bg-ayur-border-strong"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading || !!configError}
          className="mt-6 w-full py-3.5 bg-ayur-surface border border-ayur-border-strong text-ayur-text rounded-xl font-semibold shadow-sm hover:bg-ayur-hover hover:border-ayur-text/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <p className="mt-8 text-center text-sm text-ayur-text/60 font-medium">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-ayur-accent font-bold hover:underline underline-offset-4"
          >
            {isRegistering ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
