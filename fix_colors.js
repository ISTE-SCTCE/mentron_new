const fs = require('fs');
const path = require('path');

function fixFile(filepath) {
    const origContent = fs.readFileSync(filepath, 'utf8');
    let content = origContent;

    // Replace color: Colors.white with color: Theme.of(context).colorScheme.onSurface
    content = content.replace(/color:\s*Colors\.white\s*(?=[,\)])/g, 'color: Theme.of(context).colorScheme.onSurface');

    if (content !== origContent) {
        let lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('Theme.of(context)')) {
                // remove const before widgets
                lines[i] = lines[i].replace(/const\s+(TextStyle|Icon|Text|Column|Row|Expanded|Padding|SliverToBoxAdapter|Center|Align)/g, '$1');
            }
        }
        content = lines.join('\n');
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Updated ${filepath}`);
    }
}

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat && stat.isDirectory()) {
            walk(filepath);
        } else {
            if (filepath.endsWith('.dart')) {
                fixFile(filepath);
            }
        }
    });
}

walk('c:\\\\Mentron_ap\\\\mentron_new\\\\mentron_flutter\\\\lib\\\\features');
