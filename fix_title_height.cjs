const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// Reduce seal size on title page
content = content.replace(/size="w-24 h-24"/g, 'size="w-16 h-16"');

// Ensure the border-b on the title is not causing issues
// Actually let's just make the title page less tall by reducing some margins further
content = content.replace(/className="text-center my-2 py-3 border-y border-slate-200"/g, 'className="text-center my-1 py-2 border-y border-slate-200"');
content = content.replace(/className="my-2">\n                          <h3 className="text-\[9px\]/g, 'className="my-1">\n                          <h3 className="text-[9px]');

fs.writeFileSync('./components/ContractStudio.tsx', content);
