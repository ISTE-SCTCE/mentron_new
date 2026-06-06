import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    orig_content = content

    # Replace `color: Colors.white` -> `color: Theme.of(context).colorScheme.onSurface`
    # only if NOT followed by `.withOpacity` or `.withValues`
    # Also handle `Colors.white,` and `Colors.white)`
    
    content = re.sub(r'color:\s*Colors\.white\s*(?=[,\)])', r'color: Theme.of(context).colorScheme.onSurface', content)

    # Now we have Theme.of(context) in places that might be marked const.
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'Theme.of(context)' in line:
            line = re.sub(r'const\s+(TextStyle|Icon|Text|Column|Row|Expanded|Padding|SliverToBoxAdapter|Center|Align)', r'\1', line)
            lines[i] = line
            
    content = '\n'.join(lines)

    if content != orig_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(r'c:\Mentron_ap\mentron_new\mentron_flutter\lib\features'):
    for file in files:
        if file.endswith('.dart'):
            fix_file(os.path.join(root, file))
