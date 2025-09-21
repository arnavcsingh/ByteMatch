#!/usr/bin/env node

/**
 * Test script to verify Ollama is running and Mistral model is available
 * Run with: node scripts/test-ollama.js
 */

const http = require('http');

async function testOllamaConnection() {
  console.log('🔍 Testing Ollama Connection...');
  
  try {
    // Test if Ollama is running
    const response = await fetch('http://localhost:11434/api/tags');
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Ollama is running!');
    
    // Check if Mistral model is available
    const models = data.models || [];
    const mistralModel = models.find(model => model.name.includes('mistral'));
    
    if (mistralModel) {
      console.log(`✅ Mistral model found: ${mistralModel.name}`);
      console.log(`   Size: ${(mistralModel.size / 1024 / 1024 / 1024).toFixed(2)} GB`);
      console.log(`   Modified: ${new Date(mistralModel.modified_at).toLocaleString()}`);
    } else {
      console.log('❌ Mistral model not found!');
      console.log('   Available models:', models.map(m => m.name).join(', '));
      console.log('   Run: ollama pull mistral');
    }
    
    // Test a simple generation
    console.log('\n🧪 Testing Mistral generation...');
    const testResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        prompt: 'What is 2+2?',
        stream: false,
      }),
    });
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Mistral generation test successful!');
      console.log(`   Response: ${testData.response}`);
    } else {
      console.log('❌ Mistral generation test failed!');
    }
    
  } catch (error) {
    console.log('❌ Ollama connection failed!');
    console.log('   Error:', error.message);
    console.log('\n📋 Troubleshooting:');
    console.log('   1. Make sure Ollama is installed: https://ollama.ai/');
    console.log('   2. Start Ollama: ollama serve');
    console.log('   3. Pull Mistral model: ollama pull mistral');
    console.log('   4. Check if Ollama is running on port 11434');
  }
}

testOllamaConnection();
