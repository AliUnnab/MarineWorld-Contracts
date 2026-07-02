const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const target = `{page.type === 'verification' && (
                      <div className="flex-1 flex flex-col justify-center">`;

const replacement = `{pageIdx === pdfStructure.length - 1 && (
                      <div className={\`mt-12 pt-8 flex flex-col justify-end page-break-inside-avoid \${showPdfPreviewOverlay ? 'flex' : 'hidden print:flex'}\`}>`;

content = content.replace(target, replacement);

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated verification block to append to last page");
