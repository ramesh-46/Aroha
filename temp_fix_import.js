const fs = require('fs');
const path = require('path');

const walk = dir => {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if(fs.statSync(p).isDirectory()) {
      walk(p);
    } else if(p.endsWith('.js') && !p.includes('sweetalertConfig.js')) {
      let c = fs.readFileSync(p, 'utf8');
      if(c.includes('import Swal from "sweetalert2";')) {
        let depth = (p.match(/\\/g) || []).length - (dir.match(/\\/g) || []).length;
        let relativePath = './sweetalertConfig'; // Assuming flat src for now
        fs.writeFileSync(p, c.replace(/import Swal from "sweetalert2";/g, `import Swal from "./sweetalertConfig";`));
        console.log('Fixed:', p);
      }
    }
  });
};
walk('./src');
