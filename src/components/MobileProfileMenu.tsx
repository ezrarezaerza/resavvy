import React, { useRef, useEffect } from "react";
import { 
  X, 
  BarChart2, 
  Settings, 
  LogOut, 
  Shield, 
  Moon, 
  Sun,
  Library,
  User
} from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../hooks/useSettings";
import { OptimizedImage } from "./OptimizedImage";

// Register the GSAP plugin if needed, although useGSAP is registered internally.
gsap.registerPlugin();

interface MobileProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (id: string) => void;
}

export function MobileProfileMenu({ isOpen, onClose, onNavigate }: MobileProfileMenuProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useSettings();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const userInfoRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  // Store timeline reference
  const tl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    if (!isOpen) return;

    // Create a new master timeline
    tl.current = gsap.timeline({
      paused: true,
      onReverseComplete: () => {
        onClose();
      }
    });

    // Reset styles before animation
    gsap.set(containerRef.current, { display: "block" });
    gsap.set(overlayRef.current, { opacity: 0 });
    gsap.set(contentRef.current, { xPercent: 100 });
    
    // Select all child elements of menu items for stagger
    const menuItems = menuItemsRef.current?.children;
    if (menuItems && menuItems.length > 0) {
      gsap.set(menuItems, { opacity: 0, y: 30 });
    }
    
    if (userInfoRef.current) {
      gsap.set(userInfoRef.current, { opacity: 0, scale: 0.95, y: -15 });
    }
    if (closeBtnRef.current) {
      gsap.set(closeBtnRef.current, { rotate: -90, scale: 0.7, opacity: 0 });
    }
    if (footerRef.current) {
      gsap.set(footerRef.current, { opacity: 0, y: 20 });
    }

    // Build timeline
    tl.current
      .to(overlayRef.current, {
        opacity: 1,
        duration: 0.35,
        ease: "power2.out"
      })
      .to(contentRef.current, {
        xPercent: 0,
        duration: 0.45,
        ease: "power4.out" // native-like bounce/ease
      }, "-=0.25")
      .to(closeBtnRef.current, {
        rotate: 0,
        scale: 1,
        opacity: 1,
        duration: 0.35,
        ease: "back.out(1.7)"
      }, "-=0.3")
      .to(userInfoRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: "power3.out"
      }, "-=0.25");

    if (menuItems && menuItems.length > 0) {
      tl.current.to(menuItems, {
        opacity: 1,
        y: 0,
        stagger: 0.06,
        duration: 0.4,
        ease: "power3.out"
      }, "-=0.25");
    }

    tl.current.to(footerRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.35,
      ease: "power2.out"
    }, "-=0.2");

    // Play timeline
    tl.current.play();

    return () => {
      if (tl.current) {
        tl.current.kill();
      }
    };
  }, { dependencies: [isOpen], scope: containerRef });

  const handleClose = () => {
    if (tl.current) {
      // Play backwards and wait for onReverseComplete to trigger onClose
      tl.current.timeScale(1.25).reverse();
    } else {
      onClose();
    }
  };

  // Prevent scroll propagation
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const handleItemClick = (action: () => void) => {
    // Elegant slide out animation before executing action
    if (tl.current) {
      tl.current.timeScale(1.5).reverse();
      // Wait for reverse animation to finish, then execute action
      setTimeout(() => {
        action();
      }, 350);
    } else {
      action();
      onClose();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ display: "none" }}
    >
      {/* Backdrop overlay */}
      <div 
        ref={overlayRef}
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Main Drawer Content */}
      <div 
        ref={contentRef}
        className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-950 shadow-2xl flex flex-col justify-between"
      >
        {/* Header Block */}
        <div className="flex flex-col px-6 pt-7 pb-4">
          <div className="flex items-center justify-between mb-8">
            <span className="font-heading font-black text-2xl tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <img 
                src={isDark ? "/icon-192x192-white.png" : "/icon-192x192.png"} 
                alt="Logo" 
                className="w-7 h-7 object-contain" 
              />
              Resavvy
            </span>
            <button 
              ref={closeBtnRef}
              onClick={handleClose}
              className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all cursor-pointer border border-gray-200 dark:border-white/5 flex items-center justify-center bg-white dark:bg-gray-900 shadow-xs shrink-0"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info card */}
          {user && (
            <div 
              ref={userInfoRef}
              className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xl overflow-hidden shadow-md shrink-0">
                {user.avatarUrl ? (
                  <OptimizedImage src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-base font-extrabold text-gray-900 dark:text-white truncate leading-snug">{user.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate font-semibold">@{user.username}</span>
                {user.bio && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-[200px]">{user.bio}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
          <div ref={menuItemsRef} className="flex flex-col gap-2.5">
            <button
              onClick={() => handleItemClick(() => onNavigate?.("library"))}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left bg-transparent cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-white/5"
            >
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Library className="w-5 h-5" />
              </div>
              <span>My Library</span>
            </button>

            <button
              onClick={() => handleItemClick(() => onNavigate?.("analytics"))}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left bg-transparent cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-white/5"
            >
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <BarChart2 className="w-5 h-5" />
              </div>
              <span>Analytics Dashboard</span>
            </button>

            {user?.role === "ADMIN" && (
              <button
                onClick={() => handleItemClick(() => onNavigate?.("admin"))}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-left bg-transparent cursor-pointer border border-transparent hover:border-rose-100/50 dark:hover:border-rose-500/10"
              >
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                  <Shield className="w-5 h-5" />
                </div>
                <span>Admin Panel</span>
              </button>
            )}

            <button
              onClick={() => handleItemClick(() => {
                if (typeof window !== "undefined") {
                  window.history.pushState(null, "", "/settings");
                  window.dispatchEvent(new Event("popstate"));
                }
              })}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left bg-transparent cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-white/5"
            >
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Settings className="w-5 h-5" />
              </div>
              <span>Settings</span>
            </button>

            {/* Quick Theme Switcher inside Menu */}
            <div className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 mt-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Dark Mode</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Adjust screen brightness</span>
                </div>
              </div>
              <button 
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDark ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-800'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Area with Log Out */}
        <div ref={footerRef} className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/10">
          <button
            onClick={() => handleItemClick(() => {
              if (logout) logout();
            })}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-4 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white font-bold text-base rounded-2xl transition-all duration-250 cursor-pointer shadow-xs border border-red-500/20 hover:border-red-500"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
