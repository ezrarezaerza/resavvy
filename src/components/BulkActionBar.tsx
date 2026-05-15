import React, { useState } from 'react';
import { X, Plus, FolderPlus } from 'lucide-react';
import { usePlaylist } from '../context/PlaylistContext';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { Song } from '../types';

interface BulkActionBarProps {
  selectedSongs: Song[];
  onClear: () => void;
  onComplete: () => void;
}

  export function BulkActionBar({ selectedSongs, onClear, onComplete }: BulkActionBarProps) {
  const { groups, addSong } = usePlaylist();
  const { token } = useAuth();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExistingModal, setShowExistingModal] = useState(false);
  
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !token) return;
    
    setIsSubmitting(true);
    try {
      const createRes = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newPlaylistName })
      });
      if (!createRes.ok) throw new Error('Failed to create playlist');
      const playlist = await createRes.json();

      // UI Context gets updated when the page reloads or ideally through context here:
      // But creating a playlist isn't easily done locally without knowing its ID sync.
      // So we will just proceed. We need `createGroup` exposed or just wait for refresh.

      const bulkRes = await fetch('/api/songs?action=bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetPlaylistId: playlist.id, songs: selectedSongs })
      });
      if (!bulkRes.ok) throw new Error('Failed to add songs');
      
      toast.success(`Created playlist and added ${selectedSongs.length} songs`);
      // local context updates...
      setShowCreateModal(false);
      setNewPlaylistName('');
      onComplete();
    } catch (error) {
      toast.error('Failed to perform bulk action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaylistId || !token) return;
    
    setIsSubmitting(true);
    try {
      // update local
      selectedSongs.forEach(song => {
        addSong(selectedPlaylistId, {
          id: song.youtubeId || song.id,
          title: song.title,
          artist: song.artist,
          thumbnailUrl: song.thumbnailUrl,
          duration: song.duration
        });
      });

      const bulkRes = await fetch('/api/songs?action=bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetPlaylistId: selectedPlaylistId, songs: selectedSongs })
      });
      if (!bulkRes.ok) throw new Error('Failed to add songs');
      
      // Toast already shown by addSong mostly or let's use the bulk one.
      
      setShowExistingModal(false);
      setSelectedPlaylistId('');
      onComplete();
    } catch (error) {
      toast.error('Failed to add to existing playlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedSongs.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white px-6 py-4 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-6 z-50 transition-transform duration-300 transform translate-y-0">
        <span className="font-bold whitespace-nowrap">{selectedSongs.length} selected</span>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Playlist
          </button>
          
          {groups.length > 0 && (
            <button 
              onClick={() => setShowExistingModal(true)}
              className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-800 dark:text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              Add to Existing
            </button>
          )}
          
          <button 
            onClick={onClear}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-full text-sm font-medium transition-colors ml-2 border border-transparent hover:border-gray-300 dark:hover:border-gray-500"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Playlist">
        <form onSubmit={handleCreateAndAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Playlist Name</label>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-md font-medium disabled:opacity-50">
              {isSubmitting ? 'Creating...' : 'Create & Add'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showExistingModal} onClose={() => setShowExistingModal(false)} title="Add to Existing Playlist">
        <form onSubmit={handleAddToExisting} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Select Playlist</label>
            <select
              value={selectedPlaylistId}
              onChange={(e) => setSelectedPlaylistId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              required
            >
              <option value="" disabled>Select a playlist</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setShowExistingModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-md font-medium disabled:opacity-50">
              {isSubmitting ? 'Adding...' : 'Add Songs'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
