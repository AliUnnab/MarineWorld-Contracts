const fs = require('fs');

let content = fs.readFileSync('./utils/LegalMarkdownEngine.tsx', 'utf8');

const processLegalTextRegex = /export const processLegalText = \([\s\S]*?\n\};\n/m;

const newProcessLegalText = `export const processLegalText = (text: string, startNumber: number = 1): string => {
  if (!text) return "";

  const lines = text.split('\\n');
  const processedLines: string[] = [];

  let inCodeBlock = false;
  let rootOffset: number | null = null;
  let h1Counter = startNumber - 1;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('\`\`\`')) {
      inCodeBlock = !inCodeBlock;
      processedLines.push(line);
      continue;
    }

    if (inCodeBlock || trimmedLine.startsWith('|')) {
      processedLines.push(line);
      continue;
    }

    if (!trimmedLine) {
      processedLines.push('');
      continue;
    }

    // Match manually numbered lines (e.g. "1.1.", "2.1.3.", "1.", "  1.1.1.")
    const numberMatch = line.match(/^(\\s*)([0-9]+)\\.([0-9]+)?(?:\\.([0-9]+))?\\.?\\s+(.*)/);
    
    // Also match list markers like "-", "*"
    const listMatch = line.match(/^(\\s*)([-*])\\s+(.*)/);

    // Headings
    const h1Match = line.match(/^#\\s+(.*)/);
    const h2Match = line.match(/^##\\s+(.*)/);
    const h3Match = line.match(/^###\\s+(.*)/);

    if (h1Match) {
      h1Counter++;
      processedLines.push(\`\\n**\${h1Counter}. \${h1Match[1]}**\\n\`);
      continue;
    } else if (h2Match) {
      const baseNum = h1Counter < startNumber ? startNumber : h1Counter;
      processedLines.push(\`\\n**\${baseNum}.X \${h2Match[1]}**\\n\`);
      continue;
    } else if (h3Match) {
      const baseNum = h1Counter < startNumber ? startNumber : h1Counter;
      processedLines.push(\`\\n**\${baseNum}.X.X \${h3Match[1]}**\\n\`);
      continue;
    }

    if (numberMatch) {
      const indentStr = numberMatch[1];
      const firstNum = parseInt(numberMatch[2], 10);
      const secondNum = numberMatch[3];
      const thirdNum = numberMatch[4];
      const content = numberMatch[5];
      
      if (rootOffset === null) {
         rootOffset = startNumber - firstNum;
      }
      
      const newFirstNum = firstNum + rootOffset;
      
      let newNumStr = \`\${newFirstNum}.\`;
      if (secondNum !== undefined) newNumStr += \`\${secondNum}.\`;
      if (thirdNum !== undefined) newNumStr += \`\${thirdNum}.\`;

      let spaces = "";
      if (indentStr.length > 0) {
         spaces = "&nbsp;&nbsp;&nbsp;&nbsp;";
         if (indentStr.length > 3) {
            spaces += "&nbsp;&nbsp;&nbsp;&nbsp;";
         }
      } else if (thirdNum !== undefined) {
         // Auto indent level 3 if it has 3 numbers even if user didn't space it
         spaces = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
      } else if (secondNum !== undefined) {
         spaces = "&nbsp;&nbsp;&nbsp;&nbsp;";
      }
      
      let formattedContent = content;
      const colonMatch = content.match(/^([^:]+):(.*)/);
      if (colonMatch && !content.includes('**')) {
        const prefix = colonMatch[1];
        if (prefix.length < 80) {
           formattedContent = \`**\${prefix}:**\${colonMatch[2]}\`;
        }
      }

      processedLines.push(\`\\n\${spaces}**\${newNumStr}** \${formattedContent}\\n\`);
      continue;
    }

    if (listMatch) {
      const indentStr = listMatch[1];
      const content = listMatch[3];
      
      let spaces = "";
      if (indentStr.length > 0) {
         spaces = "&nbsp;&nbsp;&nbsp;&nbsp;";
      }
      
      processedLines.push(\`\\n\${spaces}• \${content}\\n\`);
      continue;
    }

    processedLines.push(line);
  }

  let result = processedLines.join('\\n');
  result = result.replace(/(Section|Clause|Article)\\s+(\\d+\\.?\\d*\\.?\\d*)/gi, '**$1 $2**');
  result = result.replace(/(Annex|Appendix|Schedule)\\s+([A-Z])/gi, '**$1 $2**');
  return result;
};
`;

content = content.replace(processLegalTextRegex, newProcessLegalText);
fs.writeFileSync('./utils/LegalMarkdownEngine.tsx', content);
