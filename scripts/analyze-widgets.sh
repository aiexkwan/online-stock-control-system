#!/bin/bash

# Widget Complexity Analysis Script
# Output: CSV format for easy analysis

echo "Widget Name,Lines of Code,Import Count,Component Count,Hook Count,Complexity Score"

# Function to analyze a widget file
analyze_widget() {
    local file=$1
    local filename=$(basename "$file")

    # Count lines of code (excluding blank lines and comments)
    local loc=$(grep -v "^[[:space:]]*$" "$file" | grep -v "^[[:space:]]*//" | grep -v "^[[:space:]]*\*" | wc -l)

    # Count imports
    local imports=$(grep -c "^import" "$file")

    # Count React components (rough estimate)
    local components=$(grep -E "const.*=.*\(|function.*\(" "$file" | grep -E "React\.|<|JSX" | wc -l)

    # Count hooks usage
    local hooks=$(grep -E "use[A-Z]" "$file" | wc -l)

    # Calculate complexity score (weighted)
    local complexity=$((loc/50 + imports*2 + components*3 + hooks*2))

    echo "$filename,$loc,$imports,$components,$hooks,$complexity"
}

# Analyze widgets directory
for file in /mnt/c/Users/ccohen/Documents/NewPennine/online-stock-control-system/app/admin/components/dashboard/widgets/*.tsx; do
    if [[ ! "$file" =~ test\.tsx$ ]] && [[ ! "$file" =~ example\.tsx$ ]]; then
        analyze_widget "$file"
    fi
done

# Analyze charts directory
for file in /mnt/c/Users/ccohen/Documents/NewPennine/online-stock-control-system/app/admin/components/dashboard/charts/*.tsx; do
    analyze_widget "$file"
done
