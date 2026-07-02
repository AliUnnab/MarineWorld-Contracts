const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

content = content.replace(/{activeContractId \|\| "PENDING-GENERATION"}/g, '{activeContractId || "uF7iCaQ3Gaosw1jxzLKr"}');
content = content.replace(/activeContractId \|\| "placeholder"/g, 'activeContractId || "uF7iCaQ3Gaosw1jxzLKr"');

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Success");
