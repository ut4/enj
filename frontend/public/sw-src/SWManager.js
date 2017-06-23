/**
 * @param {ServiceWorkerGlobalScope} mainSWScope
 */
function SWManager(mainSWScope) {
    'use strict';
    /**
     * Etsii $cachedArrayUrl taulukosta itemin, jonka $key on yhtä kuin
     * $valueToMatch. Käytetään tilanteissa, jossa esim. GET /api/programs/all
     * on cachetettu, mutta GET /api/programs/2 ei. Tällöin se voidaan hakea
     * getall-tulosjoukosta (FindFromCachedArrayBy('id', 42,
     * 'api/programs/getall'))
     *
     * @param {string} key esim. 'id'
     * @param {any} valueToMatch esim. 42
     * @param {string} cachedArrayUrl esim. api/programs/all
     * @return {Promise} -> ({any|undefined} data, {Object} error)
     */
    this.findFromCachedArrayBy = function (key, valueToMatch, cachedArrayUrl) {
        return getCachedJson(cachedArrayUrl)
            .then(function (json) {
                return json.find(function (item) {
                    return item[key] === valueToMatch;
                });
            });
    };
    /**
     * Palauttaa DYNAMIC_CACHE handlerin palauttaman arvon paketoituna
     * jsonina Responseen.
     *
     * @param {string} url (event.request.url)
     * @return {Promise|null} -> ({Response} response, {any} any)
     */
    this.makeResponder = function (url) {
        var dynamicDataPromise = callDataGetter(url);
        if (!dynamicDataPromise) {
            return null;
        }
        return dynamicDataPromise.then(function (data) {
            return new Response(data ? JSON.stringify(data) : '[]'); 
        });
    };
    /**
     * @param {string} url esim. api/foo/bar
     * @param {any} newValue
     * @return {Promise} -> ({void} nothing, {Object} error)
     */
    this.updateCache = function (url, newValue) {
        return validateCacheUpdateAction(url, newValue)
            .then(function () {
                return setCachedJson(url, newValue);
            });
    };
    /**
     * @param {string} url esim. foo/bar, täydentyy http://site/api/foo/bar
     * @param {any} newValue
     * @return {Promise} -> ({void} nothing, {Object|string} error)
     */
    this.TODOpushToCache = function (url, newValue) {
        return validateCacheUpdateAction(url, newValue)
            .then(function () {
                return getCachedJson(url);
            })
            .then(function (json) {
                if (!Array.isArray(json)) {
                    return Promise.reject('Ei voi pushata cacheen ' + url + ', arvo ei taulukko');
                }
                json.push(newValue);
                return setCachedJson(url, json);
            });
    };
    /**
     * @param {boolean} newValue
     * @return {void}
     */
    this.setIsOnline = function (newValue) {
        mainSWScope.isOnline = newValue === true;
        console.info('Asetettiin isOnline -> ' + (mainSWScope.isOnline ? 'true' : 'false'));
    };
    /**
     * @param {boolean} newValue
     * @return {void}
     */
    this.setDevMode = function (newValue) {
        mainSWScope.devMode = newValue === true;
        console.info('Asetettiin devMode -> ' + (mainSWScope.devMode ? 'true' : 'false'));
    };




    function getCachedJson(url) {
        return mainSWScope.caches
            .match(makeApiRequest(url))
            .then(function (response) {
                return response.json();
            });
    }
    function setCachedJson(url, newValue) {
        return mainSWScope.caches.open(mainSWScope.CACHE_NAME)
            .then(function (cache) {
                console.info('Ylikirjoitetaan cache ' + url);
                return cache.put(
                    makeApiRequest(url),
                    new Response(JSON.stringify(newValue))
                );
            });
    }
    function callDataGetter(url) {
        for (var definition of mainSWScope.DYNAMIC_CACHE) {
            var matches = url.match(new RegExp(definition.urlMatcher));
            if (!matches) {
                continue;
            }
            return definition.dataGetter(matches.length > 1 ? matches.slice(1) : []);
        }
        return null;
    }
    function validateCacheUpdateAction(url, newValue) {
        return new Promise(function (resolve, reject) {
            var completedUrl = url.split('?')[0];
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
        return new Request(mainSWScope.baseUrl.href + url);
    }
}
