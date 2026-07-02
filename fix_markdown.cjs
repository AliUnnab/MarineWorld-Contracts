const fs = require('fs');

let content = fs.readFileSync('./utils/LegalMarkdownEngine.tsx', 'utf8');

const processLegalTextRegex = /export const processLegalText = \([\s\S]*?\n\};\n/m;

const newProcessLegalText = `export const processLegalText = (text: string, startNumber: number = 1): string => {
  if (!text) return "";

  const lines = text.split('\\n');
  const processedLines: string[] = [];
  
  let h1Counter = startNumber - 1;
  let levelCounters = [0, 0, 0, 0, 0];
  let baseDepth = 0;
  
  // Track if we are inside a code block or table to avoid touching it
  let inCodeBlock = false;

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
      processedLines.push(line);
      continue;
    }

    // Markdown headings
    const h1Match = line.match(/^#\\s+(.*)/);
    const h2Match = line.match(/^##\\s+(.*)/);
    const h3Match = line.match(/^###\\s+(.*)/);

    // List item (number or bullet)
    const listMatch = line.match(/^(\\s*)((?:\\d+\\.)+\\d*\\.?|[-*])\\s+(.*)/);

    if (h1Match) {
      h1Counter++;
      levelCounters = [0, 0, 0, 0, 0];
      baseDepth = 0; // Reset depth
      processedLines.push(\`**\${h1Counter}. \${h1Match[1]}**\`);
      continue;
    } else if (h2Match) {
      levelCounters[0]++;
      levelCounters[1] = 0;
      levelCounters[2] = 0;
      const baseNum = h1Counter < startNumber ? startNumber : h1Counter;
      processedLines.push(\`**\${baseNum}.\${levelCounters[0]}. \${h2Match[1]}**\`);
      continue;
    } else if (h3Match) {
      levelCounters[1]++;
      levelCounters[2] = 0;
      const baseNum = h1Counter < startNumber ? startNumber : h1Counter;
      processedLines.push(\`**\${baseNum}.\${levelCounters[0] || 1}.\${levelCounters[1]}. \${h3Match[1]}**\`);
      continue;
    }

    if (listMatch) {
      const indentStr = listMatch[1];
      const marker = listMatch[2];
      const content = listMatch[3];
      const indent = indentStr.length;

      let level = 1;

      if (marker === '-' || marker === '*') {
         if (indent === 0) level = 1;
         else if (indent <= 4) level = 2;
         else level = 3;
      } else {
         const nums = marker.match(/\\d+/g);
         if (nums) {
           const depth = nums.length;
           if (baseDepth === 0) {
             baseDepth = depth;
           }
           level = depth - baseDepth + 1;
           if (level < 1) level = 1;
         }
      }

      // Update counters based on level
      if (level === 1) {
         levelCounters[0]++;
         levelCounters[1] = 0;
         levelCounters[2] = 0;
      } else if (level === 2) {
         if (levelCounters[0] === 0) levelCounters[0] = 1;
         levelCounters[1]++;
         levelCounters[2] = 0;
      } else {
         if (levelCounters[0] === 0) levelCounters[0] = 1;
         if (levelCounters[1] === 0) levelCounters[1] = 1;
         levelCounters[2]++;
      }

      const baseNum = h1Counter < startNumber ? startNumber : h1Counter;
      
      // Ensure bolding for the text leading up to a colon (optional aesthetic for legal docs)
      let formattedContent = content;
      const colonMatch = content.match(/^([^:]+):(.*)/);
      if (colonMatch && !content.includes('**')) {
        // If it looks like a term definition or title, bold the title part
        const prefix = colonMatch[1];
        if (prefix.length < 60) {
           formattedContent = \`**\${prefix}:**\${colonMatch[2]}\`;
        }
      }

      if (level === 1) {
         processedLines.push(\`\\n<div class="legal-clause level-1">**\${baseNum}.\${levelCounters[0]}.** \${formattedContent}</div>\`);
      } else if (level === 2) {
         processedLines.push(\`\\n<div class="legal-clause level-2" style="margin-left: 20px;">**\${baseNum}.\${levelCounters[0]}.\${levelCounters[1]}.** \${formattedContent}</div>\`);
      } else {
         processedLines.push(\`\\n<div class="legal-clause level-3" style="margin-left: 40px;">**\${baseNum}.\${levelCounters[0]}.\${levelCounters[1]}.\${levelCounters[2]}.** \${formattedContent}</div>\`);
      }
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
