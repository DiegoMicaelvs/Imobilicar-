const fs = require('fs');
const path = 'c:\\Users\\usuário\\Documents\\Projeto Car\\client\\src\\pages\\admin.tsx';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');

    // Lines were 1-indexed in view_file.
    // We want to keep 1 to 170 (index 0 to 169)
    // And keep 6471 to end (index 6470 to end)
    const newLines = [...lines.slice(0, 170), ...lines.slice(6470)];

    fs.writeFileSync(path, newLines.join('\n'), 'utf8');
    console.log('File cleaned up successfully with Node.js');
} catch (err) {
    console.error('Error cleaning up file:', err);
}
