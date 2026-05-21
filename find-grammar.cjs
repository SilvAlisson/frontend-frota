const fs = require('fs');
const path = require('path');

const targetWords = [
  'kilometragem', 'kilometros', 'kilo', 'veiculo', 'usuario', 'relatorio', 'manutençao', 'manutencao', 'endereco', 'historico', 'acoes', 'exluir'
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();
        const hasWord = targetWords.some(w => {
            const index = lower.indexOf(w);
            if (index === -1) return false;
            // check word boundaries roughly
            const before = lower[index - 1];
            const after = lower[index + w.length];
            const isWord = (!before || /[^a-z]/.test(before)) && (!after || /[^a-z]/.test(after));
            return isWord;
        });
        
        if (hasWord) {
          if (!line.includes('const ') && !line.includes('let ') && !line.includes('type ') && !line.includes('interface ')) {
             console.log(fullPath + ':' + (i + 1) + ' -> ' + line.trim());
          }
        }
      }
    }
  }
}

walk('src');
