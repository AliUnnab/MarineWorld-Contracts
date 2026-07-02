const fs = require('fs');
let content = fs.readFileSync('./utils/LegalMarkdownEngine.tsx', 'utf8');

content = content.replace(
  `      } else if (secondNum !== undefined) {
         spaces = "&nbsp;&nbsp;&nbsp;&nbsp;";
      }`,
  `      } else if (secondNum !== undefined) {
         // no auto-indent for X.X unless the user explicitly indented it
         spaces = "";
      }`
);

fs.writeFileSync('./utils/LegalMarkdownEngine.tsx', content);
