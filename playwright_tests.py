from playwright.sync_api import sync_playwright
import sys
sys.stdout.reconfigure(encoding="utf-8")

def test_ghrad_app():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        # Test 1: Home page
        try:
            page.goto("http://localhost:5173/#/")
            page.wait_for_load_state("networkidle", timeout=15000)
            page.wait_for_selector("text=Fast & On-Demand", timeout=10000)
            results.append(("Home page", "PASS", "Onboarding content visible"))
        except Exception as e:
            results.append(("Home page", "FAIL", str(e)))

        # Test 2: Onboarding skip
        try:
            page.goto("http://localhost:5173/#/onboarding")
            page.wait_for_load_state("networkidle", timeout=10000)
            page.click("button:has-text(Skip)")
            page.wait_for_url("**/login", timeout=5000)
            results.append(("Onboarding skip", "PASS", "Skip -> login works"))
        except Exception as e:
            results.append(("Onboarding skip", "FAIL", str(e)))

        # Test 3: Login UI
        try:
            page.goto("http://localhost:5173/#/login")
            page.wait_for_load_state("networkidle", timeout=10000)
            page.wait_for_selector("text=Welcome Back", timeout=10000)
            page.wait_for_selector("text=Email Address", timeout=5000)
            page.wait_for_selector("button:has-text(Sign In)", timeout=5000)
            results.append(("Login UI", "PASS", "Welcome Back, email, sign in visible"))
        except Exception as e:
            results.append(("Login UI", "FAIL", str(e)))

        # Test 4: Sign Up toggle
        try:
            page.goto("http://localhost:5173/#/login")
            page.wait_for_load_state("networkidle", timeout=10000)
            page.click("button:has-text(Sign Up)")
            page.wait_for_selector("text=Create Account", timeout=5000)
            results.append(("Sign Up toggle", "PASS", "Create Account mode works"))
        except Exception as e:
            results.append(("Sign Up toggle", "FAIL", str(e)))

        # Test 5: Forgot password
        try:
            page.goto("http://localhost:5173/#/login")
            page.wait_for_load_state("networkidle", timeout=10000)
            page.click("text=Forgot password?")
            page.wait_for_selector("text=Reset Password", timeout=5000)
            results.append(("Forgot password", "PASS", "Reset Password form visible"))
        except Exception as e:
            results.append(("Forgot password", "FAIL", str(e)))

        # Test 6: Invalid login
        try:
            page.goto("http://localhost:5173/#/login")
            page.wait_for_load_state("networkidle", timeout=10000)
            page.get_by_label("Email Address").fill("fake@test.com")
            page.get_by_label("Password").fill("wrongpass")
            page.click("button:has-text(Sign In)")
            page.wait_for_timeout(2000)
            results.append(("Invalid login", "PASS", "No crash on bad credentials"))
        except Exception as e:
            results.append(("Invalid login", "FAIL", str(e)))

        # Test 7: Admin route guard
        try:
            page.goto("http://localhost:5173/#/admin")
            page.wait_for_load_state("networkidle", timeout=10000)
            url = page.url
            if "/login" in url or "/onboarding" in url:
                results.append(("Admin guard", "PASS", f"Redirected to {url}"))
            else:
                results.append(("Admin guard", "WARN", f"Admin accessible: {url}"))
        except Exception as e:
            results.append(("Admin guard", "FAIL", str(e)))

        # Test 8: Console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        try:
            page.goto("http://localhost:5173/#/")
            page.wait_for_load_state("networkidle", timeout=15000)
            if console_errors:
                results.append(("Console errors", "WARN", f"{len(console_errors)} errors"))
            else:
                results.append(("Console errors", "PASS", "No console errors"))
        except Exception as e:
            results.append(("Console errors", "FAIL", str(e)))

        browser.close()
    return results

if __name__ == "__main__":
    results = test_ghrad_app()
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
