const fs = require('fs');
const content = fs.readFileSync('api/playlists.ts', 'utf8');

const regex = /const savedPlaylists = savedRecords\.map\(record => \(\{[\s\S]*?\}\)\);\s*return res\.status\(200\)\.json\(\[\.\.\.ownedPlaylists, \.\.\.savedPlaylists\]\);/;

const replacement = `
         const savedPlaylists = savedRecords.map(record => ({
           ...record.playlist,
           isSaved: true
         }));
         const savedIds = new Set(savedPlaylists.map(p => p.id));
         const ownedPlaylistsMapped = ownedPlaylists.map(p => ({
           ...p,
           isSaved: savedIds.has(p.id)
         })).filter(p => !savedIds.has(p.id)); // do not duplicate if owned is also saved
         
         return res.status(200).json([...ownedPlaylistsMapped, ...savedPlaylists]);
`;

fs.writeFileSync('api/playlists.ts', content.replace(regex, replacement.trim()));
