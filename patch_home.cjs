const fs = require('fs');
let content = fs.readFileSync('src/components/HomeDashboard.tsx', 'utf8');

const target = `  useEffect(() => {
    // Fetch global trending unconditionally
    fetch('/api/social?type=trending')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTrending(data); })
      .catch(console.error);

    // Fetch discovery shelves unconditionally
    fetch('/api/social?type=discovery')
      .then(res => res.json())
      .then(data => {
          if (data.trending) setTrendingCurations(data.trending);
          if (data.fresh) setFreshCurations(data.fresh);
          if (data.quickPicks) setQuickPicks(data.quickPicks);
          if (data.globalTags) setGlobalTags(data.globalTags);
      })
      .catch(console.error);

    if (token) {
      fetch('/api/social?type=rotation', { headers: { 'Authorization': \`Bearer \${token}\` } })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setHeavyRotation(data); })
        .catch(console.error);
            
      fetch('/api/social?type=recommended', { headers: { 'Authorization': \`Bearer \${token}\` } })
        .then(res => res.json())
        .then(data => { if (data.songs) setRecommended(data); })
        .catch(console.error);
    }
  }, [token]);`;

const replacement = `  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    // Fetch global trending unconditionally
    fetch('/api/social?type=trending', { signal })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTrending(data); })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });

    // Fetch discovery shelves unconditionally
    fetch('/api/social?type=discovery', { signal })
      .then(res => res.json())
      .then(data => {
          if (data.trending) setTrendingCurations(data.trending);
          if (data.fresh) setFreshCurations(data.fresh);
          if (data.quickPicks) setQuickPicks(data.quickPicks);
          if (data.globalTags) setGlobalTags(data.globalTags);
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });

    if (token) {
      fetch('/api/social?type=rotation', { headers: { 'Authorization': \`Bearer \${token}\` }, signal })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setHeavyRotation(data); })
        .catch(err => { if (err.name !== 'AbortError') console.error(err); });
            
      fetch('/api/social?type=recommended', { headers: { 'Authorization': \`Bearer \${token}\` }, signal })
        .then(res => res.json())
        .then(data => { if (data.songs) setRecommended(data); })
        .catch(err => { if (err.name !== 'AbortError') console.error(err); });
    }

    return () => abortController.abort();
  }, [token]);`;

if (content.includes(target)) {
  fs.writeFileSync('src/components/HomeDashboard.tsx', content.replace(target, replacement), 'utf8');
  console.log('Patched successfully');
} else {
  console.log('Target not found');
}
