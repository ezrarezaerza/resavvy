import { useState, useEffect } from 'react';
import { extractYouTubeId, extractYouTubePlaylistId, fetchYouTubeMetadata, getThumbnailUrl } from '../utils/youtube';
import { parseYouTubeTitle } from '../utils/metadata';
import { Song } from '../types';
import { OptimizedImage } from "./OptimizedImage";

interface FetchedMetadata {
  videoId: string;
  originalTitle: string;
  thumbnailUrl: string;
}

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
}

interface StagedPlaylistSong {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  duration: string;
  selected: boolean;
}

interface AddSongInputProps {
  onAdd: (song: Omit<Song, 'addedAt'>) => void;
  onAddBulk?: (songs: Omit<Song, 'addedAt'>[]) => void;
  initialUrl?: string;
}

export function AddSongInput({ onAdd, onAddBulk, initialUrl }: AddSongInputProps) {
  const [mode, setMode] = useState<'search' | 'manual'>(initialUrl ? 'manual' : 'search');
  const [url, setUrl] = useState(initialUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialUrl) {
      setMode('manual');
      setUrl(initialUrl);
    }
  }, [initialUrl]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Staging state for single manual video
  const [isStaging, setIsStaging] = useState(false);
  const [metadata, setMetadata] = useState<FetchedMetadata | null>(null);
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [stagedDuration, setStagedDuration] = useState<string | number>('');

  // Playlist Staging State
  const [isPlaylistStaging, setIsPlaylistStaging] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistSongs, setPlaylistSongs] = useState<StagedPlaylistSong[]>([]);
  const [playlistSearchFilter, setPlaylistSearchFilter] = useState('');

  // Artist Auto-Suggest states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchArtistSuggestions = async (val: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/songs?action=artists&q=${encodeURIComponent(val)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/search/youtube?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Search failed');
      }
      setResults(data);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Search error');
    } finally {
      setIsSearching(false);
    }
  };

  const formatTime = (secondsVal: string | number | undefined) => {
    if (secondsVal === undefined || secondsVal === null || secondsVal === '--:--') return '--:--';
    if (typeof secondsVal === 'string' && secondsVal.includes(':')) return secondsVal;
    
    const seconds = Number(secondsVal);
    if (isNaN(seconds)) return '--:--';
    
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleFetch = async () => {
    setError(null);
    setIsStaging(false);
    setIsPlaylistStaging(false);

    if (!url.trim()) {
      setError('Please enter a YouTube video or playlist URL.');
      return;
    }

    // Check if URL is a YouTube playlist link
    const playlistId = extractYouTubePlaylistId(url);
    if (playlistId) {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search/youtube-playlist?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch YouTube playlist.');
        }
        if (!data.songs || data.songs.length === 0) {
          throw new Error('No songs found in this YouTube playlist.');
        }

        setPlaylistTitle(data.title || 'YouTube Playlist');
        setPlaylistSongs(data.songs.map((s: any) => ({ ...s, selected: true })));
        setIsPlaylistStaging(true);
      } catch (err: any) {
        setError(err instanceof Error ? err.message : 'Failed to fetch playlist.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Single video URL handling
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      setError('Invalid YouTube URL. Please enter a valid video or playlist link.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchYouTubeMetadata(url);
      const parsed = parseYouTubeTitle(data.title);
      
      const mqThumbnail = getThumbnailUrl(videoId, 'mqdefault');
      
      setMetadata({
        videoId,
        originalTitle: data.title,
        thumbnailUrl: mqThumbnail,
      });
      setArtist(parsed.artist);
      setTitle(parsed.title);
      setIsStaging(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video metadata.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAddSingle = () => {
    if (metadata) {
      onAdd({
        id: metadata.videoId,
        title: title.trim() || 'Unknown Title',
        artist: artist.trim() || 'Unknown Artist',
        thumbnailUrl: metadata.thumbnailUrl,
        duration: stagedDuration as string
      } as any);
      resetForm();
    }
  };

  const handleConfirmAddPlaylist = () => {
    const selected = playlistSongs
      .filter((s) => s.selected)
      .map((s) => ({
        id: s.id,
        title: s.title.trim() || 'Unknown Title',
        artist: s.artist.trim() || 'Unknown Artist',
        thumbnailUrl: s.thumbnailUrl,
        duration: s.duration
      }));

    if (selected.length === 0) return;

    if (onAddBulk) {
      onAddBulk(selected);
    } else {
      selected.forEach((song) => onAdd(song));
    }
    resetForm();
  };

  const toggleSelectAllPlaylist = (select: boolean) => {
    setPlaylistSongs((prev) => prev.map((s) => ({ ...s, selected: select })));
  };

  const toggleSongSelection = (id: string) => {
    setPlaylistSongs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const updatePlaylistSongField = (id: string, field: 'title' | 'artist', value: string) => {
    setPlaylistSongs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const cleanYouTubeTitle = (titleStr: string) => {
    if (!titleStr) return { artist: '', title: '' };
    let cleaned = titleStr.replace(/official(?: music)? video|lyric(?:s| video)?/gi, '').trim();
    cleaned = cleaned.replace(/\(\s*\)|\[\s*\]/g, '').trim();
    cleaned = cleaned.replace(/-+$/, '').trim();

    if (cleaned.includes(' - ')) {
      const parts = cleaned.split(' - ');
      return {
        artist: parts[0].trim(),
        title: parts.slice(1).join(' - ').trim()
      };
    } else if (cleaned.includes('-')) {
      const parts = cleaned.split('-');
      return {
        artist: parts[0].trim(),
        title: parts.slice(1).join('-').trim()
      };
    }
    return { title: cleaned };
  };

  const handleResultClick = (result: SearchResult) => {
    setMode('manual');
    setUrl(`https://www.youtube.com/watch?v=${result.id}`);
    
    const { title: newTitle, artist: newArtist } = cleanYouTubeTitle(result.title);

    setTitle(newTitle || '');
    setArtist(newArtist || result.artist);
    setStagedDuration(result.duration);
    
    setMetadata({
      videoId: result.id,
      originalTitle: result.title,
      thumbnailUrl: result.thumbnail
    });
    setIsStaging(true);
  };

  const resetForm = () => {
    setUrl('');
    setSearchQuery('');
    setResults([]);
    setMetadata(null);
    setIsStaging(false);
    setIsPlaylistStaging(false);
    setPlaylistTitle('');
    setPlaylistSongs([]);
    setPlaylistSearchFilter('');
    setArtist('');
    setTitle('');
    setStagedDuration('');
    setError(null);
  };

  const filteredPlaylistSongs = playlistSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(playlistSearchFilter.toLowerCase()) ||
      s.artist.toLowerCase().includes(playlistSearchFilter.toLowerCase())
  );

  const selectedPlaylistCount = playlistSongs.filter((s) => s.selected).length;

  return (
    <div className="w-full font-sans pb-2">
      <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-black/20 p-1 rounded-xl w-fit mx-auto border border-gray-200 dark:border-white/5">
        <button
          onClick={() => { setMode('search'); resetForm(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'search' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
        >
          Search YouTube
        </button>
        <button
          onClick={() => { setMode('manual'); resetForm(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
        >
          Direct / Playlist Link
        </button>
      </div>

      {mode === 'search' ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                placeholder="Search for a song..." 
                value={searchQuery}
                autoFocus
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-5 py-3 bg-indigo-600 dark:bg-white text-white dark:text-black font-medium rounded-xl hover:bg-indigo-700 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap text-sm shadow-md"
              >
              {isSearching ? '...' : 'Search'}
            </button>
          </div>
          
          {error && <p className="text-sm text-red-500 font-medium px-1">{error}</p>}

          {results.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 max-h-96 overflow-y-auto pr-2 no-scrollbar">
              {results.map((result) => (
                <div 
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer rounded-lg p-2 flex gap-4 items-center transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                >
                  <OptimizedImage 
                    src={result.thumbnail} 
                    alt={result.title}
                    className="w-16 h-12 object-cover rounded shadow-sm bg-gray-200 dark:bg-black/40"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-gray-900 dark:text-white text-sm font-medium truncate">{result.title}</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-xs truncate mt-0.5">{result.artist}</p>
                  </div>
                  <div className="text-xs font-mono text-gray-500 shrink-0">
                    {formatTime(result.duration)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {!isStaging && !isPlaylistStaging ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  placeholder="Paste YouTube Video or Playlist URL..." 
                  value={url}
                  autoFocus
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                  className="flex-1 w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
                <button 
                  onClick={handleFetch}
                  disabled={isLoading || !url.trim()}
                  className="px-5 py-3 bg-indigo-600 dark:bg-white text-white dark:text-black font-medium rounded-xl hover:bg-indigo-700 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap text-sm shadow-md"
                >
                  {isLoading ? 'Fetching...' : 'Fetch Link'}
                </button>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                Tip: You can paste a single track link or a full YouTube Playlist link (e.g. <code className="text-indigo-600 dark:text-indigo-400">...playlist?list=...</code>) to import songs in bulk.
              </p>

              {error && (
                <p className="text-sm text-red-500 font-medium px-1">{error}</p>
              )}
            </div>
          ) : isPlaylistStaging ? (
            /* BULK PLAYLIST IMPORT STAGING VIEW */
            <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-200 flex flex-col gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-3.5 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    YouTube Playlist Import
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">
                    {playlistTitle}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Found {playlistSongs.length} tracks • {selectedPlaylistCount} selected
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectAllPlaylist(true)}
                    className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 hover:bg-indigo-200 dark:hover:bg-indigo-800/80 rounded-lg transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelectAllPlaylist(false)}
                    className="px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-200/60 dark:bg-white/10 hover:bg-gray-300/60 dark:hover:bg-white/20 rounded-lg transition-colors"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Filter search box for large playlists */}
              {playlistSongs.length > 5 && (
                <input
                  type="text"
                  placeholder="Filter songs in this playlist..."
                  value={playlistSearchFilter}
                  onChange={(e) => setPlaylistSearchFilter(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              )}

              {/* Tracks List */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 no-scrollbar divide-y divide-gray-100 dark:divide-white/5">
                {filteredPlaylistSongs.map((song) => (
                  <div
                    key={song.id}
                    className={`pt-2 flex items-center gap-3 p-2 rounded-xl transition-colors ${
                      song.selected
                        ? 'bg-gray-50/80 dark:bg-white/[0.03]'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={song.selected}
                      onChange={() => toggleSongSelection(song.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />

                    <OptimizedImage
                      src={song.thumbnailUrl}
                      alt={song.title}
                      className="w-12 h-10 object-cover rounded-md shadow-sm shrink-0 bg-gray-200 dark:bg-gray-800"
                    />

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                      <input
                        type="text"
                        value={song.artist}
                        onChange={(e) => updatePlaylistSongField(song.id, 'artist', e.target.value)}
                        placeholder="Artist"
                        className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 truncate"
                      />
                      <input
                        type="text"
                        value={song.title}
                        onChange={(e) => updatePlaylistSongField(song.id, 'title', e.target.value)}
                        placeholder="Song Title"
                        className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 truncate"
                      />
                    </div>

                    <div className="text-[11px] font-mono text-gray-400 shrink-0">
                      {song.duration}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-200 dark:border-white/5">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAddPlaylist}
                  disabled={selectedPlaylistCount === 0}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                >
                  Add Selected Tracks ({selectedPlaylistCount})
                </button>
              </div>
            </div>
          ) : (
            /* SINGLE VIDEO STAGING VIEW */
            <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex flex-col sm:flex-row gap-5 mb-5 relative">
                <OptimizedImage 
                  src={metadata?.thumbnailUrl} 
                  alt={title || "Thumbnail"}
                  className="w-24 h-24 aspect-square object-cover object-center rounded-lg shadow-md border border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 shrink-0"
                />
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Artist</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={artist}
                        onChange={(e) => {
                          const val = e.target.value;
                          setArtist(val);
                          fetchArtistSuggestions(val);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => {
                          fetchArtistSuggestions(artist);
                          setShowSuggestions(true);
                        }}
                        placeholder="Artist name"
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowSuggestions(false)}
                          />
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto overflow-x-hidden divide-y divide-gray-100 dark:divide-white/5">
                            {suggestions.map((item: any) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setArtist(item.name);
                                  setShowSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                {item.name}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Song title"
                      className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end pt-2 mt-4 border-t border-gray-200 dark:border-white/5">
                <button 
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmAddSingle}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                >
                  Confirm & Add
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
