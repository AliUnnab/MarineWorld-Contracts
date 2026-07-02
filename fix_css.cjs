const fs = require('fs');
let css = fs.readFileSync('./src/index.css', 'utf8');

const target = `.pdf-generating {
  background: white !important;
  background-color: white !important;
  padding: 0 !important;
  margin: 0 !important;
}`;
const replacement = `.pdf-generating, .pdf-generating #contract-pages-container {
  background: white !important;
  background-color: white !important;
  padding: 0 !important;
  margin: 0 !important;
}`;

css = css.replace(target, replacement);

fs.writeFileSync('./src/index.css', css);
