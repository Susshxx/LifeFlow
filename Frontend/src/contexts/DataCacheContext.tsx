import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CacheData {
  [key: string]: {
    data: any;
    timestamp: number;
  };
}

interface DataCacheContextType {
  getCache: (key: string, maxAge?: number) => any | null;
  setCache: (key: string, data: any) => void;
  clearCache: (key?: string) => void;
  invalidateCache: (pattern?: string) => void;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes default

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<CacheData>({});

  const getCache = (key: string, maxAge: number = CACHE_DURATION) => {
    const cached = cache[key];
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      // Cache expired
      return null;
    }
    
    return cached.data;
  };

  const setCacheData = (key: string, data: any) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now(),
      },
    }));
  };

  const clearCache = (key?: string) => {
    if (key) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
    } else {
      setCache({});
    }
  };

  const invalidateCache = (pattern?: string) => {
    if (!pattern) {
      setCache({});
      return;
    }
    
    setCache(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (key.includes(pattern)) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  };

  return (
    <DataCacheContext.Provider value={{ getCache, setCache: setCacheData, clearCache, invalidateCache }}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within DataCacheProvider');
  }
  return context;
}
