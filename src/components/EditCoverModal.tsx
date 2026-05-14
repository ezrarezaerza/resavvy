import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PlaylistGroup } from '../types';

interface EditCoverModalProps {
  group: PlaylistGroup;
  onSave: (type: 'random' | 'custom', url?: string) => void;
  onClose: () => void;
}

export function EditCoverModal({ group, onSave, onClose }: EditCoverModalProps) {
  const [coverType, setCoverType] = useState<'random' | 'custom'>(group.coverType || 'random');
  const [customUrl, setCustomUrl] = useState(group.customCoverUrl || '');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(coverType, coverType === 'custom' ? customUrl : undefined);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
      <div className="bg-[#0f111a] dark:bg-[#0f111a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden z-[101]">
        <h2 className="text-xl font-bold text-white mb-6">Customize Playlist Cover</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="coverType"
                value="random"
                checked={coverType === 'random'}
                onChange={() => setCoverType('random')}
                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 focus:ring-offset-gray-900 bg-black/20"
              />
              <span className="text-sm font-medium text-gray-300">Random Track Art</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="coverType"
                value="custom"
                checked={coverType === 'custom'}
                onChange={() => setCoverType('custom')}
                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 focus:ring-offset-gray-900 bg-black/20"
              />
              <span className="text-sm font-medium text-gray-300">Custom Image Link</span>
            </label>
          </div>
          
          {coverType === 'custom' && (
            <div className="mt-2 text-left">
              <label htmlFor="customUrl" className="block text-sm font-medium text-gray-300 mb-1">
                Image URL
              </label>
              <input
                id="customUrl"
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required={coverType === 'custom'}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 relative z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
