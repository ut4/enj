'use strict';

if (!self || !(self instanceof ServiceWorkerGlobalScope)) {
    throw new Error('This file is intended to be used as a service worker ' +
        '(window.navigator.serviceWorker.register(<urlToThisFile>)');
}

self.importScripts('vendor/sw-vendor.bundle.js');
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
const swManager = new SWManager(self);

const apiNamespace = 'api';
function prefixWithApiNamespace(url) {
    return apiNamespace + '/' + url;
}

self.CACHE_NAME = 'enjOffline-v0.0';
self.CACHE_FILES = [
    '',
    'index.html',
    // == Skriptit ===========
    'vendor/app-vendor.bundle.js',
    'vendor/app-vendor.bundle.css',
    'app.bundle.js',
    // == API-pyynnöt ========
    // (pidettävä päivitettynä manuaalisesti)
    prefixWithApiNamespace('workout'),
    prefixWithApiNamespace('exercise'),
    // == Teema ==============
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
    'theme/polygons.png'
];
self.DYNAMIC_CACHE = [{
    urlMatcher: prefixWithApiNamespace('workout\\?startFrom=(.+)&startTo=(.+)'),
    dataGetter: ([startFrom, startTo]) => swManager.findFromCachedArrayBy(
        {start: {$where: function () { // function () instead of fat-arrow because of "this"
            return this >= startFrom && this <= startTo
        }}},
        prefixWithApiNamespace('workout')
    )
}];

// == Workerin staten manipulointi ==
// =============================================================================
self.addEventListener('message', event => {
    switch (event.data.action) {
        case 'updateCache' :
            console.log('Saatiin cachen päivityspyyntö', event.data);
            swManager.updateCache(prefixWithApiNamespace(event.data.url), event.data.data)
                .then(() => {
                    event.ports[0].postMessage({ok: true});
                }, errorMessage => {
                    event.ports[0].postMessage({error: errorMessage});
                });
            break;
        case 'pushToCache' :
            console.log('Saatiin cachen pushpyyntö', event.data);
            swManager.updateCache(prefixWithApiNamespace(event.data.url), event.data.data)
                .then(() => {
                    event.ports[0].postMessage({ok: true});
                }, errorMessage => {
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
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            swManager.getAuthToken(),
            self.caches.open(self.CACHE_NAME)
        ]).then(([token, cache]) => {
            const headers = new Headers();
            headers.set('Authorization', 'Bearer ' + token);
            return cache.addAll(self.CACHE_FILES.map(url =>
                // file.ext -> /afoo/file.ext
                new Request(self.baseUrl.pathname + url, {headers})
            ));
        }).then(() =>
            // forces the waiting service worker to become the active
            // service worker
            self.skipWaiting()
        )
    );
});

// == Refresh ==
// =============================================================================
self.addEventListener('activate', event => {
    event.waitUntil(
        self.caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== self.CACHE_NAME) {
                        return self.caches.delete(cacheName);
                    }
                })
            ).then(() =>
                // Calling claim() to force a "controllerchange" event on
                // navigator.serviceWorker
                self.clients.claim()
            );
        })
    );
});

// == HTTP hijacks ==
// =============================================================================
const apiUrlRegExp = new RegExp(`/${apiNamespace}/`);
self.addEventListener('fetch', event => {
    var isApiRequest = apiUrlRegExp.test(event.request.url);
    if ((self.devMode && !isApiRequest) || self.isOnline) {
        return;
    }
    var responder = isApiRequest && swManager.makeResponder(event.request.url);
    event.respondWith(
        responder || self.caches.match(event.request).then(response =>
            response || fetch(event.request)
        ).catch(() =>
            new Response('fallback')
        )
    );
});
