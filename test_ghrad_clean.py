import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

def run_tests():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.set_default_timeout(15000)
        
        # Ensure clean state
        page.context.clear_cookies()
        
        # Test 1: Home page renders
        try:
            page.goto("http://localhost:5173/#/")
            page.wait_for_load_state("networkidle")
            text = page.text_content("body")
            if "Fast" in text and "On-Demand" in text:
                results.append(("Home page renders", "PASS", "Onboarding content visible"))
            else:
                results.append(("Home page renders", "FAIL", "Expected text not found"))
        except Exception as e:
            results.append(("Home page renders", "FAIL", str(e)))
        
        # Test 2: Onboarding skip to login
        try:
            page.goto("http://localhost:5173/#/onboarding")
            page.wait_for_load_state("networkidle")
            skip_btn = page.get_by_role("button", name="Skip")
            skip_btn.click()
            page.wait_for_url("**/login", timeout=5000)
            results.append(("Onboarding skip to login", "PASS", "Skip button navigates to login"))
        except Exception as e:
            results.append(("Onboarding skip to login", "FAIL", str(e)))
        
        # Test 3: Login UI
        try:
            page.goto("http://localhost:5173/#/login")
            page.wait_for_load_state("networkidle")
            page.wait_for_selector("text=Welcome Back")
            page.wait_for_selector("text=Email Address")
            page.wait_for_selector("text=Sign In")
            results.append(("Login UI present", "PASS", "Email, password, Sign In button visible"))
        except Exception as e:
            results.append(("Login UI present", "FAIL", str(e)))
        
        # Test 4: Sign Up mode toggle
        try:
            page.goto("http://localhost:5173/#/login")
            page.wait_for_load_state("networkidle")
            page.get_by_role("button", name="Sign Up").click()
            page.wait_for_selector("text=Create Account")
            results.append(("Sign Up toggle", "PASS", "Create Account mode visible"))
        except Exception as e:
            results.append(("Sign Up toggle", "FAIL", str(e)))
        
        # Test 5: Forgot password toggle
        try:
            page.goto("http://localhost:5173/#/login")
            page.wait_for_load_state("networkidle")
            page.click("text=Forgot password?")
            page.wait_for_selector("text=Reset Password")
            results.append(("Forgot password toggle", "PASS", "Reset Password form visible"))
        except Exception as e:
            results.append(("Forgot password toggle", "FAIL", str(e)))
        
        # Test 6: Invalid login does not crash
        try:
            page.goto("http://localhost:5173/#/login")
            page.wait_for_load_state("networkidle")
            page.get_by_label("Email Address").fill("fake@test.com")
            page.get_by_label("Password").fill("wrongpass")
            page.get_by_role("button", name="Sign In").click()
            page.wait_for_timeout(2000)
            results.append(("Invalid login safety", "PASS", "No crash with bad credentials"))
        except Exception as e:
            results.append(("Invalid login safety", "FAIL", str(e)))
        
        # Test 7: Admin route guard
        try:
            page.goto("http://localhost:5173/#/admin")
            page.wait_for_load_state("networkidle")
            url = page.url
            if "/login" in url or "/onboarding" in url:
                results.append(("Admin route guard", "PASS", f"Unauthenticated user redirected to {url}"))
            else:
                results.append(("Admin route guard", "FAIL", f"Admin accessible without auth: {url}"))
        except Exception as e:
            results.append(("Admin route guard", "FAIL", str(e)))
        
        # Test 8: Console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        try:
            page.goto("http://localhost:5173/#/")
            page.wait_for_load_state("networkidle")
            if console_errors:
                results.append(("Console errors", "WARN", f"{len(console_errors)} console error(s)"))
            else:
                results.append(("Console errors", "PASS", "No console errors"))
        except Exception as e:
            results.append(("Console errors", "FAIL", str(e)))
        
        browser.close()
    return results

if __name__ == "__main__":
    results = run_tests()
    print("=" * 70)
    print("GHRAD.MA PLAYWRIGHT TEST RESULTS")
    print("=" * 70)
    for name, status, detail in results:
        icon = "PASS" if status == "PASS" else "FAIL" if status == "FAIL" else "WARN"
        print(f"[{icon}] {name}: {detail}")
    print("=" * 70)
    passed = sum(1 for _, s, _ in results if s == "PASS")
    failed = sum(1 for _, s, _ in results if s == "FAIL")
    warnings = sum(1 for _, s, _ in results if s == "WARN")
    print(f"Total: {len(results)} | Passed: {passed} | Failed: {failed} | Warnings: {warnings}")
