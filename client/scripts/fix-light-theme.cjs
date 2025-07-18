#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define dark-to-light theme mappings
const themeReplacements = [
  // Background gradients
  { from: /bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900/g, to: 'bg-gray-50' },
  { from: /bg-gradient-to-br from-slate-900 to-blue-900/g, to: 'bg-white' },
  { from: /bg-gradient-to-br from-slate-900 to-slate-800/g, to: 'bg-gray-50' },
  
  // Solid dark backgrounds
  { from: /bg-gray-900/g, to: 'bg-white' },
  { from: /bg-slate-900/g, to: 'bg-white' },
  { from: /bg-slate-800/g, to: 'bg-gray-50' },
  { from: /bg-slate-700/g, to: 'bg-gray-100' },
  { from: /bg-slate-600/g, to: 'bg-gray-200' },
  
  // Semi-transparent backgrounds
  { from: /bg-white\/10/g, to: 'bg-white shadow-lg' },
  { from: /bg-white\/20/g, to: 'bg-gray-50 border border-gray-200' },
  { from: /bg-white\/5/g, to: 'bg-gray-50' },
  
  // Text colors
  { from: /text-white(?![a-zA-Z0-9-])/g, to: 'text-gray-900' },
  { from: /text-blue-200/g, to: 'text-gray-600' },
  { from: /text-blue-300/g, to: 'text-gray-700' },
  { from: /text-slate-300/g, to: 'text-gray-600' },
  { from: /text-slate-400/g, to: 'text-gray-500' },
  { from: /text-green-300/g, to: 'text-green-600' },
  { from: /text-green-400/g, to: 'text-green-600' },
  { from: /text-yellow-400/g, to: 'text-va-red-primary' },
  
  // Borders
  { from: /border-white\/20/g, to: 'border-gray-200' },
  { from: /border-white\/30/g, to: 'border-gray-300' },
  { from: /border-slate-700/g, to: 'border-gray-200' },
  { from: /border-slate-600/g, to: 'border-gray-300' },
  
  // Hover states
  { from: /hover:bg-slate-800/g, to: 'hover:bg-gray-100' },
  { from: /hover:bg-slate-700/g, to: 'hover:bg-gray-200' },
  { from: /hover:bg-slate-600/g, to: 'hover:bg-gray-300' },
  
  // Dark mode variants (remove them)
  { from: /dark:bg-[a-zA-Z0-9\-\/]+/g, to: '' },
  { from: /dark:text-[a-zA-Z0-9\-\/]+/g, to: '' },
  { from: /dark:border-[a-zA-Z0-9\-\/]+/g, to: '' },
  { from: /dark:hover:[a-zA-Z0-9\-\/]+/g, to: '' },
  
  // Backdrop blur (keep for glass effect)
  { from: /backdrop-blur-lg/g, to: 'shadow-lg' },
  { from: /backdrop-blur-sm/g, to: 'shadow-sm' },
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    themeReplacements.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        changed = true;
      }
    });
    
    // Clean up multiple spaces
    content = content.replace(/\s+/g, ' ');
    content = content.replace(/className="[^"]*\s+"/g, (match) => {
      return match.replace(/\s+/g, ' ').replace(/\s+"/g, '"');
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Process all TypeScript/JavaScript files in src
const files = glob.sync('client/src/**/*.{ts,tsx,js,jsx}', { 
  ignore: ['**/node_modules/**', '**/*.d.ts', '**/scripts/**'] 
});

console.log(`🔍 Processing ${files.length} files...`);

files.forEach(fixFile);

console.log('✨ Theme fix complete!');
