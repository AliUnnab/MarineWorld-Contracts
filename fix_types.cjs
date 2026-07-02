const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

content = content.replace(
  "jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }",
  "jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' as 'portrait' }"
);

fs.writeFileSync('./components/ContractStudio.tsx', content);
