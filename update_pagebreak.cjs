const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const t = `      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' as 'portrait' }`;
const r = `      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' as 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] }`;

content = content.replace(t, r);

fs.writeFileSync('./components/ContractStudio.tsx', content);
