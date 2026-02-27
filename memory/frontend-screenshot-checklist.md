# Frontend Screenshot Checklist

Use this before attempting any UI screenshots:

## Pre-Screenshot Verification

1. **Environment Variables**
   ```bash
   cat .env  # Should exist and have values
   ```

2. **Production Build**
   ```bash
   npm run build  # Not npm run dev!
   ls dist/  # Should have index.html + assets/
   ```

3. **SPA Server** (for React/Vue/Angular)
   ```python
   # Use this instead of python3 -m http.server
   # See /tmp/spa-server.py for reference
   ```

4. **Server Health Check**
   ```bash
   curl -s http://localhost:3000 | grep -E "(root|div|app)"
   # Should return HTML with content
   ```

5. **Content Verification**
   ```bash
   # In Playwright script:
   const content = await page.evaluate(() => 
     document.getElementById('root').innerHTML.length
   );
   // Should be >1000 chars
   ```

## Common Failures & Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank screenshots | Missing .env | Create .env with required vars |
| 404 errors | No SPA routing | Use SPA-aware server |
| 0 content length | Dev server issues | Use production build |
| Connection refused | Server not running | Start server, verify with curl |
| Unstyled content | CSS not loading | Check build output, use production |

## Tools That Work

✅ **Playwright** (installed at ~/Library/Caches/ms-playwright/)
- Headless Chromium
- Full JS execution
- Best for React apps

❌ **CDP** (Chrome DevTools Protocol)
- Issues with JS hydration
- Harder to debug

❌ **Vite Dev Server**
- HMR websocket fails in headless
- Use production build instead

## Quick Test Script

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { 
    waitUntil: 'networkidle' 
  });
  
  // Check content loaded
  const html = await page.evaluate(() => 
    document.body.innerHTML
  );
  console.log(`Content: ${html.length} chars`);
  
  if (html.length > 1000) {
    await page.screenshot({ path: 'test.png' });
    console.log('✅ Screenshot saved');
  } else {
    console.log('❌ Not enough content');
  }
  
  await browser.close();
})();
```

## Lessons from 2026-02-06

- Tried 5 screenshot methods before fixing root cause
- Missing .env was the actual problem
- Production build + SPA server = success
- Always verify with curl before screenshots
