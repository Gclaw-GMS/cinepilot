[2026-02-06 01:40]

TAG: confidence
MISS: Initially stored Telegram botToken as plaintext in openclaw.json config file
FIX: Moved to environment variable TELELEGRAM_BOT_TOKEN, referenced as ${TELEGRAM_BOT_TOKEN} in config, added to LaunchAgent plist
CONTEXT: dont-hack-me security audit flagged plaintext secrets - learned proper secret management

[2026-02-06 09:15]

TAG: speed -> depth
MISS: Screenshot failures - tried 5 different methods (CDP, Playwright, browser tool) without fixing root cause first. Wasted tokens on workarounds instead of diagnosing the actual problem (missing .env file, using dev server instead of production build).
FIX: Created pre-screenshot checklist: verify .env exists, build for production, use SPA-aware server, verify server health with curl, check DOM content length before capturing.
CONTEXT: Mission Control frontend screenshots. Multiple failed attempts before realizing React app wasn't rendering due to missing Supabase credentials. See memory/frontend-screenshot-checklist.md for working process.

[2026-02-06 09:15]

TAG: communication
MISS: Went silent during long screenshot debugging session. User had to ask "how's it going?" multiple times. Didn't proactively report blockers or progress.
FIX: Commit to check-ins every 10-15 minutes on multi-step tasks. Report blockers immediately. Better to say "stuck on X, trying Y" than go quiet.
CONTEXT: Mission Control build session. User asked for status multiple times after I said I'd deliver screenshots.

