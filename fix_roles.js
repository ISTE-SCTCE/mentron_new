const fs = require('fs');

function replaceFile(path, oldText, newText) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newText);
  fs.writeFileSync(path, content);
}

replaceFile('app/notes/page.tsx', "profile?.role === 'exec' || profile?.role === 'admin'", "profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'");
replaceFile('app/lib/actions/deleteActions.ts', "profile?.role === 'exec' || profile?.role === 'admin'", "profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'");
replaceFile('app/projects/ProjectsList.tsx', "userRole === 'exec' || userRole === 'admin'", "userRole === 'exec' || userRole === 'core' || userRole === 'admin'");
replaceFile('app/marketplace/MarketplaceList.tsx', "userRole === 'exec' || userRole === 'admin'", "userRole === 'exec' || userRole === 'core' || userRole === 'admin'");
