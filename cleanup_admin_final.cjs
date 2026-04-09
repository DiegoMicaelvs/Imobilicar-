const fs = require('fs');
const path = require('path');

const filePath = path.join('client', 'src', 'pages', 'admin.tsx');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Keep everything before AdminUsersManagement (index 2107)
    const newLines = lines.slice(0, 2107);

    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log('Final cleanup success');
} catch (e) {
    console.error(e);
}
