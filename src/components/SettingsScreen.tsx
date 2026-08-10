import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  User, 
  Moon, 
  Sun, 
  Settings, 
  Download, 
  Upload,
  RefreshCw, 
  Trash2, 
  Check, 
  Volume2, 
  Sparkles,
  ShieldAlert,
  HardDrive,
  Wifi,
  WifiOff,
  Database
} from "lucide-react";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../context/AuthContext";
import { usePlaylist } from "../context/PlaylistContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { OptimizedImage } from "./OptimizedImage";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { fetchOfflineCacheStats, getFrequentlyPlayedTracks, clearAllOfflineCache } from "../utils/offlineManager";
import { OfflineIndicator } from "./OfflineIndicator";

export function SettingsScreen() {
  const { theme, setTheme, autoplay, setAutoplay, crossfade, setCrossfade } = useSettings();
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const { groups, importPlaylists } = usePlaylist();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== "undefined" && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    avatarUrl: user?.avatarUrl || '',
    bio: user?.bio || ''
  });
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [offlineStats, setOfflineStats] = useState({ metadataCount: 0, frequentCount: 0, mediaCount: 0 });

  const loadOfflineStats = () => {
    fetchOfflineCacheStats().then(stats => setOfflineStats(stats));
  };

  useEffect(() => {
    loadOfflineStats();
  }, []);

  const handlePrecacheTopTracks = () => {
    const top = getFrequentlyPlayedTracks(12);
    if (top.length === 0) {
      toast.info("Play a few songs first to record frequently played tracks!");
      return;
    }
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_FREQUENTLY_PLAYED',
        payload: { songs: top }
      });
      toast.success(`Pre-cached ${top.length} frequently played tracks for offline listening!`);
      setTimeout(loadOfflineStats, 1000);
    } else {
      toast.error("Service worker not active yet");
    }
  };

  const handlePurgeOfflineCache = async () => {
    await clearAllOfflineCache();
    toast.success("Offline track and metadata cache cleared.");
    loadOfflineStats();
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        avatarUrl: user.avatarUrl || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
       await updateProfile(profileForm);
       toast.success('Profile updated successfully');
    } catch (e) {
       console.error(e);
       toast.error('Failed to update profile');
    } finally {
       setIsSavingProfile(false);
    }
  };

  const handleExportData = () => {
    try {
      const exportPayload = {
        app: "ReSavvy Music",
        version: 1,
        exportedAt: new Date().toISOString(),
        playlistCount: groups.length,
        playlists: groups,
        settings: {
          theme,
          autoplay,
          crossfade
        }
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `resavvy_playlists_backup_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      const totalSongs = groups.reduce((acc, g) => acc + (g.songs?.length || 0), 0);
      toast.success(`Exported ${groups.length} playlist${groups.length === 1 ? '' : 's'} (${totalSongs} tracks) to JSON backup!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export playlist backup');
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      let playlistsToImport: any[] = [];
      if (Array.isArray(parsed)) {
        playlistsToImport = parsed;
      } else if (parsed && Array.isArray(parsed.playlists)) {
        playlistsToImport = parsed.playlists;
      } else if (parsed && Array.isArray(parsed.groups)) {
        playlistsToImport = parsed.groups;
      } else if (parsed && parsed.name && Array.isArray(parsed.songs)) {
        playlistsToImport = [parsed];
      }

      if (playlistsToImport.length === 0) {
        toast.error('No valid playlist data found in JSON file');
        return;
      }

      const count = await importPlaylists(playlistsToImport);
      if (count > 0) {
        toast.success(`Successfully imported ${count} playlist${count > 1 ? 's' : ''}!`);
      } else {
        toast.info('No new playlists were imported');
      }
    } catch (err) {
      console.error(err);
      toast.error('Invalid JSON file format');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearCache = () => {
    if (confirm('This will clear all local cache, reset preferences, log you out, and refresh the app. Continue?')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      localStorage.clear();
      toast.success('Account permanently deleted');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (e) {
      toast.error('Failed to delete account');
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

    // Set initial
    gsap.set(containerRef.current, { yPercent: 100, opacity: 0.9 });
    
    const elementsToAnimate = containerRef.current.querySelectorAll(".mobile-animate");
    if (elementsToAnimate.length > 0) {
      gsap.set(elementsToAnimate, { opacity: 0, y: 30 });
    }

    if (headerRef.current) {
      gsap.set(headerRef.current, { opacity: 0, y: -20 });
    }

    // Timeline
    const tl = gsap.timeline();
    tl.to(containerRef.current, {
      yPercent: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power4.out"
    })
    .to(headerRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.35,
      ease: "power2.out"
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

  // Animation variants (Desktop fallback)
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.35, 
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.05
      }
    }
  };

  const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } }
  };

  const renderContent = () => {
    return (
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div ref={headerRef} className="flex items-center gap-4 mb-8 sm:mb-10">
          <button 
            onClick={handleGoBack}
            className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all cursor-pointer bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-white/5 shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your profile, preferences, and account security</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Profile Settings (Only if logged in) */}
          {user ? (
            <div className="mobile-animate bg-white dark:bg-gray-900/60 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profile Settings</h2>
              </div>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row gap-5 items-center pb-2">
                  <div className="relative w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl overflow-hidden shadow-md shrink-0">
                    {profileForm.avatarUrl ? (
                      <OptimizedImage src={profileForm.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="w-full">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Avatar URL</label>
                    <input 
                      type="text" 
                      value={profileForm.avatarUrl}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-gray-50 dark:bg-black/25 border border-gray-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Display Name</label>
                    <input 
                      type="text" 
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="Your Name"
                      className="w-full bg-gray-50 dark:bg-black/25 border border-gray-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Bio</label>
                    <textarea 
                      rows={3}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      className="w-full bg-gray-50 dark:bg-black/25 border border-gray-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none" 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-600/10 flex items-center gap-2"
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="mobile-animate bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-md rounded-2xl border border-indigo-500/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Sign in to sync your profile</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Unlock custom library organization, likes syncing, and analytics.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  window.history.pushState(null, "", "/auth");
                  window.dispatchEvent(new Event("popstate"));
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
              >
                Log In
              </button>
            </div>
          )}

          {/* Preferences */}
          <div className="mobile-animate bg-white dark:bg-gray-900/60 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-5 sm:p-6 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Settings className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">App Preferences</h2>
            </div>

            {/* Theme Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Theme & Appearance</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Choose how Resavvy looks on your screen</span>
              </div>
              <div className="flex p-1 bg-gray-100 dark:bg-black/45 rounded-xl border border-gray-200/50 dark:border-white/5 self-start sm:self-auto">
                {[
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'system', icon: Settings, label: 'System' }
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value as any)}
                      className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        active 
                          ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-white shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Autoplay Similar */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                  Autoplay Similar Tracks
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Automatically queue up recommendations when playback ends</span>
              </div>
              <button 
                onClick={() => setAutoplay(!autoplay)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoplay ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-800'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoplay ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Track Crossfade */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Track Crossfade Transitions
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Smoothly blend track boundaries for uninterrupted listening</span>
              </div>
              <div className="flex p-1 bg-gray-100 dark:bg-black/45 rounded-xl border border-gray-200/50 dark:border-white/5 self-start sm:self-auto flex-wrap gap-1">
                {[
                  { value: 0, label: 'Off' },
                  { value: 2, label: '2s' },
                  { value: 4, label: '4s' },
                  { value: 6, label: '6s' },
                  { value: 8, label: '8s' },
                  { value: 12, label: '12s' }
                ].map((opt) => {
                  const active = crossfade === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setCrossfade(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        active 
                          ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-white shadow-sm font-bold' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Storage and Data */}
          <div className="mobile-animate bg-white dark:bg-gray-900/60 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Download className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Data & Backup</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-black/10 border border-gray-100 dark:border-white/5 w-full">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Playlist Backup & Restore</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Export all curated track collections to local JSON or restore existing backup files</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-900 shadow-xs"
                >
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span>Import JSON</span>
                </button>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON ({groups.length})</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-black/10 border border-gray-100 dark:border-white/5 w-full">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Clear Cache & Local Data</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Instantly resolve sync errors or performance bottlenecks</span>
              </div>
              <button
                onClick={handleClearCache}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-900 shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Resync Cache</span>
              </button>
            </div>
          </div>

          {/* Offline Playback & PWA Storage */}
          <div className="mobile-animate bg-white dark:bg-gray-900/60 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Offline Playback & PWA Cache</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Frequently played songs and playlist metadata are cached locally for offline listening</p>
                </div>
              </div>
              <div className="shrink-0">
                <OfflineIndicator />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 text-center">
              <div>
                <div className="text-lg font-extrabold text-gray-900 dark:text-white">{offlineStats.metadataCount}</div>
                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Metadata Items</div>
              </div>
              <div>
                <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{offlineStats.frequentCount}</div>
                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Top Tracks Cached</div>
              </div>
              <div>
                <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{offlineStats.mediaCount}</div>
                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Artwork & Media</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-black/10 border border-gray-100 dark:border-white/5 w-full">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Pre-cache Frequently Played Tracks</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Download metadata and artwork for your top listened tracks</span>
              </div>
              <button
                onClick={handlePrecacheTopTracks}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Cache Top Tracks</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-black/10 border border-gray-100 dark:border-white/5 w-full">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Purge Offline Media Cache</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Clear cached media files while retaining account and playlist settings</span>
              </div>
              <button
                onClick={handlePurgeOfflineCache}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-900 shadow-xs shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Media Cache</span>
              </button>
            </div>
          </div>
          {user && (
            <div className="mobile-animate bg-red-500/5 dark:bg-red-500/5 rounded-2xl border border-red-500/15 p-5 sm:p-6 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col max-w-md">
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">Delete Account Permanently</span>
                  <span className="text-xs text-red-500/80 dark:text-red-400/60 leading-relaxed">
                    This action cannot be undone. All your saved playlists, library metadata, and preferences will be permanently wiped.
                  </span>
                </div>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white text-sm font-semibold rounded-xl border border-red-600/20 hover:border-red-600 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3.5 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div 
        ref={containerRef}
        className="fixed inset-0 z-[80] bg-white dark:bg-gray-950 w-full min-h-screen flex flex-col items-center px-4 py-10 pb-32 overflow-y-auto"
      >
        {renderContent()}
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full max-w-3xl mx-auto px-4 py-6 sm:px-6 md:py-10 pb-32"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {renderContent()}
    </motion.div>
  );
}
