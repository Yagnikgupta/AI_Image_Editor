const fs = require('fs');

const mdPath = 'c:\\Users\\krish\\.gemini\\antigravity\\scratch\\ai-image-editor\\Project_Report.md';
let md = fs.readFileSync(mdPath, 'utf8');

const codes = [
  { path: 'c:\\Users\\krish\\.gemini\\antigravity\\scratch\\ai-image-editor\\client\\index.html', title: 'client/index.html', ext: 'html' },
  { path: 'c:\\Users\\krish\\.gemini\\antigravity\\scratch\\ai-image-editor\\client\\src\\index.css', title: 'client/src/index.css', ext: 'css' },
  { path: 'c:\\Users\\krish\\.gemini\\antigravity\\scratch\\ai-image-editor\\client\\src\\App.jsx', title: 'client/src/App.jsx', ext: 'javascript' },
  { path: 'c:\\Users\\krish\\.gemini\\antigravity\\scratch\\ai-image-editor\\client\\src\\components\\Canvas.jsx', title: 'client/src/components/Canvas.jsx', ext: 'javascript' },
  { path: 'c:\\Users\\krish\\.gemini\\antigravity\\scratch\\ai-image-editor\\client\\src\\components\\RightPanel.jsx', title: 'client/src/components/RightPanel.jsx', ext: 'javascript' },
  { path: 'c:\\Users\\krish\\.gemini\\antigravity\\scratch\\ai-image-editor\\server\\index.js', title: 'server/index.js', ext: 'javascript' },
];

let codeSection = `## 8. CODING (FULL SOURCE CODE APPENDIX)\n\nThe complete source code of the project has been appended below as per the project requirements.\n\n`;

for(let c of codes) {
  try {
    const content = fs.readFileSync(c.path, 'utf8');
    codeSection += `### ${c.title}\n\`\`\`${c.ext}\n${content}\n\`\`\`\n\n`;
  } catch (e) {
    console.log(`Failed to read ${c.path}: ${e.message}`);
  }
}

const regex = /## 8\. CODING(?:(?!\n## )[\s\S])*/;
const splitStr = '## 9. DATABASE DESIGN';

if (md.includes(splitStr)) {
   const parts = md.split(splitStr);
   md = parts[0].replace(regex, codeSection) + splitStr + parts[1];
}

fs.writeFileSync(mdPath, md);
console.log('Appended successfully');
