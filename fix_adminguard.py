import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/components/AdminGuard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = 'const { user, profile, loading } = useAuth();'
new = 'const { user, profile, loading } = useAuth();' + '\n\n  // Immediate redirect for users with no Supabase auth token (avoids sidebar flash)' + '\n  const hasAuthToken = typeof window !== undefined && Object.keys(localStorage).some(key => sb- in key && -auth-token in key);' + '\n\n  if (!hasAuthToken && !loading) {' + '\n    return <Navigate to=" /login\ replace />;' + '\n }'

if old in content:
 content = content.replace(old, new)
 with open('src/components/AdminGuard.jsx', 'w', encoding='utf-8') as f:
 f.write(content)
 print('AdminGuard.jsx updated')
else:
 print('Pattern not found')
