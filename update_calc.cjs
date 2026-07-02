const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const target = `    const estimateSectionHeight = (sec) => {
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
    });`;

const replacement = `    const estimateSectionHeight = (sec) => {
      let percent = 8; // Base height for title, margins, borders
      const text = sec.content || "";
      
      // Calculate table heights if present
      const tables = (text.match(/\\|[\\s\\S]*?\\|/g) || []).length;
      percent += tables * 5;
      
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


    allSections.forEach((sec) => {
      const secHeight = estimateSectionHeight(sec);
      
      // Calculate: Remaining Page Height, Next Section Height
      const remainingSpace = MAX_PAGE_CAPACITY - currentHeightEstimate;
      
      // If the next section fits completely, continue rendering on the same page.
      if (secHeight <= remainingSpace) {
        currentSectionsGroup.push(sec);
        currentHeightEstimate += secHeight;
      } 
      else if (secHeight > MAX_PAGE_CAPACITY) {
        // Section is too big for a single page, we need to split it or just put it on its own page
        if (currentSectionsGroup.length > 0) {
          structure.push({ 
            title: "Document Body", 
            id: \`DocBody_\${structure.length}\`, 
            type: "document_body", 
            sections: currentSectionsGroup 
          });
        }
        structure.push({ 
          title: "Document Body", 
          id: \`DocBody_\${structure.length}\`, 
          type: "document_body", 
          sections: [{...sec, isSplit: true}] 
        });
        currentSectionsGroup = [];
        currentHeightEstimate = 0;
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
    });`;

content = content.replace(target, replacement);

fs.writeFileSync('./components/ContractStudio.tsx', content);
