"""
Concurrent load test script using Playwright.
Opens 20 browser instances simultaneously to test application responsiveness.
"""

import argparse
import asyncio
import signal
from playwright.async_api import async_playwright


URL = "http://127.0.0.1:5076/?category=All&query=123&mode=search&indexers=Mock1%252CMock2%252CMock3"
NUM_INSTANCES = 30

# Track all open browsers for cleanup
open_browsers = []
shutdown_event = asyncio.Event()


async def open_page(browser_id: int, playwright, keep_open: float):
    """Open a single browser instance and navigate to the URL."""
    print(f"[Browser {browser_id}] Starting...")

    browser = await playwright.chromium.launch(headless=True)
    open_browsers.append(browser)
    context = await browser.new_context()
    page = await context.new_page()

    try:
        print(f"[Browser {browser_id}] Navigating to URL...")
        response = await page.goto(URL, timeout=60000)

        if response:
            print(f"[Browser {browser_id}] Response status: {response.status}")
        else:
            print(f"[Browser {browser_id}] No response received")

        # Wait for the page to be fully loaded
        await page.wait_for_load_state("networkidle", timeout=60000)
        print(f"[Browser {browser_id}] Page loaded successfully")

        # Keep the browser open for observation, but check for shutdown
        try:
            await asyncio.wait_for(shutdown_event.wait(), timeout=keep_open)
        except asyncio.TimeoutError:
            pass  # Normal timeout, not a shutdown

    except asyncio.CancelledError:
        print(f"[Browser {browser_id}] Cancelled")
    except Exception as e:
        print(f"[Browser {browser_id}] Error: {type(e).__name__}: {e}")

    finally:
        if browser in open_browsers:
            open_browsers.remove(browser)
        await browser.close()
        print(f"[Browser {browser_id}] Closed")


async def cleanup_browsers():
    """Close all open browsers."""
    print("\nClosing all browsers...")
    for browser in list(open_browsers):
        try:
            await browser.close()
        except Exception:
            pass
    open_browsers.clear()


async def main(keep_open: float):
    print(f"Starting concurrent test with {NUM_INSTANCES} browser instances...")
    print(f"Target URL: {URL}")
    print(f"Keep open duration: {keep_open}s")
    print("Press Ctrl+C to close all browsers and exit\n")

    loop = asyncio.get_running_loop()

    def signal_handler():
        print("\nReceived interrupt signal...")
        shutdown_event.set()

    # Register signal handlers
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, signal_handler)
        except NotImplementedError:
            # Windows doesn't support add_signal_handler
            signal.signal(sig, lambda s, f: signal_handler())

    try:
        async with async_playwright() as playwright:
            # Launch all browsers concurrently
            tasks = [open_page(i + 1, playwright, keep_open) for i in range(NUM_INSTANCES)]
            await asyncio.gather(*tasks, return_exceptions=True)
    except asyncio.CancelledError:
        pass
    finally:
        await cleanup_browsers()

    print("\nAll browsers closed. Test complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Concurrent load test using Playwright")
    parser.add_argument(
        "--keep-open", "-k",
        type=float,
        default=1,
        help="Seconds to keep browsers open after page load (default: 1)"
    )
    args = parser.parse_args()

    try:
        asyncio.run(main(args.keep_open))
    except KeyboardInterrupt:
        print("\nInterrupted.")
