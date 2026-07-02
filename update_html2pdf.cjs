const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const t1 = `    const opt = {
      margin:       0,
      filename:     \\\`Contract_\\\${activeContractId || 'Draft'}.pdf\\\`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };`;

const r1 = `    const opt = {
      margin:       0,
      filename:     \`Contract_\${activeContractId || 'Draft'}.pdf\`,
      image:        { type: 'jpeg', quality: 1.0 },
      html2canvas:  { scale: 2, useCORS: true, logging: false, windowWidth: 1200 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] }
    };`;

content = content.replace(t1, r1);

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated html2pdf options");
