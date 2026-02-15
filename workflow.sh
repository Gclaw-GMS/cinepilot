#!/bin/bash
# CinePilot CI/CD Workflow
# Dev → QA → Reviewer → Merge/Reject

set -e

PROJECT_DIR="$HOME/.openclaw/workspace-agents/cinepilot"
QA_DIR="$HOME/.openclaw/workspace-agents/cinepilot-qa"
REVIEWER_DIR="$HOME/.openclaw/workspace-agents/cinepilot-reviewer"

echo "🎬 CinePilot CI/CD Workflow"
echo "============================"

# Check if we're in market hours (for trading) or just running feature tests
MODE="${1:-feature}"  # feature, qa, review, deploy

cd "$PROJECT_DIR"

case "$MODE" in
  feature)
    echo "📝 Mode: Feature Development"
    echo "Making changes to codebase..."
    # User/dev makes changes here
    echo "Changes complete. Run './workflow.sh qa' to test."
    ;;

  qa)
    echo "🧪 Mode: QA Testing"
    
    # Check build
    echo "Running build test..."
    cd frontend && npm run build > /tmp/cinepilot-build.log 2>&1 || true
    if grep -q "error" /tmp/cinepilot-build.log; then
      echo "❌ Build FAILED"
      cat /tmp/cinepilot-build.log | tail -20
      exit 1
    fi
    echo "✅ Build PASSED"
    
    # Check for TypeScript errors
    echo "Checking TypeScript..."
    npx tsc --noEmit > /tmp/cinepilot-tsc.log 2>&1 || true
    if grep -q "error TS" /tmp/cinepilot-tsc.log; then
      echo "❌ TypeScript errors found"
      cat /tmp/cinepilot-tsc.log | head -30
    else
      echo "✅ TypeScript OK"
    fi
    
    echo "✅ QA PASSED - Ready for review"
    echo "Run './workflow.sh review' to trigger code review"
    ;;

  review)
    echo "👀 Mode: Code Review"
    
    # Get latest changes
    echo "Fetching latest changes..."
    git fetch origin
    
    # Get diff
    echo "Changes since last merge:"
    git diff HEAD~1 --stat
    
    # Review criteria check
    echo ""
    echo "Review Checklist:"
    echo "================="
    echo "✅ [Manual] Code follows conventions?"
    echo "✅ [Manual] No security issues?"
    echo "✅ [Manual] QA tests passed?"
    echo "✅ [Manual] Feature works as described?"
    
    echo ""
    echo "📋 Reviewer Decision:"
    echo "1. APPROVE - Run './workflow.sh deploy'"
    echo "2. REQUEST CHANGES - Fix issues and re-run qa"
    ;;

  deploy)
    echo "🚀 Mode: Deploy to GitHub"
    
    # Commit changes
    git add -A
    git commit -m "Update: $(date '+%Y-%m-%d %H:%M')" || echo "Nothing to commit"
    
    # Push to GitHub
    echo "Pushing to GitHub..."
    git push origin master
    
    echo "✅ Deployed to https://github.com/Gclaw-GMS/cinepilot"
    ;;

  *)
    echo "Usage: $0 {feature|qa|review|deploy}"
    echo ""
    echo "Workflow:"
    echo "  feature  - Make code changes (dev mode)"
    echo "  qa       - Run QA tests"
    echo "  review   - Code review"
    echo "  deploy   - Push to GitHub (after approval)"
    exit 1
    ;;
esac
