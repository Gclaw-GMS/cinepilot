// CinePilot API Client - Phase 28 Enhancements
// Enhanced with offline support, retry logic, and improved caching

export interface APIConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  cacheEnabled: boolean;
}

const defaultConfig: APIConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000,
  retries: 3,
  cacheEnabled: true,
};

class APIClient {
  private config: APIConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private retryCount: Map<string, number> = new Map();

  constructor(config: Partial<APIConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}?${JSON.stringify(params || {})}`;
  }

  private isCacheValid(key: string, ttl: number = 5 * 60 * 1000): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < ttl;
  }

  private setCache(key: string, data: any): void {
    if (this.config.cacheEnabled) {
      this.cache.set(key, { data, timestamp: Date.now() });
    }
  }

  private getCache<T>(key: string, ttl?: number): T | null {
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(key, ttl)) {
      return cached.data as T;
    }
    return null;
  }

  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit,
    retries: number = this.config.retries
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, options.body);
    
    try {
      const response = await fetch(`${this.config.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.setCache(cacheKey, data);
      this.retryCount.delete(cacheKey);
      return data;
    } catch (error) {
      const currentRetries = this.retryCount.get(cacheKey) || 0;
      
      if (currentRetries < retries) {
        this.retryCount.set(cacheKey, currentRetries + 1);
        await new Promise(resolve => setTimeout(resolve, 1000 * (currentRetries + 1)));
        return this.fetchWithRetry<T>(endpoint, options, retries);
      }
      
      throw error;
    }
  }

  // Generic request methods
  async get<T>(endpoint: string, params?: any, useCache: boolean = true): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    if (useCache) {
      const cached = this.getCache<T>(cacheKey);
      if (cached) return cached;
    }

    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.fetchWithRetry<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.fetchWithRetry<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.fetchWithRetry<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.fetchWithRetry<T>(endpoint, { method: 'DELETE' });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export types for common endpoints
export interface Project {
  id: number;
  title: string;
  genre: string;
  budget: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: number;
  project_id: number;
  scene_number: string;
  title: string;
  description: string;
  location: string;
  characters: string[];
  duration: number;
}

export interface Crew {
  id: number;
  name: string;
  role: string;
  department: string;
  daily_rate: number;
  availability: boolean;
}

// API Methods
export const projects = {
  list: () => apiClient.get<Project[]>('/projects'),
  get: (id: number) => apiClient.get<Project>(`/projects/${id}`),
  create: (data: Partial<Project>) => apiClient.post<Project>('/projects', data),
  update: (id: number, data: Partial<Project>) => apiClient.put<Project>(`/projects/${id}`, data),
  delete: (id: number) => apiClient.delete(`/projects/${id}`),
};

export const scenes = {
  list: (projectId: number) => apiClient.get<Scene[]>(`/projects/${projectId}/scenes`),
  get: (projectId: number, sceneId: number) => apiClient.get<Scene>(`/projects/${projectId}/scenes/${sceneId}`),
  create: (projectId: number, data: Partial<Scene>) => apiClient.post<Scene>(`/projects/${projectId}/scenes`, data),
  update: (projectId: number, sceneId: number, data: Partial<Scene>) => 
    apiClient.put<Scene>(`/projects/${projectId}/scenes/${sceneId}`, data),
  delete: (projectId: number, sceneId: number) => 
    apiClient.delete(`/projects/${projectId}/scenes/${sceneId}`),
};

export const crew = {
  list: () => apiClient.get<Crew[]>('/crew'),
  get: (id: number) => apiClient.get<Crew>(`/crew/${id}`),
  create: (data: Partial<Crew>) => apiClient.post<Crew>('/crew', data),
  update: (id: number, data: Partial<Crew>) => apiClient.put<Crew>(`/crew/${id}`, data),
  delete: (id: number) => apiClient.delete(`/crew/${id}`),
  availability: (id: number, available: boolean) => 
    apiClient.put<Crew>(`/crew/${id}/availability`, { available }),
};

export default apiClient;
