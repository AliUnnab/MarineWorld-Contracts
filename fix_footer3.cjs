const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const targetStr = "${showPdfPreviewOverlay ? 'flex' : 'hidden print:flex'}";
if (content.includes(targetStr)) {
    content = content.replace(targetStr, "flex");
    fs.writeFileSync('./components/ContractStudio.tsx', content);
    console.log("Fixed visibility");
} else {
    console.log("Could not find the target string.");
}
