const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const importLines = `import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
`;

content = content.replace(
  /import React, \{ useState, useEffect, useMemo, useRef \} from 'react';/,
  `import React, { useState, useEffect, useMemo, useRef } from 'react';\n` + importLines
);

const newDownloadMethods = `
  const handleDownload = async () => {
    const element = document.getElementById('contract-pages-container');
    if (!element) return;

    // To ensure high quality, we clone the node or temporarily remove the scale transform
    // Actually html2pdf handles it if we pass the right options
    
    // We only want to capture the actual pages, let's wrap them in a container if needed,
    // but the container itself is fine.
    
    // Set a class to indicate printing mode for any CSS tweaks
    element.classList.add('pdf-generating');
    
    const opt = {
      margin:       0,
      filename:     \`Contract_\${activeContractId || 'Draft'}.pdf\`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      element.classList.remove('pdf-generating');
    }
  };

  const handleExportDocx = async () => {
    // Basic DOCX generation from pdfStructure
    try {
      const docChildren = [];
      
      pdfStructure.forEach(page => {
        if (page.type === 'title') {
           docChildren.push(new Paragraph({ text: "AGREEMENT", heading: HeadingLevel.HEADING_1 }));
           docChildren.push(new Paragraph({ text: "\\n" }));
        } else if (page.type === 'document_body' || page.type === 'section') {
           if (page.sections) {
             page.sections.forEach(sec => {
               docChildren.push(new Paragraph({ text: sec.title || "", heading: HeadingLevel.HEADING_2 }));
               if (sec.content) {
                 const lines = sec.content.split('\\n');
                 lines.forEach(line => {
                    if (line.trim()) {
                      docChildren.push(new Paragraph({ children: [new TextRun(line.replace(/#/g, '').trim())] }));
                    }
                 });
               }
               docChildren.push(new Paragraph({ text: "\\n" }));
             });
           } else {
             docChildren.push(new Paragraph({ text: page.title || "", heading: HeadingLevel.HEADING_2 }));
             if (page.content) {
               const lines = page.content.split('\\n');
               lines.forEach(line => {
                  if (line.trim()) {
                    docChildren.push(new Paragraph({ children: [new TextRun(line.replace(/#/g, '').trim())] }));
                  }
               });
             }
             docChildren.push(new Paragraph({ text: "\\n" }));
           }
        }
      });
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren
        }]
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, \`Contract_\${activeContractId || 'Draft'}.docx\`);
    } catch (err) {
      console.error("DOCX generation failed", err);
    }
  };
`;

content = content.replace(
  /const handleDownload = async \(\) => \{\s*\/\/ Rely on the browser's native print engine[\s\S]*?window\.print\(\);\s*\};/g,
  newDownloadMethods
);

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated download methods");
