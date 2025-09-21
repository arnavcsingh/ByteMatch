import OllamaTest from '@/app/components/ollama-test/OllamaTest';
import OllamaDiagnostics from '@/app/components/ollama-diagnostics/OllamaDiagnostics';

export default function TestOllamaPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ollama Nutrition Calculator Test
          </h1>
          <p className="text-gray-600">
            Test the Ollama + Mistral integration for nutrition calculations
          </p>
        </div>
        
        <div className="space-y-8">
          <OllamaDiagnostics />
          <OllamaTest />
        </div>
        
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">📋 Prerequisites:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Ollama must be installed and running</li>
            <li>• Mistral model must be pulled: <code className="bg-yellow-100 px-1 rounded">ollama pull mistral</code></li>
            <li>• Ollama should be accessible at <code className="bg-yellow-100 px-1 rounded">http://localhost:11434</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
