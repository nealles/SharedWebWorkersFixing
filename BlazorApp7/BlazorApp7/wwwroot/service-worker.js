
//console.log('[SW] Script 2 loaded');

self.addEventListener('install', function (event) {
    //console.log('[SW] Install event');
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    //console.log('[SW] Activate event');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
    const url = new URL(event.request.url);

    //console.log('[SW] Fetch:', url.pathname);

    // Skip debug, hot-reload and source maps
    if (url.pathname.includes('_framework/debug') ||
        url.pathname.includes('_framework/blazor-hotreload') ||
        url.pathname.endsWith('.map')) {
        //console.log('[SW] Skip:', url.pathname);
        return;
    }

    // Handle navigation and framework requests
    if (event.request.mode === 'navigate' || url.pathname.includes('_framework/')) {
        //console.log('[SW] Intercepting:', url.pathname);

        event.respondWith(
            fetch(event.request)
                .then(function (response) {
                    //console.log('[SW] Response status:', response.status);

                    // Clone response to avoid consuming it
                    const responseClone = response.clone();

                    // Create new headers
                    const newHeaders = new Headers();

                    // Copy existing headers
                    responseClone.headers.forEach(function (value, key) {
                        if (!['content-length', 'content-encoding'].includes(key.toLowerCase())) {
                            newHeaders.set(key, value);
                        }
                    });

                    // Add required headers for threading
                    newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
                    newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

                    //console.log('[SW] Headers added for:', url.pathname);

                    // Return modified response
                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders
                    });
                })
                .catch(function (error) {
                    console.error('[SW] Fetch error for', url.pathname, ':', error);
                    // Fallback: try to fetch again without interception
                    return fetch(event.request);
                })
        );
    } else {
        // Don't intercept other requests
        //console.log('[SW] Passthrough:', url.pathname);
        return;
    }
});