const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// 1. Remove border-t border-black from signature wrappers
content = content.replace(/className="border-t border-black pt-4 relative flex flex-col justify-end min-h-\[90px\]"/g, 'className="pt-4 relative flex flex-col justify-end min-h-[90px]"');

// 2. Remove SVGs (signature lines)
// Use a regex to match the SVGs inside the signature blocks
content = content.replace(/\{\/\* Simulated Organic Signature Stroke \*\/\}\s*<svg[\s\S]*?<\/svg>\s*/g, '');

fs.writeFileSync('./components/ContractStudio.tsx', content);
