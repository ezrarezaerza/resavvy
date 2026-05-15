import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { PlaylistGroup } from '../types';

interface EditPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: PlaylistGroup;
  onSave: (details: Partial<Pick<PlaylistGroup, 'name' | 'description' | 'tags' | 'visibility'>>) => void;
}

export function EditPlaylistModal({ isOpen, onClose, playlist, onSave }: EditPlaylistModalProps) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || '');
  const [tagsStr, setTagsStr] = useState(playlist.tags?.join(', ') || '');
  const [visibility, setVisibility] = useState<'private' | 'public' | 'unlisted'>(playlist.visibility || 'private');

  useEffect(() => {
    if (isOpen) {
      setName(playlist.name);
      setDescription(playlist.description || '');
      setTagsStr(playlist.tags?.join(', ') || '');
      setVisibility(playlist.visibility || 'private');
    }
  }, [isOpen, playlist]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    onSave({
      name: name.trim(),
      description: description.trim(),
      tags,
      visibility,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Playlist Details">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 shadow-sm transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 shadow-sm h-24 resize-none transition-all"
            placeholder="What's this playlist about?"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 shadow-sm transition-all"
            placeholder="workout, chill, focus"
          />
        </div>

        <div>
           <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Visibility</label>
           <select
             value={visibility}
             onChange={(e) => setVisibility(e.target.value as any)}
             className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 shadow-sm transition-all"
           >
             <option value="private">Private</option>
             <option value="unlisted">Unlisted</option>
             <option value="public">Public</option>
           </select>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-all font-medium shadow-md hover:shadow-lg active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
