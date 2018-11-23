

// Set a name for the current cache
var cacheName = 'v1'; 

// Default files to always cache
var cacheFiles = [
	'./',
	'/index.html',
	'/restaurant.html',
	'/js/main.js',
	'/js/restaurant_info.js',
	'/js/idb.js',
	'/css/styles.css',
	'/css/review-styles.css',
	'/css/star_rating.css',
	'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
	'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
	'/js/dbhelper.js',
	'/manifest.json',
	'./img/1.jpg',
	'./img/2.jpg',
	'./img/3.jpg',
	'./img/4.jpg',
	'./img/5.jpg',
	'./img/6.jpg',
	'./img/7.jpg',
	'./img/8.jpg',
	'./img/9.jpg',
	'./img/10.jpg',
	'/sw.js'
]

self.addEventListener('install', function(e) {
	console.log('ServiceWorker Installed');
	 // Delay the event until the Promise is resolved
    e.waitUntil(

    	// Open the cache
	    caches.open(cacheName).then(function(cache) {

	    	// Add all the default files to the cache
			console.log('[ServiceWorker] Caching cacheFiles');
			return cache.addAll(cacheFiles);
	    })
	);
})

self.addEventListener('activate', function(e) {
	e.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.filter(function(cache) {
            return cache.startsWith('restaurant-') &&
                   cache != cacheName;
          }).map(function(cache) {
            return caches.delete(cache);
          })
        );
      })
    );
})

self.addEventListener('fetch', function(e) {
	console.log('ServiceWorker Fetching', e.request.url);
	
	e.respondWith(
		// Check in cache for the request being made
		caches.match(e.request)
			.then(function(response) {

				// If the request is in the cache
				if ( response ) {
					console.log("[ServiceWorker] Found in Cache", e.request.url, response);
					return response;
				}

				// If the request is NOT in the cache, fetch and cache

				var requestClone = e.request.clone();
				return fetch(requestClone)
					.then(function(res) {

						if ( !res || res.status !== 200 || res.type !== 'basic') {
							console.log("[ServiceWorker] No response from fetch ")
							return res;
						}

						var responseClone = res.clone();
						caches.open(cacheName).then(function(cache) {

							// Put the fetched response in the cache
							cache.put(e.request, responseClone);
							console.log('[ServiceWorker] New Data Cached', e.request.url);
							
							return(res);
				        });
				         

					})
					.catch(function(err) {
						console.log('[ServiceWorker] Error Fetching & Caching New Data', err);
					});


			}) 
	); 
})

self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
