#!/usr/bin/env node

/**
 * Build Check Script
 * Run this before deploying to identify potential issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for common build issues...\n');

let hasErrors = false;

// Check 1: Duplicate exports in API routes
console.log('1. Checking for duplicate exports in API routes...');
const apiDir = path.join(__dirname, 'src', 'app', 'api');
if (fs.existsSync(apiDir)) {
  const files = fs.readdirSync(apiDir, { recursive: true });
  const routeFiles = files.filter(f => f.endsWith('route.ts'));
  
  routeFiles.forEach(file => {
    const filePath = path.join(apiDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for duplicate GET
    const getMatches = content.match(/export\s+(async\s+)?function\s+GET/g);
    if (getMatches && getMatches.length > 1) {
      console.log(`   ❌ ${file}: Multiple GET functions found`);
      hasErrors = true;
    }
    
    // Check for duplicate POST
    const postMatches = content.match(/export\s+(async\s+)?function\s+POST/g);
    if (postMatches && postMatches.length > 1) {
      console.log(`   ❌ ${file}: Multiple POST functions found`);
      hasErrors = true;
    }
  });
  
  if (!hasErrors) {
    console.log('   ✅ No duplicate exports found');
  }
}

// Check 2: Large video files
console.log('\n2. Checking video file sizes...');
const videosDir = path.join(__dirname, 'public', 'videos');
if (fs.existsSync(videosDir)) {
  const videos = fs.readdirSync(videosDir).filter(f => f.endsWith('.mp4'));
  let hasLargeFiles = false;
  
  videos.forEach(video => {
    const videoPath = path.join(videosDir, video);
    const stats = fs.statSync(videoPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    if (stats.size > 100 * 1024 * 1024) {
      console.log(`   ⚠️  ${video}: ${sizeMB}MB (exceeds 100MB limit)`);
      hasLargeFiles = true;
    } else {
      console.log(`   ✅ ${video}: ${sizeMB}MB`);
    }
  });
  
  if (hasLargeFiles) {
    console.log('   ⚠️  Some videos exceed Vercel\'s 100MB limit');
  }
} else {
  console.log('   ℹ️  No videos directory found');
}

// Check 3: Required files
console.log('\n3. Checking required configuration files...');
const requiredFiles = [
  'package.json',
  'next.config.ts',
  'tsconfig.json',
  'vercel.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} missing`);
    hasErrors = true;
  }
});

// Check 4: Environment variables in next.config
console.log('\n4. Checking next.config.ts...');
const nextConfigPath = path.join(__dirname, 'next.config.ts');
if (fs.existsSync(nextConfigPath)) {
  const config = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (config.includes('ignoreBuildErrors: true')) {
    console.log('   ✅ TypeScript errors will be ignored during build');
  }
  
  if (config.includes('ignoreDuringBuilds: true')) {
    console.log('   ✅ ESLint errors will be ignored during build');
  }
  
  if (config.includes('VERCEL')) {
    console.log('   ✅ PWA is conditionally disabled on Vercel');
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Issues found! Please fix them before deploying.');
  process.exit(1);
} else {
  console.log('✅ No obvious issues found. Ready to build!');
  console.log('\nRun: npm run build');
  process.exit(0);
}

