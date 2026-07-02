const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// Update the container class to have a white background during pdf generation
const containerTarget = `id="contract-pages-container" className="flex-1 overflow-auto print:overflow-visible print:pt-0 print:pb-0 print:px-0 pt-20 pb-20 px-8 flex flex-col items-center bg-[#0b0f19] print:bg-white min-w-0 font-sans"`;
const containerReplacement = `id="contract-pages-container" className="flex-1 overflow-auto print:overflow-visible print:pt-0 print:pb-0 print:px-0 pt-20 pb-20 px-8 flex flex-col items-center bg-[#0b0f19] print:bg-white pdf-generating:bg-white min-w-0 font-sans"`;
content = content.replace(containerTarget, containerReplacement);

// Update page class: use exactly 793.7px x 1122.5px which is A4 at 96 DPI, or just let jsPDF do the pagination based on page-break-after
const pageTarget = `className="contract-page-sheet w-[794px] h-[1123px] overflow-hidden bg-white relative p-6 lg:p-8 flex flex-col shrink-0 mt-8 rounded-sm first:mt-0 break-after-page page-break-after-always"`;
// Make it exactly 1122px (which is the closest integer to 1122.5) to avoid overflow, and only apply page-break on non-last children
const pageReplacement = `className="contract-page-sheet w-[794px] h-[1122px] overflow-hidden bg-white relative p-6 lg:p-8 flex flex-col shrink-0 mt-8 rounded-sm first:mt-0 [&:not(:last-child)]:break-after-page [&:not(:last-child)]:page-break-after-always"`;
content = content.replace(pageTarget, pageReplacement);

fs.writeFileSync('./components/ContractStudio.tsx', content);
