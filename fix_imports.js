const fs = require('fs');
const path = require('path');

const filesToFix = ['signup.js', 'profile.js', 'login.js'];
const dir = path.join(__dirname, 'src');

for (const file of filesToFix) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove all Swal imports
  content = content.replace(/import Swal from "sweetalert2";\n?/g, '');
  
  // Add exactly one at the top
  content = `import Swal from "sweetalert2";\n` + content;
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
}
