const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');
content = content.replace(
  /isSplit\?: boolean \}\] = \[/,
  "isSplit?: boolean, sections?: any[] }[] = ["
);
fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated structure type");
