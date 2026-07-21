import sys
sys.stdout.reconfigure(encoding='utf-8')

path = 'src/pages/Login.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'type=" button\' in line and i + 1 < len(lines) and 'onClick={() => setAuthMode('forgot')}' in lines[i + 1]:
 indent = ' '
 lines[i] = line.rstrip() + '\n' + indent + 'data-testid=\forgot-password-btn\\n'
 break

with open(path, 'w', encoding='utf-8') as f:
 f.writelines(lines)
print('Login.jsx updated')
