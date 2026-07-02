const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const newLogic = `
    const estimateSectionHeight = (sec) => {
      let percent = 8; // Base height for title, margins, borders
      const text = sec.content || "";
      percent += text.length / 40; // Approx 4000 chars per full page
      const newlines = (text.match(/\\n/g) || []).length;
      percent += newlines * 1.5; // Paragraph breaks add vertical height
      
      // Add extra height for custom injected blocks
      if (sec.id === "Commercial Foundation") {
        percent += 15;
      } else if (sec.id === "Parties") {
        percent += 20;
      }
      
      return percent;
    };
`;

content = content.replace(
  /const estimateSectionHeight = \([\s\S]*?return percent;\n    \};/g,
  newLogic
);

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated height estimator");
