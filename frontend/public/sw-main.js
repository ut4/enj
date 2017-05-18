'use strict';

if (!self || !(self instanceof ServiceWorkerGlobalScope)) {
    throw new Error('This file is intended to be used as a service worker ' +
        '(window.navigator.serviceWorker.register(<urlToThisFile>)');
}

self.importScripts('sw-src/SWManager.js');

// http://mysite.com/sw.js -> /, http://mysite.com/afoo/sw.js -> /afoo/
self.baseUrl = new URL('./', self.location.href);
// Jos true, disabloi cachen kokonaan (ohittaa kaikkien fetch-eventien
// hijackauksen)
self.isOnline = false;
// Jos true, ohittaa kaikkien, paitsi /api -sisältöisten fetch-eventien
// hijackauksen
self.devMode = false;
// Kasa metodeja, jotka pääasiassa mutatoi self:n statea
var swManager = new SWManager(self);

self.CACHE_NAME = 'enjOffline-v0.0';
self.CACHE_FILES = [
    '',
    'index.html',
    // == Scriptit ========
    'vendor/bundle.js',
    'app.bundle.js',
    // == API-pyynnöt ========
    // (pidettävä päivitettynä manuaalisesti)
    'api/workout',
    // == Teema ===========
    'theme/arrows.png',
    'theme/diagram-icon.svg',
    'theme/dumb-bell-icon.svg',
    'theme/favicon.ico',
    'theme/favicon.png',
    'theme/firasans-heavy-webfont.eot',
    'theme/firasans-heavy-webfont.ttf',
    'theme/firasans-heavy-webfont.woff2',
    'theme/firasans-light-webfont.eot',
    'theme/firasans-light-webfont.ttf',
    'theme/firasans-light-webfont.woff2',
    'theme/icon-sprite.svg',
    'theme/main.css',
    'theme/meal-icon.svg',
    'theme/polygons.png',
    'theme/spinner.gif'
];
self.DYNAMIC_CACHE = [{
    urlMatcher: 'api/program/(\\d+)',
    dataGetter: function (matchCaptures) {
        return swManager.findFromCachedArrayBy(
            'id',
            parseInt(matchCaptures[0], 10),
            'api/program'
        );
    }
}];

// == Workerin staten manipulointi ==
// =============================================================================
self.addEventListener('message', function (event) {
    switch (event.data.action) {
        case 'updateCache' :
            console.log('Saatiin cachen päivityspyyntö', event.data);
            swManager.updateCache(event.data.url, event.data.data)
                .then(function () {
                    event.ports[0].postMessage({ok: true});
                }, function (errorMessage) {
                    event.ports[0].postMessage({error: errorMessage});
                });
            break;
        case 'pushToCache' :
            console.log('Saatiin cachen pushpyyntö', event.data);
            swManager.updateCache(event.data.url, event.data.data)
                .then(function () {
                    event.ports[0].postMessage({ok: true});
                }, function (errorMessage) {
                    event.ports[0].postMessage({error: errorMessage});
                });
            break;
        case 'setIsOnline':
            console.log('Saatiin isOnline päivityspyyntö', event.data);
            swManager.setIsOnline(event.data.value);
            break;
        case 'setDevMode':
            console.log('Saatiin devModen päivityspyyntö', event.data);
            swManager.setDevMode(event.data.value);
            break;
        default :
            console.error('Tuntematon pyyntö ' + event.data.action, event.data);
            break;
    }
});

// == Install ==
// =============================================================================
self.addEventListener('install', function (event) {
    event.waitUntil(
        self.caches.open(self.CACHE_NAME)
            .then(function (cache) {
                return cache.addAll(self.CACHE_FILES.map(function (url) {
                    console.log(url)
                    // file.ext -> /afoo/file.ext
                    return new Request(self.baseUrl.pathname + url);
                }));
            })
            .then(function () {
                // forces the waiting service worker to become the active
                // service worker
                return self.skipWaiting();
            })
    );
});

// == Refresh ==
// =============================================================================
self.addEventListener('activate', function (event) {
    event.waitUntil(
        self.caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheName !== self.CACHE_NAME) {
                        return self.caches.delete(cacheName);
                    }
                })
            ).then(function () {
                // Calling claim() to force a "controllerchange" event on
                // navigator.serviceWorker
                return self.clients.claim();
            });
        })
    );
});

// == HTTP hijacks ==
// =============================================================================
self.addEventListener('fetch', function (event) {
    var isApiRequest = /\/api\//.test(event.request.url);
    if ((self.devMode && !isApiRequest) || self.isOnline) {
        return;
    }
    var responder = isApiRequest && swManager.makeResponder(event.request.url);
    event.respondWith(
        responder || self.caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        }).catch(function () {
            return new Response('fallback');
        })
    );
});
