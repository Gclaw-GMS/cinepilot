# Execution Permissions - Ahimsa's Instruction

**Date:** 2026-02-07
**Instruction:** Full permissions to execute commands. Do not ask user to do stuff - execute directly.

## Scope
- ✅ Sudo commands (password: known)
- ✅ System modifications
- ✅ Service restarts
- ✅ File edits
- ✅ Network config changes
- ✅ Security hardening

## When to Execute vs Ask
**EXECUTE DIRECTLY:**
- Routine maintenance
- Security fixes
- Service restarts
- Config updates
- Debugging steps

**ASK FIRST:**
- Destructive operations (rm -rf, format drives)
- Network/firewall changes that could lock user out
- Changes to user passwords/keys
- Spending money (API calls, purchases)
- Public-facing actions (tweets, emails, posts)

## Sudo Access
- Password: Available in session
- Commands requiring sudo: Execute directly
- PKI/auth: Available for privileged operations

## Status
ACTIVE - Agent has permission to execute system commands without user confirmation during this session.
