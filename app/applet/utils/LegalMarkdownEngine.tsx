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
  
  let h1Counter = startNumber - 1;
  let h2Counter = 0;
  let h3Counter = 0;
  
  let listLevel1Counter = 0;
  let listLevel2Counter = 0;

  let inList = false;
  let currentListIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      processedLines.push(line);
      continue; // Don't break the list on empty lines
    }

    const h1Match = line.match(/^#\s+(.*)/);
    const h2Match = line.match(/^##\s+(.*)/);
    const h3Match = line.match(/^###\s+(.*)/);

    if (h1Match) {
      h1Counter++;
      h2Counter = 0;
      h3Counter = 0;
      processedLines.push(`**${h1Counter}. ${h1Match[1]}**`);
      inList = false;
      continue;
    } else if (h2Match) {
      h2Counter++;
      h3Counter = 0;
      const baseNum = h1Counter < startNumber ? startNumber : h1Counter;
      processedLines.push(`**${baseNum}.${h2Counter} ${h2Match[1]}**`);
      inList = false;
      continue;
    } else if (h3Match) {
      h3Counter++;
      const baseNum = h1Counter < startNumber ? startNumber : h1Counter;
      processedLines.push(`**${baseNum}.${h2Counter || 1}.${h3Counter} ${h3Match[1]}**`);
      inList = false;
      continue;
    }

    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
    if (listMatch) {
      const indent = listMatch[1].length;
      const content = listMatch[3];

      if (!inList) {
        inList = true;
        currentListIndent = indent;
        listLevel1Counter = 1;
        listLevel2Counter = 0;
      } else {
        if (indent > currentListIndent) {
          if (listLevel2Counter === 0) listLevel2Counter = 1;
          else listLevel2Counter++;
        } else if (indent < currentListIndent) {
          currentListIndent = indent;
          listLevel1Counter++;
          listLevel2Counter = 0;
        } else {
          if (listLevel2Counter > 0) listLevel2Counter++;
          else listLevel1Counter++;
        }
      }

      const baseNum = h1Counter < startNumber ? startNumber : h1Counter;
      if (listLevel2Counter > 0) {
         processedLines.push(`\n&nbsp;&nbsp;&nbsp;&nbsp;**${baseNum}.${listLevel1Counter}.${listLevel2Counter}** ${content}`);
      } else {
         processedLines.push(`\n**${baseNum}.${listLevel1Counter}** ${content}`);
      }
      continue;
    }

    processedLines.push(line);
    inList = false; // Reset list if we encounter non-list text
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
            // Check if it looks like a section number like "1." or "1.1"
            const isSectionNum = typeof props.children === 'string' && /^(\d+(\.\d+)*)/.test(props.children);
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
