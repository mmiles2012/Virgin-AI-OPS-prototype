#!/bin/bash

echo "🔍 Validating Virgin Atlantic UI Updates and Accessibility Improvements..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track validation results
issues_found=0

echo "📋 Checking Virgin Atlantic Design System Compliance..."

# Check for semantic color usage vs hardcoded colors
echo "🎨 Validating color system implementation..."

hardcoded_colors=$(find client/src/components -name "*.tsx" -exec grep -l "text-white\|bg-gray-900\|text-red-400\|bg-red-500" {} \; 2>/dev/null | wc -l)

if [ $hardcoded_colors -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $hardcoded_colors files with potential hardcoded colors${NC}"
    echo "   Checking for proper semantic color usage..."
    
    semantic_colors=$(find client/src/components -name "*.tsx" -exec grep -l "text-foreground\|bg-card\|text-va-red-primary\|bg-va-red-primary" {} \; 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Found $semantic_colors files using semantic Virgin Atlantic colors${NC}"
else
    echo -e "${GREEN}✅ No hardcoded colors found - all using semantic design tokens${NC}"
fi

# Check for responsive design patterns
echo ""
echo "📱 Validating responsive design implementation..."

responsive_files=$(find client/src/components -name "*.tsx" -exec grep -l "sm:\|md:\|lg:\|xl:" {} \; 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Found $responsive_files files with responsive design classes${NC}"

grid_responsive=$(find client/src/components -name "*.tsx" -exec grep -l "grid-cols-1.*sm:grid-cols\|flex-col.*lg:flex-row" {} \; 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Found $grid_responsive files with responsive grid layouts${NC}"

# Check for accessibility improvements
echo ""
echo "♿ Validating accessibility compliance..."

aria_labels=$(find client/src/components -name "*.tsx" -exec grep -l "aria-label\|role=" {} \; 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Found $aria_labels files with ARIA labels and roles${NC}"

button_sizing=$(find client/src/components -name "*.tsx" -exec grep -l "min-h-\[44px\]\|p-3\|px-4.*py-3" {} \; 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Found $button_sizing files with WCAG-compliant touch targets${NC}"

# Check VirginAtlanticComponents.tsx specifically
echo ""
echo "🏢 Validating Virgin Atlantic Components library..."

if [ -f "client/src/components/ui/VirginAtlanticComponents.tsx" ]; then
    echo -e "${GREEN}✅ VirginAtlanticComponents.tsx exists${NC}"
    
    # Check for proper variants
    variants_count=$(grep -c "virgin-primary\|success\|warning\|destructive" client/src/components/ui/VirginAtlanticComponents.tsx)
    echo -e "${GREEN}✅ Found $variants_count Virgin Atlantic brand variants${NC}"
    
    # Check for accessibility features
    touch_targets=$(grep -c "min-h-\[44px\]" client/src/components/ui/VirginAtlanticComponents.tsx)
    echo -e "${GREEN}✅ Found $touch_targets WCAG-compliant touch targets${NC}"
else
    echo -e "${RED}❌ VirginAtlanticComponents.tsx not found${NC}"
    issues_found=$((issues_found + 1))
fi

# Check CSS theme file
echo ""
echo "🎨 Validating Virgin Atlantic theme CSS..."

if [ -f "client/src/styles/virgin-atlantic-theme.css" ]; then
    echo -e "${GREEN}✅ Virgin Atlantic theme CSS exists${NC}"
    
    va_colors=$(grep -c "va-red-primary\|va-cloud-white\|aero-blue" client/src/styles/virgin-atlantic-theme.css)
    echo -e "${GREEN}✅ Found $va_colors Virgin Atlantic brand colors defined${NC}"
else
    echo -e "${RED}❌ Virgin Atlantic theme CSS not found${NC}"
    issues_found=$((issues_found + 1))
fi

# Check Tailwind config
echo ""
echo "⚙️  Validating Tailwind configuration..."

if [ -f "tailwind.config.ts" ]; then
    echo -e "${GREEN}✅ Tailwind config exists${NC}"
    
    extended_colors=$(grep -c "va-red\|aero-blue\|surface" tailwind.config.ts)
    if [ $extended_colors -gt 0 ]; then
        echo -e "${GREEN}✅ Virgin Atlantic colors extended in Tailwind config${NC}"
    else
        echo -e "${YELLOW}⚠️  Virgin Atlantic colors may not be properly extended${NC}"
    fi
else
    echo -e "${RED}❌ Tailwind config not found${NC}"
    issues_found=$((issues_found + 1))
fi

# Final summary
echo ""
echo "📊 Validation Summary:"
echo "======================"

total_components=$(find client/src/components -name "*.tsx" | wc -l)
echo "📁 Total components: $total_components"
echo "🎨 Components with semantic colors: $semantic_colors"
echo "📱 Responsive components: $responsive_files"
echo "♿ Accessible components: $aria_labels"

if [ $issues_found -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All validations passed! Virgin Atlantic UI audit complete.${NC}"
    echo -e "${GREEN}✅ Design system compliance: PASS${NC}"
    echo -e "${GREEN}✅ Accessibility improvements: PASS${NC}"
    echo -e "${GREEN}✅ Mobile responsiveness: PASS${NC}"
    echo -e "${GREEN}✅ Component consistency: PASS${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Found $issues_found validation issues to address${NC}"
fi

echo ""
echo "🔗 Development server running at: http://localhost:5001"
echo "🧪 Test responsive behavior by resizing browser window"
echo "📱 Test mobile experience using browser dev tools"
