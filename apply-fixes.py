#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script to apply manual fixes to index.html - FINAL VERSION"""

# Read the file
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Check if fixes are already applied
if 'script-enhancements.js' in content:
    print("Script already added, skipping...")
else:
    # 1. Add script-enhancements.js after script.js
    content = content.replace(
        '    <script src="script.js"></script>\n</body>',
        '    <script src="script.js"></script>\n    <script src="script-enhancements.js"></script>\n</body>'
    )
    print("✓ Added script-enhancements.js")

# 2. Add multiple attribute to image input
if 'id="imagem"' in content and 'multiple' not in content:
    content = content.replace(
        'id="imagem" name="imagem" class="form-input-file" accept="image/*">',
        'id="imagem" name="imagem" class="form-input-file" accept="image/*" multiple>'
    )
    print("✓ Added multiple attribute to image input")

# 3. Remove "Selecione..." option from exhibitor select
if '<option value="">Selecione...</option>' in content:
    # Find and remove only the one in the exhibitor select
    lines = content.split('\n')
    new_lines = []
    skip_next = False
    for i, line in enumerate(lines):
        if skip_next:
            skip_next = False
            continue
        if '<option value="">Selecione...</option>' in line:
            # Check if this is in the exhibitor select context
            context = '\n'.join(lines[max(0, i-3):min(len(lines), i+3)])
            if 'id_exibidora' in context:
                print("✓ Removed 'Selecione...' option from exhibitor select")
                continue  # Skip this line
        new_lines.append(line)
    content = '\n'.join(new_lines)

# Write back
with open('index.html', 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("\n✅ All fixes applied successfully!")
