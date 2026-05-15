import { useState } from 'react';
import { extractYouTubeId, fetchYouTubeMetadata } from '../utils/youtube';
import { parseYouTubeTitle } from '../utils/metadata';
import { Song } from '../types';
import { toast } from 'sonner';
import { triggerHaptic } from '../utils/nativeCapabilities';

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

interface AddSongInputProps {
  onAdd: (song: Omit<Song, 'addedAt'>) => void;
}

export function AddSongInput({ onAdd }: AddSongInputProps) {
  const [mode, setMode] = useState<'search' | 'manual'>('search');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Staging state for manual
  const [isStaging, setIsStaging] = useState(false);
  const [metadata, setMetadata] = useState<FetchedMetadata | null>(null);
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [stagedDuration, setStagedDuration] = useState<string | number>('');

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
      const msg = err instanceof Error ? err.message : 'Search error';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const formatTime = (duration: string | number | undefined) => {
    if (duration === undefined || duration === null || duration === '--:--') return '--:--';
    if (typeof duration === 'string' && duration.includes(':')) return duration;
    const seconds = typeof duration === 'string' ? parseInt(duration, 10) : duration;
    if (isNaN(seconds)) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleFetch = async () => {
    setError(null);
    setIsStaging(false);

    if (!url.trim()) {
      setError('Please enter a YouTube URL.');
      return;
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      setError('Invalid YouTube URL. Please make sure the link is correct.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchYouTubeMetadata(url);
      const parsed = parseYouTubeTitle(data.title);
      
      const hqThumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
      
      setMetadata({
        videoId,
        originalTitle: data.title,
        thumbnailUrl: hqThumbnail,
      });
      setArtist(parsed.artist);
      setTitle(parsed.title);
      setIsStaging(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch video metadata.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAdd = () => {
    if (metadata) {
      triggerHaptic();
      onAdd({
        id: metadata.videoId,
        title: title.trim() || 'Unknown Title',
        artist: artist.trim() || 'Unknown Artist',
        thumbnailUrl: metadata.thumbnailUrl,
        duration: stagedDuration as string // Pass the duration along
      } as any);
      resetForm();
    }
  };

  const cleanYouTubeTitle = (rawTitle: string, defaultArtist: string) => {
    let cleaned = rawTitle.replace(/\[.*?\]|\(.*?\)|official(?: music)? video|lyric(?:s| video)?/gi, '').trim();
    // Attempt to split by '-' if it exists
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
    return { title: cleaned, artist: defaultArtist };
  };

  const handleResultClick = (result: SearchResult) => {
    setMode('manual');
    setUrl('https://www.youtube.com/watch?v=' + result.id);
    
    const { title: newTitle, artist: newArtist } = cleanYouTubeTitle(result.title, result.artist);

    setTitle(newTitle);
    setArtist(newArtist);
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
    setArtist('');
    setTitle('');
    setStagedDuration('');
    setError(null);
  };

  return (
    <div className="w-full font-sans pb-2">
      <div className="flex gap-2 mb-6 bg-black/20 p-1 rounded-xl w-fit mx-auto border border-white/5">
        <button
          onClick={() => { setMode('search'); resetForm(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'search' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
        >
          Search YouTube
        </button>
        <button
          onClick={() => { setMode('manual'); resetForm(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
        >
          Direct Link
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
              className="flex-1 w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-5 py-3 bg-white text-black font-medium rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap text-sm shadow-md"
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
                  className="hover:bg-white/5 cursor-pointer rounded-lg p-2 flex gap-4 items-center transition-colors border border-transparent hover:border-white/10"
                >
                  <img 
                    src={result.thumbnail} 
                    alt={result.title}
                    className="w-16 h-12 object-cover rounded shadow-sm bg-black/40"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm font-medium truncate">{result.title}</h4>
                    <p className="text-gray-400 text-xs truncate mt-0.5">{result.artist}</p>
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
          {!isStaging ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  placeholder="Paste YouTube URL here..." 
                  value={url}
                  autoFocus
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                  className="flex-1 w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
                <button 
                  onClick={handleFetch}
                  disabled={isLoading || !url.trim()}
                  className="px-5 py-3 bg-white text-black font-medium rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap text-sm shadow-md"
                >
                  {isLoading ? 'Fetching...' : 'Fetch'}
                </button>
              </div>
              
              {error && (
                <p className="text-sm text-red-500 font-medium px-1">{error}</p>
              )}
            </div>
          ) : (
            <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex flex-col sm:flex-row gap-5 mb-5 relative">
                <img 
                  src={metadata?.thumbnailUrl} 
                  alt={title || "Thumbnail"}
                  className="w-24 h-24 aspect-square object-cover object-center rounded-lg shadow-md border border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 shrink-0"
                />
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Artist</label>
                    <input 
                      type="text" 
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="Artist name"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Song title"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end pt-2 mt-4 border-t border-white/5">
                <button 
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-xl transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmAdd}
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
