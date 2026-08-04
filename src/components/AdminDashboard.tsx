import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Shield,
  Users,
  AlertTriangle,
  FileText,
  Settings,
  Search,
  CheckCircle,
  Ban,
  UserCheck,
  UserMinus,
  Star,
  Activity,
  Plus,
  Trash2,
  RefreshCw,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  X,
  Music,
  Check,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Filter,
  Sliders,
  Calculator,
  AlertCircle,
  Calendar,
  Info,
  BarChart2,
  PieChart,
  Zap,
  ArrowUp,
  ArrowDown,
  Image,
  Sparkles,
  Megaphone,
  Save,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Layout,
  LayoutGrid,
  GripVertical
} from "lucide-react";
import { toast } from "sonner";

interface SystemUser {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  role: "ADMIN" | "USER" | "VERIFIED_CURATOR";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  suspensionExpiresAt: string | null;
  moderationWarning: string | null;
  totalPlaylists: number;
  totalSaved: number;
}

interface AdminPlaylist {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  visibility: "public" | "private";
  isFlagged: boolean;
  flagReason: string | null;
  isHidden: boolean;
  isFeatured: boolean;
  featuredAt: string | null;
  likesCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
  _count: {
    songs: number;
  };
}

interface DeadSong {
  id: string;
  title: string;
  artist: string | null;
  youtubeId: string;
  isDeadLink: boolean;
  playCount: number;
  playlist: {
    id: string;
    name: string;
    user: {
      username: string;
    };
  } | null;
}

interface SystemLog {
  id: string;
  createdAt: string;
  type: string;
  description: string;
  details: string | null;
}

interface QuotaUsage {
  id: string;
  date: string;
  youtubeQuotaUsed: number;
  totalRequests: number;
}

interface SystemTag {
  id: string;
  name: string;
}

interface SystemConfig {
  id: string;
  key: string;
  value: string;
}

export function AdminDashboard() {
  const { token, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"moderation" | "users" | "monitoring" | "homepage" | "promotions" | "config">("moderation");
  const [moderationSubTab, setModerationSubTab] = useState<"playlists" | "curation">("playlists");
  const [configSubTab, setConfigSubTab] = useState<"security" | "layout" | "discovery">("security");
  
  // Real-Time Live Preview state variables
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewSource, setPreviewSource] = useState<"live" | "draft">("live");
  const [previewIndex, setPreviewIndex] = useState(0);
  
  // State variables
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [playlists, setPlaylists] = useState<AdminPlaylist[]>([]);
  const [deadSongs, setDeadSongs] = useState<DeadSong[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [quota, setQuota] = useState<QuotaUsage[]>([]);
  const [tags, setTags] = useState<SystemTag[]>([]);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter/Search states
  const [userSearch, setUserSearch] = useState("");
  const [playlistSearch, setPlaylistSearch] = useState("");

  // Analytics & monitoring states
  const [quotaTimeframe, setQuotaTimeframe] = useState<"7" | "14" | "30">("7");
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState<"ALL" | "INFO" | "AUDIT" | "ERROR" | "WARNING">("ALL");
  const [simExpectedDailySearches, setSimExpectedDailySearches] = useState<number>(350);
  const [simAverageCost, setSimAverageCost] = useState<number>(3);
  const [simEnableCache, setSimEnableCache] = useState<boolean>(true);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Tag inputs
  const [newTagName, setNewTagName] = useState("");
  const [tagQuery, setTagQuery] = useState("");

  // Live Config States
  const [maxSongsInput, setMaxSongsInput] = useState("100");
  const [cacheExpiryInput, setCacheExpiryInput] = useState("24");
  const [alertBannerInput, setAlertBannerInput] = useState("");
  const [registrationDisabledInput, setRegistrationDisabledInput] = useState(false);
  const [maintenanceModeInput, setMaintenanceModeInput] = useState(false);
  const [enableCommunityPostsInput, setEnableCommunityPostsInput] = useState(false);
  const [strictModerationInput, setStrictModerationInput] = useState(false);

  const [featuredCollectionEnabledInput, setFeaturedCollectionEnabledInput] = useState(false);
  const [featuredTitleInput, setFeaturedTitleInput] = useState("");
  const [featuredPlaylistIdInput, setFeaturedPlaylistIdInput] = useState("");
  const [featuredDescInput, setFeaturedDescInput] = useState("");

  // Customizable Collection Row States
  const [customRowEnabledInput, setCustomRowEnabledInput] = useState(false);
  const [customRowTitleInput, setCustomRowTitleInput] = useState("");
  const [customRowSubtitleInput, setCustomRowSubtitleInput] = useState("");
  const [customRowTypeInput, setCustomRowTypeInput] = useState<"playlists" | "songs">("playlists");
  const [customRowIdsInput, setCustomRowIdsInput] = useState<string[]>([]);
  const [compiledItems, setCompiledItems] = useState<any[]>([]);
  const [rowSearchQuery, setRowSearchQuery] = useState("");
  const [rowSearchResults, setRowSearchResults] = useState<{playlists: any[], songs: any[]}>({playlists: [], songs: []});
  const [rowSearchLoading, setRowSearchLoading] = useState(false);

  // Homepage Layout Customizer States
  const [homepageLayoutInput, setHomepageLayoutInput] = useState<any[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState<string>("");
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [dragOverSectionIndex, setDragOverSectionIndex] = useState<number | null>(null);

  // Recommended & Moods/Genres States
  const [recommendedLimitInput, setRecommendedLimitInput] = useState("20");
  const [recommendedStrategyInput, setRecommendedStrategyInput] = useState("artist_match");
  const [recommendedExcludePlayedInput, setRecommendedExcludePlayedInput] = useState(true);
  const [moodsGenresLimitInput, setMoodsGenresLimitInput] = useState("15");
  const [moodsGenresCustomTagsInput, setMoodsGenresCustomTagsInput] = useState("");

  // Promotional Banners States
  const [bannersList, setBannersList] = useState<any[]>([]);
  const [newBannerImage, setNewBannerImage] = useState("");
  const [newBannerMobileImage, setNewBannerMobileImage] = useState("");
  const [newBannerLink, setNewBannerLink] = useState("");
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerSubtitle, setNewBannerSubtitle] = useState("");
  const [newBannerType, setNewBannerType] = useState<"spotlight" | "ad">("spotlight");
  const [newBannerButtonText, setNewBannerButtonText] = useState("Explore Now");
  const [newBannerEnableGradient, setNewBannerEnableGradient] = useState(true);
  const [newBannerTags, setNewBannerTags] = useState("");
  const [newBannerHideContent, setNewBannerHideContent] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [slideshowIntervalInput, setSlideshowIntervalInput] = useState("6");

  // Synchronize dynamic system config inputs once fetched from server
  useEffect(() => {
    if (configs.length > 0) {
      const maxSongs = configs.find(c => c.key === "MAX_SONGS_PER_PLAYLIST")?.value;
      if (maxSongs) setMaxSongsInput(maxSongs);

      const cacheExpiry = configs.find(c => c.key === "CACHE_EXPIRY_HOURS")?.value;
      if (cacheExpiry) setCacheExpiryInput(cacheExpiry);

      const alertBanner = configs.find(c => c.key === "SYSTEM_ALERT_BANNER")?.value;
      if (alertBanner !== undefined) setAlertBannerInput(alertBanner);

      const intervalVal = configs.find(c => c.key === "SYSTEM_PROMO_INTERVAL")?.value;
      if (intervalVal) setSlideshowIntervalInput(intervalVal);

      const regDisVal = configs.find(c => c.key === "DISABLE_REGISTRATION")?.value === "true";
      setRegistrationDisabledInput(regDisVal);

      const maintVal = configs.find(c => c.key === "MAINTENANCE_MODE")?.value === "true";
      setMaintenanceModeInput(maintVal);

      const commPostsVal = configs.find(c => c.key === "ENABLE_COMMUNITY_POSTS")?.value !== "false";
      setEnableCommunityPostsInput(commPostsVal);

      const strictModVal = configs.find(c => c.key === "STRICT_MODERATION")?.value === "true";
      setStrictModerationInput(strictModVal);

      const featuredEnabledVal = configs.find(c => c.key === "FEATURED_COLLECTION_ENABLED")?.value === "true";
      setFeaturedCollectionEnabledInput(featuredEnabledVal);

      const titleVal = configs.find(c => c.key === "FEATURED_COLLECTION_TITLE")?.value || "";
      const playlistIdVal = configs.find(c => c.key === "FEATURED_COLLECTION_PLAYLIST_ID")?.value || "";
      const descVal = configs.find(c => c.key === "FEATURED_COLLECTION_DESC")?.value || "";
      setFeaturedTitleInput(titleVal);
      setFeaturedPlaylistIdInput(playlistIdVal);
      setFeaturedDescInput(descVal);

      const customEnabledVal = configs.find(c => c.key === "CUSTOM_ROW_ENABLED")?.value === "true";
      const customTitleVal = configs.find(c => c.key === "CUSTOM_ROW_TITLE")?.value || "";
      const customSubtitleVal = configs.find(c => c.key === "CUSTOM_ROW_SUBTITLE")?.value || "";
      const customTypeVal = (configs.find(c => c.key === "CUSTOM_ROW_TYPE")?.value as "playlists" | "songs") || "playlists";
      const customIdsVal = configs.find(c => c.key === "CUSTOM_ROW_IDS")?.value || "";
      const idList = customIdsVal.split(",").map((id: string) => id.trim()).filter((id: string) => id.length > 0);

      setCustomRowEnabledInput(customEnabledVal);
      setCustomRowTitleInput(customTitleVal);
      setCustomRowSubtitleInput(customSubtitleVal);
      setCustomRowTypeInput(customTypeVal);
      setCustomRowIdsInput(idList);

      const bannersVal = configs.find(c => c.key === "SYSTEM_PROMO_BANNERS")?.value;
      if (bannersVal) {
        try {
          const parsed = JSON.parse(bannersVal);
          if (Array.isArray(parsed)) {
            setBannersList(parsed);
          }
        } catch (e) {
          // ignore parsing error in sync
        }
      } else {
        setBannersList([]);
      }

      const recLimit = configs.find(c => c.key === "RECOMMENDED_LIMIT")?.value;
      if (recLimit) setRecommendedLimitInput(recLimit);

      const recStrategy = configs.find(c => c.key === "RECOMMENDED_STRATEGY")?.value;
      if (recStrategy) setRecommendedStrategyInput(recStrategy);

      const recExcludePlayed = configs.find(c => c.key === "RECOMMENDED_EXCLUDE_PLAYED")?.value;
      if (recExcludePlayed !== undefined) setRecommendedExcludePlayedInput(recExcludePlayed === "true");

      const mgLimit = configs.find(c => c.key === "MOOD_GENRES_LIMIT")?.value;
      if (mgLimit) setMoodsGenresLimitInput(mgLimit);

      const mgCustomTags = configs.find(c => c.key === "MOOD_GENRES_CUSTOM_TAGS")?.value;
      if (mgCustomTags !== undefined) setMoodsGenresCustomTagsInput(mgCustomTags);

      const defaultSections = [
        { id: "promoBanners", name: "Advertisement Banners", visible: true, title: "Special Offers", layoutStyle: "carousel" },
        { id: "yourCurations", name: "Your Curations", visible: true, title: "Your Curations", layoutStyle: "carousel" },
        { id: "heavyRotation", name: "On Heavy Rotation", visible: true, title: "On Heavy Rotation", layoutStyle: "carousel" },
        { id: "trending", name: "Trending Worldwide", visible: true, title: "Trending Worldwide", layoutStyle: "carousel" },
        { id: "recommended", name: "Recommended for You", visible: true, title: "Recommended for You", layoutStyle: "carousel" },
        { id: "quickPicks", name: "Quick Picks", visible: true, title: "Quick Picks", layoutStyle: "grid" },
        { id: "spotlight", name: "Spotlight Curation", visible: true, title: "Spotlight Curation", layoutStyle: "hero" },
        { id: "customCollection", name: "Customizable Collection Row", visible: true, title: "Customizable Collection Row", layoutStyle: "carousel" },
        { id: "communityFavorites", name: "Community Favorites", visible: true, title: "Community Favorites", layoutStyle: "carousel" },
        { id: "freshFinds", name: "Fresh Finds", visible: true, title: "Fresh Finds", layoutStyle: "carousel" },
        { id: "moodsGenres", name: "Moods & Genres", visible: true, title: "Moods & Genres", layoutStyle: "grid" }
      ];
      const layoutStr = configs.find(c => c.key === "HOMEPAGE_LAYOUT")?.value;
      let layout: any[] = [];
      if (layoutStr) {
        try {
          layout = JSON.parse(layoutStr);
        } catch (e) {
          console.error(e);
        }
      }
      const merged = [...layout];
      defaultSections.forEach(defSec => {
        if (!merged.some(s => s.id === defSec.id)) {
          merged.push(defSec);
        }
      });
      setHomepageLayoutInput(merged);
    }
  }, [configs]);

  // Rotate the slideshow in the live admin preview panel
  useEffect(() => {
    if (activeTab !== "promotions" || previewSource !== "live" || bannersList.length <= 1) {
      return;
    }
    const speedSecs = parseInt(slideshowIntervalInput, 10) || 6;
    const interval = setInterval(() => {
      setPreviewIndex(prev => (prev + 1) % bannersList.length);
    }, speedSecs * 1000);
    return () => clearInterval(interval);
  }, [bannersList, slideshowIntervalInput, activeTab, previewSource]);

  useEffect(() => {
    if (previewIndex >= bannersList.length) {
      setPreviewIndex(0);
    }
  }, [bannersList, previewIndex]);

  // User suspension input map (userId -> inputs)
  const [userSuspensionInputs, setUserSuspensionInputs] = useState<Record<string, { days: string; warning: string }>>({});

  // Selection states for Batch Moderation
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Record<string, boolean>>({});
  const [selectedDeadSongIds, setSelectedDeadSongIds] = useState<Record<string, boolean>>({});

  // Media Inspector states
  const [inspectPlaylistId, setInspectPlaylistId] = useState<string | null>(null);
  const [inspectorPlaylist, setInspectorPlaylist] = useState<any | null>(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);

  // Inline editing states for inspector
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editSongTitle, setEditSongTitle] = useState("");
  const [editSongArtist, setEditSongArtist] = useState("");

  // Admin Auto-Suggest states
  const [adminArtistSuggestions, setAdminArtistSuggestions] = useState<any[]>([]);
  const [showAdminArtistSuggestions, setShowAdminArtistSuggestions] = useState(false);

  const fetchAdminArtistSuggestions = async (val: string) => {
    try {
      const res = await fetch(`/api/songs?action=artists&q=${encodeURIComponent(val)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminArtistSuggestions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [artistStats, setArtistStats] = useState<{ totalArtists: number; sampleArtists: any[] } | null>(null);
  const [syncingArtists, setSyncingArtists] = useState(false);

  const fetchArtistStats = async () => {
    try {
      const res = await fetch('/api/admin?action=get-artists-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setArtistStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncArtists = async () => {
    setSyncingArtists(true);
    try {
      const res = await fetch('/api/admin?action=sync-artists', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Sync completed! Synchronized ${data.totalFound} unique artists, imported ${data.newlyImported} new ones.`);
        fetchArtistStats();
      } else {
        toast.error(data.error || 'Failed to sync artists');
      }
    } catch (e) {
      toast.error('Sync failed');
    } finally {
      setSyncingArtists(false);
    }
  };

  const [editingPlaylist, setEditingPlaylist] = useState(false);
  const [editPlaylistName, setEditPlaylistName] = useState("");
  const [editPlaylistDesc, setEditPlaylistDesc] = useState("");
  const [editPlaylistVisibility, setEditPlaylistVisibility] = useState<"public" | "private">("public");

  useEffect(() => {
    if (token) {
      loadAllAdminData();
    }
  }, [token]);

  const loadAllAdminData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch simultaneously to minimize load times
      const [
        usersRes,
        playlistsRes,
        deadSongsRes,
        logsRes,
        quotaRes,
        tagsRes,
        configsRes,
        socialRes
      ] = await Promise.all([
        fetch("/api/admin?action=get-users", { headers }),
        fetch("/api/admin?action=get-playlists", { headers }),
        fetch("/api/admin?action=get-dead-songs", { headers }),
        fetch("/api/admin?action=get-logs", { headers }),
        fetch("/api/admin?action=get-quota", { headers }),
        fetch("/api/admin?action=get-tags", { headers }),
        fetch("/api/admin?action=get-config", { headers }),
        fetch("/api/social")
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (playlistsRes.ok) setPlaylists(await playlistsRes.json());
      if (deadSongsRes.ok) setDeadSongs(await deadSongsRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
      if (quotaRes.ok) setQuota(await quotaRes.json());
      if (tagsRes.ok) setTags(await tagsRes.json());
      if (configsRes.ok) setConfigs(await configsRes.json());
      if (socialRes.ok) {
        const socialData = await socialRes.json();
        if (socialData.customCollection) {
          setCompiledItems(socialData.customCollection.items || []);
        }
      }
      fetchArtistStats();
    } catch (err) {
      console.error("Failed to load admin dashboard data", err);
      toast.error("Error loading administrative data. Please check connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllAdminData(true);
  };

  // --- Quadrant 1 Operations: Moderation ---
  const handleModeratePlaylist = async (playlistId: string, updates: Partial<AdminPlaylist> & { flagReason?: string }) => {
    try {
      const res = await fetch("/api/admin?action=moderate-playlist", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ playlistId, ...updates })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to moderate playlist");
      }

      toast.success("Playlist moderation setting updated");
      // Update local state
      setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, ...updates } : p));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleFetchPlaylistDetails = async (playlistId: string) => {
    setInspectPlaylistId(playlistId);
    setInspectorLoading(true);
    setEditingPlaylist(false);
    setEditingSongId(null);
    try {
      const res = await fetch(`/api/admin?action=get-playlist-details&playlistId=${playlistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch playlist details");
      const data = await res.json();
      setInspectorPlaylist(data);
      setEditPlaylistName(data.name);
      setEditPlaylistDesc(data.description || "");
      setEditPlaylistVisibility(data.visibility);
    } catch (err: any) {
      toast.error(err.message);
      setInspectPlaylistId(null);
    } finally {
      setInspectorLoading(false);
    }
  };

  const handleDeleteSongFromPlaylist = async (songId: string) => {
    if (!window.confirm("Are you sure you want to delete this track from the playlist? This action cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin?action=delete-song", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ songId })
      });
      if (!res.ok) throw new Error("Failed to delete song");
      toast.success("Song removed from playlist");
      
      // Update inspector state
      if (inspectorPlaylist) {
        setInspectorPlaylist({
          ...inspectorPlaylist,
          songs: inspectorPlaylist.songs.filter((s: any) => s.id !== songId)
        });
      }
      
      // Update parent list count
      setPlaylists(prev => prev.map(p => {
        if (p.id === inspectorPlaylist?.id) {
          return { ...p, _count: { songs: Math.max(0, p._count.songs - 1) } };
        }
        return p;
      }));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateSongInPlaylist = async (songId: string, title: string, artist: string) => {
    try {
      const res = await fetch("/api/admin?action=update-song", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ songId, title, artist })
      });
      if (!res.ok) throw new Error("Failed to update song details");
      toast.success("Song details updated");
      setEditingSongId(null);
      
      // Update inspector state
      if (inspectorPlaylist) {
        setInspectorPlaylist({
          ...inspectorPlaylist,
          songs: inspectorPlaylist.songs.map((s: any) => s.id === songId ? { ...s, title, artist } : s)
        });
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdatePlaylistDetails = async (playlistId: string, name: string, description: string, visibility: string) => {
    try {
      const res = await fetch("/api/admin?action=update-playlist", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ playlistId, name, description, visibility })
      });
      if (!res.ok) throw new Error("Failed to update playlist details");
      toast.success("Playlist details updated successfully");
      setEditingPlaylist(false);
      
      // Update inspector state
      if (inspectorPlaylist) {
        setInspectorPlaylist({
          ...inspectorPlaylist,
          name,
          description,
          visibility
        });
      }
      
      // Update parent playlists list
      setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, name, description, visibility: visibility as any } : p));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBulkModeratePlaylists = async (updates: any) => {
    const selectedIds = Object.keys(selectedPlaylistIds).filter(id => selectedPlaylistIds[id]);
    if (selectedIds.length === 0) return;
    
    // If setting flagged and no reason provided, prompt
    if (updates.isFlagged && !updates.flagReason) {
      const reason = window.prompt(`Enter reason for flagging ${selectedIds.length} playlists:`) || "";
      if (reason === null) return; // User cancelled
      updates.flagReason = reason;
    }
    
    try {
      const res = await fetch("/api/admin?action=bulk-moderate-playlists", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ playlistIds: selectedIds, updates })
      });
      if (!res.ok) throw new Error("Failed to bulk moderate playlists");
      toast.success(`Successfully updated ${selectedIds.length} playlists`);
      
      // Reset checkboxes
      setSelectedPlaylistIds({});
      
      // Update local state
      setPlaylists(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, ...updates } : p));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBulkClearDeadSongs = async () => {
    const selectedIds = Object.keys(selectedDeadSongIds).filter(id => selectedDeadSongIds[id]);
    if (selectedIds.length === 0) return;
    
    try {
      const res = await fetch("/api/admin?action=bulk-clear-dead-songs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ songIds: selectedIds })
      });
      if (!res.ok) throw new Error("Failed to bulk clear dead songs");
      toast.success(`Successfully cleared dead status for ${selectedIds.length} songs`);
      
      // Reset checkboxes
      setSelectedDeadSongIds({});
      
      // Update local state
      setDeadSongs(prev => prev.filter(s => !selectedIds.includes(s.id)));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleClearDeadSong = async (songId: string) => {
    try {
      const res = await fetch("/api/admin?action=clear-dead-song", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ songId })
      });

      if (!res.ok) throw new Error("Failed to clear dead song report");

      toast.success("Song marked clean. Reports cleared.");
      setDeadSongs(prev => prev.filter(s => s.id !== songId));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // --- Quadrant 2 Operations: Users ---
  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      const res = await fetch("/api/admin?action=update-user-role", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, role })
      });

      if (!res.ok) throw new Error("Failed to update user role");

      toast.success(`User role successfully changed to ${role}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as any } : u));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      const inputs = userSuspensionInputs[userId] || { days: "7", warning: "" };
      const durationDays = status === "SUSPENDED" ? parseInt(inputs.days || "7") : undefined;
      const warningMessage = inputs.warning || undefined;

      const res = await fetch("/api/admin?action=update-user-status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, status, durationDays, warningMessage })
      });

      if (!res.ok) throw new Error("Failed to update user status");

      toast.success(`User status changed to ${status}`);
      // Reload users list to show calculated expiration times
      const usersRes = await fetch("/api/admin?action=get-users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // --- Quadrant 4 Operations: Custom Taxonomy & System configs ---
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const res = await fetch("/api/admin?action=add-tag", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newTagName.trim() })
      });

      if (!res.ok) throw new Error("Failed to add system tag");

      toast.success(`Tag "${newTagName.trim()}" successfully added`);
      setNewTagName("");
      
      const tagsRes = await fetch("/api/admin?action=get-tags", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tagsRes.ok) setTags(await tagsRes.json());
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const res = await fetch("/api/admin?action=delete-tag", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: tagId })
      });

      if (!res.ok) throw new Error("Failed to delete system tag");

      toast.success("System taxonomy tag deleted successfully");
      setTags(prev => prev.filter(t => t.id !== tagId));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateConfig = async (key: string, value: string) => {
    try {
      const res = await fetch("/api/admin?action=update-config", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ key, value })
      });

      if (!res.ok) throw new Error("Failed to save config toggle");

      toast.success(`Config toggle "${key}" successfully saved`);
      setConfigs(prev => {
        const exists = prev.some(c => c.key === key);
        if (exists) {
          return prev.map(c => c.key === key ? { ...c, value } : c);
        } else {
          return [...prev, { key, value, updatedAt: new Date().toISOString() }];
        }
      });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const isDirty = (() => {
    if (configs.length === 0) return false;

    const findVal = (key: string) => configs.find(c => c.key === key)?.value || "";

    const dDisableReg = findVal("DISABLE_REGISTRATION") === "true";
    const dMaintenance = findVal("MAINTENANCE_MODE") === "true";
    const dCommPosts = findVal("ENABLE_COMMUNITY_POSTS") !== "false";
    const dStrictMod = findVal("STRICT_MODERATION") === "true";

    const dMaxSongs = findVal("MAX_SONGS_PER_PLAYLIST") || "100";
    const dCacheExpiry = findVal("CACHE_EXPIRY_HOURS") || "24";
    const dAlertBanner = findVal("SYSTEM_ALERT_BANNER") || "";
    const dSlideshowInterval = findVal("SYSTEM_PROMO_INTERVAL") || "6";

    const dRecLimit = findVal("RECOMMENDED_LIMIT") || "20";
    const dRecStrategy = findVal("RECOMMENDED_STRATEGY") || "artist_match";
    const dRecExcludePlayed = findVal("RECOMMENDED_EXCLUDE_PLAYED") === "true";

    const dMgLimit = findVal("MOOD_GENRES_LIMIT") || "15";
    const dMgCustomTags = findVal("MOOD_GENRES_CUSTOM_TAGS") || "";

    const dFeaturedEnabled = findVal("FEATURED_COLLECTION_ENABLED") === "true";
    const dFeaturedTitle = findVal("FEATURED_COLLECTION_TITLE") || "";
    const dFeaturedPlaylistId = findVal("FEATURED_COLLECTION_PLAYLIST_ID") || "";
    const dFeaturedDesc = findVal("FEATURED_COLLECTION_DESC") || "";

    const dCustomEnabled = findVal("CUSTOM_ROW_ENABLED") === "true";
    const dCustomTitle = findVal("CUSTOM_ROW_TITLE") || "";
    const dCustomSubtitle = findVal("CUSTOM_ROW_SUBTITLE") || "";
    const dCustomType = findVal("CUSTOM_ROW_TYPE") || "playlists";
    const dCustomIds = findVal("CUSTOM_ROW_IDS") || "";

    const dLayout = findVal("HOMEPAGE_LAYOUT") || "";
    const dBanners = findVal("SYSTEM_PROMO_BANNERS") || "";

    if (registrationDisabledInput !== dDisableReg) return true;
    if (maintenanceModeInput !== dMaintenance) return true;
    if (enableCommunityPostsInput !== dCommPosts) return true;
    if (strictModerationInput !== dStrictMod) return true;

    if (maxSongsInput !== dMaxSongs) return true;
    if (cacheExpiryInput !== dCacheExpiry) return true;
    if (alertBannerInput !== dAlertBanner) return true;
    if (slideshowIntervalInput !== dSlideshowInterval) return true;

    if (recommendedLimitInput !== dRecLimit) return true;
    if (recommendedStrategyInput !== dRecStrategy) return true;
    if (recommendedExcludePlayedInput !== dRecExcludePlayed) return true;

    if (moodsGenresLimitInput !== dMgLimit) return true;
    if (moodsGenresCustomTagsInput !== dMgCustomTags) return true;

    if (featuredCollectionEnabledInput !== dFeaturedEnabled) return true;
    if (featuredTitleInput !== dFeaturedTitle) return true;
    if (featuredPlaylistIdInput !== dFeaturedPlaylistId) return true;
    if (featuredDescInput !== dFeaturedDesc) return true;

    if (customRowEnabledInput !== dCustomEnabled) return true;
    if (customRowTitleInput !== dCustomTitle) return true;
    if (customRowSubtitleInput !== dCustomSubtitle) return true;
    if (customRowTypeInput !== dCustomType) return true;
    if (customRowIdsInput.join(",") !== dCustomIds) return true;

    // Homepage layout and banners list check
    if (JSON.stringify(homepageLayoutInput) !== (dLayout || "[]")) return true;
    if (JSON.stringify(bannersList) !== (dBanners || "[]")) return true;

    return false;
  })();

  const handleSavePanelConfigs = async (keys: string[], values: Record<string, string>, panelName: string) => {
    try {
      const configItems = keys.map(key => ({
        key,
        value: values[key]
      }));

      const res = await fetch("/api/admin?action=bulk-update-configs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ configs: configItems })
      });

      if (!res.ok) throw new Error(`Failed to save ${panelName} settings`);

      toast.success(`${panelName} settings saved successfully`);
      
      setConfigs(prev => {
        const next = [...prev];
        configItems.forEach(item => {
          const index = next.findIndex(c => c.key === item.key);
          if (index > -1) {
            next[index] = { ...next[index], value: item.value, updatedAt: new Date().toISOString() };
          } else {
            next.push({ key: item.key, value: item.value, updatedAt: new Date().toISOString() });
          }
        });
        return next;
      });
    } catch (err: any) {
      toast.error(err.message || `Failed to save ${panelName} settings`);
    }
  };

  const handleSaveAllConfigs = async () => {
    try {
      const configItems = [
        { key: "DISABLE_REGISTRATION", value: registrationDisabledInput ? "true" : "false" },
        { key: "MAINTENANCE_MODE", value: maintenanceModeInput ? "true" : "false" },
        { key: "ENABLE_COMMUNITY_POSTS", value: enableCommunityPostsInput ? "true" : "false" },
        { key: "STRICT_MODERATION", value: strictModerationInput ? "true" : "false" },
        { key: "MAX_SONGS_PER_PLAYLIST", value: maxSongsInput },
        { key: "CACHE_EXPIRY_HOURS", value: cacheExpiryInput },
        { key: "FEATURED_COLLECTION_ENABLED", value: featuredCollectionEnabledInput ? "true" : "false" },
        { key: "FEATURED_COLLECTION_TITLE", value: featuredTitleInput.trim() },
        { key: "FEATURED_COLLECTION_DESC", value: featuredDescInput.trim() },
        { key: "FEATURED_COLLECTION_PLAYLIST_ID", value: featuredPlaylistIdInput },
        { key: "CUSTOM_ROW_ENABLED", value: customRowEnabledInput ? "true" : "false" },
        { key: "CUSTOM_ROW_TITLE", value: customRowTitleInput.trim() },
        { key: "CUSTOM_ROW_SUBTITLE", value: customRowSubtitleInput.trim() },
        { key: "CUSTOM_ROW_TYPE", value: customRowTypeInput },
        { key: "CUSTOM_ROW_IDS", value: customRowIdsInput.join(",") },
        { key: "RECOMMENDED_LIMIT", value: recommendedLimitInput },
        { key: "RECOMMENDED_STRATEGY", value: recommendedStrategyInput },
        { key: "RECOMMENDED_EXCLUDE_PLAYED", value: recommendedExcludePlayedInput ? "true" : "false" },
        { key: "MOOD_GENRES_LIMIT", value: moodsGenresLimitInput },
        { key: "MOOD_GENRES_CUSTOM_TAGS", value: moodsGenresCustomTagsInput.trim() },
        { key: "SYSTEM_ALERT_BANNER", value: alertBannerInput.trim() },
        { key: "SYSTEM_PROMO_INTERVAL", value: slideshowIntervalInput },
        { key: "SYSTEM_PROMO_BANNERS", value: JSON.stringify(bannersList) },
        { key: "HOMEPAGE_LAYOUT", value: JSON.stringify(homepageLayoutInput) }
      ];

      const res = await fetch("/api/admin?action=bulk-update-configs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ configs: configItems })
      });

      if (!res.ok) throw new Error("Failed to save configurations");

      toast.success("All system configurations saved successfully");
      
      setConfigs(prev => {
        const next = [...prev];
        configItems.forEach(item => {
          const index = next.findIndex(c => c.key === item.key);
          if (index > -1) {
            next[index] = { ...next[index], value: item.value, updatedAt: new Date().toISOString() };
          } else {
            next.push({ key: item.key, value: item.value, updatedAt: new Date().toISOString() });
          }
        });
        return next;
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save configurations");
    }
  };

  const handleDiscardChanges = () => {
    if (configs.length > 0) {
      const regDis = configs.find(c => c.key === "DISABLE_REGISTRATION")?.value === "true";
      setRegistrationDisabledInput(regDis);

      const maint = configs.find(c => c.key === "MAINTENANCE_MODE")?.value === "true";
      setMaintenanceModeInput(maint);

      const commPosts = configs.find(c => c.key === "ENABLE_COMMUNITY_POSTS")?.value !== "false";
      setEnableCommunityPostsInput(commPosts);

      const strictMod = configs.find(c => c.key === "STRICT_MODERATION")?.value === "true";
      setStrictModerationInput(strictMod);

      const maxSongs = configs.find(c => c.key === "MAX_SONGS_PER_PLAYLIST")?.value || "100";
      setMaxSongsInput(maxSongs);

      const cacheExpiry = configs.find(c => c.key === "CACHE_EXPIRY_HOURS")?.value || "24";
      setCacheExpiryInput(cacheExpiry);

      const alertBanner = configs.find(c => c.key === "SYSTEM_ALERT_BANNER")?.value || "";
      setAlertBannerInput(alertBanner);

      const intervalVal = configs.find(c => c.key === "SYSTEM_PROMO_INTERVAL")?.value || "6";
      setSlideshowIntervalInput(intervalVal);

      const bannersVal = configs.find(c => c.key === "SYSTEM_PROMO_BANNERS")?.value;
      if (bannersVal) {
        try {
          setBannersList(JSON.parse(bannersVal));
        } catch (e) {
          setBannersList([]);
        }
      } else {
        setBannersList([]);
      }

      const recLimit = configs.find(c => c.key === "RECOMMENDED_LIMIT")?.value || "20";
      setRecommendedLimitInput(recLimit);

      const recStrategy = configs.find(c => c.key === "RECOMMENDED_STRATEGY")?.value || "artist_match";
      setRecommendedStrategyInput(recStrategy);

      const recExcludePlayed = configs.find(c => c.key === "RECOMMENDED_EXCLUDE_PLAYED")?.value === "true";
      setRecommendedExcludePlayedInput(recExcludePlayed);

      const mgLimit = configs.find(c => c.key === "MOOD_GENRES_LIMIT")?.value || "15";
      setMoodsGenresLimitInput(mgLimit);

      const mgCustomTags = configs.find(c => c.key === "MOOD_GENRES_CUSTOM_TAGS")?.value || "";
      setMoodsGenresCustomTagsInput(mgCustomTags);

      const titleVal = configs.find(c => c.key === "FEATURED_COLLECTION_TITLE")?.value || "";
      setFeaturedTitleInput(titleVal);

      const playlistIdVal = configs.find(c => c.key === "FEATURED_COLLECTION_PLAYLIST_ID")?.value || "";
      setFeaturedPlaylistIdInput(playlistIdVal);

      const descVal = configs.find(c => c.key === "FEATURED_COLLECTION_DESC")?.value || "";
      setFeaturedDescInput(descVal);

      const customEnabledVal = configs.find(c => c.key === "CUSTOM_ROW_ENABLED")?.value === "true";
      const customTitleVal = configs.find(c => c.key === "CUSTOM_ROW_TITLE")?.value || "";
      const customSubtitleVal = configs.find(c => c.key === "CUSTOM_ROW_SUBTITLE")?.value || "";
      const customTypeVal = (configs.find(c => c.key === "CUSTOM_ROW_TYPE")?.value as "playlists" | "songs") || "playlists";
      const customIdsVal = configs.find(c => c.key === "CUSTOM_ROW_IDS")?.value || "";
      const idList = customIdsVal.split(",").map((id: string) => id.trim()).filter((id: string) => id.length > 0);

      setCustomRowEnabledInput(customEnabledVal);
      setCustomRowTitleInput(customTitleVal);
      setCustomRowSubtitleInput(customSubtitleVal);
      setCustomRowTypeInput(customTypeVal);
      setCustomRowIdsInput(idList);

      const layoutStr = configs.find(c => c.key === "HOMEPAGE_LAYOUT")?.value;
      let layout: any[] = [];
      if (layoutStr) {
        try {
          layout = JSON.parse(layoutStr);
        } catch (e) {
          console.error(e);
        }
      }
      const defaultSections = [
        { id: "promoBanners", name: "Advertisement Banners", visible: true, title: "Special Offers", layoutStyle: "carousel" },
        { id: "yourCurations", name: "Your Curations", visible: true, title: "Your Curations", layoutStyle: "carousel" },
        { id: "heavyRotation", name: "On Heavy Rotation", visible: true, title: "On Heavy Rotation", layoutStyle: "carousel" },
        { id: "trending", name: "Trending Worldwide", visible: true, title: "Trending Worldwide", layoutStyle: "carousel" },
        { id: "recommended", name: "Recommended for You", visible: true, title: "Recommended for You", layoutStyle: "carousel" },
        { id: "quickPicks", name: "Quick Picks", visible: true, title: "Quick Picks", layoutStyle: "grid" },
        { id: "spotlight", name: "Spotlight Curation", visible: true, title: "Spotlight Curation", layoutStyle: "hero" },
        { id: "customCollection", name: "Customizable Collection Row", visible: true, title: "Customizable Collection Row", layoutStyle: "carousel" },
        { id: "communityFavorites", name: "Community Favorites", visible: true, title: "Community Favorites", layoutStyle: "carousel" },
        { id: "freshFinds", name: "Fresh Finds", visible: true, title: "Fresh Finds", layoutStyle: "carousel" },
        { id: "moodsGenres", name: "Moods & Genres", visible: true, title: "Moods & Genres", layoutStyle: "grid" }
      ];
      const merged = [...layout];
      defaultSections.forEach(defSec => {
        if (!merged.some(s => s.id === defSec.id)) {
          merged.push(defSec);
        }
      });
      setHomepageLayoutInput(merged);
    }
    toast.success("Draft configurations discarded");
  };

  const handleSearchCustomRowItems = async (q: string) => {
    setRowSearchQuery(q);
    if (!q.trim()) {
      setRowSearchResults({ playlists: [], songs: [] });
      return;
    }
    setRowSearchLoading(true);
    try {
      const res = await fetch(`/api/search/global?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setRowSearchResults({
          playlists: data.playlists || [],
          songs: data.songs || []
        });
      }
    } catch (err) {
      console.error("Custom row item search failed", err);
    } finally {
      setRowSearchLoading(false);
    }
  };

  const handleAddItemToCustomRow = (item: any) => {
    if (compiledItems.some(i => i.id === item.id)) {
      toast.error("Item is already added to the compiled collection row");
      return;
    }
    const nextItems = [...compiledItems, item];
    setCompiledItems(nextItems);
    setCustomRowIdsInput(nextItems.map(i => i.id));
    toast.success("Added to compilation row draft!");
  };

  const handleRemoveItemFromCustomRow = (id: string) => {
    const nextItems = compiledItems.filter(i => i.id !== id);
    setCompiledItems(nextItems);
    setCustomRowIdsInput(nextItems.map(i => i.id));
    toast.success("Removed from compilation row draft");
  };

  const handleMoveItemInCustomRow = (index: number, direction: "up" | "down") => {
    const nextItems = [...compiledItems];
    if (direction === "up" && index > 0) {
      const temp = nextItems[index];
      nextItems[index] = nextItems[index - 1];
      nextItems[index - 1] = temp;
    } else if (direction === "down" && index < nextItems.length - 1) {
      const temp = nextItems[index];
      nextItems[index] = nextItems[index + 1];
      nextItems[index + 1] = temp;
    }
    setCompiledItems(nextItems);
    setCustomRowIdsInput(nextItems.map(i => i.id));
  };

  const handleToggleCustomRowType = (type: "playlists" | "songs") => {
    if (compiledItems.length > 0) {
      if (!window.confirm("Changing collection row type will clear current compiled items. Continue?")) {
        return;
      }
    }
    setCustomRowTypeInput(type);
    setCompiledItems([]);
    setCustomRowIdsInput([]);
    setRowSearchResults({ playlists: [], songs: [] });
    setRowSearchQuery("");
    toast.success(`Row type changed to ${type}. Click Save to persist.`);
  };

  const handleAddBanner = () => {
    if (!newBannerImage.trim()) {
      toast.error("Desktop Image URL is required");
      return;
    }

    const parsedTags = newBannerTags
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    let updatedList;
    if (editingBannerId) {
      // Update existing banner
      updatedList = bannersList.map(b => {
        if (b.id === editingBannerId) {
          return {
            ...b,
            imageUrl: newBannerImage.trim(),
            mobileImageUrl: newBannerMobileImage.trim() || undefined,
            linkUrl: newBannerLink.trim() || undefined,
            title: newBannerTitle.trim() || undefined,
            subtitle: newBannerSubtitle.trim() || undefined,
            type: newBannerType,
            buttonText: newBannerButtonText.trim(),
            enableGradient: newBannerEnableGradient,
            tags: parsedTags,
            hideContent: newBannerHideContent,
          };
        }
        return b;
      });
      toast.success("Promotional banner updated successfully");
    } else {
      // Add new banner
      const newBanner = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
        imageUrl: newBannerImage.trim(),
        mobileImageUrl: newBannerMobileImage.trim() || undefined,
        linkUrl: newBannerLink.trim() || undefined,
        title: newBannerTitle.trim() || undefined,
        subtitle: newBannerSubtitle.trim() || undefined,
        type: newBannerType,
        buttonText: newBannerButtonText.trim(),
        enableGradient: newBannerEnableGradient,
        tags: parsedTags,
        hideContent: newBannerHideContent,
      };
      updatedList = [...bannersList, newBanner];
      toast.success("Universal promotional banner added successfully");
    }

    setBannersList(updatedList);
    
    // Clear inputs
    setNewBannerImage("");
    setNewBannerMobileImage("");
    setNewBannerLink("");
    setNewBannerTitle("");
    setNewBannerSubtitle("");
    setNewBannerType("spotlight");
    setNewBannerButtonText("Explore Now");
    setNewBannerEnableGradient(true);
    setNewBannerTags("");
    setNewBannerHideContent(false);
    setEditingBannerId(null);
  };

  const handleCancelEdit = () => {
    setNewBannerImage("");
    setNewBannerMobileImage("");
    setNewBannerLink("");
    setNewBannerTitle("");
    setNewBannerSubtitle("");
    setNewBannerType("spotlight");
    setNewBannerButtonText("Explore Now");
    setNewBannerEnableGradient(true);
    setNewBannerTags("");
    setNewBannerHideContent(false);
    setEditingBannerId(null);
    toast.info("Edit cancelled");
  };

  const handleDeleteBanner = (id: string) => {
    const updatedList = bannersList.filter(b => b.id !== id);
    setBannersList(updatedList);
    toast.success("Promotional banner deleted successfully");
    if (editingBannerId === id) {
      handleCancelEdit();
    }
  };

  const handleMoveBannerUp = (index: number) => {
    if (index === 0) return;
    const updatedList = [...bannersList];
    const temp = updatedList[index];
    updatedList[index] = updatedList[index - 1];
    updatedList[index - 1] = temp;
    setBannersList(updatedList);
  };

  const handleMoveBannerDown = (index: number) => {
    if (index === bannersList.length - 1) return;
    const updatedList = [...bannersList];
    const temp = updatedList[index];
    updatedList[index] = updatedList[index + 1];
    updatedList[index + 1] = temp;
    setBannersList(updatedList);
  };

  const handleLoadTemplate = (type: "spotlight" | "ad") => {
    if (type === "spotlight") {
      setNewBannerTitle("Neon Synthwave Nights");
      setNewBannerSubtitle("Step into the retro-futuristic grid with custom curated heavy synth and retrowave.");
      setNewBannerImage("https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=1200&auto=format&fit=crop");
      setNewBannerMobileImage("https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop");
      setNewBannerLink("https://youtube.com");
      setNewBannerType("spotlight");
      setNewBannerButtonText("Explore Now");
      setNewBannerEnableGradient(true);
      setNewBannerTags("synthwave, retro, music, spotlight");
      setNewBannerHideContent(false);
    } else if (type === "ad") {
      setNewBannerTitle("🍣 Craving Fresh Salmon Sushi?");
      setNewBannerSubtitle("Order premium platter deliveries and enjoy 25% off with promo code SALMON25 today!");
      setNewBannerImage("https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1200&auto=format&fit=crop");
      setNewBannerMobileImage("https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=600&auto=format&fit=crop");
      setNewBannerLink("https://ubereats.com");
      setNewBannerType("ad");
      setNewBannerButtonText("Order Now");
      setNewBannerEnableGradient(false);
      setNewBannerTags("sushi, ad, promo, delivery");
      setNewBannerHideContent(false);
    }
    setEditingBannerId(null);
    toast.success("Loaded universal banner template! Review details and click Add to save.");
  };

  // Filters
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPlaylists = playlists.filter(p =>
    p.name.toLowerCase().includes(playlistSearch.toLowerCase()) ||
    (p.user?.username || "").toLowerCase().includes(playlistSearch.toLowerCase())
  );

  const registrationDisabled = configs.find(c => c.key === "DISABLE_REGISTRATION")?.value === "true";

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[60vh] text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p className="text-sm font-medium tracking-wide">Retrieving administration databases...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-6 text-gray-100 pb-20">
      {/* Admin Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold tracking-wider text-xs uppercase mb-1">
            <Shield className="w-4 h-4" />
            Administrative Domain
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">System Control Center</h1>
          <p className="text-sm text-gray-400 mt-1">Configure curation parameters, monitor platform metrics, and administer user access policies.</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 bg-[#1e293b]/60 border border-white/10 hover:bg-[#1e293b] text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-md active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Grid Tabs Selector */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-1">
        <button
          onClick={() => setActiveTab("moderation")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "moderation"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Content Moderation
          {deadSongs.length > 0 && (
            <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
              {deadSongs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("homepage")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "homepage"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Layout className="w-4 h-4" />
          Homepage Settings
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "users"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Users className="w-4 h-4" />
          User Directory
        </button>
        <button
          onClick={() => setActiveTab("monitoring")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "monitoring"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Activity className="w-4 h-4" />
          Platform Monitoring
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "config"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Settings className="w-4 h-4" />
          System Settings
        </button>
        <button
          onClick={() => setActiveTab("promotions")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "promotions"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Promotions & Broadcasts
        </button>
      </div>

      {/* Tabs Content */}

      {/* Tab 1: Moderation */}
      {activeTab === "moderation" && (
        <div className="flex flex-col gap-6 animate-fadeIn">

            
            <div className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold">Public Playlists Moderation</h2>
                <p className="text-xs text-gray-400 mt-1">Promote high-quality playlists to featured or hide contents reported or flagged as inappropriate.</p>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search playlists or owners..."
                  value={playlistSearch}
                  onChange={e => setPlaylistSearch(e.target.value)}
                  className="w-full bg-[#1e293b]/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {Object.values(selectedPlaylistIds).some(Boolean) && (
              <div className="bg-[#1e293b]/60 border border-indigo-500/30 text-indigo-300 rounded-xl p-3.5 mb-5 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                <span className="text-xs font-semibold">
                  {Object.values(selectedPlaylistIds).filter(Boolean).length} playlists selected
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleBulkModeratePlaylists({ isFeatured: true })}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    Feature
                  </button>
                  <button
                    onClick={() => handleBulkModeratePlaylists({ isFeatured: false })}
                    className="bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-[11px] px-3 py-1.5 rounded-lg border border-white/10 transition-all cursor-pointer"
                  >
                    Unfeature
                  </button>
                  <button
                    onClick={() => handleBulkModeratePlaylists({ isHidden: true })}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    Hide
                  </button>
                  <button
                    onClick={() => handleBulkModeratePlaylists({ isHidden: false })}
                    className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    Unhide
                  </button>
                  <button
                    onClick={() => handleBulkModeratePlaylists({ isFlagged: true })}
                    className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    Flag...
                  </button>
                  <button
                    onClick={() => handleBulkModeratePlaylists({ isFlagged: false })}
                    className="bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 text-teal-400 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    Clear Flags
                  </button>
                  <button
                    onClick={() => setSelectedPlaylistIds({})}
                    className="text-[11px] text-gray-400 hover:text-white underline px-2 py-1 cursor-pointer"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-0 cursor-pointer w-4 h-4"
                        checked={filteredPlaylists.length > 0 && filteredPlaylists.every(p => selectedPlaylistIds[p.id])}
                        onChange={e => {
                          const checked = e.target.checked;
                          const updated = { ...selectedPlaylistIds };
                          filteredPlaylists.forEach(p => {
                            updated[p.id] = checked;
                          });
                          setSelectedPlaylistIds(updated);
                        }}
                      />
                    </th>
                    <th className="py-3 px-4">Playlist</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Vis.</th>
                    <th className="py-3 px-4">Status & Curation</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPlaylists.map(playlist => (
                    <tr key={playlist.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 w-10">
                        <input
                          type="checkbox"
                          className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-0 cursor-pointer w-4 h-4"
                          checked={!!selectedPlaylistIds[playlist.id]}
                          onChange={e => {
                            setSelectedPlaylistIds(prev => ({
                              ...prev,
                              [playlist.id]: e.target.checked
                            }));
                          }}
                        />
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-200">
                        <div>
                          {playlist.name}
                          <span className="text-[10px] text-gray-500 font-normal block mt-0.5">
                            {playlist._count.songs} tracks • {playlist.likesCount} likes
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        {playlist.user?.name || "Unknown"}
                        <span className="text-[10px] text-gray-500 block">@{playlist.user?.username || "deleted"}</span>
                      </td>
                      <td className="py-4 px-4">
                        {playlist.visibility === "public" ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <Globe className="w-3 h-3" /> Public
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500 font-medium">
                            <Lock className="w-3 h-3" /> Private
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {playlist.isFeatured && (
                            <span className="flex items-center gap-0.5 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                              <Star className="w-3 h-3 fill-amber-400" /> Featured
                            </span>
                          )}
                          {playlist.isFlagged && (
                            <span className="flex items-center gap-0.5 bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full font-bold" title={playlist.flagReason || "No reason specified"}>
                              <AlertTriangle className="w-3 h-3" /> Flagged
                            </span>
                          )}
                          {playlist.isHidden && (
                            <span className="flex items-center gap-0.5 bg-gray-500/10 text-gray-400 px-2 py-0.5 rounded-full font-bold">
                              <EyeOff className="w-3 h-3" /> Hidden
                            </span>
                          )}
                          {!playlist.isFeatured && !playlist.isFlagged && !playlist.isHidden && (
                            <span className="flex items-center gap-0.5 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleFetchPlaylistDetails(playlist.id)}
                            className="p-1.5 rounded-lg border bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-1 font-bold text-[10px] px-2.5 cursor-pointer"
                            title="Inspect playlist tracks & details"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect
                          </button>

                          <button
                            onClick={() => handleModeratePlaylist(playlist.id, { isFeatured: !playlist.isFeatured })}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              playlist.isFeatured
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                                : "bg-transparent border-white/5 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/10"
                            }`}
                            title={playlist.isFeatured ? "Unfeature curation" : "Feature on discovery shelf"}
                          >
                            <Star className={`w-3.5 h-3.5 ${playlist.isFeatured ? "fill-amber-400" : ""}`} />
                          </button>

                          <button
                            onClick={() => handleModeratePlaylist(playlist.id, { isHidden: !playlist.isHidden })}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              playlist.isHidden
                                ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                                : "bg-transparent border-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/10"
                            }`}
                            title={playlist.isHidden ? "Make visible" : "Hide from discovery/search"}
                          >
                            {playlist.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => {
                              const isFlagged = !playlist.isFlagged;
                              let flagReason = null;
                              if (isFlagged) {
                                flagReason = window.prompt("Reason for flagging playlist?") || "";
                              }
                              handleModeratePlaylist(playlist.id, { isFlagged, flagReason });
                            }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              playlist.isFlagged
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                                : "bg-transparent border-white/5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/10"
                            }`}
                            title={playlist.isFlagged ? "Clear flagging status" : "Flag inappropriate playlist"}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPlaylists.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        No public playlists found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
              
              <div className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Automated Dead-Link Detection & Reports
              </h2>
              <p className="text-xs text-gray-400 mt-1">Tracks YouTube videos that have been reported by users or identified as broken or unavailable.</p>
            </div>

            {Object.values(selectedDeadSongIds).some(Boolean) && (
              <div className="bg-[#1e293b]/60 border border-emerald-500/30 text-emerald-300 rounded-xl p-3.5 mb-5 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                <span className="text-xs font-semibold">
                  {Object.values(selectedDeadSongIds).filter(Boolean).length} reported tracks selected
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleBulkClearDeadSongs}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    Bulk Mark Active & Reset Reports
                  </button>
                  <button
                    onClick={() => setSelectedDeadSongIds({})}
                    className="text-[11px] text-gray-400 hover:text-white underline px-2 py-1 cursor-pointer"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-0 cursor-pointer w-4 h-4"
                        checked={deadSongs.length > 0 && deadSongs.every(s => selectedDeadSongIds[s.id])}
                        onChange={e => {
                          const checked = e.target.checked;
                          const updated = { ...selectedDeadSongIds };
                          deadSongs.forEach(s => {
                            updated[s.id] = checked;
                          });
                          setSelectedDeadSongIds(updated);
                        }}
                      />
                    </th>
                    <th className="py-3 px-4">Track Title</th>
                    <th className="py-3 px-4">Artist</th>
                    <th className="py-3 px-4">YouTube ID</th>
                    <th className="py-3 px-4">Source Playlist</th>
                    <th className="py-3 px-4 text-center">Status Flag</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {deadSongs.map(song => (
                    <tr key={song.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 w-10">
                        <input
                          type="checkbox"
                          className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-0 cursor-pointer w-4 h-4"
                          checked={!!selectedDeadSongIds[song.id]}
                          onChange={e => {
                            setSelectedDeadSongIds(prev => ({
                              ...prev,
                              [song.id]: e.target.checked
                            }));
                          }}
                        />
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-200">{song.title}</td>
                      <td className="py-4 px-4 text-gray-400">{song.artist || "Unknown"}</td>
                      <td className="py-4 px-4 text-gray-400 font-mono select-all">
                        <a
                          href={`https://youtube.com/watch?v=${song.youtubeId}`}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="hover:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          {song.youtubeId}
                        </a>
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        {song.playlist ? (
                          <div>
                            {song.playlist.name}
                            <span className="text-[10px] text-gray-500 block">owner: @{song.playlist.user.username}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                          Dead Link Flagged
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleClearDeadSong(song.id)}
                          className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Mark Active / Reset Reports
                        </button>
                      </td>
                    </tr>
                  ))}
                  {deadSongs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        <CheckCircle className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                        No outstanding dead-links reported. Platform healthy!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab 4: Homepage Settings */}
      {activeTab === "homepage" && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Top Overview Banner */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/40 to-violet-950/40 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2 text-white">
                <Layout className="w-5 h-5 text-indigo-400" />
                Homepage Settings & Customization
              </h2>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                Configure spotlight banners, section visibility, layouts, custom curated shelves, and discovery recommendation engines.
              </p>
            </div>
          </div>

{/* Spotlight Curation Manager */}
              <div id="featured-homepage-section-panel" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-indigo-400" />
              Spotlight Curation
            </h2>
            <p className="text-xs text-gray-400 mb-6">Create a highly styled, admin-curated spotlight section on the homepage based on any public curation playlist.</p>

            <div className="flex flex-col gap-4">
              {/* Toggle Spotlight Status */}
              <div className="flex items-center justify-between p-4 bg-slate-900/35 border border-white/5 rounded-xl transition-all hover:border-white/10">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-gray-200">Display Status</span>
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                      featuredCollectionEnabledInput ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {featuredCollectionEnabledInput ? "LIVE (unsaved)" : "DISABLED (unsaved)"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">Toggle whether this customizable spotlight curation is active on the homepage.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeaturedCollectionEnabledInput(!featuredCollectionEnabledInput)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                    featuredCollectionEnabledInput ? "bg-emerald-600" : "bg-slate-700"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    featuredCollectionEnabledInput ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Spotlight Title */}
              <div className="flex flex-col gap-2 p-4 bg-slate-900/35 border border-white/5 rounded-xl">
                <div>
                  <span className="font-semibold text-xs text-gray-200 block">Title</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">The custom heading as shown to public visitors.</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={featuredTitleInput}
                    onChange={(e) => setFeaturedTitleInput(e.target.value)}
                    placeholder="Spotlight Curation..."
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Spotlight Message / Description */}
              <div className="flex flex-col gap-2 p-4 bg-slate-900/35 border border-white/5 rounded-xl">
                <div>
                  <span className="font-semibold text-xs text-gray-200 block">Description</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">A customizable curation message or description text shown in the spotlight.</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <textarea
                    rows={2}
                    value={featuredDescInput}
                    onChange={(e) => setFeaturedDescInput(e.target.value)}
                    placeholder="A special curation hand-picked by the admin team..."
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              {/* Source Curation Playlist */}
              <div className="flex flex-col gap-2 p-4 bg-slate-900/35 border border-white/5 rounded-xl">
                <div>
                  <span className="font-semibold text-xs text-gray-200 block">Source Curation Playlist</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Select a public playlist whose songs should populate this custom category.</span>
                </div>
                <select
                  value={featuredPlaylistIdInput}
                  onChange={(e) => setFeaturedPlaylistIdInput(e.target.value)}
                  className="w-full mt-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Public Playlist --</option>
                  {playlists
                    .filter((p: any) => p.visibility === "public")
                    .map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (by {p.user?.name || p.user?.username || "Unknown"})
                      </option>
                    ))}
                </select>
              </div>

              {/* Save Button for Spotlight Curation */}
              <div className="flex justify-end mt-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => handleSavePanelConfigs(
                    [
                      "FEATURED_COLLECTION_ENABLED",
                      "FEATURED_COLLECTION_TITLE",
                      "FEATURED_COLLECTION_DESC",
                      "FEATURED_COLLECTION_PLAYLIST_ID"
                    ],
                    {
                      FEATURED_COLLECTION_ENABLED: featuredCollectionEnabledInput ? "true" : "false",
                      FEATURED_COLLECTION_TITLE: featuredTitleInput.trim(),
                      FEATURED_COLLECTION_DESC: featuredDescInput.trim(),
                      FEATURED_COLLECTION_PLAYLIST_ID: featuredPlaylistIdInput
                    },
                    "Spotlight Curation"
                  )}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Spotlight Curation
                </button>
              </div>
            </div>
          </div>

          {/* Customizable Homepage Collection Row */}
          <div id="custom-homepage-row-panel" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6 mt-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Customizable Collection Row
            </h2>
            <p className="text-xs text-gray-400 mb-6">Create a fully custom category row on the homepage containing a curated collection of either playlists or songs.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Settings Controls */}
              <div className="flex flex-col gap-4">
                {/* Toggle Row Status */}
                <div className="flex items-center justify-between p-4 bg-slate-900/35 border border-white/5 rounded-xl transition-all hover:border-white/10">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-gray-200">Display Status</span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                        customRowEnabledInput ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {customRowEnabledInput ? "LIVE (unsaved)" : "DISABLED (unsaved)"}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">Toggle whether this customizable category row is active on the homepage.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomRowEnabledInput(!customRowEnabledInput)}
                    className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                      customRowEnabledInput ? "bg-emerald-600" : "bg-slate-700"
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      customRowEnabledInput ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Row Title */}
                <div className="flex flex-col gap-2 p-4 bg-slate-900/35 border border-white/5 rounded-xl">
                  <div>
                    <span className="font-semibold text-xs text-gray-200 block">Row Title</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">The main section heading displayed to visitors.</span>
                  </div>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={customRowTitleInput}
                      onChange={(e) => setCustomRowTitleInput(e.target.value)}
                      placeholder="e.g. Community Favorites, Late Night Grooves"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Row Subtitle */}
                <div className="flex flex-col gap-2 p-4 bg-slate-900/35 border border-white/5 rounded-xl">
                  <div>
                    <span className="font-semibold text-xs text-gray-200 block">Row Subtitle</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">The supporting descriptive text or tagline shown below the title.</span>
                  </div>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={customRowSubtitleInput}
                      onChange={(e) => setCustomRowSubtitleInput(e.target.value)}
                      placeholder="e.g. Hand-picked playlists by our global curators"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Row Mode Selector */}
                <div className="flex flex-col gap-2 p-4 bg-slate-900/35 border border-white/5 rounded-xl">
                  <div>
                    <span className="font-semibold text-xs text-gray-200 block">Collection Type</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Choose whether this curated row displays playlists or songs.</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleToggleCustomRowType("playlists")}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        customRowTypeInput === "playlists"
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                          : "bg-slate-950/40 border-white/10 text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      Playlists Collection
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleCustomRowType("songs")}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        customRowTypeInput === "songs"
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                          : "bg-slate-950/40 border-white/10 text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      Songs Collection
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Compiler Component */}
              <div className="flex flex-col gap-4 bg-slate-900/20 border border-white/5 rounded-xl p-4">
                <span className="font-semibold text-xs text-gray-200 block">Interactive Compiler</span>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={rowSearchQuery}
                    onChange={(e) => handleSearchCustomRowItems(e.target.value)}
                    placeholder={customRowTypeInput === "playlists" ? "Search public playlists to add..." : "Search songs to add..."}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  />
                  {rowSearchLoading && (
                    <div className="absolute right-3 top-2.5 text-[10px] text-indigo-400 animate-pulse">searching...</div>
                  )}
                </div>

                {/* Search Results dropdown/pane */}
                {rowSearchQuery.trim().length > 0 && (
                  <div className="max-h-48 overflow-y-auto bg-slate-950 border border-white/10 rounded-xl p-2 flex flex-col gap-1">
                    {customRowTypeInput === "playlists" ? (
                      rowSearchResults.playlists.length > 0 ? (
                        rowSearchResults.playlists.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-lg transition-all">
                            <div className="flex items-center gap-2">
                              {p.customCoverUrl ? (
                                <img src={p.customCoverUrl} alt="" className="w-8 h-8 rounded object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-8 h-8 bg-indigo-950 rounded flex items-center justify-center text-indigo-400 font-bold text-xs">P</div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-200 truncate max-w-[150px]">{p.name}</span>
                                <span className="text-[10px] text-gray-400">by {p.user?.name || p.user?.username || "Unknown"}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddItemToCustomRow(p)}
                              className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-1 rounded"
                            >
                              Add
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-xs text-gray-500">No playlists match search</div>
                      )
                    ) : (
                      rowSearchResults.songs.length > 0 ? (
                        rowSearchResults.songs.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-lg transition-all">
                            <div className="flex items-center gap-2">
                              {s.thumbnailUrl ? (
                                <img src={s.thumbnailUrl} alt="" className="w-8 h-8 rounded object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-gray-400 font-bold text-xs">S</div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-200 truncate max-w-[150px]">{s.title}</span>
                                <span className="text-[10px] text-gray-400">{s.artist || "Unknown artist"}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddItemToCustomRow(s)}
                              className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-1 rounded"
                            >
                              Add
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-xs text-gray-500">No songs match search</div>
                      )
                    )}
                  </div>
                )}

                {/* Compiled / Curated List */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Compiled Row Items ({compiledItems.length})</span>
                  {compiledItems.length === 0 ? (
                    <div className="border border-dashed border-white/5 rounded-xl p-6 text-center text-xs text-gray-500">
                      No items compiled yet. Search and add items to customize this row.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
                      {compiledItems.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-slate-950/60 border border-white/5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-mono">#{idx + 1}</span>
                            {item.customCoverUrl || item.thumbnailUrl ? (
                              <img src={item.customCoverUrl || item.thumbnailUrl} alt="" className="w-7 h-7 rounded object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-7 h-7 bg-slate-900 rounded flex items-center justify-center text-xs text-gray-400">
                                {customRowTypeInput === "playlists" ? "P" : "S"}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-gray-200 truncate max-w-[120px]">{item.name || item.title}</span>
                              <span className="text-[9px] text-gray-500">
                                {customRowTypeInput === "playlists"
                                  ? `by ${item.user?.name || item.user?.username || "Admin"}`
                                  : (item.artist || "Unknown artist")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Reorder Buttons */}
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveItemInCustomRow(idx, "up")}
                              className="p-1 rounded bg-slate-900 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === compiledItems.length - 1}
                              onClick={() => handleMoveItemInCustomRow(idx, "down")}
                              className="p-1 rounded bg-slate-900 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromCustomRow(item.id)}
                              className="p-1 rounded bg-rose-950/40 text-rose-400 hover:bg-rose-900 hover:text-white transition-colors ml-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Individual Save Button for Customizable Homepage Collection Row */}
              <div className="flex justify-end mt-6 pt-4 border-t border-white/5 col-span-1 lg:col-span-2">
                <button
                  type="button"
                  onClick={() => handleSavePanelConfigs(
                    [
                      "CUSTOM_ROW_ENABLED",
                      "CUSTOM_ROW_TITLE",
                      "CUSTOM_ROW_SUBTITLE",
                      "CUSTOM_ROW_TYPE",
                      "CUSTOM_ROW_IDS"
                    ],
                    {
                      CUSTOM_ROW_ENABLED: customRowEnabledInput ? "true" : "false",
                      CUSTOM_ROW_TITLE: customRowTitleInput.trim(),
                      CUSTOM_ROW_SUBTITLE: customRowSubtitleInput.trim(),
                      CUSTOM_ROW_TYPE: customRowTypeInput,
                      CUSTOM_ROW_IDS: customRowIdsInput.join(",")
                    },
                    "Collection Row"
                  )}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Collection Row
                </button>
              </div>
            </div>
          </div>

          {/* Homepage Layout Customizer & Section Order  */}
          {(() => {
            // Fallback to default sections if empty or not fully populated
            const defaultSections = [
              { id: "promoBanners", name: "Advertisement Banners", visible: true, title: "Special Offers", layoutStyle: "carousel" },
              { id: "yourCurations", name: "Your Curations", visible: true, title: "Your Curations", layoutStyle: "carousel" },
              { id: "heavyRotation", name: "On Heavy Rotation", visible: true, title: "On Heavy Rotation", layoutStyle: "carousel" },
              { id: "trending", name: "Trending Worldwide", visible: true, title: "Trending Worldwide", layoutStyle: "carousel" },
              { id: "recommended", name: "Recommended for You", visible: true, title: "Recommended for You", layoutStyle: "carousel" },
              { id: "quickPicks", name: "Quick Picks", visible: true, title: "Quick Picks", layoutStyle: "grid" },
              { id: "spotlight", name: "Spotlight Curation", visible: true, title: "Spotlight Curation", layoutStyle: "hero" },
              { id: "customCollection", name: "Customizable Collection Row", visible: true, title: "Customizable Collection Row", layoutStyle: "carousel" },
              { id: "communityFavorites", name: "Community Favorites", visible: true, title: "Community Favorites", layoutStyle: "carousel" },
              { id: "freshFinds", name: "Fresh Finds", visible: true, title: "Fresh Finds", layoutStyle: "carousel" },
              { id: "moodsGenres", name: "Moods & Genres", visible: true, title: "Moods & Genres", layoutStyle: "grid" }
            ];

            const mergedLayout = homepageLayoutInput.length > 0 ? homepageLayoutInput : defaultSections;

            const handleMoveSection = (index: number, direction: "up" | "down") => {
              const nextLayout = [...mergedLayout];
              if (direction === "up" && index > 0) {
                const temp = nextLayout[index];
                nextLayout[index] = nextLayout[index - 1];
                nextLayout[index - 1] = temp;
              } else if (direction === "down" && index < nextLayout.length - 1) {
                const temp = nextLayout[index];
                nextLayout[index] = nextLayout[index + 1];
                nextLayout[index + 1] = temp;
              }
              setHomepageLayoutInput(nextLayout);
            };

            const handleToggleSectionVisibility = (id: string) => {
              const nextLayout = mergedLayout.map(s => s.id === id ? { ...s, visible: !s.visible } : s);
              setHomepageLayoutInput(nextLayout);
            };

            const handleUpdateSectionTitle = (id: string, title: string) => {
              const nextLayout = mergedLayout.map(s => s.id === id ? { ...s, title } : s);
              setHomepageLayoutInput(nextLayout);
            };

            const handleUpdateSectionStyle = (id: string, layoutStyle: string) => {
              const nextLayout = mergedLayout.map(s => s.id === id ? { ...s, layoutStyle } : s);
              setHomepageLayoutInput(nextLayout);
            };

            const handleResetLayoutToDefault = () => {
              if (window.confirm("Are you sure you want to reset the homepage layout to the system defaults?")) {
                setHomepageLayoutInput(defaultSections);
              }
            };

            return (
              <div id="homepage-layout-customizer-panel" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-md font-bold mb-1 flex items-center gap-2 text-white">
                      <Layout className="w-4 h-4 text-indigo-400" />
                      Homepage Layout Customizer & Section Order
                    </h3>
                    <p className="text-xs text-gray-400">
                      Drag or reorder content sections globally. Configure search grids, carousels, visibility gates, and dynamic catalog structures on the main landing index.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="reset-homepage-layout-btn"
                    onClick={handleResetLayoutToDefault}
                    className="text-xs text-gray-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-white/5 transition-all self-start md:self-auto"
                  >
                    Reset to Defaults
                  </button>
                </div>

                {/* Section Stack container */}
                <div className="flex flex-col gap-3">
                  {mergedLayout.map((section, idx) => {
                    const canMoveUp = idx > 0;
                    const canMoveDown = idx < mergedLayout.length - 1;
                    const isEditing = editingSectionId === section.id;

                    return (
                      <div
                        key={section.id}
                        className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all ${
                          section.visible
                            ? "bg-[#1e293b]/45 border-white/5 hover:border-indigo-500/20"
                            : "bg-[#020617]/30 border-white/5 opacity-60"
                        }`}
                      >
                        {/* Left: Grab/Grip icon + Title or Editor */}
                        <div className="flex items-center gap-3 mb-3 md:mb-0">
                          <span className="text-gray-600 cursor-grab active:cursor-grabbing hover:text-gray-400 transition-colors">
                            <GripVertical className="w-4 h-4" />
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-indigo-400 font-mono">0{idx + 1}</span>
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-gray-200">{section.name}</span>
                              {isEditing ? (
                                <div className="flex gap-1.5 mt-1 items-center">
                                  <input
                                    type="text"
                                    value={editingSectionTitle}
                                    onChange={(e) => setEditingSectionTitle(e.target.value)}
                                    className="bg-slate-950 border border-white/10 rounded-lg px-2 py-0.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 w-36"
                                    placeholder="Custom title..."
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdateSectionTitle(section.id, editingSectionTitle.trim());
                                      setEditingSectionId(null);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2 py-1 rounded transition-all"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSectionId(null)}
                                    className="text-gray-400 hover:text-white text-[10px] font-bold px-1 py-1 transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-gray-400">
                                    Title: <strong className="text-gray-300">"{section.title || section.name}"</strong>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSectionId(section.id);
                                      setEditingSectionTitle(section.title || section.name);
                                    }}
                                    className="text-gray-500 hover:text-white p-0.5 rounded transition-colors"
                                    title="Edit Title Override"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Layout Style picker + Show/Hide toggle + Reordering controls */}
                        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                          {/* Layout Style choice (if relevant) */}
                          {["trending", "heavyRotation", "recommended", "communityFavorites", "freshFinds", "quickPicks", "moodsGenres"].includes(section.id) && (
                            <div className="flex items-center gap-1 bg-black/30 border border-white/5 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => handleUpdateSectionStyle(section.id, "carousel")}
                                className={`text-[9px] font-bold px-2 py-1 rounded-lg transition-all ${
                                  section.layoutStyle !== "grid"
                                    ? "bg-indigo-600/80 text-white"
                                    : "text-gray-400 hover:text-gray-200"
                                }`}
                              >
                                Carousel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateSectionStyle(section.id, "grid")}
                                className={`text-[9px] font-bold px-2 py-1 rounded-lg transition-all ${
                                  section.layoutStyle === "grid"
                                    ? "bg-indigo-600/80 text-white"
                                    : "text-gray-400 hover:text-gray-200"
                                }`}
                              >
                                Grid
                              </button>
                            </div>
                          )}

                          {/* Visibility toggler */}
                          <button
                            type="button"
                            onClick={() => handleToggleSectionVisibility(section.id)}
                            className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                              section.visible
                                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20"
                                : "bg-slate-800 text-gray-500 border-transparent hover:bg-slate-700 hover:text-gray-400"
                            }`}
                          >
                            {section.visible ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>VISIBLE</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>HIDDEN</span>
                              </>
                            )}
                          </button>

                          {/* Reordering Up & Down buttons */}
                          <div className="flex items-center bg-black/20 rounded-xl p-1 border border-white/5 gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveSection(idx, "up")}
                              disabled={!canMoveUp}
                              className={`p-1 rounded-lg transition-colors ${
                                canMoveUp
                                  ? "text-gray-300 hover:bg-slate-800 hover:text-white cursor-pointer"
                                  : "text-gray-600 cursor-not-allowed opacity-30"
                              }`}
                              title="Move Up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSection(idx, "down")}
                              disabled={!canMoveDown}
                              className={`p-1 rounded-lg transition-colors ${
                                canMoveDown
                                  ? "text-gray-300 hover:bg-slate-800 hover:text-white cursor-pointer"
                                  : "text-gray-600 cursor-not-allowed opacity-30"
                                }`}
                              title="Move Down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Individual Save Button for Homepage Layout Customizer */}
                <div className="flex justify-end mt-6 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    id="save-homepage-layout-btn"
                    onClick={() => handleSavePanelConfigs(
                      ["HOMEPAGE_LAYOUT"],
                      { HOMEPAGE_LAYOUT: JSON.stringify(mergedLayout) },
                      "Homepage Layout"
                    )}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Homepage Layout
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Homepage Section Configuration Settings Panel  */}
          <div id="homepage-sections-settings-panel" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="text-md font-bold mb-1 flex items-center gap-2 text-white">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Homepage Section Configuration Settings
              </h3>
              <p className="text-xs text-gray-400">
                Customize advanced behaviors, display limits, recommendation models, and category overrides for 'Recommended for You' and 'Moods & Genres'.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Recommended for You Settings */}
              <div className="bg-slate-900/35 border border-white/5 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-bold text-gray-200">Recommended for You Settings</h4>
                </div>

                {/* Recommendation Strategy */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300">Recommendation Strategy</label>
                  <select
                    value={recommendedStrategyInput}
                    onChange={(e) => setRecommendedStrategyInput(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 w-full"
                  >
                    <option value="artist_match">Personalized (User's Played Artists Match)</option>
                    <option value="all_songs">Global Discovery (Trending Public Tracks Fallback)</option>
                  </select>
                  <span className="text-[10px] text-gray-500">
                    Choose how the system determines songs recommended to users.
                  </span>
                </div>

                {/* Recommendation Limit */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300">Recommendation Limit (Max Songs)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={recommendedLimitInput}
                    onChange={(e) => setRecommendedLimitInput(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 w-full"
                    placeholder="e.g. 20"
                  />
                  <span className="text-[10px] text-gray-500">
                    The maximum number of recommended songs to fetch and display.
                  </span>
                </div>

                {/* Recommendation Exclude Played */}
                <div className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-xl mt-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-gray-300">Exclude Own Tracks</span>
                    <span className="text-[10px] text-gray-500">Filter out songs from the user's own playlists.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecommendedExcludePlayedInput(!recommendedExcludePlayedInput)}
                    className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                      recommendedExcludePlayedInput ? "bg-emerald-600" : "bg-slate-700"
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      recommendedExcludePlayedInput ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>

              {/* Right: Moods & Genres Settings */}
              <div className="bg-slate-900/35 border border-white/5 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <LayoutGrid className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-bold text-gray-200">Moods & Genres Settings</h4>
                </div>

                {/* Moods Custom Tags override */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300">Custom Tags Override</label>
                  <input
                    type="text"
                    value={moodsGenresCustomTagsInput}
                    onChange={(e) => setMoodsGenresCustomTagsInput(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 w-full"
                    placeholder="e.g. lofi, study, synthwave, energetic, acoustic"
                  />
                  <span className="text-[10px] text-gray-500">
                    Enter comma-separated tags to enforce specific moods/genres on the homepage. Leave empty to compile automatically based on platform taxonomy.
                  </span>
                </div>

                {/* Moods display limit */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-300">Moods Display Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={moodsGenresLimitInput}
                    onChange={(e) => setMoodsGenresLimitInput(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 w-full"
                    placeholder="e.g. 15"
                  />
                  <span className="text-[10px] text-gray-500">
                    The maximum number of moods/genres chips shown in the row.
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button for Discovery & Moods Configuration */}
            <div className="flex justify-end mt-6 pt-4 border-t border-white/5">
              <button
                type="button"
                id="save-discovery-settings-btn"
                onClick={() => {
                  const limitVal = parseInt(recommendedLimitInput, 10);
                  if (isNaN(limitVal) || limitVal <= 0) {
                    toast.error("Please enter a valid positive recommended limit");
                    return;
                  }
                  const moodsLimitVal = parseInt(moodsGenresLimitInput, 10);
                  if (isNaN(moodsLimitVal) || moodsLimitVal <= 0) {
                    toast.error("Please enter a valid positive moods display limit");
                    return;
                  }
                  handleSavePanelConfigs(
                    [
                      "RECOMMENDED_STRATEGY",
                      "RECOMMENDED_LIMIT",
                      "RECOMMENDED_EXCLUDE_PLAYED",
                      "MOOD_GENRES_CUSTOM_TAGS",
                      "MOOD_GENRES_LIMIT"
                    ],
                    {
                      RECOMMENDED_STRATEGY: recommendedStrategyInput,
                      RECOMMENDED_LIMIT: recommendedLimitInput,
                      RECOMMENDED_EXCLUDE_PLAYED: recommendedExcludePlayedInput ? "true" : "false",
                      MOOD_GENRES_CUSTOM_TAGS: moodsGenresCustomTagsInput.trim(),
                      MOOD_GENRES_LIMIT: moodsGenresLimitInput
                    },
                    "Discovery Sections"
                  );
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Save Discovery Settings
              </button>
            </div>
          </div>

              
        </div>
      )}

{/* Tab 2: Users */}
      {activeTab === "users" && (
        <div className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold">Registered User Directory</h2>
              <p className="text-xs text-gray-400 mt-1">Audit platform accounts, promote users to curators/administrators, and apply moderation status flags.</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search registered users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full bg-[#1e293b]/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Role / Permission</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">User Statistics</th>
                  <th className="py-3 px-4 text-right">Moderation Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(user => {
                  const suspensionInput = userSuspensionInputs[user.id] || { days: "7", warning: "" };
                  const isCurrentAdminSelf = currentUser?.id === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-white/[0.01] transition-colors align-top">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white uppercase text-xs">
                              {user.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-200">
                              {user.name} {isCurrentAdminSelf && <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1 py-0.5 rounded-md font-bold ml-1">You</span>}
                            </div>
                            <div className="text-[10px] text-gray-400">@{user.username}</div>
                            {user.moderationWarning && (
                              <div className="text-[9px] text-rose-400 font-medium max-w-xs mt-1 bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/10">
                                Warning: "{user.moderationWarning}"
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {isCurrentAdminSelf ? (
                          <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase text-[10px] tracking-wide">
                            ADMIN
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={e => handleUpdateUserRole(user.id, e.target.value)}
                            className="bg-[#1e293b] border border-white/10 rounded-lg text-xs px-2 py-1 text-gray-300 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="USER">Standard User</option>
                            <option value="VERIFIED_CURATOR">Verified Curator</option>
                            <option value="ADMIN">Administrator</option>
                          </select>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          {user.status === "ACTIVE" && (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[10px]">
                              <CheckCircle className="w-3.5 h-3.5" /> ACTIVE
                            </span>
                          )}
                          {user.status === "SUSPENDED" && (
                            <div>
                              <span className="text-amber-400 font-semibold flex items-center gap-1 text-[10px]">
                                <AlertTriangle className="w-3.5 h-3.5" /> SUSPENDED
                              </span>
                              {user.suspensionExpiresAt && (
                                <span className="text-[9px] text-gray-500 block mt-0.5">
                                  Until: {new Date(user.suspensionExpiresAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                          {user.status === "BANNED" && (
                            <span className="text-rose-500 font-semibold flex items-center gap-1 text-[10px]">
                              <Ban className="w-3.5 h-3.5" /> BANNED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-gray-300 font-mono">
                        <div>{user.totalPlaylists} playlists created</div>
                        <div className="text-[10px] text-gray-500">{user.totalSaved} playlists saved</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {!isCurrentAdminSelf && (
                          <div className="flex flex-col gap-2 max-w-[200px] ml-auto">
                            {user.status === "ACTIVE" ? (
                              <div className="bg-[#1e293b]/50 border border-white/5 rounded-xl p-2 flex flex-col gap-1.5 text-left">
                                <div className="flex gap-1 items-center">
                                  <input
                                    type="number"
                                    placeholder="Days"
                                    value={suspensionInput.days}
                                    onChange={e => setUserSuspensionInputs(prev => ({
                                      ...prev,
                                      [user.id]: { ...suspensionInput, days: e.target.value }
                                    }))}
                                    className="w-12 bg-black/20 border border-white/10 rounded px-1.5 py-0.5 text-center text-[10px]"
                                  />
                                  <span className="text-[9px] text-gray-400">days duration</span>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Moderation Warning message..."
                                  value={suspensionInput.warning}
                                  onChange={e => setUserSuspensionInputs(prev => ({
                                    ...prev,
                                    [user.id]: { ...suspensionInput, warning: e.target.value }
                                  }))}
                                  className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-[10px]"
                                />
                                <div className="flex gap-1.5 mt-1">
                                  <button
                                    onClick={() => handleUpdateUserStatus(user.id, "SUSPENDED")}
                                    className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold py-1 px-1.5 rounded text-[9px] border border-amber-500/10 text-center"
                                  >
                                    Suspend
                                  </button>
                                  <button
                                    onClick={() => handleUpdateUserStatus(user.id, "BANNED")}
                                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-1 px-1.5 rounded text-[9px] border border-red-500/10 text-center"
                                  >
                                    BAN
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleUpdateUserStatus(user.id, "ACTIVE")}
                                className="flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-3 py-1.5 rounded-xl ml-auto"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Re-Activate Account
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      No users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Monitoring & API Logs */}
      {activeTab === "monitoring" && (() => {
        // Calculate quota filter statistics
        const filteredQuota = quota.slice(0, Number(quotaTimeframe));
        const chartQuota = filteredQuota.slice().reverse();
        const totalUsageInFilter = filteredQuota.reduce((acc, q) => acc + (q.youtubeQuotaUsed ?? 0), 0);
        const totalRequestsInFilter = filteredQuota.reduce((acc, q) => acc + (q.totalRequests ?? 0), 0);
        const avgCostPerSearch = totalRequestsInFilter > 0 ? (totalUsageInFilter / totalRequestsInFilter).toFixed(2) : "0.00";
        const peakQuotaDay = filteredQuota.length > 0 ? Math.max(...filteredQuota.map(q => q.youtubeQuotaUsed ?? 0)) : 0;
        
        // Calculate efficiency level
        const currentTodayUsage = quota[0] ? (quota[0].youtubeQuotaUsed ?? 0) : 0;
        let efficiencyStatus = "Optimal";
        let efficiencyColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
        if (currentTodayUsage > 8000) {
          efficiencyStatus = "Critical";
          efficiencyColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
        } else if (currentTodayUsage > 5000) {
          efficiencyStatus = "High Load";
          efficiencyColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
        }

        // Filter logs
        const filteredLogs = logs.filter(log => {
          if (logFilter !== "ALL" && log.type !== logFilter) return false;
          if (logSearch) {
            const searchLower = logSearch.toLowerCase();
            const matchesDesc = log.description?.toLowerCase().includes(searchLower);
            const matchesDetails = log.details?.toLowerCase().includes(searchLower);
            return matchesDesc || matchesDetails;
          }
          return true;
        });

        const totalLogsCount = logs.length;
        const totalErrorsCount = logs.filter(l => l.type === "ERROR").length;
        const totalAuditCount = logs.filter(l => l.type === "AUDIT").length;
        const totalWarningsCount = logs.filter(l => l.type === "WARNING").length;

        // Capacity simulation parameters
        const projectedDaily = Math.round(simExpectedDailySearches * simAverageCost * (simEnableCache ? 0.6 : 1.0));
        const projectedMonthly = projectedDaily * 30;
        const percentOfDailyLimit = ((projectedDaily / 10000) * 100).toFixed(1);
        const dailyLimitExceeded = projectedDaily > 10000;

        return (
          <div id="monitoring-analytics-dashboard" className="flex flex-col gap-8 animate-fadeIn">
            {/* Top Stats Deck */}
            <div id="analytics-stats-deck" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div id="stat-card-budget" className="bg-[#0f172a]/60 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap className="w-12 h-12 text-indigo-400" />
                </div>
                <span className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider block">Daily Budget Limit</span>
                <span className="text-2xl font-black font-mono text-white mt-1 block">10,000 Units</span>
                <span className="text-[10px] text-gray-400 block mt-2">V3 Search API global hard-stop limit</span>
              </div>

              <div id="stat-card-today" className="bg-[#0f172a]/60 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity className="w-12 h-12 text-pink-400" />
                </div>
                <span className="text-[10px] text-pink-300 font-semibold uppercase tracking-wider block">Today's Consumption</span>
                <span className="text-2xl font-black font-mono text-pink-400 mt-1 block">
                  {currentTodayUsage.toLocaleString()} <span className="text-xs text-gray-500 font-normal">Units</span>
                </span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${efficiencyColor}`}>
                    {efficiencyStatus}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    ~ {((currentTodayUsage / 10000) * 100).toFixed(1)}% used
                  </span>
                </div>
              </div>

              <div id="stat-card-efficiency" className="bg-[#0f172a]/60 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-12 h-12 text-emerald-400" />
                </div>
                <span className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider block">API Unit Efficiency</span>
                <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
                  {avgCostPerSearch} <span className="text-xs text-gray-500 font-normal">Units/Search</span>
                </span>
                <span className="text-[10px] text-gray-400 block mt-2">Average API cost units consumed per query action</span>
              </div>

              <div id="stat-card-volume" className="bg-[#0f172a]/60 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Search className="w-12 h-12 text-cyan-400" />
                </div>
                <span className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider block">Active Search Queries</span>
                <span className="text-2xl font-black font-mono text-cyan-400 mt-1 block">
                  {quota[0] ? (quota[0].totalRequests ?? 0).toLocaleString() : "0"} <span className="text-xs text-gray-500 font-normal">Requests</span>
                </span>
                <span className="text-[10px] text-gray-400 block mt-2">Successful user triggers recorded today</span>
              </div>
            </div>

            {/* Quota Graph and Projection Grid */}
            <div id="quota-analytics-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Interactive Graph Visualizer */}
              <div id="quota-trend-card" className="lg:col-span-2 bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-indigo-400" />
                        YouTube Quota Consumption Profile
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">Chronological resource usage analysis with interactive day details.</p>
                    </div>

                    {/* Timeframe selector */}
                    <div className="flex items-center gap-1.5 bg-black/30 border border-white/5 p-1 rounded-xl self-start sm:self-auto">
                      {(["7", "14", "30"] as const).map(days => (
                        <button
                          key={days}
                          id={`timeframe-btn-${days}`}
                          onClick={() => setQuotaTimeframe(days)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                            quotaTimeframe === days
                              ? "bg-indigo-600 text-white shadow"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {days} Days
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary of timeframe */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-4 bg-slate-900/40 border border-white/5 rounded-xl text-center mb-6">
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-semibold">Total Period Cost</span>
                      <span className="text-sm font-extrabold font-mono text-indigo-400">{totalUsageInFilter.toLocaleString()} u</span>
                    </div>
                    <div className="border-x border-white/5">
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-semibold">Total Period Searches</span>
                      <span className="text-sm font-extrabold font-mono text-emerald-400">{totalRequestsInFilter.toLocaleString()} q</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-semibold">Peak Usage Day</span>
                      <span className="text-sm font-extrabold font-mono text-rose-400">{peakQuotaDay.toLocaleString()} u</span>
                    </div>
                  </div>

                  {/* Chronological Chart Grid */}
                  <div className="bg-[#1e293b]/10 border border-white/5 p-6 rounded-xl relative">
                    {/* Graph grid lines */}
                    <div className="absolute inset-y-6 left-0 right-0 flex flex-col justify-between pointer-events-none opacity-10">
                      <div className="border-b border-dashed border-white w-full" />
                      <div className="border-b border-dashed border-white w-full" />
                      <div className="border-b border-dashed border-white w-full" />
                      <div className="border-b border-dashed border-white w-full" />
                    </div>

                    <div className="h-48 w-full flex items-end justify-between gap-1.5 md:gap-3 relative z-1">
                      {chartQuota.map((day, idx) => {
                        const percent = Math.min(100, ((day.youtubeQuotaUsed ?? 0) / 10000) * 100);
                        return (
                          <div key={day.id || idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            {/* Hover info tooltip card */}
                            <div className="absolute bottom-full mb-3 bg-slate-950 border border-white/10 text-[10px] text-gray-200 p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-28 text-center shadow-2xl">
                              <span className="font-extrabold block text-indigo-300">
                                {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                              <div className="h-px bg-white/5 my-1.5" />
                              <div className="flex justify-between items-center text-[9px] font-mono mt-0.5 text-gray-400">
                                <span>Quota:</span>
                                <span className="font-bold text-white">{(day.youtubeQuotaUsed ?? 0).toLocaleString()} u</span>
                              </div>
                              <div className="flex justify-between items-center text-[9px] font-mono text-gray-400 mt-0.5">
                                <span>Volume:</span>
                                <span className="font-bold text-emerald-400">{(day.totalRequests ?? 0).toLocaleString()} q</span>
                              </div>
                            </div>
                            
                            {/* Custom Bar with rounded tip and gradient hover */}
                            <div className="w-full relative group flex flex-col items-center justify-end h-full">
                              <div
                                style={{ height: `${Math.max(4, percent)}%` }}
                                className={`w-full rounded-t transition-all duration-300 ${
                                  percent > 80
                                    ? "bg-rose-500 hover:bg-rose-400"
                                    : percent > 40
                                    ? "bg-amber-500 hover:bg-amber-400"
                                    : "bg-indigo-600 hover:bg-indigo-400"
                                } shadow-[0_0_10px_rgba(99,102,241,0.1)]`}
                              />
                            </div>
                            
                            {/* Short Date label */}
                            <span className="text-[8px] text-gray-500 mt-2.5 font-mono truncate w-full text-center">
                              {new Date(day.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        );
                      })}
                      {quota.length === 0 && (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-xs gap-2">
                          <Info className="w-6 h-6 text-slate-600" />
                          <span>No API metrics logged. Perform query operations to generate profiles.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-4 font-medium bg-black/15 p-3 rounded-xl border border-white/5">
                  <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>The metrics shown represent estimated cost values. YouTube V3 search lists cost 100 units per operation, while video profile details cost 1 unit.</span>
                </div>
              </div>

              {/* Right Column: Dynamic Projection Calculator & Capacity Planner */}
              <div id="capacity-simulator-card" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-400" />
                    Scale Capacity Planner
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Simulate growth and estimate YouTube API quota impact under customizable caching behaviors.</p>

                  <div className="mt-6 flex flex-col gap-5">
                    {/* Expected Daily Searches */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Expected Daily Searches</label>
                        <span className="text-xs font-mono font-bold text-indigo-400">{simExpectedDailySearches} queries</span>
                      </div>
                      <input
                        id="simulator-searches-range"
                        type="range"
                        min="50"
                        max="2000"
                        step="50"
                        value={simExpectedDailySearches}
                        onChange={(e) => setSimExpectedDailySearches(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-[8px] font-mono text-gray-500 mt-1">
                        <span>50</span>
                        <span>1,000</span>
                        <span>2,000</span>
                      </div>
                    </div>

                    {/* Average Cost */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Average Units Per Search</label>
                        <span className="text-xs font-mono font-bold text-indigo-400">{simAverageCost} units</span>
                      </div>
                      <input
                        id="simulator-cost-range"
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={simAverageCost}
                        onChange={(e) => setSimAverageCost(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-[8px] font-mono text-gray-500 mt-1">
                        <span>1 unit (Light)</span>
                        <span>5 units</span>
                        <span>10 units (Heavy)</span>
                      </div>
                    </div>

                    {/* Enable Intelligent Caching Toggle */}
                    <div className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-xl">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-200">Intelligent Caching</span>
                        <span className="text-[9px] text-gray-400">Reduces direct API calls by 40%</span>
                      </div>
                      <button
                        id="simulator-caching-toggle"
                        onClick={() => setSimEnableCache(!simEnableCache)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                          simEnableCache ? "bg-indigo-600" : "bg-slate-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            simEnableCache ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Simulation Output Area */}
                <div className="mt-8 pt-6 border-t border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-3">Projected Consumption Matrix</span>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-black/25 p-3 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-400 block">Daily Est. Cost</span>
                      <span className="text-lg font-black font-mono text-white mt-0.5 block">{projectedDaily.toLocaleString()} u</span>
                    </div>
                    <div className="bg-black/25 p-3 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-400 block">Monthly Est. Cost</span>
                      <span className="text-lg font-black font-mono text-white mt-0.5 block">{projectedMonthly.toLocaleString()} u</span>
                    </div>
                  </div>

                  {/* Limit depletion visualizer */}
                  <div className="bg-black/35 p-3.5 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center text-[10px] mb-1.5">
                      <span className="text-gray-300 font-semibold">Budget Footprint</span>
                      <span className={`font-mono font-bold ${dailyLimitExceeded ? "text-rose-400" : "text-emerald-400"}`}>
                        {percentOfDailyLimit}% of limit
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Number(percentOfDailyLimit))}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          dailyLimitExceeded ? "bg-rose-500" : "bg-emerald-500"
                        }`}
                      />
                    </div>
                    {dailyLimitExceeded ? (
                      <div className="flex items-center gap-1.5 mt-2.5 text-rose-400 text-[9px] font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Warning: Projections exceed 10k units daily limit!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-2.5 text-emerald-400 text-[9px] font-medium">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Projection sits safely within daily limits.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Logs Section */}
            <div id="audit-trail-card" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    System Operations Audit Trail
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Secure log stream recording administrative interventions, critical system events, and security warnings.</p>
                </div>

                {/* Audit Logs Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search input */}
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                    <input
                      id="log-search-input"
                      type="text"
                      placeholder="Search log trace details..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-1.5 pl-9 pr-3 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    {logSearch && (
                      <button
                        onClick={() => setLogSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Log level filter tabs */}
                  <div className="flex items-center gap-1 bg-black/20 border border-white/5 p-1 rounded-xl">
                    {(["ALL", "INFO", "AUDIT", "ERROR"] as const).map(level => {
                      let btnColor = "text-gray-400 hover:text-white";
                      if (logFilter === level) {
                        btnColor = level === "ERROR"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : level === "AUDIT"
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-indigo-600 text-white";
                      }
                      return (
                        <button
                          key={level}
                          id={`log-filter-${level}`}
                          onClick={() => setLogFilter(level)}
                          className={`text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all ${btnColor}`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Logs Stat Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 bg-slate-900/30 border border-white/5 rounded-xl mb-4 text-center">
                <div className="text-left sm:text-center">
                  <span className="text-[8px] text-gray-400 uppercase tracking-wider block font-semibold">Total Event Count</span>
                  <span className="text-sm font-extrabold font-mono text-gray-300">{totalLogsCount} Trace logs</span>
                </div>
                <div className="text-left sm:text-center border-l border-white/5 pl-3 sm:pl-0">
                  <span className="text-[8px] text-gray-400 uppercase tracking-wider block font-semibold">Audit Events</span>
                  <span className="text-sm font-extrabold font-mono text-purple-400">{totalAuditCount} Actions</span>
                </div>
                <div className="text-left sm:text-center border-l border-white/5 pl-3 sm:pl-0">
                  <span className="text-[8px] text-gray-400 uppercase tracking-wider block font-semibold">Critical Errors</span>
                  <span className="text-sm font-extrabold font-mono text-rose-400">{totalErrorsCount} Failures</span>
                </div>
                <div className="text-left sm:text-center border-l border-white/5 pl-3 sm:pl-0">
                  <span className="text-[8px] text-gray-400 uppercase tracking-wider block font-semibold">Active Warnings</span>
                  <span className="text-sm font-extrabold font-mono text-amber-400">{totalWarningsCount} Notices</span>
                </div>
              </div>

              {/* Logs Stream Container */}
              <div className="overflow-y-auto max-h-[450px] border border-white/5 rounded-xl no-scrollbar divide-y divide-white/5 bg-slate-950/20">
                {filteredLogs.map(log => {
                  let badgeClass = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                  if (log.type === "AUDIT") badgeClass = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
                  if (log.type === "ERROR") badgeClass = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                  if (log.type === "WARNING") badgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";

                  const isExpanded = selectedLogId === log.id;

                  return (
                    <div
                      key={log.id}
                      id={`log-item-${log.id}`}
                      className={`p-3.5 flex flex-col hover:bg-white/[0.02] transition-colors cursor-pointer ${
                        isExpanded ? "bg-white/[0.015]" : ""
                      }`}
                      onClick={() => setSelectedLogId(isExpanded ? null : log.id)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[10px] text-gray-500 font-mono shrink-0 py-0.5">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                          <span className={`text-[8px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full shrink-0 ${badgeClass}`}>
                            {log.type}
                          </span>
                          <p className="text-xs text-gray-200 font-medium">{log.description}</p>
                        </div>
                        
                        <span className="text-[9px] text-gray-500 font-semibold uppercase font-mono tracking-wider">
                          {isExpanded ? "Collapse ▲" : "Inspect ▼"}
                        </span>
                      </div>

                      {/* Expandable Debugger Panel */}
                      {isExpanded && (
                        <div className="mt-3.5 pt-3.5 border-t border-white/5 animate-slideDown">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Payload / Error Stack Trace</span>
                          <div className="relative">
                            <pre className="text-[10px] text-gray-300 font-mono bg-black/45 p-3 rounded-xl select-all whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border border-white/5">
                              {log.details || `No auxiliary debug payloads are linked with log ID: ${log.id}`}
                            </pre>
                            <button
                              id={`copy-log-btn-${log.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(log.details || log.description);
                                toast.success("Log tracing copied to clipboard");
                              }}
                              className="absolute top-2 right-2 text-[9px] font-bold uppercase bg-indigo-600/35 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2 py-1 rounded-lg transition-all"
                            >
                              Copy Stack
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <div className="p-12 text-center text-gray-500 text-xs flex flex-col items-center justify-center gap-2">
                    <Info className="w-5 h-5 text-slate-700" />
                    <span>No administrative logs matched the specified tracing criteria.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tab 4: System Settings */}
      {activeTab === "config" && (() => {
        // Compute active configuration values
        const disableSongUploads = configs.find(c => c.key === "DISABLE_USER_SONG_UPLOADS")?.value === "true";
        
        // Filter the pre-approved tags
        const filteredTags = tags.filter(tag => tag.name.toLowerCase().includes(tagQuery.toLowerCase()));

        return (
          <div id="live-system-configuration-dashboard" className="flex flex-col gap-8 animate-fadeIn">
            {/* Top Overview Banner / Announcement */}
            <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/40 to-cyan-950/40 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-extrabold flex items-center gap-2 text-white">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  Live System Configuration
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                  Dynamically adjust security gates, performance limits, and search taxonomies. Changes persist in the database and apply instantly.
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] bg-black/30 border border-white/10 px-3 py-1.5 rounded-xl self-start md:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-gray-300 font-semibold">Active Sync Engine</span>
              </div>
            </div>

            {/* Flat Dashboard Layout - No Sub-tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Column 1: Security and Performance */}
              <div className="flex flex-col gap-8">
                {/* 1. Feature Switches & Security Gates */}
                <div id="security-switches-panel" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-md font-bold mb-1 flex items-center gap-2 text-white">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    Security & Feature Switches
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">Instantly toggle core platform capabilities during heavy loads or security mitigation.</p>

                  <div className="flex flex-col gap-4">
                    {/* Switch 1: Registration Disable */}
                    <div className="flex items-center justify-between p-4 bg-slate-900/35 border border-white/5 rounded-xl transition-all hover:border-white/10">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-gray-200">Account Registration Gate</span>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                            registrationDisabledInput ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {registrationDisabledInput ? "LOCKED" : "ACTIVE"}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">Lock new user registration to prevent spam signups.</span>
                      </div>
                      <button
                        type="button"
                        id="toggle-registration-btn"
                        onClick={() => setRegistrationDisabledInput(!registrationDisabledInput)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                          registrationDisabledInput ? "bg-rose-600" : "bg-emerald-600"
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          registrationDisabledInput ? "translate-x-4" : "translate-x-0"
                        }`} />
                      </button>
                    </div>

                    {/* Switch 2: Maintenance Mode */}
                    <div className="flex items-center justify-between p-4 bg-slate-900/35 border border-white/5 rounded-xl transition-all hover:border-white/10">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-gray-200">Global Maintenance Mode</span>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                            maintenanceModeInput ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-slate-500/10 text-gray-400 border border-white/10"
                          }`}>
                            {maintenanceModeInput ? "MAINTENANCE" : "OFFLINE"}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">Lock database writes and limit public app views to read-only.</span>
                      </div>
                      <button
                        type="button"
                        id="toggle-maintenance-btn"
                        onClick={() => setMaintenanceModeInput(!maintenanceModeInput)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                          maintenanceModeInput ? "bg-amber-600" : "bg-slate-700"
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          maintenanceModeInput ? "translate-x-4" : "translate-x-0"
                        }`} />
                      </button>
                    </div>

                    {/* Switch 3: Community Posts Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-900/35 border border-white/5 rounded-xl transition-all hover:border-white/10">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-gray-200">Community Social Features</span>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                            enableCommunityPostsInput ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {enableCommunityPostsInput ? "ENABLED" : "RESTRICTED"}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">Allow community user forks, playlist likes, and public reviews.</span>
                      </div>
                      <button
                        type="button"
                        id="toggle-social-btn"
                        onClick={() => setEnableCommunityPostsInput(!enableCommunityPostsInput)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                          enableCommunityPostsInput ? "bg-emerald-600" : "bg-rose-600"
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          enableCommunityPostsInput ? "translate-x-4" : "translate-x-0"
                        }`} />
                      </button>
                    </div>

                    {/* Switch 4: Strict Content Moderation Auto-Filter */}
                    <div className="flex items-center justify-between p-4 bg-slate-900/35 border border-white/5 rounded-xl transition-all hover:border-white/10">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-gray-200">Strict Metadata Filtering</span>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                            strictModerationInput ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-slate-500/10 text-gray-400 border border-white/10"
                          }`}>
                            {strictModerationInput ? "ENFORCED" : "STANDARD"}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">Automatically flag playlists targeting unauthorized content or external urls.</span>
                      </div>
                      <button
                        type="button"
                        id="toggle-strict-mod-btn"
                        onClick={() => setStrictModerationInput(!strictModerationInput)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                          strictModerationInput ? "bg-purple-600" : "bg-slate-700"
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          strictModerationInput ? "translate-x-4" : "translate-x-0"
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Individual Save Button for Security Switches */}
                  <div className="flex justify-end mt-6 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      id="save-security-switches-btn"
                      onClick={() => handleSavePanelConfigs(
                        [
                          "DISABLE_REGISTRATION",
                          "MAINTENANCE_MODE",
                          "ENABLE_COMMUNITY_POSTS",
                          "STRICT_MODERATION"
                        ],
                        {
                          DISABLE_REGISTRATION: registrationDisabledInput ? "true" : "false",
                          MAINTENANCE_MODE: maintenanceModeInput ? "true" : "false",
                          ENABLE_COMMUNITY_POSTS: enableCommunityPostsInput ? "true" : "false",
                          STRICT_MODERATION: strictModerationInput ? "true" : "false"
                        },
                        "Security & Feature Settings"
                      )}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Security Switches
                    </button>
                  </div>
                </div>

                {/* 2. Performance & Resource Bounds */}
                <div id="performance-parameters-panel" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-md font-bold mb-1 flex items-center gap-2 text-white">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    Performance & Resource Bounds
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">Manage data limits, quotas, and cache durations to optimize page-load speed and API cost metrics.</p>

                  <div className="flex flex-col gap-5">
                    {/* Limit 1: Max Songs Per Playlist */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 p-4 bg-slate-900/35 border border-white/5 rounded-xl">
                      <div className="sm:col-span-2">
                        <span className="font-semibold text-xs text-gray-200 block">Max Tracks Per Playlist</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Maximum items a user can append to a curation record.</span>
                      </div>
                      <div className="flex gap-2 items-center justify-self-end w-full sm:w-auto">
                        <input
                          id="max-songs-input-field"
                          type="number"
                          min="1"
                          max="1000"
                          value={maxSongsInput}
                          onChange={(e) => setMaxSongsInput(e.target.value)}
                          className="w-full sm:w-20 bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-center font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Limit 2: Youtube API Cache TTL */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 p-4 bg-slate-900/35 border border-white/5 rounded-xl">
                      <div className="sm:col-span-2">
                        <span className="font-semibold text-xs text-gray-200 block">YouTube Profile Cache TTL</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Database hold window (Hours) before re-querying YouTube metadata.</span>
                      </div>
                      <div className="flex gap-2 items-center justify-self-end w-full sm:w-auto">
                        <input
                          id="cache-expiry-input-field"
                          type="number"
                          min="1"
                          max="720"
                          value={cacheExpiryInput}
                          onChange={(e) => setCacheExpiryInput(e.target.value)}
                          className="w-full sm:w-20 bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-center font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Individual Save Button for Performance Bounds */}
                  <div className="flex justify-end mt-6 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      id="save-performance-bounds-btn"
                      onClick={() => handleSavePanelConfigs(
                        [
                          "MAX_SONGS_PER_PLAYLIST",
                          "CACHE_EXPIRY_HOURS"
                        ],
                        {
                          MAX_SONGS_PER_PLAYLIST: maxSongsInput,
                          CACHE_EXPIRY_HOURS: cacheExpiryInput
                        },
                        "Performance Bounds"
                      )}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Performance Settings
                    </button>
                  </div>
                </div>
              </div>

              {/* Column 2: Discovery and Taxonomy */}
              <div className="flex flex-col gap-8">
                {/* 3. Taxonomy and Discovery Tag Control */}
                <div id="taxonomy-tags-panel" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-md font-bold mb-1 flex items-center gap-2 text-white">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      Official Discovery Taxonomy
                    </h3>
                    <p className="text-xs text-gray-400 mb-6">Create pre-approved search filters that dictate Tag recommendations and categories shown in explore views.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {/* Search Tags input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                        <input
                          id="tag-search-field"
                          type="text"
                          placeholder="Filter pre-approved tags..."
                          value={tagQuery}
                          onChange={e => setTagQuery(e.target.value)}
                          className="w-full bg-[#1e293b]/40 border border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                        {tagQuery && (
                          <button
                            onClick={() => setTagQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Tag additions form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newTagName.trim()) return;
                          handleAddTag(e);
                        }}
                        className="flex gap-1.5"
                      >
                        <input
                          id="add-tag-name-input"
                          type="text"
                          placeholder="synthwave, study..."
                          value={newTagName}
                          onChange={e => setNewTagName(e.target.value)}
                          className="flex-1 bg-[#1e293b]/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="submit"
                          id="submit-tag-btn"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 rounded-xl flex items-center shadow active:scale-95 transition-all cursor-pointer"
                        >
                          Add
                        </button>
                      </form>
                    </div>

                    {/* Pre-approved Tag Cloud scrolling pane */}
                    <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto no-scrollbar border border-white/5 p-3 rounded-xl bg-black/10">
                      {filteredTags.map(tag => (
                        <div
                          key={tag.id}
                          id={`tag-badge-${tag.id}`}
                          className="flex items-center gap-1.5 bg-[#1e293b]/60 border border-white/10 text-gray-200 px-3 py-1 rounded-full text-xs font-semibold group hover:border-indigo-500/45 transition-colors"
                        >
                          <span>#{tag.name}</span>
                          <button
                            type="button"
                            id={`delete-tag-btn-${tag.id}`}
                            onClick={() => handleDeleteTag(tag.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                            title={`Delete taxonomy tag #${tag.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {filteredTags.length === 0 && (
                        <div className="w-full text-center py-6 text-gray-500 text-xs flex flex-col items-center justify-center gap-1">
                          <Info className="w-4 h-4 text-slate-700" />
                          <span>No official taxonomy tags found matching "{tagQuery}".</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-400 mt-4 bg-black/10 p-2.5 rounded-xl border border-white/5">
                    <span>Total Taxonomies: <strong className="text-indigo-400 font-mono">{tags.length}</strong></span>
                    <span>Visible: <strong className="text-emerald-400 font-mono">{filteredTags.length}</strong></span>
                  </div>
                </div>

                {/* 4. Artist Registry & Auto-Suggest Sync */}
                <div id="artist-registry-sync-panel" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-md font-bold mb-1 flex items-center gap-2 text-white">
                      <Music className="w-4 h-4 text-indigo-400" />
                      Artist Database Registry
                    </h3>
                    <p className="text-xs text-gray-400 mb-6">
                      Manage the centralized artist auto-suggest library. Automatically synchronize, extract, and index unique artist names from songs stored in the platform.
                    </p>

                    <div className="bg-black/10 rounded-xl p-4 border border-white/5 flex items-center justify-between mb-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Total Indexed Artists</span>
                        <span className="text-2xl font-black text-white font-mono">{artistStats?.totalArtists ?? 0}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSyncArtists}
                        disabled={syncingArtists}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow active:scale-95 transition-all cursor-pointer"
                      >
                        {syncingArtists ? "Synchronizing..." : "Sync & Index"}
                      </button>
                    </div>

                    <h4 className="text-xs font-semibold text-gray-300 mb-2">Registered Artists Sample:</h4>
                    <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto no-scrollbar border border-white/5 p-3 rounded-xl bg-black/10">
                      {artistStats?.sampleArtists && artistStats.sampleArtists.length > 0 ? (
                        artistStats.sampleArtists.map((item: any) => (
                          <div
                            key={item.id}
                            className="bg-[#1e293b]/60 border border-white/10 text-gray-200 px-3 py-1 rounded-full text-xs font-semibold"
                          >
                            {item.name}
                          </div>
                        ))
                      ) : (
                        <div className="w-full text-center py-6 text-gray-500 text-xs flex flex-col items-center justify-center gap-1">
                          <Info className="w-4 h-4 text-slate-700" />
                          <span>No indexed artists found. Click 'Sync & Index' above to build.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-400 mt-4 bg-black/10 p-2.5 rounded-xl border border-white/5">
                    <span>Artist database automatically populates during new track creations.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tab 5: Promotions & Broadcasts */}
      {activeTab === "promotions" && (() => {
        // Find current selected banner for preview
        const activeBanners = previewSource === "live" ? bannersList : [
          {
            id: "draft",
            title: newBannerTitle,
            subtitle: newBannerSubtitle,
            imageUrl: newBannerImage || "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=1200&auto=format&fit=crop",
            mobileImageUrl: newBannerMobileImage || newBannerImage || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop",
            linkUrl: newBannerLink,
            type: newBannerType,
            buttonText: newBannerButtonText,
            enableGradient: newBannerEnableGradient
          }
        ];

        const activeBanner = activeBanners[previewIndex] || activeBanners[0];

        return (
          <div className="flex flex-col gap-8 animate-fadeIn">
            {/* Top Header Section */}
            <div className="bg-gradient-to-r from-violet-950/40 via-slate-900/40 to-indigo-950/40 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-extrabold flex items-center gap-2 text-white">
                  <Megaphone className="w-5 h-5 text-indigo-400 animate-pulse" />
                  Promotions & Broadcasts
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                  Deploy system-wide announcements and design highly customizable promotional banners or ad spaces. Real-time visualizers allow you to preview changes instantly across device ratios.
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-xl text-[10px] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Studio Panel</span>
              </div>
            </div>

            {/* Real-Time Live Mirror Preview Simulator (Full-Width) */}
            <div id="live-mirror-preview-panel" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6 w-full mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4 mb-4">
                <div>
                  <h3 className="text-md font-bold flex items-center gap-2 text-white">
                    <Monitor className="w-4 h-4 text-emerald-400" />
                    Live Mirror Simulator
                  </h3>
                  <span className="text-[10px] text-gray-400">Previews exact user homepage slideshow sizing, typography, and button responsiveness.</span>
                </div>

                {/* Simulator Controls */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  {/* Device Selection */}
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`p-1.5 rounded-lg border transition-all ${
                      previewDevice === "desktop"
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                        : "bg-slate-900/40 border-white/5 text-gray-400 hover:text-gray-300"
                    }`}
                    title="Desktop Preview Aspect Ratio"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`p-1.5 rounded-lg border transition-all ${
                      previewDevice === "mobile"
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                        : "bg-slate-900/40 border-white/5 text-gray-400 hover:text-gray-300"
                    }`}
                    title="Mobile Preview Aspect Ratio"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>

                  {/* Divider */}
                  <div className="w-px h-6 bg-white/10 mx-1" />

                  {/* Source Selection */}
                  <div className="bg-slate-950/40 border border-white/10 p-0.5 rounded-lg flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewSource("live");
                        setPreviewIndex(0);
                      }}
                      className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                        previewSource === "live"
                          ? "bg-indigo-600 text-white shadow"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      Live List
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewSource("draft");
                        setPreviewIndex(0);
                      }}
                      className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                        previewSource === "draft"
                          ? "bg-amber-600 text-white shadow"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      Draft Form
                    </button>
                  </div>
                </div>
              </div>

              {/* Device Screen Container Frame */}
              <div className="flex justify-center bg-black/35 rounded-2xl p-4 border border-white/5 relative min-h-[220px]">
                {activeBanner ? (
                  <div 
                    className={`relative overflow-hidden transition-all duration-300 rounded-2xl bg-slate-900 border border-white/5 shadow-inner ${
                      previewDevice === "mobile" 
                        ? "w-[600px] max-w-full aspect-[600/350]" 
                        : "w-[1200px] max-w-full aspect-[1200/400]"
                    }`}
                  >
                    {/* Slide image block */}
                    <div className="absolute inset-0 w-full h-full">
                      <img
                        src={previewDevice === "mobile" ? (activeBanner.mobileImageUrl || activeBanner.imageUrl) : activeBanner.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {/* Gradient Toggle Overlay */}
                      {activeBanner.enableGradient !== false && !activeBanner.hideContent && (
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
                      )}
                    </div>

                    {/* Slide Content Box */}
                    {!activeBanner.hideContent && (
                      <div className={`absolute inset-0 flex flex-col justify-center px-6 ${previewDevice === "mobile" ? "py-4 px-5" : "py-6 px-10"} z-10`}>
                        <span className={`text-[8px] font-black tracking-widest uppercase mb-0.5 ${
                          activeBanner.type === "ad" ? "text-amber-400" : "text-indigo-400"
                        }`}>
                          {activeBanner.type === "ad" ? "Advertisement" : "Promoted Spotlight"}
                        </span>
                        {activeBanner.title && (
                          <h2 className={`font-black text-white tracking-tight leading-tight line-clamp-1 ${
                            previewDevice === "mobile" ? "text-sm" : "text-lg md:text-xl"
                          }`}>
                            {activeBanner.title}
                          </h2>
                        )}
                        {activeBanner.subtitle && (
                          <p className="text-[10px] text-slate-300 font-medium max-w-sm mt-0.5 leading-snug line-clamp-2">
                            {activeBanner.subtitle}
                          </p>
                        )}
                        {activeBanner.buttonText && activeBanner.buttonText.trim() !== "" && (
                          <div className={`${previewDevice === "mobile" ? "mt-2" : "mt-3"}`}>
                            <span className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded-full shadow cursor-default select-none">
                              {activeBanner.buttonText}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Top-Right Indicator Badge */}
                    <div className="absolute top-2.5 right-2.5 bg-black/85 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[8px] font-black text-gray-300 uppercase tracking-widest z-20 flex flex-col items-end gap-0.5">
                      <span>{previewDevice === "mobile" ? "Mobile Render" : "Desktop Render"}</span>
                      <span className="text-indigo-400 text-[7px]">{previewDevice === "mobile" ? "600 x 350 px" : "1200 x 400 px"}</span>
                    </div>

                    {/* Page Indicators overlay (only if in Live mode with multiple slides) */}
                    {previewSource === "live" && bannersList.length > 1 && (
                      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
                        {bannersList.map((_, dotIndex) => (
                          <button
                            key={dotIndex}
                            type="button"
                            onClick={() => setPreviewIndex(dotIndex)}
                            className={`h-1 rounded-full transition-all ${
                              previewIndex === dotIndex ? "w-3.5 bg-white" : "w-1 bg-white/40 hover:bg-white/70"
                            }`}
                            title={`View slide ${dotIndex + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center w-full bg-slate-950/20 rounded-xl border border-dashed border-white/5 relative">
                    <AlertCircle className="w-8 h-8 text-amber-500/60 mb-2 animate-bounce" />
                    <span className="text-xs font-semibold text-amber-500/90">No Slides Configured</span>
                    <p className="text-[10px] text-gray-500 max-w-xs mt-1">
                      No active slide banners in library. Default to draft form view or load quick templates.
                    </p>
                  </div>
                )}
              </div>

              {/* Global Slide settings (Interval speed slider) */}
              <div className="mt-4 p-3 bg-slate-950/20 border border-white/5 rounded-xl flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-xs font-semibold text-gray-300">Slideshow Transition Speed</span>
                  <span className="text-[9px] text-gray-500">Dynamic delay between slides in seconds (current: {slideshowIntervalInput}s)</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={slideshowIntervalInput}
                    onChange={(e) => setSlideshowIntervalInput(e.target.value)}
                    className="w-16 bg-slate-950/50 border border-white/10 rounded-lg px-2 py-1 text-center text-xs text-gray-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Side: Setup & Forms (6 Cols) */}
              <div className="lg:col-span-6 flex flex-col gap-8">
                
                {/* 1. Global Broadcast Announcement */}
                <div id="broadcast-alert-panel" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-md font-bold flex items-center gap-2 text-white">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      Global Broadcast Announcement
                    </h3>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {alertBannerInput.length}/180 chars
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">Deploy a high-visibility real-time system banner visible to all active users on the platform index page.</p>

                  <div className="flex flex-col gap-4">
                    <textarea
                      id="system-broadcast-textarea"
                      placeholder="Enter emergency notification message (e.g., 'Warning: Scheduled database updates tonight at 11:00 PM PST. Playback services might be briefly interrupted.')...."
                      value={alertBannerInput}
                      onChange={(e) => {
                        if (e.target.value.length <= 180) {
                          setAlertBannerInput(e.target.value);
                        }
                      }}
                      rows={3}
                      className="w-full bg-[#1e293b]/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none"
                    />

                    {/* Announcement Real-Time Replica (Mirrors AppLayout.tsx) */}
                    {alertBannerInput.trim() && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Real-Time Announcement Mirror</span>
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 border border-indigo-500/20 text-white px-3 py-2.5 rounded-xl text-[11px] flex items-center justify-between gap-3 shadow-md">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-white shrink-0">
                              <Megaphone className="w-3 h-3 animate-pulse" />
                            </span>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-black text-[7px] bg-white/20 px-1 py-0.5 rounded uppercase tracking-wider shrink-0">ANNOUNCEMENT</span>
                              <span className="font-semibold text-white truncate">{alertBannerInput}</span>
                            </div>
                          </div>
                          <span className="text-white/60 text-[9px] font-bold">Preview</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      {alertBannerInput.trim() && (
                        <button
                          id="clear-broadcast-btn"
                          onClick={() => {
                            setAlertBannerInput("");
                            handleUpdateConfig("SYSTEM_ALERT_BANNER", "");
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold text-xs rounded-xl active:scale-95 transition-all"
                        >
                          Clear Banner
                        </button>
                      )}
                      <button
                        id="publish-broadcast-btn"
                        onClick={() => handleUpdateConfig("SYSTEM_ALERT_BANNER", alertBannerInput.trim())}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                      >
                        Publish Announcement
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Slide Config & Creator Form */}
                <div id="promotional-slideshow-panel" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                    <div>
                      <h3 className="text-md font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Slideshow Builder
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">Configure universal slideshow spotlights or ad spaces.</p>
                    </div>
                  </div>

                  {/* Quick Templates */}
                  <div className="p-3 bg-slate-900/30 border border-white/5 rounded-xl mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-2">
                      Quick Start Templates
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadTemplate("spotlight")}
                        className="flex-1 py-2 bg-indigo-950/40 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Load Promoted Spot (1200x400 / Mobile 600x350)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadTemplate("ad")}
                        className="flex-1 py-2 bg-amber-950/40 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Load Commercial Ad (Standard Banner)
                      </button>
                    </div>
                  </div>

                  {/* Create Slide Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newBannerImage.trim()) {
                        toast.error("Desktop Image URL is required.");
                        return;
                      }
                      handleAddBanner();
                    }}
                    className="flex flex-col gap-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-300">
                          Category / Placement
                        </label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setNewBannerType("spotlight")}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                              newBannerType === "spotlight"
                                ? "bg-indigo-600/20 border-indigo-500 text-indigo-400 font-black"
                                : "bg-slate-900/45 border-white/5 text-gray-400 hover:text-gray-300"
                            }`}
                          >
                            Promoted Spotlight
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewBannerType("ad")}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                              newBannerType === "ad"
                                ? "bg-amber-600/20 border-amber-500 text-amber-400 font-black"
                                : "bg-slate-900/45 border-white/5 text-gray-400 hover:text-gray-300"
                            }`}
                          >
                            Advertisement
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-300">
                          Banner Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Neon Synthwave Nights"
                          value={newBannerTitle}
                          onChange={(e) => setNewBannerTitle(e.target.value)}
                          className="w-full bg-[#1e293b]/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-300">
                        Banner Subtitle <span className="text-gray-500">(Optional Copy)</span>
                      </label>
                      <textarea
                        placeholder="Provide text content describing this feature or commercial promotion..."
                        value={newBannerSubtitle}
                        onChange={(e) => setNewBannerSubtitle(e.target.value)}
                        rows={2}
                        className="w-full bg-[#1e293b]/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-300">
                          Desktop Image (Desktop Banner) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="Recommended: 1200x400"
                          value={newBannerImage}
                          onChange={(e) => setNewBannerImage(e.target.value)}
                          className="w-full bg-[#1e293b]/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono text-[10px]"
                        />
                        <span className="text-[9px] text-gray-500 leading-none">Desktop layout dimensions: 1200 x 400 pixels</span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-300">
                          Mobile Image (Mobile Banner) <span className="text-gray-500">(Optional)</span>
                        </label>
                        <input
                          type="url"
                          placeholder="Recommended: 600x350"
                          value={newBannerMobileImage}
                          onChange={(e) => setNewBannerMobileImage(e.target.value)}
                          className="w-full bg-[#1e293b]/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono text-[10px]"
                        />
                        <span className="text-[9px] text-gray-500 leading-none">Mobile layout dimensions: 600 x 350 pixels</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-300">
                          Target Action Link
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. /premium or external link"
                          value={newBannerLink}
                          onChange={(e) => setNewBannerLink(e.target.value)}
                          className="w-full bg-[#1e293b]/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono text-[10px]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-300">
                          Action Button Text
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Explore Now (Leave blank to hide)"
                          value={newBannerButtonText}
                          onChange={(e) => setNewBannerButtonText(e.target.value)}
                          className="w-full bg-[#1e293b]/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-300">
                        Tags / SEO Metadata <span className="text-gray-500">(Optional comma-separated list)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. campaign, summer-playlist, heavy-rotation"
                        value={newBannerTags}
                        onChange={(e) => setNewBannerTags(e.target.value)}
                        className="w-full bg-[#1e293b]/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono text-[10px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-[#1e293b]/20 border border-white/5 rounded-xl">
                        <div className="flex flex-col pr-2">
                          <span className="text-xs font-semibold text-gray-200">Enable Dark Gradient</span>
                          <span className="text-[9px] text-gray-500 leading-tight">Contrast block behind text layer.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBannerEnableGradient(!newBannerEnableGradient)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                            newBannerEnableGradient ? "bg-indigo-600" : "bg-slate-700"
                          }`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            newBannerEnableGradient ? "translate-x-4" : "translate-x-0"
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#1e293b]/20 border border-white/5 rounded-xl">
                        <div className="flex flex-col pr-2">
                          <span className="text-xs font-semibold text-gray-200">Hidden</span>
                          <span className="text-[9px] text-gray-500 leading-tight">Do not display elements ranging from Category/Placement to Action Button Text on the banner, while keeping SEO and metadata intact.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBannerHideContent(!newBannerHideContent)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                            newBannerHideContent ? "bg-indigo-600" : "bg-slate-700"
                          }`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            newBannerHideContent ? "translate-x-4" : "translate-x-0"
                          }`} />
                        </button>
                      </div>
                    </div>

                    {editingBannerId ? (
                      <div className="flex gap-2 w-full mt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/5"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Custom Banner to Slideshow
                      </button>
                    )}
                  </form>
                </div>
              </div>

              {/* Right Side: Active Slides & Real-Time Device Simulator (6 Cols) */}
              <div className="lg:col-span-6 flex flex-col gap-8">
                
                {/* 3. Active Promotion Library */}
                <div id="active-promos-library" className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Active Banner Queue ({bannersList.length})
                    </span>
                    <span className="text-[9px] text-gray-500 font-medium">Ordering controls below</span>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto no-scrollbar">
                    {bannersList.map((banner, index) => (
                      <div
                        key={banner.id}
                        onClick={() => {
                          if (previewSource === "live") {
                            setPreviewIndex(index);
                          }
                        }}
                        className={`bg-[#1e293b]/20 border p-3 rounded-xl flex flex-col sm:flex-row gap-4 items-start sm:items-stretch group hover:bg-[#1e293b]/30 transition-all cursor-pointer ${
                          previewSource === "live" && previewIndex === index 
                            ? "border-indigo-500 bg-indigo-950/10" 
                            : "border-white/5"
                        }`}
                      >
                        {/* Dual Device Thumbnail */}
                        <div className="flex flex-row sm:flex-col gap-1.5 shrink-0 justify-center">
                          <div className="relative w-20 aspect-[12/4] rounded border border-white/10 overflow-hidden bg-slate-950">
                            <img
                              src={banner.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-[7px] text-gray-400 font-extrabold uppercase tracking-widest">
                              Desk
                            </div>
                          </div>
                          <div className="relative w-20 aspect-[12/7] rounded border border-white/10 overflow-hidden bg-slate-950">
                            <img
                              src={banner.mobileImageUrl || banner.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-[7px] text-indigo-300 font-extrabold uppercase tracking-widest">
                              Mob
                            </div>
                          </div>
                        </div>

                        {/* Banner Description */}
                        <div className="flex-1 flex flex-col justify-between py-0.5 gap-2 min-w-0">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-bold text-gray-100 truncate max-w-[150px]">
                                {banner.title || "(No Title)"}
                              </h4>
                              <span className={`text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-wider ${
                                banner.type === "ad"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/10"
                              }`}>
                                {banner.type || "spotlight"}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                              {banner.subtitle || "(No Subtitle)"}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap text-[9px] text-slate-500">
                            {banner.buttonText && (
                              <span className="bg-slate-950/40 px-1.5 py-0.5 rounded border border-white/5 text-[8px] text-indigo-400 font-bold font-mono">
                                Action: "{banner.buttonText}"
                              </span>
                            )}
                            {banner.enableGradient !== false && (
                              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 px-1.5 py-0.5 rounded text-[8px] font-semibold">Grad Overlay</span>
                            )}
                            {banner.hideContent && (
                              <span className="bg-rose-500/10 text-rose-500 border border-rose-500/10 px-1.5 py-0.5 rounded text-[8px] font-semibold">Content Hidden</span>
                            )}
                            {banner.tags && banner.tags.map((tag: string) => (
                              <span key={tag} className="bg-slate-800/80 text-gray-400 border border-white/5 px-1 py-0.5 rounded text-[8px] font-mono">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0 self-center sm:self-stretch">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBannerUp(index);
                            }}
                            disabled={index === 0}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
                            title="Move Banner Order Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBannerDown(index);
                            }}
                            disabled={index === bannersList.length - 1}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
                            title="Move Banner Order Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Populate form fields for editing
                              setEditingBannerId(banner.id);
                              setNewBannerImage(banner.imageUrl);
                              setNewBannerMobileImage(banner.mobileImageUrl || "");
                              setNewBannerLink(banner.linkUrl || "");
                              setNewBannerTitle(banner.title || "");
                              setNewBannerSubtitle(banner.subtitle || "");
                              setNewBannerType(banner.type || "spotlight");
                              setNewBannerButtonText(banner.buttonText || "");
                              setNewBannerEnableGradient(banner.enableGradient !== false);
                              setNewBannerTags(banner.tags ? banner.tags.join(", ") : "");
                              setNewBannerHideContent(banner.hideContent || false);
                              toast.info(`Loaded "${banner.title || "Untitled"}" into editor`);
                              
                              // Smooth scroll to the editor form
                              document.getElementById("promotional-slideshow-panel")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              editingBannerId === banner.id
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "bg-indigo-950/40 border-indigo-500/15 hover:bg-indigo-900 text-indigo-400 hover:text-indigo-200"
                            }`}
                            title="Edit / Re-edit Banner Slide"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBanner(banner.id);
                            }}
                            className="p-1.5 bg-rose-950/40 border border-rose-500/10 hover:bg-rose-900 rounded-lg text-rose-400 hover:text-rose-200 transition-all cursor-pointer ml-1"
                            title="Delete Banner Slide"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {bannersList.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-white/5 rounded-xl bg-slate-950/20">
                        <AlertCircle className="w-8 h-8 text-amber-500/50 mb-2" />
                        <span className="text-xs font-semibold text-amber-500/80">Queue Is Empty</span>
                        <p className="text-[10px] text-gray-400 max-w-xs mt-0.5">
                          Add custom dynamic banners to populate the active queue.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Interactive Media Inspector Overlay */}
      {inspectPlaylistId !== null && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#131d35]">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <Music className="w-5 h-5" />
                <span>Interactive Media Inspector</span>
              </div>
              <button
                onClick={() => setInspectPlaylistId(null)}
                className="text-gray-400 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {inspectorLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                  <span className="text-xs text-gray-400">Loading playlist stream & tracks...</span>
                </div>
              ) : inspectorPlaylist ? (
                <div className="flex flex-col gap-6">
                  {/* Playlist Info Box */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 relative">
                    {!editingPlaylist ? (
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">Playlist Overview</span>
                            <h3 className="text-xl font-bold text-gray-100 mt-1">{inspectorPlaylist.name}</h3>
                          </div>
                          <button
                            onClick={() => {
                              setEditingPlaylist(true);
                              setEditPlaylistName(inspectorPlaylist.name);
                              setEditPlaylistDesc(inspectorPlaylist.description || "");
                              setEditPlaylistVisibility(inspectorPlaylist.visibility);
                            }}
                            className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" /> Edit Metadata
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 max-w-2xl">
                          {inspectorPlaylist.description || "No description provided."}
                        </p>
                        <div className="flex gap-4 mt-4 text-[10px] text-gray-500 font-medium">
                          <span>Owner: <strong className="text-gray-300">@{inspectorPlaylist.user?.username || "deleted"}</strong> ({inspectorPlaylist.user?.name})</span>
                          <span>Visibility: <strong className="text-indigo-400 uppercase">{inspectorPlaylist.visibility}</strong></span>
                          <span>Tracks: <strong className="text-gray-300">{inspectorPlaylist.songs?.length || 0}</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 animate-fadeIn">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400">Edit Playlist Metadata</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Playlist Name</label>
                            <input
                              type="text"
                              value={editPlaylistName}
                              onChange={e => setEditPlaylistName(e.target.value)}
                              className="w-full bg-[#1e293b]/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Visibility</label>
                            <select
                              value={editPlaylistVisibility}
                              onChange={e => setEditPlaylistVisibility(e.target.value as any)}
                              className="w-full bg-[#1e293b]/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="public">Public</option>
                              <option value="private">Private</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Description</label>
                          <textarea
                            value={editPlaylistDesc}
                            onChange={e => setEditPlaylistDesc(e.target.value)}
                            rows={2}
                            className="w-full bg-[#1e293b]/50 border border-white/10 rounded-lg p-2.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setEditingPlaylist(false)}
                            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdatePlaylistDetails(inspectorPlaylist.id, editPlaylistName, editPlaylistDesc, editPlaylistVisibility)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Playlist Tracks Box */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Tracklist Management ({inspectorPlaylist.songs?.length || 0} tracks)</h4>
                    
                    <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar animate-fadeIn">
                      {inspectorPlaylist.songs && inspectorPlaylist.songs.length > 0 ? (
                        inspectorPlaylist.songs.map((song: any) => (
                          <div key={song.id} className="bg-white/[0.01] border border-white/5 hover:border-white/10 rounded-xl p-3.5 flex items-center justify-between gap-4 transition-all">
                            
                            {editingSongId !== song.id ? (
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs text-gray-200 truncate">{song.title}</span>
                                  {song.isDeadLink && (
                                    <span className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-bold shrink-0">
                                      Dead link
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                                  <span>by <strong className="text-gray-300 font-medium">{song.artist || "Unknown Artist"}</strong></span>
                                  <span>•</span>
                                  <span className="font-mono">YouTube: {song.youtubeId}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                <div>
                                  <label className="text-[8px] uppercase tracking-wider text-gray-400 block mb-0.5">Song Title</label>
                                  <input
                                    type="text"
                                    value={editSongTitle}
                                    onChange={e => setEditSongTitle(e.target.value)}
                                    className="w-full bg-[#1e293b]/80 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div className="relative">
                                  <label className="text-[8px] uppercase tracking-wider text-gray-400 block mb-0.5">Artist</label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={editSongArtist}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setEditSongArtist(val);
                                        fetchAdminArtistSuggestions(val);
                                        setShowAdminArtistSuggestions(true);
                                      }}
                                      onFocus={() => {
                                        fetchAdminArtistSuggestions(editSongArtist);
                                        setShowAdminArtistSuggestions(true);
                                      }}
                                      className="w-full bg-[#1e293b]/80 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                                    />
                                    {showAdminArtistSuggestions && adminArtistSuggestions.length > 0 && (
                                      <>
                                        <div 
                                          className="fixed inset-0 z-10" 
                                          onClick={() => setShowAdminArtistSuggestions(false)}
                                        />
                                        <div className="absolute left-0 right-0 top-full mt-1 bg-[#1e293b]/95 border border-white/10 rounded-lg shadow-xl z-20 max-h-36 overflow-y-auto divide-y divide-white/5">
                                          {adminArtistSuggestions.map((item: any) => (
                                            <button
                                              key={item.id}
                                              type="button"
                                              onClick={() => {
                                                setEditSongArtist(item.name);
                                                setShowAdminArtistSuggestions(false);
                                              }}
                                              className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-indigo-600/20 hover:text-white transition-colors cursor-pointer"
                                            >
                                              {item.name}
                                            </button>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Individual Song Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {editingSongId !== song.id ? (
                                <>
                                  <a
                                    href={`https://youtube.com/watch?v=${song.youtubeId}`}
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                                    title="Play and check YouTube video"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    onClick={() => {
                                      setEditingSongId(song.id);
                                      setEditSongTitle(song.title);
                                      setEditSongArtist(song.artist || "");
                                    }}
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                                    title="Edit track metadata"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSongFromPlaylist(song.id)}
                                    className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                                    title="Delete from playlist"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleUpdateSongInPlaylist(song.id, editSongTitle, editSongArtist)}
                                    className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all cursor-pointer"
                                    title="Confirm changes"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingSongId(null)}
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                                    title="Cancel edit"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>

                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center text-gray-500 text-xs">
                          No tracks available in this playlist.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-gray-500 text-xs">
                  Failed to load metadata stream. Please re-open the inspector.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#131d35] border-t border-white/5 text-right flex justify-between items-center text-[10px] text-gray-400">
              <span>Changes take effect immediately across all client applications.</span>
              <button
                onClick={() => setInspectPlaylistId(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer text-xs"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
