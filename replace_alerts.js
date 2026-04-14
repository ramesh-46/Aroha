const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replaceAlertsInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Insert SweetAlert2 import if not exists
  if (content.includes('alert(') && !content.includes('import Swal from "sweetalert2";')) {
    const importRegex = /import .+;/g;
    let match;
    let lastImportIndex = -1;
    while ((match = importRegex.exec(content)) !== null) {
      lastImportIndex = match.index + match[0].length;
    }
    
    const importStmt = '\nimport Swal from "sweetalert2";';
    if (lastImportIndex !== -1) {
      content = content.slice(0, lastImportIndex) + importStmt + content.slice(lastImportIndex);
    } else {
      content = importStmt + '\n' + content;
    }
  }

  // Replace alert(message) with Swal.fire(message)
  content = content.replace(/alert\((.*)\)/g, (match, p1) => {
    // Determine type by looking for common error words
    const lowerP1 = p1.toLowerCase();
    let type = '"info"';
    if (lowerP1.includes('fail') || lowerP1.includes('error') || lowerP1.includes('wrong') || lowerP1.includes('unable') || lowerP1.includes('incorrect') || lowerP1.includes('enter ') || lowerP1.includes('select ') || lowerP1.includes('!') ) {
      type = '"error"';
      if(lowerP1.includes('success')) type = '"success"';
    } else if (lowerP1.includes('success') || lowerP1.includes('updated') || lowerP1.includes('generated') || lowerP1.includes('added') || lowerP1.includes('sent')) {
      type = '"success"';
    } else {
      type = '"warning"';
    }
    return `Swal.fire(${p1}, "", ${type})`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
};

const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkSync(filePath);
    } else if (filePath.endsWith('.js')) {
      replaceAlertsInFile(filePath);
    }
  }
};

walkSync(directoryPath);
