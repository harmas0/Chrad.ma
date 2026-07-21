import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.set_default_timeout(15000)
    
    urls = [
        "http://localhost:5173/#/",
        "http://localhost:5173/#/login",
        "http://localhost:5173/#/onboarding",
        "http://localhost:5173/#/admin",
    ]
    
    for url in urls:
        page.goto(url)
        page.wait_for_load_state("networkidle")
        title = page.title()
        body_text = page.text_content("body")[:200]
        print(f"\nURL: {page.url}")
        print(f"Title: {title}")
        print(f"Body snippet: {body_text[:150]}")
    
    browser.close()
