import sys

new_content = """import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AudioLines, X } from 'lucide-react';

interface AuthScreenProps {
  onClose?: () => void;
}

export function AuthScreen({ onClose }: AuthScreenProps) {
  const { login, setShowLoginModal } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth?action=login' : '/api/auth?action=register';
      const body = isLogin ? { username, password } : { name, username, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const resText = await res.text();
      let data;
      try {
        data = JSON.parse(resText);
      } catch (e) {
        throw new Error(res.ok ? 'Failed to parse response' : resText || 'Authentication failed');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.token, data.user);
      setShowLoginModal(false);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-[0.98] duration-300">
      {/* Fullscreen solid background consistent with theme */}
      <div className="absolute inset-0 z-0 bg-[#0a0f16]/90 backdrop-blur-sm" onClick={() => { if (onClose) onClose(); setShowLoginModal(false); }} />
      
      {/* Subtle floating spotlight behind the panel */}
      <div className="absolute z-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      <div className="bg-white/5 dark:bg-black/40 backdrop-blur-2xl border border-white/10 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] w-full max-w-md p-8 relative z-10 overflow-hidden flex flex-col items-center animate-in slide-in-from-bottom-8 duration-500 ease-out">
        {/* Inner glare effect */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none border border-white/5 mix-blend-overlay" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
        
        {onClose && (
           <button onClick={() => { onClose(); setShowLoginModal(false); }} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-20">
             <X className="w-5 h-5" />
           </button>
        )}

        <div className="bg-indigo-500/20 backdrop-blur-md p-3 rounded-2xl shadow-lg flex items-center justify-center mb-6 relative z-20 ring-1 ring-white/10">
          <AudioLines className="w-8 h-8 text-indigo-400" />
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md relative z-20">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="text-white/60 text-sm mb-8 text-center drop-shadow-sm font-medium relative z-20">
          {isLogin 
            ? 'Sign in to save playlists and organize your music.'
            : 'Join Resavvy to build your ultimate music library.'}
        </p>

        {error && (
          <div className="w-full bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-200 p-3 rounded-xl text-sm mb-6 text-center font-medium relative z-20 shadow-inner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 relative z-20">
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                placeholder="Full Name"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium shadow-inner"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Username"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium shadow-inner"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-sm text-white/60 font-medium drop-shadow-sm relative z-20">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-white hover:text-indigo-400 font-bold transition-colors focus:outline-none underline decoration-white/20 underline-offset-4"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
"""

with open('src/components/AuthScreen.tsx', 'w') as f:
    f.write(new_content)
