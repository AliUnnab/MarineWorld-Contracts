import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Dynamic Legal Numbering & Formatting Engine
 */
export const processLegalText = (text: string, startNumber: number = 1): string => {
  if (!text) return "";

  const lines = text.split('\n');
  const processedLines: string[] = [];

  let inCodeBlock = false;
  let rootOffset: number | null = null;
  let h1Counter = startNumber - 1;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('```')) {
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
    const numberMatch = line.match(/^(\s*)([0-9]+)\.([0-9]+)?(?:\.([0-9]+))?\.?\s+(.*)/);
    
    // Also match list markers like "-", "*"
    const listMatch = line.match(/^(\s*)([-*])\s+(.*)/);

    // Headings
    const h1Match = line.match(/^#\s+(.*)/);
    const h2Match = line.match(/^##\s+(.*)/);
    const h3Match = line.match(/^###\s+(.*)/);

    if (h1Match) {
      h1Counter++;
      processedLines.push(`\n**${h1Counter}. ${h1Match[1]}**\n`);
      continue;
    } else if (h2Match) {
      const baseNum = h1Counter < startNumber ? startNumber : h1Counter;
      processedLines.push(`\n**${baseNum}.X ${h2Match[1]}**\n`);
      continue;
    } else if (h3Match) {
      const baseNum = h1Counter < startNumber ? startNumber : h1Counter;
      processedLines.push(`\n**${baseNum}.X.X ${h3Match[1]}**\n`);
      continue;
    }

    if (numberMatch) {
      const indentStr = numberMatch[1];
      const firstNum = parseInt(numberMatch[2], 10);
      const secondNum = numberMatch[3];
      const thirdNum = numberMatch[4];
      let content = numberMatch[5];
      
      if (rootOffset === null) {
         rootOffset = startNumber - firstNum;
      }
      
      const newFirstNum = firstNum + rootOffset;
      
      let newNumStr = `${newFirstNum}.`;
      if (secondNum !== undefined) newNumStr += `${secondNum}.`;
      if (thirdNum !== undefined) newNumStr += `${thirdNum}.`;

      // Bold text before colon
      let formattedContent = content;
      const colonMatch = content.match(/^([^:]+):(.*)/);
      if (colonMatch && !content.includes('**')) {
        const prefix = colonMatch[1];
        if (prefix.length < 80) {
           formattedContent = `**${prefix}:**${colonMatch[2]}`;
        }
      }

      let spaces = "";
      if (thirdNum !== undefined || indentStr.length > 2) {
         spaces = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
      } else if (secondNum !== undefined || indentStr.length > 0) {
         spaces = "&nbsp;&nbsp;&nbsp;&nbsp;";
      }

      processedLines.push(`\n${spaces}**${newNumStr}** ${formattedContent}\n`);
      continue;
    }

    if (listMatch) {
      const indentStr = listMatch[1];
      const content = listMatch[3];
      
      let spaces = "";
      if (indentStr.length > 0) {
         spaces = "&nbsp;&nbsp;&nbsp;&nbsp;";
      }
      
      processedLines.push(`\n${spaces}• ${content}\n`);
      continue;
    }

    processedLines.push(line);
  }

  let result = processedLines.join('\n');
  result = result.replace(/(Section|Clause|Article)\s+(\d+\.?\d*\.?\d*)/gi, '**$1 $2**');
  result = result.replace(/(Annex|Appendix|Schedule)\s+([A-Z])/gi, '**$1 $2**');
  return result;
};

export const LegalMarkdown: React.FC<{ content: string; startNumber?: number; className?: string }> = ({ content, startNumber = 1, className = "" }) => {
  const processedContent = processLegalText(content, startNumber);
  
  return (
    <div className={`legal-markdown-engine prose max-w-none text-left ${className}`} style={{ textAlign: 'left' }}>
      <Markdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 className="font-manrope font-semibold text-[16px] uppercase mb-[16px] break-after-avoid page-break-inside-avoid text-slate-900" {...props} />,
          h2: ({node, ...props}) => <h2 className="font-manrope font-semibold text-[12px] mb-[10px] break-after-avoid page-break-inside-avoid text-slate-800" {...props} />,
          h3: ({node, ...props}) => <h3 className="font-inter font-semibold text-[11px] mb-[10px] break-after-avoid page-break-inside-avoid text-slate-800" {...props} />,
          p: ({node, ...props}) => <p className="font-inter font-normal text-[10.5px] leading-[1.45] mb-[8px] tracking-[0px] text-left page-break-inside-avoid" style={{ textAlign: 'left' }} {...props} />,
          ul: ({node, ...props}) => <ul className="font-inter font-normal text-[10.5px] leading-[1.4] mb-[10px] list-disc pl-5 page-break-inside-avoid" {...props} />,
          ol: ({node, ...props}) => <ol className="font-inter font-normal text-[10.5px] leading-[1.4] mb-[10px] list-decimal pl-5 page-break-inside-avoid" {...props} />,
          li: ({node, ...props}) => <li className="mb-[4px] page-break-inside-avoid" {...props} />,
          table: ({node, ...props}) => <div className="overflow-x-auto mb-[10px] page-break-inside-avoid"><table className="min-w-full border-collapse border border-slate-300" {...props} /></div>,
          th: ({node, ...props}) => <th className="font-inter font-semibold text-[10px] leading-[1.3] border border-slate-300 px-3 py-2 bg-slate-50 text-left" {...props} />,
          td: ({node, ...props}) => <td className="font-inter font-normal text-[10px] leading-[1.3] border border-slate-300 px-3 py-2 text-left" {...props} />,
          strong: ({node, ...props}) => {
            // Check if it looks like a section number like "1." or "1.1."
            const isSectionNum = typeof props.children === 'string' && /^\d+(\.\d+)*\./.test(props.children);
            if (isSectionNum) {
               return <strong className="font-inter font-semibold text-[10.5px]" {...props} />
            }
            return <strong className="font-semibold" {...props} />
          },
          em: ({node, ...props}) => {
            // Internal comments or notes
            return <em className="font-inter italic text-[9px] text-slate-500 page-break-inside-avoid print:hidden" {...props} />
          }
        }}
      >
        {processedContent}
      </Markdown>
    </div>
  );
};
