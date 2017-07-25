import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import RESTBackend from 'src/common/RESTBackend';

interface TestType { id?: number; foo: string; }
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
            .withExactArgs(testUrlNamespace)
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
            .withExactArgs(testUrlNamespace, data)
            .returns(Promise.resolve({insertId: 1} as Enj.API.InsertResponse));
        //
        const resultPromise = RESTBackend.insert(data);
        //
        assert.ok(httpPost.verify());
        const done = assert.async();
        resultPromise.then(actualId => {
            assert.equal(actualId, 1, 'Pitäisi palauttaa generoitu id int-muodossa');
            done();
        });
    });
});