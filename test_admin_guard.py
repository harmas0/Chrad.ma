import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.set_default_timeout(15000)
    
    # Clear any existing state
    page.context.add_cookies([])
    
    # Check admin guard
    page.goto("http://localhost:5173/#/admin")
    page.wait_for_load_state("networkidle")
    url = page.url
    print(f"Admin page URL after load: {url}")
    
    # Check if there is any user state
    page.goto("http://localhost:5173/#/")
    page.wait_for_load_state("networkidle")
    content = page.content()
    print(f"Home page content length: {len(content)}")
    
    # Check what guard components exist
    page.goto("http://localhost:5173/#/admin")
    page.wait_for_load_state("networkidle")
    
    # Check for navigation elements - if BottomNav is present, user might be logged in
    bottom_nav = page.locator("nav").count()
    print(f"Nav elements found: {bottom_nav}")
    
    browser.close()
