import QUnit from 'qunitjs';
import sinon from 'sinon';
import utils from 'tests/utils';

QUnit.module('SWManager', hooks => {
    hooks.beforeEach(() => {
        this.fakeSWScope = utils.fakeSWScope('somecache');
        this.fakeSWScope.baseUrl = {href: 'http://a.b:3000/'};
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
    QUnit.test('findFromCachedArrayBy etsii taulusta objektin avaimella', assert => {
        const cachedUrl = 'foo/bar';
        const cachedValue = [{akey: 'fo', bkey: 'foo'}, {akey: 'fy', bkey: 'fyy'}];
        const prep = this.fakeSWScope.putTestCache({
            url: this.fakeSWScope.baseUrl.href + cachedUrl,
            value: cachedValue
        });
        //
        const done = assert.async();
        prep
            .then(() => this.swManager.findFromCachedArrayBy('akey', 'fy', cachedUrl))
            .then(found => {
                assert.deepEqual(found, cachedValue[1], 'Pitäisi palauttaa itemin jonka "akey" === "fy"');
                return this.swManager.findFromCachedArrayBy('akey', 'afuy', cachedUrl);
            }).then(empty => {
                assert.deepEqual(empty, undefined, 'Pitäisi palauttaa undefined jos itemiä ei löydy');
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
        this.swManager.makeResponder('http://a.b/foo/24').then(dynamicResponse => {
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
        this.swManager.makeResponder('http://asd.com:4545/segment').then(dynamicResponse2 => {
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
        const res = this.swManager.makeResponder('http://asd.com:4545/bar');
        assert.deepEqual(res, null);
        assert.equal(getter.called, false);
    });
    QUnit.test('updateCache asettaa uuden cache-arvon', assert => {
        const urlToUpdate = 'foo/bar';
        const fullUrl = this.fakeSWScope.baseUrl.href + urlToUpdate;
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
        this.fakeSWScope.CACHE_FILES = ['registred'];
        //
        const done = assert.async();
        this.swManager.updateCache('not/registered', {})
            .then(null, () => {
                assert.ok(true);
                done();
            });
    });
    QUnit.test('setDevMode asettaa arvon scopeen', assert => {
        const initialValue = this.fakeSWScope.devMode;
        this.swManager.setDevMode(true);
        assert.notEqual(this.fakeSWScope.devMode, initialValue);
        assert.equal(this.fakeSWScope.devMode, true);
        this.swManager.setDevMode(false);
        assert.equal(this.fakeSWScope.devMode, false);
    });
    QUnit.test('setIsOnline asettaa arvon scopeen', assert => {
        const initialValue = this.fakeSWScope.isOnline;
        this.swManager.setIsOnline(true);
        assert.notEqual(this.fakeSWScope.isOnline, initialValue);
        assert.equal(this.fakeSWScope.isOnline, true);
        this.swManager.setIsOnline(false);
        assert.equal(this.fakeSWScope.isOnline, false);
    });
});