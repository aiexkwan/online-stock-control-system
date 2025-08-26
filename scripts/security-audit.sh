#!/bin/bash

# Security Audit Script
# Scans for hardcoded secrets and sensitive information

echo "🔍 Security Audit - Scanning for sensitive information..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for issues found
ISSUES_FOUND=0

# Function to check for patterns
check_pattern() {
    local pattern="$1"
    local description="$2"
    local exclude_dirs="--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude-dir=coverage --exclude-dir=playwright-report"
    
    echo -e "\n${YELLOW}Checking for: ${description}${NC}"
    
    # Use grep to find matches
    if grep -r $exclude_dirs -l "$pattern" . 2>/dev/null | grep -v ".env.example" | grep -v ".mcp.json.example" | grep -v "security-audit.sh"; then
        echo -e "${RED}⚠️  Found potential security issues!${NC}"
        ((ISSUES_FOUND++))
    else
        echo -e "${GREEN}✓ No issues found${NC}"
    fi
}

# Check for various API key patterns
echo "🔐 Scanning for API Keys and Tokens..."
check_pattern "sk-proj-[a-zA-Z0-9]\{40,\}" "OpenAI API Keys"
check_pattern "re_[a-zA-Z0-9]\{20,\}" "Resend API Keys"
check_pattern "sbp_[a-zA-Z0-9]\{30,\}" "Supabase Access Tokens"
check_pattern "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9._-]\+" "JWT Tokens"

# Check for hardcoded passwords
echo -e "\n🔑 Scanning for Hardcoded Passwords..."
check_pattern "password[[:space:]]*=[[:space:]]*[\"'][^\"']\{6,\}[\"']" "Hardcoded Passwords"
check_pattern "passwd[[:space:]]*=[[:space:]]*[\"'][^\"']\{6,\}[\"']" "Hardcoded Passwords (passwd)"
check_pattern "pwd[[:space:]]*=[[:space:]]*[\"'][^\"']\{6,\}[\"']" "Hardcoded Passwords (pwd)"

# Check for email/password combinations
echo -e "\n👤 Scanning for Test Credentials..."
check_pattern "TEST_SYS_LOGIN[[:space:]]*=" "Test Login Credentials"
check_pattern "TEST_SYS_PASSWORD[[:space:]]*=" "Test Password Credentials"

# Check if .env file is tracked in git
echo -e "\n📁 Checking Git Tracking..."
if git ls-files | grep -E "^\.env$" > /dev/null 2>&1; then
    echo -e "${RED}⚠️  .env file is tracked in Git!${NC}"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}✓ .env file is not tracked${NC}"
fi

if git ls-files | grep -E "^\.mcp\.json$" > /dev/null 2>&1; then
    echo -e "${RED}⚠️  .mcp.json file is tracked in Git!${NC}"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}✓ .mcp.json file is not tracked${NC}"
fi

# Summary
echo -e "\n=================================================="
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ Security audit complete - No issues found!${NC}"
else
    echo -e "${RED}❌ Security audit complete - Found $ISSUES_FOUND security issue(s)${NC}"
    echo -e "${YELLOW}Please review and fix the issues before pushing to repository${NC}"
    exit 1
fi