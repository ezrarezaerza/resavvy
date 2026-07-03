const fs = require('fs');
const content = fs.readFileSync('api/social.ts', 'utf8');
const recommendedBlock = `
  if (type === 'recommended') {
     const user = getUser(req);
     if (!user) return res.status(401).json({ error: 'Unauthorized' });
     try {
       // Find user's top artists
       const topSongs = await prisma.song.findMany({
         where: { playlist: { userId: user.id } },
         orderBy: { playCount: 'desc' },
         take: 20
       });
       const artists = [...new Set(topSongs.filter(s => s.artist).map(s => s.artist))].slice(0, 5);
       
       if (artists.length === 0) {
           return res.status(200).json([]);
       }
       
       const recommended = await prisma.song.findMany({
         where: { 
           playlist: { visibility: 'public' },
           artist: { in: artists },
           NOT: { playlist: { userId: user.id } }
         },
         include: { playlist: { select: { id: true, name: true, userId: true } } },
         take: 15,
         orderBy: { playCount: 'desc' }
       });
       
       // Deduplicate by youtubeId
       const uniqueRecs = [];
       const seen = new Set();
       for (const song of recommended) {
           if (!seen.has(song.youtubeId)) {
               seen.add(song.youtubeId);
               uniqueRecs.push(song);
           }
       }
       
       return res.status(200).json({ songs: uniqueRecs, basedOn: artists });
     } catch (err) {
       console.error(err);
       return res.status(500).json({ error: 'Failed recommended' });
     }
  }
`;
const insertionPoint = content.indexOf(`if (type === 'stats') {`);
const newContent = content.slice(0, insertionPoint) + recommendedBlock + '\n  ' + content.slice(insertionPoint);
fs.writeFileSync('api/social.ts', newContent);
