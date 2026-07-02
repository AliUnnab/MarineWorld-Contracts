const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const oldRegex1 = `const titleMatch = (section.title || "").match(/Section\\s+(\\d+)/i);`;
const newRegex1 = `const titleMatch = (section.title || "").match(/(?:Section|Clause)\\s*0*(\\d+)/i) || (section.title || "").match(/\\b(\\d+)\\b/);`;

const oldRegex2 = `const titleMatch = (page.title || "").match(/Section\\s+(\\d+)/i);`;
const newRegex2 = `const titleMatch = (page.title || "").match(/(?:Section|Clause)\\s*0*(\\d+)/i) || (page.title || "").match(/\\b(\\d+)\\b/);`;

content = content.replace(oldRegex1, newRegex1);
content = content.replace(oldRegex2, newRegex2);

fs.writeFileSync('./components/ContractStudio.tsx', content);
