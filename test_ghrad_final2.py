import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

def run_tests():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.set_default_timeout(15000)
        
        def go(url):
            page.goto(url)
            page.wait_for_load_state("networkidle")
        
        # Test 1
        try:
            go("http://localhost:5173/#/")
            txt = page.text_content("body")
            ok = "Fast" in txt and "On-Demand" in txt
            results.append(("Home page", "PASS" if ok else "FAIL", "Onboarding content present" if ok else "Missing text"))
        except Exception as e:
            results.append(("Home page", "FAIL", str(e)))
        
        # Test 2
        try:
            go("http://localhost:5173/#/onboarding")
            page.get_by_role("button", name="Skip").click()
            page.wait_for_url("**/login", timeout=5000)
            results.append(("Onboarding skip", "PASS", "Skip -> login"))
        except Exception as e:
            results.append(("Onboarding skip", "FAIL", str(e)))
        
        # Test 3
        try:
            go("http://localhost:5173/#/login")
            page.wait_for_selector("text=Welcome Back")
            page.wait_for_selector("text=Email Address")
            page.wait_for_selector("text=Sign In")
            results.append(("Login UI", "PASS", "Welcome Back, Email, Sign In visible"))
        except Exception as e:
            results.append(("Login UI", "FAIL", str(e)))
        
        # Test 4
        try:
            go("http://localhost:5173/#/login")
            page.get_by_role("button", name="Sign Up").click()
            page.wait_for_selector("text=Create Account")
            results.append(("Sign Up toggle", "PASS", "Create Account mode works"))
        except Exception as e:
            results.append(("Sign Up toggle", "FAIL", str(e)))
        
        # Test 5
        try:
            go("http://localhost:5173/#/login")
            page.click("text=Forgot password?")
            page.wait_for_selector("text=Reset Password")
            results.append(("Forgot password", "PASS", "Reset Password visible"))
        except Exception as e:
            results.append(("Forgot password", "FAIL", str(e)))
        
        # Test 6
        try:
            go("http://localhost:5173/#/admin")
            url = page.url
            if "/login" in url or "/onboarding" in url:
                results.append(("Admin guard", "PASS", "Redirected to " + url))
            else:
                results.append(("Admin guard", "FAIL", "Admin accessible: " + url))
        except Exception as e:
            results.append(("Admin guard", "FAIL", str(e)))
        
        # Test 7
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        try:
            go("http://localhost:5173/#/")
            if console_errors:
                results.append(("Console errors", "WARN", str(len(console_errors)) + " errors"))
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
        print("[" + icon + "] " + name + ": " + detail)
    print("=" * 70)
    passed = sum(1 for _, s, _ in results if s == "PASS")
    failed = sum(1 for _, s, _ in results if s == "FAIL")
    warnings = sum(1 for _, s, _ in results if s == "WARN")
    print("Total: " + str(len(results)) + " | Passed: " + str(passed) + " | Failed: " + str(failed) + " | Warnings: " + str(warnings))
