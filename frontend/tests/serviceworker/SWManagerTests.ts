import QUnit from 'qunitjs';
import sinon from 'sinon';
import utils from 'tests/utils';

const testApiNamespace = 'api/v2';

QUnit.module('SWManager', hooks => {
    hooks.beforeEach(() => {
        this.fakeSWScope = utils.fakeSWScope('somecache');
        this.fakeSWScope.baseUrl = {href: 'http://a.b:3000/'};
        this.buildFullUrl = url => this.fakeSWScope.baseUrl.href + url;
        this.swManager = new SWManager(this.fakeSWScope);
    });
    hooks.afterEach(() => {
        delete this.fakeSWScope.baseUrl;
        delete this.fakeSWScope.devMode;
        delete this.fakeSWScope.isOnline;
        delete this.fakeSWScope.DYNAMIC_CACHE;
        delete this.fakeSWScope.CACHE_NAME;
        delete this.fakeSWScope.CACHE_FILES;
    });
    QUnit.test('findFromCachedArrayBy etsii taulusta filttereitä vastaavan objektin', assert => {
        const cachedUrl = 'foo/bar'; // notetoself: api-prefix pitää asettaa itse, SWmanager on tietoinen vain baseUrlista...
        const cachedData = [{akey: 'fo', bkey: 'foo'}, {akey: 'fy', bkey: 'fyy'}];
        const prep = this.fakeSWScope.putTestCache({
            url: this.buildFullUrl(cachedUrl),
            value: cachedData
        });
        //
        const done = assert.async();
        prep
            .then(() => this.swManager.findFromCachedArrayBy({akey: {$eq: 'fy'}}, cachedUrl))
            .then(found => {
                assert.deepEqual(found, [cachedData[1]], 'Pitäisi palauttaa itemit, joiden "akey" === "fy"');
                return this.swManager.findFromCachedArrayBy({akey: {$eq: 'asdc'}}, cachedUrl);
            }).then(empty => {
                assert.deepEqual(empty, [], 'Pitäisi palauttaa [] jos itemiä ei löydy');
                return this.fakeSWScope.cleanTestCache();
            }).then(wasCleanupSuccessful => {
                assert.ok(wasCleanupSuccessful);
                done();
            });
    });
    QUnit.test('findFromCachedArrayBy heittää errorin jos cachedArray:ta ei ole olemassa', assert => {
        const done = assert.async();
        this.swManager.findFromCachedArrayBy('key', 'value', 'not/cached')
            .catch(() => {
                assert.ok(true);
                done();
            });
    });
    QUnit.test('makeResponder palauttaa Responsen jos regexp matchaa', assert => {
        const mockData = {foo: 'bar'};
        const getter = sinon.stub().returns(Promise.resolve(mockData));
        const getter2 = sinon.stub().returns(Promise.resolve());
        this.fakeSWScope.DYNAMIC_CACHE = [{
            urlMatcher: 'foo/(\\d+)',
            dataGetter: getter
        }, {
            urlMatcher: 'segment',
            dataGetter: getter2
        }];
        const done = assert.async(2);
        // Yksi regexp-capture
        this.swManager.makeResponder(this.buildFullUrl('foo/24')).then(dynamicResponse => {
            const actualMatchCaptures = getter.firstCall.args[0];
            const expectedMatchCaptures = ['24'];
            assert.deepEqual(actualMatchCaptures, expectedMatchCaptures);
            assert.ok(dynamicResponse instanceof Response);
            return dynamicResponse.json();
        }).then(actualData => {
            assert.deepEqual(actualData, mockData);
            done();
        });
        // Ei regexp-capturea
        this.swManager.makeResponder(this.buildFullUrl('segment')).then(dynamicResponse2 => {
            const actualMatchCaptures2 = getter2.firstCall.args[0];
            const expectedMatchCaptures2 = [];
            assert.deepEqual(actualMatchCaptures2, expectedMatchCaptures2);
            assert.ok(dynamicResponse2 instanceof Response);
            return dynamicResponse2.json();
        }).then(actualData2 => {
            assert.deepEqual(actualData2, []);
            done();
        });
    });
    QUnit.test('makeResponder palauttaa null jos regexp ei matchaa', assert => {
        const getter = sinon.spy();
        this.fakeSWScope.DYNAMIC_CACHE = [{
            urlMatcher: 'foo',
            dataGetter: getter
        }];
        //
        const res = this.swManager.makeResponder(this.buildFullUrl('bar'));
        assert.deepEqual(res, null);
        assert.equal(getter.called, false);
    });
    QUnit.test('updateCache asettaa uuden cache-arvon', assert => {
        // notetoself: api-prefix pitää asettaa itse, SWmanager on tietoinen vain baseUrlista...
        const urlToUpdate = testApiNamespace + '/' + 'foo/bar';
        const fullUrl = this.buildFullUrl(urlToUpdate);
        const dataToCache = {foo: 'bar'};
        this.fakeSWScope.CACHE_FILES = [urlToUpdate];
        //
        const done = assert.async();
        this.fakeSWScope.caches.match(new Request(fullUrl))
            .then(initialCached => {
                assert.equal(undefined, initialCached);
                return this.swManager.updateCache(urlToUpdate, dataToCache);
            }).then(() =>
                this.fakeSWScope.caches.match(new Request(fullUrl))
            ).then(cached => {
                assert.ok(cached instanceof Response);
                return cached.json();
            }).then(cachedData => {
                assert.deepEqual(cachedData, dataToCache);
                return this.fakeSWScope.cleanTestCache();
            }).then(wasCleanupSuccessful => {
                assert.ok(wasCleanupSuccessful);
                done();
            });
    });
    QUnit.test('updateCache rejektoi jos urlia ei ole CACHE_FILES -rekisterissä', assert => {
        const registeredUrl = testApiNamespace + '/registred';
        const notRegisteredUrl = testApiNamespace + '/not/registered';
        this.fakeSWScope.CACHE_FILES = [registeredUrl];
        //
        const done = assert.async(2);
        // Pitäisi rejektoida
        this.swManager.updateCache(notRegisteredUrl, {})
            .then(null, () => {
                assert.ok(true);
                done();
            });
        // Ei pitäisi rejektoida, koska url parametrien ei pitäisi vaikuttaa
        this.swManager.updateCache(registeredUrl + '?foo=bar', {})
            .then(() => {
                assert.ok(true);
                done();
            });
    });
    QUnit.test('setIsOnline asettaa arvon scopeen', assert => {
        const initialValue = this.fakeSWScope.isOnline;
        this.swManager.setIsOnline(true);
        assert.notEqual(this.fakeSWScope.isOnline, initialValue);
        assert.equal(this.fakeSWScope.isOnline, true);
        this.swManager.setIsOnline(false);
        assert.equal(this.fakeSWScope.isOnline, false);
    });
    QUnit.test('setDevMode asettaa arvon scopeen', assert => {
        const initialValue = this.fakeSWScope.devMode;
        this.swManager.setDevMode(true);
        assert.notEqual(this.fakeSWScope.devMode, initialValue);
        assert.equal(this.fakeSWScope.devMode, true);
        this.swManager.setDevMode(false);
        assert.equal(this.fakeSWScope.devMode, false);
    });
    QUnit.test('getAuthToken palauttaa jwt:n selaintietokannasta', assert => {
        const mockDb = {onsuccess: e => null};
        const indexedDBStub = sinon.stub(this.fakeSWScope.indexedDB, 'open').returns(mockDb);
        // Stubbaa mockDbConnection.transaction('userState').objectStore('userState').get(1) takaperin
        const mockReadTransaction = {onsuccess: e => null};
        const mockStore = {get: sinon.stub().returns(mockReadTransaction)};
        const mockTransaction = {objectStore: sinon.stub().returns(mockStore)};
        const mockDbConnection = {transaction: sinon.stub().returns(mockTransaction)};
        // Aja testimetodi & tietokannan normaalisti suorittamat onsuccess-callbackit
        const tokenPromise = this.swManager.getAuthToken();
        mockDb.onsuccess({target: {result: mockDbConnection}});
        mockReadTransaction.onsuccess({target: {result: {token: 'token'}}});
        // Assertoi, että db.transaction('userState').objectStore('userState').get(1)'d
        const done = assert.async();
        tokenPromise.then(token => {
            assert.ok(mockDbConnection.transaction.calledOnce, 'Pitäisi luoda transaktio');
            assert.deepEqual(mockDbConnection.transaction.firstCall.args, ['userState']);
            assert.ok(mockTransaction.objectStore.calledAfter(mockDbConnection.transaction), 'Pitäisi avata objectStore');
            assert.deepEqual(mockTransaction.objectStore.firstCall.args, ['userState']);
            assert.ok(mockStore.get.calledAfter(mockTransaction.objectStore), 'Pitäisi lukea rivi');
            assert.deepEqual(mockStore.get.firstCall.args, [1]);
            assert.equal(token, 'token');
            indexedDBStub.restore();
            done();
        });
    });
});