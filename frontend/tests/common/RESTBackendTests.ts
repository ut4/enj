import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import RESTBackend from 'src/common/RESTBackend';

class TestBackend extends RESTBackend<{}> {}

QUnit.module('common/RESTBackend', hooks => {
    let testUrlNamespace: string;
    let http: Http;
    let RESTBackend: TestBackend;
    hooks.beforeEach(() => {
        testUrlNamespace = 'foo';
        http = Object.create(Http.prototype);
        RESTBackend = new TestBackend(http, testUrlNamespace);
    });
    QUnit.test('selectAll kutsuu http.get namespacella', assert => {
        const httpGet = sinon.mock(http);
        httpGet.expects('get').once().withExactArgs('api/' + testUrlNamespace);
        //
        RESTBackend.getAll();
        //
        assert.ok(httpGet.verify());
    });
});