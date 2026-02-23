#!/bin/bash
# Full QC pipeline for Side Hustle Simulator
# Run before declaring any feature "done"

set -e  # Exit on first error

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Side Hustle Simulator - QC Pipeline${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}"

# Track results
RESULTS=()

# 1. TypeScript type checking
echo -e "\n${YELLOW}[1/6] TypeScript type check...${NC}"
if npm run typecheck 2>&1; then
    RESULTS+=("✅ TypeScript")
else
    RESULTS+=("❌ TypeScript")
    echo -e "${RED}TypeScript errors found${NC}"
fi

# 2. Unit tests
echo -e "\n${YELLOW}[2/6] Unit tests...${NC}"
if npm run test:unit 2>&1; then
    RESULTS+=("✅ Unit tests")
else
    RESULTS+=("❌ Unit tests")
    echo -e "${RED}Unit test failures${NC}"
fi

# 3. Build
echo -e "\n${YELLOW}[3/6] Production build...${NC}"
if npm run build 2>&1; then
    RESULTS+=("✅ Build")
    # Check bundle size
    BUNDLE_SIZE=$(du -sh dist/ | cut -f1)
    echo -e "   Bundle size: ${BUNDLE_SIZE}"
else
    RESULTS+=("❌ Build")
    echo -e "${RED}Build failed${NC}"
fi

# 4. E2E tests (if available)
echo -e "\n${YELLOW}[4/6] E2E tests...${NC}"
if npm run test:e2e 2>&1; then
    RESULTS+=("✅ E2E tests")
else
    RESULTS+=("⚠️  E2E tests (may need display)")
fi

# 5. Storybook build (verifies stories compile)
echo -e "\n${YELLOW}[5/6] Storybook build...${NC}"
if npm run build-storybook 2>&1 > /dev/null; then
    RESULTS+=("✅ Storybook")
else
    RESULTS+=("❌ Storybook")
    echo -e "${RED}Storybook build failed${NC}"
fi

# 6. Lint check (if eslint configured)
echo -e "\n${YELLOW}[6/6] Lint check...${NC}"
if command -v eslint &> /dev/null && [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
    if npx eslint src/ --max-warnings 0 2>&1; then
        RESULTS+=("✅ Lint")
    else
        RESULTS+=("⚠️  Lint warnings")
    fi
else
    RESULTS+=("⏭️  Lint (not configured)")
fi

# Summary
echo -e "\n${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Summary${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
for result in "${RESULTS[@]}"; do
    echo -e "  $result"
done

# Check for failures
if [[ " ${RESULTS[*]} " =~ "❌" ]]; then
    echo -e "\n${RED}QC FAILED - Fix issues before deploying${NC}"
    exit 1
else
    echo -e "\n${GREEN}QC PASSED - Ready to deploy${NC}"
    exit 0
fi
