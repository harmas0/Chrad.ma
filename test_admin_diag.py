import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.set_default_timeout(15000)
    
    page.goto("http://localhost:5173/#/onboarding")
    page.get_by_role("button", name="Skip").click()
    page.wait_for_url("**/login", timeout=5000)
    
    page.goto("http://localhost:5173/#/login")
    page.get_by_role("button", name="Sign Up").click()
    page.wait_for_selector("text=Create Account", timeout=5000)
    
    page.goto("http://localhost:5173/#/admin")
    page.wait_for_load_state("networkidle")
    
    print("URL:", page.url)
    print("localStorage:", page.evaluate("JSON.stringify(localStorage)"))
    browser.close()
