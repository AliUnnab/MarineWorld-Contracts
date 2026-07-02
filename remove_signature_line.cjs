const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

content = content.replace(/className="mt-auto border-t border-slate-200 pt-2"/g, 'className="mt-auto pt-1"');

fs.writeFileSync('./components/ContractStudio.tsx', content);
