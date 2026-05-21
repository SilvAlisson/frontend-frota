const fs = require('fs');
const path = require('path');

const brokenWords = new Set();
const regex = /[\w-]*\uFFFD[\w-]*/g;

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      let m;
      while ((m = regex.exec(content)) !== null) {
        brokenWords.add(m[0]);
      }
    }
  }
}
walk('src');
console.log(Array.from(brokenWords).join(', '));
