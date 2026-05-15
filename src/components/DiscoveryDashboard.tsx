import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlaylistGroup } from '../types';
import { TagBar } from './TagBar';
import { DiscoveryShelf } from './DiscoveryShelf';
import { PlaylistCard } from './PlaylistCard';
import { Compass } from 'lucide-react';

export function DiscoveryDashboard({ onSelectGroup }: { onSelectGroup: (id: string) => void }) {
  const { token } = useAuth();
  const [trending, setTrending] = useState<PlaylistGroup[]>([]);
  const [fresh, setFresh] = useState<PlaylistGroup[]>([]);
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [taggedPlaylists, setTaggedPlaylists] = useState<PlaylistGroup[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDiscoveryData();
  }, [token, selectedTag]);

  const fetchDiscoveryData = async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/social', window.location.origin);
      url.searchParams.append('type', 'discovery');
      if (selectedTag) url.searchParams.append('tag', selectedTag);
      
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url.toString(), { headers });
      if (res.ok) {
        const data = await res.json();
        if (selectedTag) {
          setTaggedPlaylists(data.playlists || []);
        } else {
          setTrending(data.trending || []);
          setFresh(data.fresh || []);
          setGlobalTags(data.globalTags || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0a0a0a] min-h-screen pb-32 no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
        <div className="flex items-center gap-4 mb-4">
          <Compass className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none mb-2">
              Discovery
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
              Explore public curations from the community
            </p>
          </div>
        </div>

        <TagBar 
          tags={globalTags} 
          selectedTag={selectedTag} 
          onSelectTag={(tag) => setSelectedTag(tag)} 
        />

        {isLoading ? (
          <div className="flex justify-center py-20 text-gray-500">
             Loading...
          </div>
        ) : selectedTag ? (
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              #{selectedTag}
            </h3>
            {taggedPlaylists.length === 0 ? (
              <p className="text-gray-500">No playlists found for this tag.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {taggedPlaylists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onClick={() => onSelectGroup(playlist.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <DiscoveryShelf
              title="Trending Curations"
              playlists={trending}
              onSelectPlaylist={onSelectGroup}
            />
            <DiscoveryShelf
              title="Fresh Finds"
              playlists={fresh}
              onSelectPlaylist={onSelectGroup}
            />
          </>
        )}
      </div>
    </div>
  );
}
