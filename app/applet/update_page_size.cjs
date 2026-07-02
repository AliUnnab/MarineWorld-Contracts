const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const target = `className="contract-page-sheet w-[800px] min-h-[1131px] bg-white relative p-6 lg:p-8 flex flex-col shrink-0 mt-8 rounded-sm first:mt-0 break-after-page page-break-after-always"`;
const replacement = `className="contract-page-sheet w-[794px] h-[1123px] overflow-hidden bg-white relative p-6 lg:p-8 flex flex-col shrink-0 mt-8 rounded-sm first:mt-0 break-after-page page-break-after-always"`;

content = content.replace(target, replacement);
fs.writeFileSync('./components/ContractStudio.tsx', content);
