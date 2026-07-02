const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const newLogic = `
    const totalContentSections = activeSectionsList.length + customSectionsList.length;

    if (totalContentSections > 0) {
      structure.push({ title: "Table of Contents", id: "TOC", type: "toc" });
    }

    // --- INTELLIGENT PAGINATION ENGINE ---
    const allSections = [...activeSectionsList, ...customSectionsList];
    let currentSectionsGroup = [];
    let currentHeightEstimate = 0;
    const MAX_PAGE_CAPACITY = 100; // 100% capacity

    const estimateSectionHeight = (sec) => {
      let percent = 8; // Base height for title, margins, borders
      const text = sec.content || "";
      percent += text.length / 42; // Approx 4200 chars per full page
      const newlines = (text.match(/\\n/g) || []).length;
      percent += newlines * 1.5; // Paragraph breaks add vertical height
      return percent;
    };

    allSections.forEach((sec) => {
      const secHeight = estimateSectionHeight(sec);
      
      // Calculate: Remaining Page Height, Next Section Height
      const remainingSpace = MAX_PAGE_CAPACITY - currentHeightEstimate;
      
      // If the next section fits completely, continue rendering on the same page.
      if (secHeight <= remainingSpace) {
        currentSectionsGroup.push(sec);
        currentHeightEstimate += secHeight;
      } 
      // If it does not fit, move the entire section to the next page.
      else {
        // Only push if we have something in the current group
        if (currentSectionsGroup.length > 0) {
          structure.push({ 
            title: "Document Body", 
            id: \`DocBody_\${structure.length}\`, 
            type: "document_body", 
            sections: currentSectionsGroup 
          });
        }
        currentSectionsGroup = [sec];
        currentHeightEstimate = secHeight;
      }
    });

    if (currentSectionsGroup.length > 0) {
      structure.push({ 
        title: "Document Body", 
        id: \`DocBody_\${structure.length}\`, 
        type: "document_body", 
        sections: currentSectionsGroup 
      });
    }
    // --- END INTELLIGENT PAGINATION ENGINE ---
`;

content = content.replace(
  /const totalContentSections = activeSectionsList\.length \+ customSectionsList\.length;[\s\S]*?\/\/ Now push all sections\s*structure\.push\(\.\.\.activeSectionsList\);\s*structure\.push\(\.\.\.customSectionsList\);/g,
  newLogic
);

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated pagination engine");
