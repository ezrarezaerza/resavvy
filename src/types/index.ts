export interface Song {
  id: string; // YouTube Video ID
  youtubeId?: string;
  title: string;
  artist?: string;
  thumbnailUrl: string;
  duration?: string;
  addedAt: number;
  playCount?: number;
  playlistCount?: number;
  globalRank?: number;
  isLiked?: boolean;
}

export interface PlaylistGroup {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  visibility?: 'private' | 'public' | 'unlisted';
  createdAt: number;
  songs: Song[];
  coverType?: 'random' | 'custom';
  customCoverUrl?: string;
  likesCount?: number;
  forksCount?: number;
  user?: {
    name: string;
    username: string;
  };
  isSaved?: boolean;
}
