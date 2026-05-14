export interface Song {
  id: string; // YouTube Video ID
  title: string;
  artist?: string;
  thumbnailUrl: string;
  duration?: string;
  addedAt: number;
  playCount?: number;
}

export interface PlaylistGroup {
  id: string;
  name: string;
  createdAt: number;
  songs: Song[];
  coverType?: 'random' | 'custom';
  customCoverUrl?: string;
}
