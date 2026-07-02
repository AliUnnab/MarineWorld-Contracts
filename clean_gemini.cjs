const fs = require('fs');

let content = fs.readFileSync('./services/gemini.ts', 'utf8');

// remove escaping from template literals
content = content.replace(/\\\$/g, '$');
content = content.replace(/\\`/g, '`');

fs.writeFileSync('./services/gemini.ts', content);
