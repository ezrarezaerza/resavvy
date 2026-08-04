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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm h-24 resize-none"
            placeholder="What's this playlist about?"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            placeholder="workout, chill, focus"
          />
        </div>

        <div>
           <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
           <select
             value={visibility}
             onChange={(e) => setVisibility(e.target.value as any)}
             className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm cursor-pointer"
           >
             <option value="private">Private</option>
             <option value="unlisted">Unlisted</option>
             <option value="public">Public</option>
           </select>
        </div>

        <div className="pt-2 flex justify-end gap-3 border-t border-gray-100 dark:border-white/5 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
