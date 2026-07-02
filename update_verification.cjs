const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

content = content.replace(
  /structure\.push\(\{ title: "Official Immutable Contract Record", id: "VerificationRecord", type: "verification" \}\);/g,
  "// verification page removed here"
);

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Removed static verification page");
