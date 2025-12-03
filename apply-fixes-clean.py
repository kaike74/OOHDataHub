#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Clean script to apply fixes to index.html"""

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

output = []
script_added = False

for i, line in enumerate(lines):
    # Skip "Selecione..." option in exhibitor select
    if '<option value="">Selecione...</option>' in line:
        # Check context
        context = ''.join(lines[max(0, i-5):min(len(lines), i+5)])
        if 'id_exibidora' in context:
            continue  # Skip this line
    
    output.append(line)
    
    # Add script after script.js (only once)
    if not script_added and '    <script src="script.js"></script>' in line:
        output.append('    <script src="script-enhancements.js"></script>\n')
        script_added = True

# Join and fix image input
content = ''.join(output)
content = content.replace(
    'id="imagem" name="imagem" class="form-input-file" accept="image/*">',
    'id="imagem" name="imagem" class="form-input-file" accept="image/*" multiple>'
)

with open('index.html', 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("✅ Fixes applied cleanly!")
