const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

content = content.replace(
  /<div className="flex flex-col h-full w-full bg-system-bg text-system-text-primary font-manrope overflow-hidden">/g,
  '<div className="contract-studio-wrapper flex flex-col h-full w-full bg-system-bg text-system-text-primary font-manrope overflow-hidden print:overflow-visible print:h-auto">'
);

content = content.replace(
  /<main className="flex-1 flex pt-16 h-full relative overflow-hidden">/g,
  '<main className="flex-1 flex pt-16 h-full relative overflow-hidden print:block print:overflow-visible print:pt-0 print:h-auto">'
);

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated ContractStudio main wrappers");
