import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AlertTriangle, Music, Loader2 } from 'lucide-react';
import { OptimizedImage } from "./OptimizedImage";

interface DuplicateGroup {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  artist: string;
  count: number;
}

interface DedupeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function DedupeModal({ isOpen, onClose, onRefresh }: DedupeModalProps) {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDuplicates();
      setShowConfirm(false);
    }
  }, [isOpen]);

  const fetchDuplicates = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/songs?action=dedupe', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDuplicates(data);
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to fetch duplicates', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMergeAll = async () => {
    if (!token) return;
    setIsMerging(true);
    try {
      const res = await fetch('/api/songs?action=dedupe-merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ groupingList: duplicates })
      });
      
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Duplicates merged successfully', 'success');
        onRefresh();
        onClose();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error(e);
      addToast(e.message || 'Failed to merge duplicates', 'error');
    } finally {
      setIsMerging(false);
      setShowConfirm(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Library Deduplicator">
      <div className="space-y-6">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Scans your library to find identical tracks saved across multiple playlists. 
          Merging will consolidate them into a single record per track while retaining the combined play count.
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            <p>Scanning library for duplicates...</p>
          </div>
        ) : duplicates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Music className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">Your library is clean!</p>
            <p className="text-sm">No duplicates found.</p>
          </div>
        ) : (
          <>
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-lg p-4 flex gap-3 text-orange-800 dark:text-orange-200 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong>Found {duplicates.length} duplicated tracks</strong>
                <p className="opacity-90 mt-1">Merging them will organize your collection and remove redundant copies from other playlists.</p>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto pr-2 space-y-2 no-scrollbar">
              {duplicates.map(dup => (
                <div key={dup.youtubeId} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                  <OptimizedImage src={dup.thumbnailUrl} alt={dup.title} className="w-10 h-10 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{dup.title}</div>
                    <div className="text-xs text-gray-500 truncate">{dup.artist || 'Unknown'}</div>
                  </div>
                  <div className="shrink-0 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2 py-1 rounded">
                    {dup.count} copies
                  </div>
                </div>
              ))}
            </div>

            {showConfirm ? (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4 pt-4 mt-4">
                <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-3">Are you sure? This action is irreversible.</p>
                <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
                    disabled={isMerging}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleMergeAll}
                    disabled={isMerging}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {isMerging ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isMerging ? 'Merging...' : 'Yes, Merge All'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end pt-4 mt-4">
                <button 
                  onClick={() => setShowConfirm(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-md text-sm font-semibold transition-colors"
                >
                  Merge All Duplicates
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
