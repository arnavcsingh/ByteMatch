"use client";

import { useState } from 'react';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function OllamaDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    const newResults: DiagnosticResult[] = [];

    // Test 1: Check if Ollama is running
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        newResults.push({
          test: 'Ollama Connection',
          status: 'success',
          message: 'Ollama is running and accessible',
        });
      } else {
        newResults.push({
          test: 'Ollama Connection',
          status: 'error',
          message: `Ollama returned status ${response.status}`,
          details: 'Please ensure Ollama is running: ollama serve',
        });
      }
    } catch (error) {
      newResults.push({
        test: 'Ollama Connection',
        status: 'error',
        message: 'Cannot connect to Ollama',
        details: 'Please install and start Ollama: ollama serve',
      });
    }

    // Test 2: Check available models
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        const models = data.models || [];
        
        if (models.length === 0) {
          newResults.push({
            test: 'Available Models',
            status: 'warning',
            message: 'No models found',
            details: 'Please pull a model: ollama pull mistral',
          });
        } else {
          const modelNames = models.map((m: any) => m.name).join(', ');
          newResults.push({
            test: 'Available Models',
            status: 'success',
            message: `Found ${models.length} model(s)`,
            details: modelNames,
          });
        }
      }
    } catch (error) {
      newResults.push({
        test: 'Available Models',
        status: 'error',
        message: 'Failed to check models',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 3: Check for Mistral model
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        const models = data.models || [];
        const mistralModel = models.find((model: any) => model.name.includes('mistral'));
        
        if (mistralModel) {
          newResults.push({
            test: 'Mistral Model',
            status: 'success',
            message: 'Mistral model found',
            details: `${mistralModel.name} (${(mistralModel.size / 1024 / 1024 / 1024).toFixed(2)} GB)`,
          });
        } else {
          newResults.push({
            test: 'Mistral Model',
            status: 'error',
            message: 'Mistral model not found',
            details: 'Please run: ollama pull mistral',
          });
        }
      }
    } catch (error) {
      newResults.push({
        test: 'Mistral Model',
        status: 'error',
        message: 'Failed to check for Mistral',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 4: Test simple generation
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
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

      if (response.ok) {
        const data = await response.json();
        newResults.push({
          test: 'Mistral Generation',
          status: 'success',
          message: 'Mistral generation test successful',
          details: `Response: ${data.response?.substring(0, 100)}...`,
        });
      } else {
        newResults.push({
          test: 'Mistral Generation',
          status: 'error',
          message: `Generation failed with status ${response.status}`,
          details: 'Check if Mistral model is properly installed',
        });
      }
    } catch (error) {
      newResults.push({
        test: 'Mistral Generation',
        status: 'error',
        message: 'Generation test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 5: Test our API endpoint
    try {
      const response = await fetch('/api/ollama-nutrition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: ['1 cup flour', '1 tbsp olive oil'],
          servings: 2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        newResults.push({
          test: 'Nutrition API',
          status: 'success',
          message: 'Nutrition API test successful',
          details: `Calculated ${data.nutrition?.calories} calories per serving`,
        });
      } else {
        const errorData = await response.json();
        newResults.push({
          test: 'Nutrition API',
          status: 'error',
          message: `API test failed with status ${response.status}`,
          details: errorData.error || 'Unknown error',
        });
      }
    } catch (error) {
      newResults.push({
        test: 'Nutrition API',
        status: 'error',
        message: 'API test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    setResults(newResults);
    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🔍 Ollama Diagnostics</h2>
      
      <button
        onClick={runDiagnostics}
        disabled={isRunning}
        className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 mb-6"
      >
        {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
      </button>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
            >
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">{getStatusIcon(result.status)}</span>
                <h3 className="font-semibold">{result.test}</h3>
              </div>
              <p className="text-sm mb-1">{result.message}</p>
              {result.details && (
                <p className="text-xs opacity-75">{result.details}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-bold text-gray-800 mb-2">📋 Quick Setup Commands:</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <div><code className="bg-gray-200 px-2 py-1 rounded">ollama serve</code> - Start Ollama service</div>
          <div><code className="bg-gray-200 px-2 py-1 rounded">ollama pull mistral</code> - Download Mistral model</div>
          <div><code className="bg-gray-200 px-2 py-1 rounded">ollama list</code> - List available models</div>
        </div>
      </div>
    </div>
  );
}
