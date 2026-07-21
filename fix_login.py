import re
with open('src/pages/Login.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = '                  {authMode === ' + """login""" + ' && (
                    <button
                      type="button"
                      onClick={() => setAuthMode(' + """forgot""" + ')}
                      className="text-[10px] font-bold text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  )'

new = '                  {authMode === ' + """login""" +  && (
                    <button
                      type="button"
                      data-testid="forgot-password-btn"
                      onClick={() => setAuthMode(' + """forgot""" + ')}
                      className="text-[10px] font-bold text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  )'

if old in content:
    content = content.replace(old, new)
    with open('src/pages/Login.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Login.jsx updated')
else:
    print('Pattern not found')
