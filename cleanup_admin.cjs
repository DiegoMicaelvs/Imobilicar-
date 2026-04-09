const fs = require('fs');
const path = require('path');

const filePath = path.join('client', 'src', 'pages', 'admin.tsx');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Use regex to match the old VendorWorkspace body if possible, or use line numbers
    const lines = content.split('\n');

    // We want to keep 0 to 169
    // And keep 6470 to end
    const part1 = lines.slice(0, 170);
    const part2 = lines.slice(6470);

    const finalContent = part1.join('\n') + '\n' + part2.join('\n');

    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log('Success');
} catch (e) {
    console.error(e);
}
