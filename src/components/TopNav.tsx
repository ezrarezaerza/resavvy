import React, { useState, useRef, useEffect } from "react";
import { 
  Menu, 
  AudioLines, 
  Moon, 
  Sun, 
  Search, 
  User, 
  BarChart2, 
  Settings, 
  LogOut,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../context/AuthContext";
import { GlobalSearchBar } from "./GlobalSearchBar";
import { OptimizedImage } from "./OptimizedImage";

interface TopNavProps {
  onMenuClick: () => void;
  onLogoClick: () => void;
  onNavigate?: (id: string, searchPrefix?: string) => void;
  isSidebarCollapsed?: boolean;
}

export const TopNav = React.memo(function TopNav({ onMenuClick, onLogoClick, onNavigate, isSidebarCollapsed }: TopNavProps) {
  const { theme, setTheme, dataSaver, setDataSaver, autoplay, setAutoplay } = useSettings();
  const { user, logout, updateProfile, deleteAccount, setShowLoginModal } = useAuth();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [isDangerZoneOpen, setIsDangerZoneOpen] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    avatarUrl: user?.avatarUrl || '',
    bio: user?.bio || ''
  });
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        avatarUrl: user.avatarUrl || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
       await updateProfile(profileForm);
       setIsProfileModalOpen(false);
    } catch (e) {
       console.error(e);
       alert('Failed to save profile');
    } finally {
       setIsSavingProfile(false);
    }
  };

  const handleExportData = () => {
    const data = {
      playlists: localStorage.getItem('resavvy_playlists'),
      settings: {
        theme: localStorage.getItem('resavvy_theme'),
        dataSaver: localStorage.getItem('resavvy_dataSaver'),
        autoplay: localStorage.getItem('resavvy_autoplay')
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resavvy_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <div className="sticky top-0 z-[70] w-full h-16 px-4 relative flex items-center justify-between bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 shrink-0">
        
        {/* Left Zone (Desktop Logo & Menu) */}
      <div className="flex-1 flex items-center justify-start">
        <button 
          onClick={onMenuClick}
          className="z-50 p-2 cursor-pointer rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div 
          className="hidden md:flex items-center gap-2 ml-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onLogoClick}
        >
          <div className="bg-indigo-500 p-1.5 rounded-lg shadow-md flex items-center justify-center">
            <AudioLines className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-gray-900 dark:text-white">Resavvy</span>
        </div>
      </div>

      {/* Center Zone (Desktop Search & Mobile Logo) */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex w-full max-w-xl justify-center z-50">
        <GlobalSearchBar onNavigate={onNavigate} />
      </div>

      <div 
        className="absolute left-1/2 -translate-x-1/2 md:hidden flex items-center gap-2 cursor-pointer"
        onClick={onLogoClick}
      >
        <div className="bg-indigo-500 p-1.5 rounded-lg shadow-md flex items-center justify-center">
          <AudioLines className="w-5 h-5 text-white" />
        </div>
        <span className="font-heading font-bold text-xl tracking-tight text-gray-900 dark:text-white">Resavvy</span>
      </div>

      {/* Right Zone (Profile Trigger) */}
      <div className="flex-1 flex items-center justify-end">
        {!user ? (
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-full transition-colors focus:outline-none"
          >
            Log In
          </button>
        ) : (
          <div className="relative" ref={menuRef}>
            <button 
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity shrink-0 focus:outline-none overflow-hidden"
            >
              {user.avatarUrl ? (
                <OptimizedImage src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-3 w-64 rounded-2xl shadow-2xl bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50 transform origin-top-right transition-all">
              {/* Top Section (User Info) */}
              <button 
                onClick={() => { setIsProfileModalOpen(true); setIsProfileOpen(false); }}
                className="w-full text-left p-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm cursor-pointer shrink-0 overflow-hidden">
                  {user?.avatarUrl ? (
                    <OptimizedImage src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user?.name || 'User'}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user?.username || 'username'}</span>
                </div>
              </button>

              {/* Action List */}
              <div className="p-2 flex flex-col gap-1">
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate?.('library');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
                  My Library
                </button>
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate?.('analytics');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors text-left"
                >
                  <BarChart2 className="w-4 h-4" />
                  Analytics
                </button>
                <button 
                  onClick={() => {
                    setIsSystemModalOpen(true);
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors text-left"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button 
                  onClick={() => {
                    if (logout) logout();
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profile Settings</h2>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                <input 
                  type="text" 
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avatar URL</label>
                <input 
                  type="text" 
                  value={profileForm.avatarUrl}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                <textarea 
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" 
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/10 flex justify-end">
              <button 
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSystemModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">System Settings</h2>
              <button 
                onClick={() => setIsSystemModalOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar">
              
              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Appearance</span>
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-black/20 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-black/40 transition-colors"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Playback & Network</h3>
                
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Autoplay Similar Tracks</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Keep music playing when your queue ends</span>
                    </div>
                    <button 
                      onClick={() => setAutoplay(!autoplay)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${autoplay ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoplay ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 rounded-xl flex flex-col mt-2 overflow-hidden">
                <button 
                  onClick={() => setIsDangerZoneOpen(!isDangerZoneOpen)}
                  className="flex items-center justify-between p-4 w-full text-left focus:outline-none"
                >
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
                  {isDangerZoneOpen ? <ChevronUp className="w-4 h-4 text-red-600 dark:text-red-400" /> : <ChevronDown className="w-4 h-4 text-red-600 dark:text-red-400" />}
                </button>
                
                {isDangerZoneOpen && (
                  <div className="p-4 pt-0 flex flex-col gap-4 border-t border-red-200/50 dark:border-red-500/10">
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Export Cloud Data</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Download a JSON backup of your playlists and library</span>
                      </div>
                      <button 
                        onClick={handleExportData}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        Export
                      </button>
                    </div>

                    <div className="flex justify-between items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Clear Local Cache</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Resolves most sync issues by clearing local data and reloading</span>
                      </div>
                      <button 
                        onClick={() => { localStorage.clear(); window.location.reload(); }}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        Resync
                      </button>
                    </div>

                    <div className="flex justify-between items-center gap-4 pt-2 mt-2 border-t border-red-200 dark:border-red-500/20">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</span>
                        <span className="text-xs text-red-500 dark:text-red-400/80">Permanently remove your account and all associated data.</span>
                      </div>
                      <button 
                        onClick={async () => { 
                          try {
                            await deleteAccount();
                            localStorage.clear();
                            window.location.reload(); 
                          } catch (e) {
                            alert('Failed to delete account');
                          }
                        }}
                        className="shrink-0 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
