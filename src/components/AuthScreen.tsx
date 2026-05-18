import React, { useState } from 'react';
import { motion } from 'motion/react';
import { loginWithGoogle, loginAsGuest } from '../firebase';

interface AuthScreenProps {
  onLoginSuccess: () => void;
  onGuestLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, onGuestLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setIsLoggingIn(true);
      await loginWithGoogle();
      onLoginSuccess();
    } catch (err: any) {
      console.error("Google Login Failed", err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError("Ошибка входа через Google. Попробуйте позже.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGuestLogin = () => {
    // Completely bypass Firebase for guests
    onGuestLogin();
  };

  return (
    <div className="absolute inset-0 z-[300] flex flex-col items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-red-900/10 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-900/10 rounded-full blur-[120px]"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl px-6 text-center"
      >
        {/* Logo Section */}
        <div className="mb-12 flex flex-col items-center">
          <h1 className="text-4xl sm:text-7xl lg:text-[10rem] leading-none font-black text-red-600 mb-2 lg:mb-6 uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] font-display text-center not-italic">
            Battle<br />Alert
          </h1>
        </div>

        {/* Buttons Section */}
        <div className="flex flex-col gap-4 items-center">
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className={`group relative flex items-center justify-center gap-3 w-64 py-4 bg-white hover:bg-zinc-100 text-black font-black uppercase tracking-widest text-sm transition-all rounded-none border-b-4 border-zinc-400 active:border-b-0 active:translate-y-1 overflow-hidden ${isLoggingIn ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : "Войти через Google"}
          </button>

          <button 
            onClick={handleGuestLogin}
            disabled={isLoggingIn}
            className="group relative flex items-center justify-center gap-3 w-64 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-sm transition-all rounded-none border-b-4 border-zinc-950 active:border-b-0 active:translate-y-1"
          >
            Играть как Гость
          </button>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 bg-red-900/20 border border-red-500/30 text-red-400 text-[10px] uppercase font-bold tracking-widest max-w-xs"
            >
              {error}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Aesthetic Accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-zinc-800 to-blue-600 opacity-30" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-zinc-800 to-red-600 opacity-30" />
      
      {/* Corner Brackets */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-red-900/30" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-blue-900/30" />
    </div>
  );
};
