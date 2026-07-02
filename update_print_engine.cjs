const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const newSplitFunction = `
  const splitContentIntoPages = (content: string, maxCharsPerPage: number = 2200): string[] => {
    if (!content) return [""];
    
    // Smart Pagination: we return the whole content for the section.
    // The actual splitting is handled by CSS \`break-inside: avoid\` and \`page-break-after\`
    // during print, and by a continuous layout in the preview.
    // BUT to satisfy the "container-based numbering system" in the UI:
    return [content]; // We will render sections dynamically.
  };
`;

content = content.replace(
  /const splitContentIntoPages = \([\s\S]*?return pages;\n  \};/m,
  newSplitFunction
);

// We need to modify pdfStructure to group ALL sections into one "Document Body" page, or keep them as separate pages.
// If we keep them as separate pages, each section starts on a new page.
// Let's modify the coreSections loop to just push one item per section.

content = content.replace(
  /const contentPages = splitContentIntoPages\(linkedClause\.content, 2200\);\n\s*contentPages\.forEach\(\(pageContent, pageIndex\) => {\n\s*activeSectionsList\.push\(\{[\s\S]*?\}\);\n\s*}\);/g,
  `activeSectionsList.push({
    ...sec,
    content: linkedClause.content,
    isSplit: false
  });`
);

content = content.replace(
  /const contentPages = splitContentIntoPages\(cl\.content, 2200\);\n\s*contentPages\.forEach\(\(pageContent, pageIndex\) => {\n\s*customSectionsList\.push\(\{[\s\S]*?\}\);\n\s*}\);/g,
  `customSectionsList.push({
    title: cl.title || "Custom Section",
    id: cl.id,
    baseSectionId: cl.id,
    content: cl.content,
    isSplit: false,
    type: "section",
    clauseId: cl.id,
    titleDisplay: cl.title || "Custom Section"
  });`
);

// Replace handleDownload to use window.print()
const handleDownloadCode = `
  const handleDownload = async () => {
    // Rely on the browser's native print engine which perfectly respects our CSS page-break-inside: avoid
    // and break-after: page rules. This produces true enterprise-grade PDFs.
    window.print();
  };
`;

content = content.replace(
  /const handleDownload = async \(\) => {[\s\S]*?setIsGeneratingPDF\(false\);\n\s*setPdfProgress\(0\);\n\s*}\n\s*};/m,
  handleDownloadCode
);


fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated pagination engine to use continuous sections and window.print");
