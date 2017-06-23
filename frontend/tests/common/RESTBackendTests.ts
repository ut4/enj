import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import RESTBackend from 'src/common/RESTBackend';
import settings from 'src/config/settings';

interface TestType { foo: string; }
class TestBackend extends RESTBackend<TestType> {}

QUnit.module('common/RESTBackend', hooks => {
    let testUrlNamespace: string;
    let http: Http;
    let RESTBackend: TestBackend;
    hooks.beforeEach(() => {
        testUrlNamespace = 'foo';
        http = Object.create(Http.prototype);
        RESTBackend = new TestBackend(http, testUrlNamespace);
    });
    QUnit.test('selectAll kutsuu http.get namespacella, ja palauttaa backendin palauttaman datan', assert => {
        const httpGet = sinon.mock(http);
        httpGet.expects('get').once()
            .withExactArgs(settings.baseApiNamespace + testUrlNamespace)
            .returns('foo');
        //
        const actualResults = RESTBackend.getAll();
        //
        assert.ok(httpGet.verify());
        assert.equal(actualResults, 'foo');
    });
    QUnit.test('insert kutsuu http.post namespacella, ja palauttaa backendin genroiman id:n', assert => {
        const httpPost = sinon.mock(http);
        const data = {foo: 'bar'};
        httpPost.expects('post').once()
            .withExactArgs(settings.baseApiNamespace + testUrlNamespace, data)
            .returns(Promise.resolve('1'));
        //
        const resultPromise = RESTBackend.insert(data);
        //
        assert.ok(httpPost.verify());
        const done = assert.async();
        resultPromise.then(actualId => {
            assert.equal(actualId, 1, 'Pitäisi palauttaa generoitu id int-muodossa');
            done();
        })
    });
});