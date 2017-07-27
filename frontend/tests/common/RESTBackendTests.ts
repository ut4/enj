import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import RESTBackend from 'src/common/RESTBackend';

interface TestType { id?: AAGUID; foo: string; }
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
    QUnit.test('insert kutsuu http.post namespacella, ja palauttaa insertCount:n', assert => {
        const httpPost = sinon.mock(http);
        const data = {foo: 'bar'};
        httpPost.expects('post').once()
            .withExactArgs(testUrlNamespace, data)
            .returns(Promise.resolve({insertCount: 2} as Enj.API.InsertResponse));
        //
        const resultPromise = RESTBackend.insert(data);
        //
        assert.ok(httpPost.verify());
        const done = assert.async();
        resultPromise.then(actualInsertCount => {
            assert.equal(actualInsertCount, 2, 'Pitäisi palauttaa insertCount int-muodossa');
            done();
        });
    });
    QUnit.test('insert asettaa insertId:n data.id:ksi, jos backend palautti sellaisen', assert => {
        const data = {id: null, foo: 'bar'};
        const insertIdFromBackend = 'uuidsa';
        sinon.stub(http, 'post').returns(Promise.resolve({
            insertCount: 1,
            insertId: insertIdFromBackend
        } as Enj.API.InsertResponse));
        //
        const done = assert.async();
        RESTBackend.insert(data).then(() => {
            assert.equal(data.id, insertIdFromBackend, 'Pitäisi asettaa data.id:ksi insertId');
            done();
        });
    });
    QUnit.test('utils.uuidv4 palauttaa uuid:n', assert => {
        //
        const uuid = RESTBackend.utils.uuidv4();
        const uuid2 = RESTBackend.utils.uuidv4();
        //
        assert.ok(isProbablyUuid(uuid), 'Pitäisi palauttaa uuid');
        assert.ok(isProbablyUuid(uuid2), 'Pitäisi palauttaa uuid');
        assert.notEqual(uuid2, uuid, 'Pitäisi palauttaa uuid');
    });
    function isProbablyUuid(str: string): boolean {
        return /^[\w]{8}-[\w]{4}-[1-5][\w]{3}-[89ab][\w]{3}-[\w]{12}$/i.test(str);
    }
});