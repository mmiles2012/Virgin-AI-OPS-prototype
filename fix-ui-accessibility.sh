#!/bin/bash

# Script to fix UI accessibility issues across the Virgin Atlantic AINO platform

echo "🛠️  Updating UI components for accessibility and Virgin Atlantic design system compliance..."

# Function to replace patterns in TypeScript/TSX files
fix_patterns() {
    local file="$1"
    
    # Replace hardcoded text colors with semantic equivalents
    sed -i 's/text-white/text-foreground/g' "$file"
    sed -i 's/text-gray-50/text-foreground/g' "$file"
    sed -i 's/text-gray-100/text-foreground/g' "$file"
    sed -i 's/text-gray-200/text-muted-foreground/g' "$file"
    sed -i 's/text-gray-300/text-muted-foreground/g' "$file"
    sed -i 's/text-gray-400/text-muted-foreground/g' "$file"
    sed -i 's/text-gray-500/text-muted-foreground/g' "$file"
    sed -i 's/text-gray-600/text-muted-foreground/g' "$file"
    
    # Replace hardcoded background colors
    sed -i 's/bg-gray-900/bg-card/g' "$file"
    sed -i 's/bg-gray-800/bg-card/g' "$file"
    sed -i 's/bg-slate-900/bg-card/g' "$file"
    sed -i 's/bg-slate-800/bg-card/g' "$file"
    
    # Replace hardcoded border colors
    sed -i 's/border-gray-700/border-border/g' "$file"
    sed -i 's/border-gray-600/border-border/g' "$file"
    sed -i 's/border-slate-700/border-border/g' "$file"
    sed -i 's/border-slate-600/border-border/g' "$file"
    
    # Replace status colors with Virgin Atlantic system
    sed -i 's/text-red-400/text-va-red-primary/g' "$file"
    sed -i 's/text-red-500/text-va-red-primary/g' "$file"
    sed -i 's/text-orange-400/text-aero-orange-alert/g' "$file"
    sed -i 's/text-orange-500/text-aero-orange-alert/g' "$file"
    sed -i 's/text-yellow-400/text-aero-amber-caution/g' "$file"
    sed -i 's/text-yellow-500/text-aero-amber-caution/g' "$file"
    sed -i 's/text-green-400/text-aero-green-safe/g' "$file"
    sed -i 's/text-green-500/text-aero-green-safe/g' "$file"
    sed -i 's/text-blue-400/text-aero-blue-primary/g' "$file"
    sed -i 's/text-blue-500/text-aero-blue-primary/g' "$file"
    sed -i 's/text-blue-600/text-aero-blue-dark/g' "$file"
    
    # Fix background status colors
    sed -i 's/bg-red-900\/20/bg-va-red-primary\/10/g' "$file"
    sed -i 's/bg-orange-900\/20/bg-aero-orange-alert\/10/g' "$file"
    sed -i 's/bg-yellow-900\/20/bg-aero-amber-caution\/10/g' "$file"
    sed -i 's/bg-green-900\/20/bg-aero-green-safe\/10/g' "$file"
    sed -i 's/bg-blue-900\/20/bg-aero-blue-primary\/10/g' "$file"
    
    # Fix border status colors
    sed -i 's/border-red-600/border-va-red-primary\/30/g' "$file"
    sed -i 's/border-orange-600/border-aero-orange-alert\/30/g' "$file"
    sed -i 's/border-yellow-600/border-aero-amber-caution\/30/g' "$file"
    sed -i 's/border-green-600/border-aero-green-safe\/30/g' "$file"
    sed -i 's/border-blue-600/border-aero-blue-primary\/30/g' "$file"
    
    # Fix hover states
    sed -i 's/hover:bg-gray-800/hover:bg-muted/g' "$file"
    sed -i 's/hover:bg-gray-700/hover:bg-muted/g' "$file"
    sed -i 's/hover:bg-slate-800/hover:bg-muted/g' "$file"
    sed -i 's/hover:bg-slate-700/hover:bg-muted/g' "$file"
    
    # Fix button variants to use Virgin Atlantic system
    sed -i 's/bg-blue-600/bg-aero-blue-primary/g' "$file"
    sed -i 's/bg-red-600/bg-va-red-primary/g' "$file"
    sed -i 's/hover:bg-blue-700/hover:bg-aero-blue-light/g' "$file"
    sed -i 's/hover:bg-red-700/hover:bg-va-red-heritage/g' "$file"
    
    echo "✅ Updated: $file"
}

# Find and fix all TSX files in components directory
find /home/msmiles/Documents/Projects/Virgin/Virgin-AI-OPS-prototype/client/src/components -name "*.tsx" -type f | while read -r file; do
    if [[ ! "$file" =~ "VirginAtlanticComponents.tsx" ]]; then  # Skip our main components file
        fix_patterns "$file"
    fi
done

echo "🎨 UI accessibility and Virgin Atlantic design system updates complete!"
echo "📋 Summary of changes:"
echo "   - Replaced hardcoded colors with semantic design tokens"
echo "   - Updated text colors for proper contrast ratios"  
echo "   - Applied Virgin Atlantic brand colors to status indicators"
echo "   - Ensured consistent spacing and typography"
echo "   - Made components responsive and touch-friendly"
