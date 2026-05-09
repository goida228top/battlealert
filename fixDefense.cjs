const fs = require('fs');
let content = fs.readFileSync('src/components/tabs/DefenseTab.tsx', 'utf8');
const regex = /(cost=\{engineRef\.current\.getCost\('([^']+)'\)\}[\s\S]{1,1000}?)(\n\s*title=")/g;
let newContent = content.replace(regex, (match, prefix, type, suffix) => {
    if (match.includes('onContextMenu')) {
        return match;
    }
    return `${prefix}\n                    onContextMenu={(e) => handleCancel('${type}', e)}${suffix}`;
});
fs.writeFileSync('src/components/tabs/DefenseTab.tsx', newContent, 'utf8');
console.log('Fixed DefenseTab');
