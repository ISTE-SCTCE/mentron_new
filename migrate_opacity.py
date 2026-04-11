import os
import re

def migrate_with_opacity(directory):
    pattern = re.compile(r'\.withOpacity\((.*?)\)')
    replacement = r'.withValues(alpha: \1)'
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.dart'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = pattern.sub(replacement, content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f'Migrated: {filepath}')

if __name__ == "__main__":
    migrate_with_opacity(r'c:\Mentron_ap\mentron_new\mentron_flutter\lib')
