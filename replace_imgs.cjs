const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<img ')) {
    content = content.replace(/<img /g, '<OptimizedImage ');
    if (!content.includes('import { OptimizedImage } from')) {
      // Find the last import
      const importMatches = [...content.matchAll(/^import .*/gm)];
      if (importMatches.length > 0) {
        const lastMatch = importMatches[importMatches.length - 1];
        const index = lastMatch.index + lastMatch[0].length;
        content = content.slice(0, index) + '\nimport { OptimizedImage } from "./OptimizedImage";' + content.slice(index);
      } else {
        content = 'import { OptimizedImage } from "./OptimizedImage";\n' + content;
      }
    }
    fs.writeFileSync(file, content, 'utf8');
  }
});
