/**
 * @param {ServiceWorkerGlobalScope} mainSWScope
 */
function SWManager(mainSWScope) {
    'use strict';
    /**
     * Etsii $cachedArrayUrl taulukosta itemin, jonka $key on yhtä kuin
     * $valueToMatch. Käytetään tilanteissa, jossa esim. GET api/programs/all on
     * cachetettu, mutta GET api/programs/42 ei. Tällöin se voidaan hakea getall-
     * tulosjoukosta (findFromCachedArrayBy({id:{$eq:42}}, 'api/programs/getall'))
     *
     * @param {Object} filters esim. {id: {$eq: 1}}
     * @param {string} cachedArrayUrl esim. api/programs/all
     * @return {Promise} -> ({any|undefined} data, {Object} error)
     */
    this.findFromCachedArrayBy = (filters, cachedArrayUrl) =>
        getCachedJson(cachedArrayUrl).then(json =>
            json ? sift(filters, json) : []
        );
    /**
     * Palauttaa DYNAMIC_CACHE handlerin palauttaman arvon paketoituna
     * jsonina Responseen.
     *
     * @param {string} url (event.request.url)
     * @return {Promise|null} -> ({Response} response, {any} any)
     */
    this.makeResponder = url => {
        const dataProvider = callDataGetter(url);
        // Urlille {url} ei löytynyt rekisteröityä DYNAMIC_CACHE-handleria
        if (!dataProvider) {
            return null;
        // Rekisteröity DYNAMIC_CACHE-handleri tarjoaa itse datan ja Response-objektin
        } else if (typeof dataProvider === 'function') {
            return dataProvider();
        }
        // Rekisteröity DYNAMIC_CACHE-handleri tarjoaa vai datan
        return dataProvider.then(data =>
            new Response(data ? JSON.stringify(data) : '[]')
        );
    };
    /**
     * @param {string} url esim. api/foo/bar
     * @param {any} newValue
     * @return {Promise} -> ({void} nothing, {Object} error)
     */
    this.updateCache = (url, newValue) =>
        validateCacheUpdateAction(url, newValue).then(() =>
            setCachedJson(url, newValue)
        );
    /**
     * @param {string} url
     * @param {any} newValue
     * @return {Promise} -> ({void} nothing, {Object|string} error)
     */
    this.TODOpushToCache = (url, newValue) =>
        validateCacheUpdateAction(url, newValue)
            .then(() => getCachedJson(url))
            .then(json => {
                if (!Array.isArray(json)) {
                    return Promise.reject('Ei voi pushata cacheen ' + url + ', arvo ei taulukko');
                }
                json.push(newValue);
                return setCachedJson(url, json);
            });
    /**
     * @param {boolean} newValue
     * @return {void}
     */
    this.setIsOnline = newValue => {
        if (newValue === false && mainSWScope.isOnline === true) {
            // forces the waiting service worker to become the active
            // service worker
            mainSWScope.skipWaiting();
        }
        mainSWScope.isOnline = newValue === true;
        mainSWScope.myconsole.info('Asetettiin isOnline -> ' + (mainSWScope.isOnline ? 'true' : 'false'));
    };
    /**
     * @param {boolean} newValue
     * @return {void}
     */
    this.setDevMode = newValue => {
        mainSWScope.devMode = newValue === true;
        mainSWScope.myconsole.info('Asetettiin devMode -> ' + (mainSWScope.devMode ? 'true' : 'false'));
    };
    /**
     * @param {boolean} newValue
     * @return {void}
     */
    this.setConsoleOutputEnabled = newValue => {
        mainSWScope.consoleOutputEnabled = newValue === true;
        mainSWScope.myconsole.info('Asetettiin consoleOutputEnabled -> ' + (mainSWScope.consoleOutputEnabled ? 'true' : 'false'));
    };
    /**
     * @return {Promise} -> ({string} token, {string|any} error)
     */
    this.getAuthToken = () =>
        new Promise((resolve, reject) => {
            const dbRequest = mainSWScope.indexedDB.open('enjOfflineDb');
            dbRequest.onsuccess = e => {
                const transaction = e.target.result.transaction('userState').objectStore('userState').get(1);
                transaction.onsuccess = e => {
                    resolve(e.target.result.token);
                };
                transaction.onerror = e => {
                    reject(store + ':n lukeminen epäonnistui' + e.target.errorCode);
                };
            };
            dbRequest.onerror = e => {
                reject('IndexedDb-yhteyden avaaminen epäonnistui ' + e.target.errorCode);
            };
        });
    /**
     * @return {Response}
     */
    this.new404 = () => new Response('Tämä reitti ei ole käytettävissä offline-tilassa.', {
        status: 454,
        statusText: 'Offline handler not found'
    });


    function getCachedJson(url) {
        return mainSWScope.caches
            .match(makeApiRequest(url))
            .then(response => response.json());// Tämä on tarkoitus .catch:ata
    }
    function setCachedJson(url, newValue) {
        return mainSWScope.caches.open(mainSWScope.CACHE_NAME)
            .then(cache => {
                mainSWScope.myconsole.info(`Ylikirjoitetaan cache ${url}`, newValue);
                return cache.put(
                    makeApiRequest(url),
                    new Response(JSON.stringify(newValue))
                );
            });
    }
    function callDataGetter(url) {
        for (const definition of mainSWScope.DYNAMIC_CACHE) {
            const matches = url.match(new RegExp(definition.urlMatcher));
            if (!matches) {
                continue;
            }
            return definition.dataGetter(matches.length > 1 ? matches.slice(1) : []);
        }
        return null;
    }
    function validateCacheUpdateAction(url, newValue) {
        return new Promise((resolve, reject) => {
            const completedUrl = url.split('?')[0];
            if (mainSWScope.CACHE_FILES.indexOf(completedUrl) < 0) {
                reject('Cache url ' + completedUrl + ' ei validi');
            } else if (!newValue) {
                reject('Dataa ei asetettu (updateCache({url: <url>, --> data: <data> <-- })');
            } else {
                resolve();
            }
        });
    }
    function makeApiRequest(url) {
        return new Request(mainSWScope.BASE_URL + '/' + url);
    }
}
