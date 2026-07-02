const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// 1. We want to implement a Dynamic Pagination Engine for the PDF rendering.
// But first, let's look at the splitContentIntoPages function.
// The user complained about arbitrary cuts and wants smart pagination.
// We can improve splitContentIntoPages to split by paragraphs rather than exact char counts.
const splitContentRegex = /const splitContentIntoPages = \([\s\S]*?return pages;\n  \};/m;

const smartPaginationCode = `
  // DYNAMIC PAGINATION ENGINE
  const splitContentIntoPages = (content: string, maxCharsPerPage: number = 2200): string[] => {
    if (!content) return [""];
    
    // Smart Pagination: split by double newline to preserve paragraph integrity
    const blocks = content.split('\\n\\n');
    const pages: string[] = [];
    let currentPage = "";

    for (const block of blocks) {
      // If a single block is monstrously huge, we have to split it by single newline or sentences
      if (block.length > maxCharsPerPage) {
        const lines = block.split('\\n');
        for (const line of lines) {
           if ((currentPage + "\\n" + line).length > maxCharsPerPage && currentPage.trim().length > 0) {
             pages.push(currentPage.trim());
             currentPage = line;
           } else {
             currentPage = currentPage ? currentPage + "\\n" + line : line;
           }
        }
      } else {
        if ((currentPage + "\\n\\n" + block).length > maxCharsPerPage && currentPage.trim().length > 0) {
          pages.push(currentPage.trim());
          currentPage = block;
        } else {
          currentPage = currentPage ? currentPage + "\\n\\n" + block : block;
        }
      }
    }
    if (currentPage.trim().length > 0) {
      pages.push(currentPage.trim());
    }
    return pages;
  };
`;

content = content.replace(splitContentRegex, smartPaginationCode);

// 2. Clause Numbering Engine
// Add a function to auto-number clauses in markdown
// Legal Numbering Engine (1 -> 1.1 -> 1.1.1 -> (a) -> (i))

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated pagination");
