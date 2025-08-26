/**
 * Service Worker for Pennine WMS
 * Optimized caching strategy for authentication and critical resources
 */

const CACHE_NAME = 'pennine-wms-v1';
const STATIC_CACHE_NAME = 'pennine-static-v1';
const DYNAMIC_CACHE_NAME = 'pennine-dynamic-v1';

// Critical resources for immediate caching
const CRITICAL_RESOURCES = [
  '/',
  '/main-login',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/js/',
  '/images/logo.png'
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = {
  auth: /^\/api\/auth\//,
  graphql: /^\/api\/graphql$/,
  static: /\.(js|css|png|jpg|jpeg|gif|svg|webp|avif|woff2?)$/
};

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Pre-cache critical resources
      caches.open(STATIC_CACHE_NAME).then(cache => {
        return cache.addAll(CRITICAL_RESOURCES.filter(url => 
          !url.includes('_next/static') // Skip Next.js chunks for now
        ));
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  event.respondWith(handleFetch(request, url));
});

async function handleFetch(request, url) {
  const pathname = url.pathname;
  
  try {
    // Strategy 1: Critical static resources - Cache First
    if (API_CACHE_PATTERNS.static.test(pathname)) {
      return await cacheFirstStrategy(request, STATIC_CACHE_NAME);
    }
    
    // Strategy 2: Authentication pages - Network First with fast fallback
    if (pathname.startsWith('/main-login') || pathname === '/') {
      return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME, 2000);
    }
    
    // Strategy 3: API routes - Network Only with error handling
    if (pathname.startsWith('/api/')) {
      return await networkOnlyStrategy(request);
    }
    
    // Strategy 4: Next.js static assets - Cache First with long TTL
    if (pathname.startsWith('/_next/static/')) {
      return await cacheFirstStrategy(request, STATIC_CACHE_NAME, 31536000); // 1 year
    }
    
    // Strategy 5: Default - Network First
    return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME, 5000);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    
    // Fallback for critical pages
    if (pathname.startsWith('/main-login') || pathname === '/') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return network error
    return new Response(
      JSON.stringify({ error: 'Network unavailable' }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache First Strategy - Best for static resources
async function cacheFirstStrategy(request, cacheName, maxAge = 3600) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('date'));
    const now = new Date();
    const age = (now - cachedDate) / 1000;
    
    if (age < maxAge) {
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Network First Strategy - Best for dynamic content
async function networkFirstStrategy(request, cacheName, timeout = 3000) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), timeout)
      )
    ]);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.warn('[SW] Network failed, trying cache:', error.message);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Network Only Strategy - Best for API calls
async function networkOnlyStrategy(request) {
  const response = await fetch(request);
  
  // Log API performance
  const timing = performance.now();
  console.log(`[SW] API call to ${request.url} took ${timing}ms`);
  
  return response;
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CACHE_CLEAR':
      handleCacheClear(payload);
      break;
    case 'CACHE_WARM':
      handleCacheWarm(payload);
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

async function handleCacheClear(cacheName) {
  try {
    const deleted = await caches.delete(cacheName || DYNAMIC_CACHE_NAME);
    console.log('[SW] Cache cleared:', deleted);
    
    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_CLEARED',
        cacheName
      });
    });
  } catch (error) {
    console.error('[SW] Cache clear error:', error);
  }
}

async function handleCacheWarm(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const promises = urls.map(url => {
      return fetch(url)
        .then(response => {
          if (response.ok) {
            return cache.put(url, response);
          }
        })
        .catch(error => {
          console.warn('[SW] Cache warm failed for:', url, error.message);
        });
    });
    
    await Promise.allSettled(promises);
    console.log('[SW] Cache warmed for', urls.length, 'URLs');
  } catch (error) {
    console.error('[SW] Cache warm error:', error);
  }
}