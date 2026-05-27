export function parseYouTubeTitle(rawTitle: string): { title: string; artist: string } {
  if (!rawTitle) return { title: '', artist: 'Unknown Artist' };
  // Use Regex to strip out common YouTube music video suffixes
  let cleanTitle = rawTitle.replace(/\[\s*(Official Video|Official Music Video|MV|Lyrics|Audio|Official Audio|Visualizer)\s*\]/gi, '').trim();
  cleanTitle = cleanTitle.replace(/\(\s*(Official Video|Official Music Video|MV|Lyrics|Audio|Official Audio|Visualizer)\s*\)/gi, '').trim();
  
  // Strip out text like " - Official Video" or similar
  cleanTitle = cleanTitle.replace(/[\-\|]\s*(Official Video|Official Music Video|MV|Lyrics|Audio|Official Audio)\s*$/gi, '').trim();

  // Try to split by " - " or "-"
  const delimiter = cleanTitle.includes(' - ') ? ' - ' : cleanTitle.includes('-') ? '-' : null;
  
  if (delimiter) {
    const parts = cleanTitle.split(delimiter);
    if (parts.length >= 2) {
      return {
        artist: parts[0].trim(),
        title: parts.slice(1).join(delimiter).trim(),
      };
    }
  }
  
  return {
    title: cleanTitle,
    artist: "Unknown Artist",
  };
}
