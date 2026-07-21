import sys  
sys.stdout.reconfigure(encoding=utf-8)  
  
path = src/pages/Login.jsx  
with open(path, r, encoding=utf-8) as f:  
    content = f.read()  
  
for i in range(len(content)):  
    if type=\" "button\ in content[i] and onClick in content[i+1]:  
        content[i] += data-testid=\forgot-password-btn\  
        break  
with open(path, w, encoding=utf-8) as f:  
    f.write(content)  
print(Login.jsx updated)  
