import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.set_default_timeout(15000)
    
    page.goto("http://localhost:5173/#/admin")
    page.wait_for_load_state("networkidle")
    
    # Check localStorage and auth state
    local_storage = page.evaluate("() => JSON.stringify(localStorage)")
    session_storage = page.evaluate("() => JSON.stringify(sessionStorage)")
    
    print(f"URL: {page.url}")
    print(f"localStorage keys: {[k for k in page.evaluate('Object.keys(localStorage)')]}")
    print(f"sessionStorage keys: {[k for k in page.evaluate('Object.keys(sessionStorage)')]}")
    
    # Check for supabase auth tokens
    has_supabase = "supabase.auth.token" in local_storage or "sb-" in local_storage
    print(f"Has supabase auth in localStorage: {has_supabase}")
    
    browser.close()
