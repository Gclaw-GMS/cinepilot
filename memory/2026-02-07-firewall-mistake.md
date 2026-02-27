# CRITICAL LESSON: Firewall Rules Break Local Services
## Date: 2026-02-07
## Severity: HIGH - System Breaking

### What Happened
Created pfctl firewall rules with `block drop in all` that blocked ALL incoming traffic including localhost (127.0.0.1). This broke:
- OpenClaw UI (http://127.0.0.1:18789)
- OpenClaw Gateway
- All localhost services

User had to manually kill/reset all firewall rules and restart.

### Root Cause
Aggressive firewall rule without exception for loopback interface:
```bash
# WRONG - Blocks everything including localhost
block drop in all

# CORRECT - Allow localhost first
pass quick on lo0 all
block drop in all
```

### Why It Failed
1. Didn't test rules before applying
2. Didn't include localhost exception
3. Didn't verify OpenClaw still worked after changes
4. Applied aggressive blocking without safety checks

### Correct Approach for Future
**Option 1: Don't use aggressive pfctl rules**
- Use macOS Application Firewall GUI instead
- Less powerful but safer

**Option 2: If using pfctl, ALWAYS include:**
```bash
# Critical: Allow localhost first
pass quick on lo0 all
pass quick from 127.0.0.1 to 127.0.0.1
pass quick from ::1 to ::1

# Then block external
block drop in all
```

**Option 3: Test before apply**
```bash
# Load rules but don't enable
pfctl -f /etc/pf.anchors/rules -n  # Test mode

# Verify services still work
curl http://127.0.0.1:18789/status

# Then enable
pfctl -e
```

### Recovery Commands (if this happens again)
```bash
# Disable packet filter immediately
sudo pfctl -d

# Clear all rules
sudo pfctl -F all

# Reset to default
sudo rm /etc/pf.anchors/tailscale
sudo pfctl -f /etc/pf.conf

# Restart OpenClaw
openclaw restart
```

### Prevention Checklist
- [ ] Always allow localhost/loopback first
- [ ] Test rules in dry-run mode (`-n` flag)
- [ ] Verify critical services still work
- [ ] Have rollback command ready
- [ ] Warn user about potential breakage
- [ ] Apply incrementally, not all at once

### Rule: NO AGGRESSIVE FIREWALL RULES WITHOUT TESTING
When setting up security:
1. **Never** apply `block drop in all` without localhost exception
2. **Always** test that OpenClaw UI still loads
3. **Always** provide immediate rollback commands
4. **Prefer** Application Firewall GUI over pfctl for user safety

### User Impact
- Broke OpenClaw instance
- Required manual intervention to fix
- Lost trust in security recommendations
- Wasted user's time

### Commitment
NEVER repeat this mistake. Always:
1. Test locally first
2. Include safety exceptions
3. Verify no breakage
4. Provide rollback
