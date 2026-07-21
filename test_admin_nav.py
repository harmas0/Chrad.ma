import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.set_default_timeout(15000)
    page.context.clear_cookies()
    
    # First set onboarded to true (simulating previous session)
    page.goto("http://localhost:5173/#/")
    page.evaluate("localStorage.setItem('onboarded', 'true')")
    
    # Now navigate to admin
    page.goto("http://localhost:5173/#/admin")
    page.wait_for_load_state("networkidle")
    
    print(f"URL after /admin: {page.url}")
    print(f"Page title: {page.title()}")
    
    # Check body text
    text = page.text_content("body")
    print(f"Body text snippet: {text[:200]}")
    
    browser.close()
