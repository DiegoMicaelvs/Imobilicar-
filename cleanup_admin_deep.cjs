const fs = require('fs');
const path = require('path');

const filePath = path.join('client', 'src', 'pages', 'admin.tsx');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Keep up to line 205 (index 204)
    // Keep from line 1990 (index 1989)
    const part1 = lines.slice(0, 205);
    const part2 = lines.slice(1989);

    fs.writeFileSync(filePath, part1.join('\n') + '\n' + part2.join('\n'), 'utf8');
    console.log('Deep cleanup success');
} catch (e) {
    console.error(e);
}
