from playwright.sync_api import sync_playwright

def test_ghrad_app():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        
        # Recon: Landing page
        try:
            page.goto('http://localhost:5173/#/')
            page.wait_for_load_state('networkidle', timeout=15000)
            page.screenshot(path='/tmp/ghrad_home.png', full_page=True)
            html = page.content()
            with open('/tmp/ghrad_home.html', 'w', encoding='utf-8') as f:
                f.write(html)
            results.append(("Home page recon", "INFO", f"HTML length: {len(html)}"))
        except Exception as e:
            results.append(("Home page recon", "FAIL", str(e)))
        
        # Recon: Login page
        try:
            page.goto('http://localhost:5173/#/login')
            page.wait_for_load_state('networkidle', timeout=15000)
            page.screenshot(path='/tmp/ghrad_login.png', full_page=True)
            html = page.content()
            with open('/tmp/ghrad_login.html', 'w', encoding='utf-8') as f:
                f.write(html)
            results.append(("Login page recon", "INFO", f"HTML length: {len(html)}"))
        except Exception as e:
            results.append(("Login page recon", "FAIL", str(e)))
        
        # Recon: Onboarding
        try:
            page.goto('http://localhost:5173/#/onboarding')
            page.wait_for_load_state('networkidle', timeout=15000)
            page.screenshot(path='/tmp/ghrad_onboarding.png', full_page=True)
            html = page.content()
            with open('/tmp/ghrad_onboarding.html', 'w', encoding='utf-8') as f:
                f.write(html)
            results.append(("Onboarding page recon", "INFO", f"HTML length: {len(html)}"))
        except Exception as e:
            results.append(("Onboarding page recon", "FAIL", str(e)))
        
        # Recon: Admin page
        try:
            page.goto('http://localhost:5173/#/admin')
            page.wait_for_load_state('networkidle', timeout=10000)
            url = page.url
            page.screenshot(path='/tmp/ghrad_admin.png', full_page=True)
            results.append(("Admin page check", "INFO", f"URL: {url}"))
        except Exception as e:
            results.append(("Admin page check", "FAIL", str(e)))
        
        browser.close()
    return results

if __name__ == '__main__':
    results = test_ghrad_app()
    print("="*70)
    print("GHRAD.MA RECON RESULTS")
    print("="*70)
    for name, status, detail in results:
        print(f"[{status}] {name}: {detail}")
    print("="*70)
