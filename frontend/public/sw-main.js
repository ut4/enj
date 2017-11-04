'use strict';

if (!self || !(self instanceof ServiceWorkerGlobalScope)) {
    throw new Error('Tätä tiedostoa on tarkoitus käyttää vain serviceWorkerinä ' +
        '(window.navigator.serviceWorker.register(<urlTähänTiedostoon>).');
}

// Koska sw-main.js tulee olla aina serverin juuressa, tämä kertoo missä kansiossa
// applikaatio sijaitsee. Esimerkkiarvo '', tai 'app'.
self.APP_DIR_NAME = '';
// http://mysite.com
self.BASE_URL = new URL(self.location.href).origin;

self.importScripts(prefixWithAppDirName('vendor/sw-vendor.bundle.js'));
self.importScripts(prefixWithAppDirName('sw-src/SWManager.js'));

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
function prefixWithAppDirName(url) {
    return self.APP_DIR_NAME + '/' + url;
}

self.CACHE_NAME = 'enjOffline-v0.0';
self.CACHE_FILES = [
    prefixWithAppDirName(''),
    prefixWithAppDirName('index.html'),
    // == Skriptit ===========
    prefixWithAppDirName('vendor/app-vendor.bundle.js'),
    prefixWithAppDirName('vendor/app-vendor.bundle.css'),
    prefixWithAppDirName('app.bundle.js'),
    // == API-pyynnöt ========
    // (pidettävä päivitettynä manuaalisesti)
    prefixWithApiNamespace('workout'),
    prefixWithApiNamespace('exercise'),
    prefixWithApiNamespace('program/mine'),
    prefixWithApiNamespace('program/templates'),
    // == Teema ==============
    prefixWithAppDirName('theme/favicon.ico'),
    prefixWithAppDirName('theme/favicon.png'),
    prefixWithAppDirName('theme/firasans-heavy-webfont.eot'),
    prefixWithAppDirName('theme/firasans-heavy-webfont.ttf'),
    prefixWithAppDirName('theme/firasans-heavy-webfont.woff2'),
    prefixWithAppDirName('theme/firasans-light-webfont.eot'),
    prefixWithAppDirName('theme/firasans-light-webfont.ttf'),
    prefixWithAppDirName('theme/firasans-light-webfont.woff2'),
    prefixWithAppDirName('theme/icon-sprite.svg'),
    prefixWithAppDirName('theme/main.css'),
    prefixWithAppDirName('theme/polygons.png'),
    prefixWithAppDirName('theme/user-icon-sprite.svg')
];
self.DYNAMIC_CACHE = [{
    urlMatcher: prefixWithApiNamespace('exercise/(.{36})'),
    dataGetter: ([exerciseId]) => swManager.findFromCachedArrayBy(
        {id: {$eq: exerciseId}},
        prefixWithApiNamespace('exercise')
    ).then(array => array[0])
}, {
    urlMatcher: prefixWithApiNamespace('workout\\?startFrom=(.+)&startTo=(.+)'),
    dataGetter: ([startFrom, startTo]) => swManager.findFromCachedArrayBy(
        {start: {$where: function () { // ei fat-arrow -syntaksia, koska tarvitaan "this"
            return this >= startFrom && this <= startTo;
        }}},
        prefixWithApiNamespace('workout')
    )
}, {
    urlMatcher: prefixWithApiNamespace('program/mine\\?when=(\\d+)'),
    dataGetter: ([unixTime]) => swManager.findFromCachedArrayBy(
        {$where: function () {
            const unixTimeInt = parseInt(unixTime, 10);
            return unixTimeInt > this.start && unixTimeInt < this.end;
        }},
        prefixWithApiNamespace('program/mine')
    )
}, {
    urlMatcher: prefixWithApiNamespace('program/(.{36})'),
    dataGetter: ([programId]) => swManager.findFromCachedArrayBy(
        {id: {$eq: programId}},
        prefixWithApiNamespace('program/mine')
    ).then(array => array[0])
}, {
    urlMatcher: prefixWithApiNamespace('stat/best-sets'),
    dataGetter: () => () => swManager.new404()
}, {
    urlMatcher: prefixWithApiNamespace('stat/general-stuff'),
    dataGetter: () => () => swManager.new404()
}, {
    urlMatcher: prefixWithApiNamespace('stat/progress.*'),
    dataGetter: () => () => swManager.new404()
}, {
    urlMatcher: prefixWithApiNamespace('user/me'),
    dataGetter: () => () => swManager.new404()
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
                new Request(self.BASE_URL + '/' + url, {headers})
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
    const isApiRequest = apiUrlRegExp.test(event.request.url);
    if ((self.devMode && !isApiRequest) || self.isOnline) {
        return;
    }
    const responder = isApiRequest && swManager.makeResponder(event.request.url);
    event.respondWith(
        responder || self.caches.match(event.request).then(response =>
            response || fetch(event.request)
        ).catch(() =>
            new Response('fallback')
        )
    );
});
