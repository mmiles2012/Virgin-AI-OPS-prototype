#!/bin/bash

echo "AINO Platform Duplication Analysis"
echo "=================================="
echo ""

echo "## Component Name Analysis (Potential Duplicates)"
echo "Finding files with similar names..."
echo ""

# Find similar component names
echo "### React Components with similar patterns:"
find frontend/components -name "*.tsx" | sed 's/.*\///' | sort | uniq -c | sort -nr | head -20

echo ""
echo "### Backend services with similar patterns:"
find backend -name "*.ts" | grep -E "(service|route|api)" | sed 's/.*\///' | sort | uniq -c | sort -nr | head -15

echo ""
echo "### Python scripts with similar patterns:"
find python_scripts -name "*.py" | sed 's/.*\///' | sort | uniq -c | sort -nr | head -15

echo ""
echo "## File Size Analysis (Large files for review)"
echo "### Frontend components over 20KB:"
find frontend -name "*.tsx" -o -name "*.ts" -exec wc -c {} + | sort -nr | head -10

echo ""
echo "### Backend files over 10KB:"
find backend -name "*.ts" -o -name "*.js" -exec wc -c {} + | sort -nr | head -10

echo ""
echo "### Python scripts over 15KB:"
find python_scripts -name "*.py" -exec wc -c {} + | sort -nr | head -10

echo ""
echo "## Line Count Analysis"
echo "### Total lines by category:"
echo "Frontend: $(find frontend -name "*.tsx" -o -name "*.ts" -exec wc -l {} + | tail -1 | awk '{print $1}')"
echo "Backend: $(find backend -name "*.ts" -o -name "*.js" -exec wc -l {} + | tail -1 | awk '{print $1}')"
echo "Python: $(find python_scripts -name "*.py" -exec wc -l {} + | tail -1 | awk '{print $1}')"

echo ""
echo "Analysis complete. Review the above for potential duplicate functionality."
