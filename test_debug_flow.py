import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.set_default_timeout(15000)
    page.context.clear_cookies()
    
    # Simulate clean test flow
    print("=== Test 1: Home page ===")
    page.goto("http://localhost:5173/#/")
    page.wait_for_load_state("networkidle")
    print(f"URL: {page.url}")
    
    print("\n=== Test 2: Onboarding ===")
    page.goto("http://localhost:5173/#/onboarding")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button", name="Skip").click()
    page.wait_for_url("**/login", timeout=5000)
    print(f"URL after skip: {page.url}")
    
    print("\n=== Test 3: Login UI ===")
    page.goto("http://localhost:5173/#/login")
    page.wait_for_load_state("networkidle")
    print(f"URL: {page.url}")
    
    print("\n=== Test 7: Admin guard ===")
    page.goto("http://localhost:5173/#/admin")
    page.wait_for_load_state("networkidle")
    print(f"URL: {page.url}")
    
    print("\n=== localStorage keys ===")
    keys = page.evaluate("Object.keys(localStorage)")
    print(f"Keys: {keys}")
    
    browser.close()
