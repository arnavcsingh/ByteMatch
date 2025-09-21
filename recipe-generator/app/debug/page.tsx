"use client";

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [recipes, setRecipes] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/recipes');
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    }
    setLoading(false);
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/user-data');
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Information</h1>
        
        <div className="grid gap-6">
          {/* Recipes Debug */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Database Recipes</h2>
              <button
                onClick={fetchRecipes}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Fetch Recipes'}
              </button>
            </div>
            
            {recipes && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Total recipes in database: {recipes.count}
                </p>
                <div className="max-h-60 overflow-y-auto">
                  {recipes.recipes.map((recipe: any, index: number) => (
                    <div key={index} className="p-2 border-b border-gray-100">
                      <div className="font-medium">{recipe.title}</div>
                      <div className="text-sm text-gray-500">ID: {recipe.id}</div>
                      <div className="text-xs text-gray-400">
                        Created: {new Date(recipe.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Data Debug */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">User Data</h2>
              <button
                onClick={fetchUserData}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Fetch User Data'}
              </button>
            </div>
            
            {userData && (
              <div>
                <div className="mb-4 p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold">User Info</h3>
                  <p>Name: {userData.user.name}</p>
                  <p>Email: {userData.user.email}</p>
                  <p>Favorites Count: {userData.user.favoritesCount}</p>
                  <p>History Count: {userData.user.historyCount}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Favorites</h3>
                    <div className="max-h-40 overflow-y-auto">
                      {userData.favorites.recipes.map((recipe: any, index: number) => (
                        <div key={index} className="p-2 border-b border-gray-100 text-sm">
                          <div className="font-medium">{recipe.title}</div>
                          <div className="text-gray-500">ID: {recipe.id}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">History</h3>
                    <div className="max-h-40 overflow-y-auto">
                      {userData.history.recipes.map((recipe: any, index: number) => (
                        <div key={index} className="p-2 border-b border-gray-100 text-sm">
                          <div className="font-medium">{recipe.title}</div>
                          <div className="text-gray-500">ID: {recipe.id}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


