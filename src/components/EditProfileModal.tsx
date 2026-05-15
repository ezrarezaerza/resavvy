import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentUsername: string;
}

export function EditProfileModal({ isOpen, onClose, currentName, currentUsername }: EditProfileModalProps) {
  const { token, user, login } = useAuth();
  const [name, setName] = useState(currentName);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // We could fetch the full profile here to pre-fill bio/avatar if we had context for it.
    // For now we just initialize it empty, user can overwrite.
    setName(currentName);
  }, [currentName]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/auth?action=update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim()
        })
      });
      
      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = await res.json();
      
      // Update local storage so useAuth picks it up (if implemented that way)
      // We will just fetch or mock
      if (user) {
         localStorage.setItem('resavvy_user', JSON.stringify({ ...user, name: updatedUser.name }));
         // if auth context updates manually:
         window.location.reload(); 
      }
      toast.success('Profile updated');
      onClose();
    } catch (err) {
      toast.error('Error updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md rounded-2xl shadow-xl overflow-hidden bg-white text-gray-900 border border-gray-200 dark:bg-[#0f172a] dark:text-white dark:border-white/10 dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          <h2 className="text-2xl font-bold">Edit Profile</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border outline-none transition-shadow bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border outline-none transition-shadow h-24 focus:ring-2 focus:ring-indigo-500 resize-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                placeholder="Tell the world about your music taste..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border outline-none transition-shadow bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                placeholder="https://..."
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

