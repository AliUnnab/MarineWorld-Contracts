const fs = require('fs');
let content = fs.readFileSync('./utils/LegalMarkdownEngine.tsx', 'utf8');

const regex = /h3: \(\{node, \.\.\.props\}\) => <h3 className="font-inter font-semibold text-\[11px\] mb-\[8px\] mt-\[12px\] break-after-avoid page-break-inside-avoid text-slate-800" \{\.\.\.props\} \/>,\n\s*h4: \(\{node, \.\.\.props\}\) => <h4 className="font-inter font-semibold text-\[10\.5px\] mb-\[6px\] mt-\[10px\] ml-4 break-after-avoid page-break-inside-avoid text-slate-800" \{\.\.\.props\} \/>,\n\s*h5: \(\{node, \.\.\.props\}\) => <h5 className="font-inter font-semibold text-\[10\.5px\] mb-\[6px\] mt-\[10px\] ml-8 break-after-avoid page-break-inside-avoid text-slate-700" \{\.\.\.props\} \/>,\n\s*h6: \(\{node, \.\.\.props\}\) => <h6 className="font-inter font-medium text-\[10\.5px\] mb-\[6px\] mt-\[8px\] ml-12 break-after-avoid page-break-inside-avoid text-slate-700" \{\.\.\.props\} \/>,/g;

const replaceWith = `h3: ({node, ...props}) => <h3 className="font-inter font-semibold text-[11px] mb-[10px] break-after-avoid page-break-inside-avoid text-slate-800" {...props} />,`;

if (content.match(regex)) {
   content = content.replace(regex, replaceWith);
   fs.writeFileSync('./utils/LegalMarkdownEngine.tsx', content);
   console.log("Success replacing headings components");
} else {
   console.log("Not found headings components");
}
