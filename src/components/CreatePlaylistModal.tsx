import React, { useState } from 'react';
import { Youtube, ListMusic, Check, Search } from 'lucide-react';
import { Song } from '../types';
import { OptimizedImage } from './OptimizedImage';
import { extractYouTubePlaylistId } from '../utils/youtube';

interface StagedTrack {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  duration: string;
  selected: boolean;
}

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    name: string,
    description?: string,
    tags?: string[],
    visibility?: 'private' | 'public' | 'unlisted',
    initialSongs?: Omit<Song, 'addedAt'>[]
  ) => Promise<void>;
  initialYoutubeUrl?: string;
}

export function CreatePlaylistModal({
  isOpen,
  onClose,
  onCreate,
  initialYoutubeUrl,
}: CreatePlaylistModalProps) {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'standard' | 'youtube'>(initialYoutubeUrl ? 'youtube' : 'standard');

  // Standard form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public' | 'unlisted'>('public');

  // YouTube import state
  const [youtubeUrl, setYoutubeUrl] = useState(initialYoutubeUrl || '');

  React.useEffect(() => {
    if (initialYoutubeUrl) {
      setMode('youtube');
      setYoutubeUrl(initialYoutubeUrl);
    }
  }, [initialYoutubeUrl]);
  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [stagedTracks, setStagedTracks] = useState<StagedTrack[]>([]);
  const [hasFetchedYoutube, setHasFetchedYoutube] = useState(false);
  const [trackSearchQuery, setTrackSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setTagsStr('');
    setVisibility('public');
    setYoutubeUrl('');
    setIsFetchingYoutube(false);
    setYoutubeError(null);
    setStagedTracks([]);
    setHasFetchedYoutube(false);
    setTrackSearchQuery('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFetchYoutubePlaylist = async () => {
    if (!youtubeUrl.trim()) {
      setYoutubeError('Please enter a valid YouTube playlist URL.');
      return;
    }

    const playlistId = extractYouTubePlaylistId(youtubeUrl);
    if (!playlistId) {
      setYoutubeError('Invalid YouTube playlist URL. Make sure it contains a list ID (e.g., list=PL...).');
      return;
    }

    setIsFetchingYoutube(true);
    setYoutubeError(null);

    try {
      const res = await fetch(`/api/search/youtube-playlist?url=${encodeURIComponent(youtubeUrl)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch YouTube playlist.');
      }

      if (!data.songs || data.songs.length === 0) {
        throw new Error('No valid video tracks found in this YouTube playlist.');
      }

      // Auto populate playlist details
      if (data.title && !name.trim()) {
        setName(data.title);
      }
      if (!description.trim()) {
        setDescription(`Imported from YouTube Playlist: ${data.title || ''}`.trim());
      }

      setStagedTracks(
        data.songs.map((s: any) => ({
          ...s,
          selected: true,
        }))
      );
      setHasFetchedYoutube(true);
    } catch (err: any) {
      setYoutubeError(err instanceof Error ? err.message : 'Error fetching playlist.');
    } finally {
      setIsFetchingYoutube(false);
    }
  };

  const toggleSelectAll = (select: boolean) => {
    setStagedTracks((prev) => prev.map((t) => ({ ...t, selected: select })));
  };

  const toggleTrackSelection = (id: string) => {
    setStagedTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const updateTrackField = (id: string, field: 'title' | 'artist', value: string) => {
    setStagedTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const parsedTags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);

    let initialSongs: Omit<Song, 'addedAt'>[] | undefined = undefined;

    if (mode === 'youtube' && hasFetchedYoutube) {
      initialSongs = stagedTracks
        .filter((t) => t.selected)
        .map((t) => ({
          id: t.id,
          title: t.title.trim() || 'Unknown Title',
          artist: t.artist.trim() || 'Unknown Artist',
          thumbnailUrl: t.thumbnailUrl,
          duration: t.duration,
        }));
    }

    try {
      await onCreate(
        name.trim(),
        description.trim() || undefined,
        parsedTags.length > 0 ? parsedTags : undefined,
        visibility,
        initialSongs
      );
      handleClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = stagedTracks.filter((t) => t.selected).length;

  const filteredStagedTracks = stagedTracks.filter(
    (t) =>
      t.title.toLowerCase().includes(trackSearchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(trackSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Tabs */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Create Playlist
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2 bg-gray-200/70 dark:bg-black/40 p-1 rounded-xl w-full">
            <button
              type="button"
              onClick={() => {
                setMode('standard');
                setYoutubeError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                mode === 'standard'
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              Blank Playlist
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('youtube');
                setYoutubeError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                mode === 'youtube'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              Import YouTube Playlist
            </button>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 no-scrollbar">
          {mode === 'youtube' && (
            <div className="space-y-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 p-3.5 rounded-xl">
              <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                YouTube Playlist URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://www.youtube.com/playlist?list=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFetchYoutubePlaylist();
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleFetchYoutubePlaylist}
                  disabled={isFetchingYoutube || !youtubeUrl.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5"
                >
                  {isFetchingYoutube ? 'Fetching...' : 'Fetch Tracks'}
                </button>
              </div>

              {youtubeError && (
                <p className="text-xs text-red-500 font-medium">{youtubeError}</p>
              )}

              {!hasFetchedYoutube && !youtubeError && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Paste a link to any public YouTube playlist to automatically extract all video tracks, clean titles, and cover art.
                </p>
              )}
            </div>
          )}

          {/* Playlist Metadata Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Playlist Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="E.g., Workout Mix, Chill Vibes..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="workout, chill, focus"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="What is this playlist about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Staged Youtube Tracks Preview */}
          {mode === 'youtube' && hasFetchedYoutube && (
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Import Tracks ({stagedTracks.length})
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {selectedCount} selected for import
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(true)}
                    className="px-2 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-100"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(false)}
                    className="px-2 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {stagedTracks.length > 5 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search imported tracks..."
                    value={trackSearchQuery}
                    onChange={(e) => setTrackSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 no-scrollbar divide-y divide-gray-100 dark:divide-white/5">
                {filteredStagedTracks.map((track) => (
                  <div
                    key={track.id}
                    className={`pt-1.5 flex items-center gap-2.5 p-1.5 rounded-lg transition-colors ${
                      track.selected
                        ? 'bg-gray-50 dark:bg-white/[0.03]'
                        : 'opacity-50 hover:opacity-90'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={track.selected}
                      onChange={() => toggleTrackSelection(track.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                    />

                    <OptimizedImage
                      src={track.thumbnailUrl}
                      alt={track.title}
                      className="w-10 h-8 object-cover rounded bg-gray-200 dark:bg-gray-800 shrink-0"
                    />

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 min-w-0">
                      <input
                        type="text"
                        value={track.artist}
                        onChange={(e) => updateTrackField(track.id, 'artist', e.target.value)}
                        placeholder="Artist"
                        className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-2 py-0.5 text-[11px] text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 truncate"
                      />
                      <input
                        type="text"
                        value={track.title}
                        onChange={(e) => updateTrackField(track.id, 'title', e.target.value)}
                        placeholder="Title"
                        className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-2 py-0.5 text-[11px] text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 truncate"
                      />
                    </div>

                    <span className="text-[10px] font-mono text-gray-400 shrink-0">
                      {track.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !name.trim() ||
                isSubmitting ||
                (mode === 'youtube' && hasFetchedYoutube && selectedCount === 0)
              }
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSubmitting ? (
                'Creating...'
              ) : mode === 'youtube' && hasFetchedYoutube ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Create Playlist ({selectedCount} Tracks)
                </>
              ) : (
                'Create Playlist'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
