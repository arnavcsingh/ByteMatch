import fs from 'fs';
import path from 'path';
import { Recipe } from '@/types';

// Database file paths
const DB_DIR = path.join(process.cwd(), 'data');
const USERS_DB = path.join(DB_DIR, 'users.json');
const RECIPES_DB = path.join(DB_DIR, 'recipes.json');
const USER_RECIPES_DB = path.join(DB_DIR, 'user_recipes.json');

// Ensure database directory exists
export function ensureDbExists() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  
  // Initialize empty databases if they don't exist
  if (!fs.existsSync(USERS_DB)) {
    fs.writeFileSync(USERS_DB, JSON.stringify({}, null, 2));
  }
  
  if (!fs.existsSync(RECIPES_DB)) {
    fs.writeFileSync(RECIPES_DB, JSON.stringify({}, null, 2));
  }
  
  if (!fs.existsSync(USER_RECIPES_DB)) {
    fs.writeFileSync(USER_RECIPES_DB, JSON.stringify({}, null, 2));
  }
}

// User interface
export interface User {
  id: string;
  email: string;
  password: string; // In production, this should be hashed
  name: string;
  createdAt: string;
  favorites: string[];
  history: string[];
}

// User recipe data interface
export interface UserRecipeData {
  userId: string;
  favorites: string[];
  history: string[];
  customRecipes: Recipe[];
}

// Database operations
export class Database {
  private static instance: Database;
  
  private constructor() {
    ensureDbExists();
  }
  
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
  
  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'favorites' | 'history'>): Promise<User> {
    const users = this.readUsers();
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newUser: User = {
      id: userId,
      ...userData,
      createdAt: new Date().toISOString(),
      favorites: [],
      history: []
    };
    
    users[userId] = newUser;
    this.writeUsers(users);
    
    return newUser;
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    const users = this.readUsers();
    const user = Object.values(users).find(u => u.email === email);
    return user || null;
  }
  
  async getUserById(id: string): Promise<User | null> {
    const users = this.readUsers();
    return users[id] || null;
  }
  
  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const users = this.readUsers();
    if (!users[userId]) return null;
    
    users[userId] = { ...users[userId], ...updates };
    this.writeUsers(users);
    
    return users[userId];
  }
  
  // Recipe operations
  async saveRecipe(recipe: Recipe): Promise<void> {
    const recipes = this.readRecipes();
    recipes[recipe.id] = recipe;
    this.writeRecipes(recipes);
  }
  
  async getRecipe(recipeId: string): Promise<Recipe | null> {
    const recipes = this.readRecipes();
    return recipes[recipeId] || null;
  }
  
  async getRecipes(recipeIds: string[]): Promise<Recipe[]> {
    const recipes = this.readRecipes();
    return recipeIds.map(id => recipes[id]).filter(Boolean);
  }
  
  // User recipe data operations
  async getUserRecipeData(userId: string): Promise<UserRecipeData> {
    const userRecipes = this.readUserRecipes();
    return userRecipes[userId] || {
      userId,
      favorites: [],
      history: [],
      customRecipes: []
    };
  }
  
  async updateUserFavorites(userId: string, favorites: string[]): Promise<void> {
    const userRecipes = this.readUserRecipes();
    if (!userRecipes[userId]) {
      userRecipes[userId] = {
        userId,
        favorites: [],
        history: [],
        customRecipes: []
      };
    }
    
    userRecipes[userId].favorites = favorites;
    this.writeUserRecipes(userRecipes);
  }
  
  async updateUserHistory(userId: string, history: string[]): Promise<void> {
    const userRecipes = this.readUserRecipes();
    if (!userRecipes[userId]) {
      userRecipes[userId] = {
        userId,
        favorites: [],
        history: [],
        customRecipes: []
      };
    }
    
    userRecipes[userId].history = history;
    this.writeUserRecipes(userRecipes);
  }
  
  async addToUserHistory(userId: string, recipeId: string): Promise<void> {
    const userData = await this.getUserRecipeData(userId);
    const history = userData.history;
    
    // Remove if already exists and add to front
    const filteredHistory = history.filter(id => id !== recipeId);
    const newHistory = [recipeId, ...filteredHistory].slice(0, 50); // Keep last 50
    
    await this.updateUserHistory(userId, newHistory);
  }
  
  async toggleUserFavorite(userId: string, recipeId: string): Promise<boolean> {
    const userData = await this.getUserRecipeData(userId);
    const favorites = userData.favorites;
    
    const isFavorite = favorites.includes(recipeId);
    let newFavorites: string[];
    
    if (isFavorite) {
      newFavorites = favorites.filter(id => id !== recipeId);
    } else {
      newFavorites = [...favorites, recipeId];
    }
    
    await this.updateUserFavorites(userId, newFavorites);
    return !isFavorite;
  }
  
  // File I/O helpers
  private readUsers(): Record<string, User> {
    try {
      const data = fs.readFileSync(USERS_DB, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users database:', error);
      return {};
    }
  }
  
  private writeUsers(users: Record<string, User>): void {
    try {
      fs.writeFileSync(USERS_DB, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error writing users database:', error);
    }
  }
  
  private readRecipes(): Record<string, Recipe> {
    try {
      const data = fs.readFileSync(RECIPES_DB, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading recipes database:', error);
      return {};
    }
  }
  
  private writeRecipes(recipes: Record<string, Recipe>): void {
    try {
      fs.writeFileSync(RECIPES_DB, JSON.stringify(recipes, null, 2));
    } catch (error) {
      console.error('Error writing recipes database:', error);
    }
  }
  
  private readUserRecipes(): Record<string, UserRecipeData> {
    try {
      const data = fs.readFileSync(USER_RECIPES_DB, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading user recipes database:', error);
      return {};
    }
  }
  
  private writeUserRecipes(userRecipes: Record<string, UserRecipeData>): void {
    try {
      fs.writeFileSync(USER_RECIPES_DB, JSON.stringify(userRecipes, null, 2));
    } catch (error) {
      console.error('Error writing user recipes database:', error);
    }
  }
}

export const db = Database.getInstance();
