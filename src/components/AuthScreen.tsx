import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Sparkles, Lock, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export function AuthScreen() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const backBtnRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const exitTimeline = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      
      // Navigate to homepage or previous page after login
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.history.pushState(null, "", "/");
          window.dispatchEvent(new Event("popstate"));
        }
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const executeBackNavigation = () => {
    if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.history.pushState(null, "", "/");
        window.dispatchEvent(new Event("popstate"));
      }
    }
  };

  const handleGoBack = () => {
    if (isMobile && containerRef.current) {
      // Exit animation with GSAP on mobile
      gsap.to(containerRef.current, {
        yPercent: 100,
        opacity: 0.8,
        duration: 0.45,
        ease: "power3.inOut",
        onComplete: executeBackNavigation
      });
    } else {
      executeBackNavigation();
    }
  };

  // GSAP Entrance Animations for Mobile
  useGSAP(() => {
    if (!isMobile || !containerRef.current) return;

    // Set initial layout
    gsap.set(containerRef.current, { yPercent: 100, opacity: 0.9 });
    
    const elementsToAnimate = containerRef.current.querySelectorAll(".mobile-animate");
    if (elementsToAnimate.length > 0) {
      gsap.set(elementsToAnimate, { opacity: 0, y: 25 });
    }

    if (backBtnRef.current) {
      gsap.set(backBtnRef.current, { opacity: 0, scale: 0.8, x: -10 });
    }

    // Build entrance timeline
    const tl = gsap.timeline();
    tl.to(containerRef.current, {
      yPercent: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power4.out" // native-like smooth ease
    })
    .to(backBtnRef.current, {
      opacity: 1,
      scale: 1,
      x: 0,
      duration: 0.35,
      ease: "back.out(1.5)"
    }, "-=0.25");

    if (elementsToAnimate.length > 0) {
      tl.to(elementsToAnimate, {
        opacity: 1,
        y: 0,
        stagger: 0.05,
        duration: 0.45,
        ease: "power3.out"
      }, "-=0.2");
    }

  }, { dependencies: [isMobile], scope: containerRef });

  const renderContent = () => {
    return (
      <>
        {/* Background spotlights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-violet-500/5 dark:bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Floating Back Button */}
        <div ref={backBtnRef} className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
          <button 
            onClick={handleGoBack}
            className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all cursor-pointer bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-white/5 flex items-center gap-2 text-sm font-semibold"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        <div 
          ref={cardRef} 
          className="mobile-animate w-full max-w-md bg-white dark:bg-gray-900/45 backdrop-blur-2xl border border-gray-200 dark:border-white/5 rounded-3xl shadow-xl p-8 relative z-10 flex flex-col items-center"
        >
          {/* Logo */}
          <div className="mobile-animate bg-gray-50 dark:bg-black/20 border border-gray-200/50 dark:border-white/5 p-3.5 rounded-2xl shadow-sm flex items-center justify-center mb-6 ring-1 ring-black/5 dark:ring-white/5">
            <img src="/icon-192x192.png" alt="Resavvy logo" className="w-8 h-8 object-contain rounded-md dark:hidden" />
            <img src="/icon-192x192-white.png" alt="Resavvy logo" className="w-8 h-8 object-contain rounded-md hidden dark:block" />
          </div>

          <h2 className="mobile-animate text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight text-center">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mobile-animate text-gray-500 dark:text-gray-400 text-sm mb-8 text-center font-medium">
            {isLogin 
              ? 'Sign in to save playlists and organize your music.'
              : 'Join Resavvy to build your ultimate music library.'}
          </p>

          {error && (
            <div className="mobile-animate w-full bg-red-500/5 border border-red-500/10 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-sm mb-6 text-center font-semibold shadow-inner">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {!isLogin && (
              <div className="mobile-animate relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  placeholder="Full Name"
                  className="w-full bg-gray-50 dark:bg-black/25 border border-gray-200 dark:border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            )}
            
            <div className="mobile-animate relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Username"
                className="w-full bg-gray-50 dark:bg-black/25 border border-gray-200 dark:border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="mobile-animate relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="w-full bg-gray-50 dark:bg-black/25 border border-gray-200 dark:border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mobile-animate w-full mt-4 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mobile-animate mt-8 text-sm text-gray-500 dark:text-gray-400 font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold transition-colors focus:outline-none"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </>
    );
  };

  if (isMobile) {
    return (
      <div 
        ref={containerRef}
        className="fixed inset-0 z-[80] bg-white dark:bg-gray-950 w-full min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-y-auto"
      >
        {renderContent()}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-[85vh] w-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
    >
      {renderContent()}
    </motion.div>
  );
}
