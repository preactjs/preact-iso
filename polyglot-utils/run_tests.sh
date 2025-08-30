#!/bin/bash

# Preact ISO URL Pattern Matching - Test Runner
# Runs tests for all language implementations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track test results
TOTAL_LANGUAGES=4
PASSED_LANGUAGES=0

echo "========================================"
echo "Preact ISO URL Pattern - Test Runner"
echo "========================================"
echo

# Function to run a test and track results
run_test() {
    local language=$1
    local directory=$2
    local command=$3
    local description=$4

    echo -e "${BLUE}Testing $language${NC} ($description)"
    echo "----------------------------------------"

    # Change to test directory and run command
    if cd "$directory" 2>/dev/null; then
        if eval "$command"; then
            echo -e "${GREEN}$language tests PASSED${NC}"
            ((PASSED_LANGUAGES++))
        else
            echo -e "${RED}$language tests FAILED${NC}"
        fi
    else
        echo -e "${RED}$language tests FAILED - Directory not found${NC}"
    fi

    echo
    # Return to script directory
    cd "$SCRIPT_DIR" 2>/dev/null || true
}

# Get the script directory to ensure we're in the right place
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Run tests for each language
run_test "Go" "go" "go test -v" "Static typing with struct returns"
run_test "Python" "python" "python3 test_preact_iso_url_pattern.py" "Dictionary-based with optional typing"
run_test "Ruby" "ruby" "ruby test_preact_iso_url_pattern.rb" "Hash-based with flexible syntax"
run_test "PHP" "php" "php test_preact_iso_url_pattern.php" "Mixed array/object approach"

# Summary
echo "========================================"
echo "Test Summary"
echo "========================================"

if [ $PASSED_LANGUAGES -eq $TOTAL_LANGUAGES ]; then
    echo -e "${GREEN}All $TOTAL_LANGUAGES language implementations passed their tests!${NC}"
    echo -e "${GREEN}Total tests across all languages: 204 (51 × 4)${NC}"
    exit 0
else
    echo -e "${RED}$PASSED_LANGUAGES/$TOTAL_LANGUAGES language implementations passed${NC}"
    echo -e "${RED}$(($TOTAL_LANGUAGES - $PASSED_LANGUAGES)) language(s) failed${NC}"
    exit 1
fi
