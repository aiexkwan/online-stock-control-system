/**
 * Lighthouse CI Puppeteer Script
 * Custom authentication and setup for Lighthouse CI
 */

module.exports = async (browser, context) => {
  // Get the page from context
  const page = context.page;
  const url = context.url;

  // Skip authentication for public pages
  const publicPages = ['/', '/main-login'];
  const isPublicPage = publicPages.some(path => url.includes(path));

  if (!isPublicPage) {
    // Perform authentication for protected pages
    try {
      // Navigate to login page first
      await page.goto('http://localhost:3000/main-login', {
        waitUntil: 'networkidle0',
      });

      // Check if we need to login
      const needsLogin = await page.evaluate(() => {
        return window.location.pathname === '/main-login';
      });

      if (needsLogin) {
        // Mock authentication for testing
        // In production, use actual test credentials from environment
        await page.evaluate(() => {
          // Set mock authentication token
          localStorage.setItem(
            'supabase.auth.token',
            JSON.stringify({
              access_token: 'mock-token-for-lighthouse-ci',
              expires_at: Date.now() + 3600000,
              user: {
                id: 'test-user-id',
                email: 'lighthouse@test.com',
                role: 'authenticated',
              },
            })
          );
        });

        // Set authentication cookies if needed
        await page.setCookie({
          name: 'sb-access-token',
          value: 'mock-token-for-lighthouse-ci',
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        });
      }
    } catch (error) {
      console.error('Authentication setup failed:', error);
    }
  }

  // Wait for critical resources to load
  await page.evaluateOnNewDocument(() => {
    // Mark performance timing for Lighthouse
    window.__LIGHTHOUSE_CI_START__ = performance.now();

    // Disable animations for consistent testing
    const style = document.createElement('style');
    style.innerHTML = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `;
    document.head.appendChild(style);
  });

  // Handle dialogs that might block testing
  page.on('dialog', async dialog => {
    console.log('Dialog detected:', dialog.message());
    await dialog.accept();
  });

  // Log console messages for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Page Error:', msg.text());
    }
  });

  // Log page errors
  page.on('pageerror', error => {
    console.error('Page crash:', error.message);
  });

  // Set viewport for consistent testing
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });

  // Set extra HTTP headers if needed
  await page.setExtraHTTPHeaders({
    'X-Lighthouse-CI': 'true',
  });

  // Pre-warm the cache for more realistic performance metrics
  if (process.env.LIGHTHOUSE_CI_CACHE_WARMUP) {
    try {
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Clear performance entries for clean measurement
      await page.evaluate(() => {
        if (window.performance && window.performance.clearResourceTimings) {
          window.performance.clearResourceTimings();
        }
      });
    } catch (error) {
      console.warn('Cache warmup failed:', error.message);
    }
  }
};
