#!/bin/bash

# Render build script for free tier
echo "🚀 Starting Render build for C++ + Python + JavaScript..."

# Update package list
apt-get update

# Install Python (usually available, lightweight)
echo "📦 Installing Python..."
python3 --version || apt-get install -y python3

# Install C++ compiler (essential, relatively lightweight)
echo "🔧 Installing C++ compiler..."
apt-get install -y build-essential g++ || echo "⚠️ C++ installation failed"

# Try to install minimal Java (OpenJDK headless - smaller)
echo "☕ Attempting minimal Java installation..."
apt-get install -y openjdk-11-jre-headless openjdk-11-jdk-headless || echo "⚠️ Java installation failed - will skip Java support"

# Verify installations
echo "🔍 Verifying installations..."
python3 --version && echo "✅ Python OK"
g++ --version && echo "✅ C++ OK" 
java -version && javac -version && echo "✅ Java OK" || echo "❌ Java not available"

# Skip PHP completely
echo "🚫 Skipping PHP (not needed)"

# Clean up package cache to save space
apt-get clean
rm -rf /var/lib/apt/lists/*

# Install Node dependencies
echo "📦 Installing Node dependencies..."
npm install

echo "✅ Build completed - C++, Python, JavaScript + (Java if successful)"