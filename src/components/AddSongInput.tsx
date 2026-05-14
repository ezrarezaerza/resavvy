import { useState } from 'react';
import { extractYouTubeId, fetchYouTubeMetadata } from '../utils/youtube';
import { parseYouTubeTitle } from '../utils/metadata';
import { Song } from '../types';

interface FetchedMetadata {
  videoId: string;
  originalTitle: string;
  thumbnailUrl: string;
}

interface AddSongInputProps {
  onAdd: (song: Omit<Song, 'addedAt'>) => void;
}

export function AddSongInput({ onAdd }: AddSongInputProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Staging state
  const [isStaging, setIsStaging] = useState(false);
  const [metadata, setMetadata] = useState<FetchedMetadata | null>(null);
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');

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
      
      // Enforce lower-resolution thumbnail
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
      setError(err instanceof Error ? err.message : 'Failed to fetch video metadata.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAdd = () => {
    if (metadata) {
      onAdd({
        id: metadata.videoId,
        title: title.trim() || 'Unknown Title',
        artist: artist.trim() || 'Unknown Artist',
        thumbnailUrl: metadata.thumbnailUrl,
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setUrl('');
    setMetadata(null);
    setIsStaging(false);
    setArtist('');
    setTitle('');
    setError(null);
  };

  return (
    <div className="w-full font-sans pb-2">
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
    </div>
  );
}
