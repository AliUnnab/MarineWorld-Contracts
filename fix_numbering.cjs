const fs = require('fs');

let contractCode = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

contractCode = contractCode.replace(/title: "Document Body"/g, 'title: currentSectionsGroup[0]?.title || "Agreement Terms"');

fs.writeFileSync('./components/ContractStudio.tsx', contractCode);


let mdCode = fs.readFileSync('./utils/LegalMarkdownEngine.tsx', 'utf8');

const listReplacementOld = `      if (listLevel2Counter > 0) {
         processedLines.push(\`\\n&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(\${getRoman(listLevel2Counter)}) \${content}\`);
      } else {
         processedLines.push(\`\\n&nbsp;&nbsp;&nbsp;&nbsp;(\${getLetter(listLevel1Counter)}) \${content}\`);
      }`;
      
const listReplacementNew = `      const baseNum = h1Counter === 0 ? startNumber : h1Counter;
      if (listLevel2Counter > 0) {
         processedLines.push(\`\\n&nbsp;&nbsp;&nbsp;&nbsp;**\${baseNum}.\${listLevel1Counter}.\${listLevel2Counter}.** \${content}\`);
      } else {
         processedLines.push(\`\\n**\${baseNum}.\${listLevel1Counter}.** \${content}\`);
      }`;

mdCode = mdCode.replace(listReplacementOld, listReplacementNew);

fs.writeFileSync('./utils/LegalMarkdownEngine.tsx', mdCode);
