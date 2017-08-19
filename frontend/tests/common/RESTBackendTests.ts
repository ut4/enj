import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import RESTBackend from 'src/common/RESTBackend';

interface TestType { id?: AAGUID; foo: string; }
class TestBackend extends RESTBackend<TestType> {}

QUnit.module('common/RESTBackend', hooks => {
    let testUrlNamespace: string;
    let shallowUserState: Http;
    let RESTBackend: TestBackend;
    hooks.beforeEach(() => {
        testUrlNamespace = 'foo';
        shallowUserState = Object.create(Http.prototype);
        RESTBackend = new TestBackend(shallowUserState, testUrlNamespace);
    });
    QUnit.test('selectAll kutsuu http.get namespacella, ja palauttaa backendin palauttaman datan', assert => {
        const httpGet = sinon.mock(shallowUserState);
        httpGet.expects('get').once()
            .withExactArgs(testUrlNamespace)
            .returns('foo');
        //
        const actualResults = RESTBackend.getAll();
        //
        assert.ok(httpGet.verify());
        assert.equal(actualResults, 'foo');
    });
    QUnit.test('insert kutsuu http.post namespacella, ja palauttaa insertCountin', assert => {
        const httpPost = sinon.mock(shallowUserState);
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
    QUnit.test('insert asettaa insertId:n data.id:ksi, jos sellaista ei ole vielä asetettu', assert => {
        const data = {id: null, foo: 'bar'};
        const insertIdFromBackend = 'uuidsa';
        sinon.stub(shallowUserState, 'post').returns(Promise.resolve({
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
    QUnit.test('update kutsuu http.put namespacella, ja palauttaa updateCountin', assert => {
        const httpPost = sinon.mock(shallowUserState);
        const data = {foo: 'bar'};
        httpPost.expects('put').once()
            .withExactArgs(testUrlNamespace, data)
            .returns(Promise.resolve({updateCount: 1} as Enj.API.UpdateResponse));
        //
        const resultPromise = RESTBackend.update(data);
        //
        assert.ok(httpPost.verify());
        const done = assert.async();
        resultPromise.then(actualUpdateCount => {
            assert.equal(actualUpdateCount, 1, 'Pitäisi palauttaa updateCount int-muodossa');
            done();
        });
    });
    QUnit.test('delete kutsuu http.delete namespacella, ja palauttaa deleteCountin', assert => {
        const httpPost = sinon.mock(shallowUserState);
        const data = {id: 'someuuid', foo: 'bar'};
        httpPost.expects('delete').once()
            .withExactArgs(testUrlNamespace + '/' + data.id, data)
            .returns(Promise.resolve({deleteCount: 1} as Enj.API.DeleteResponse));
        //
        const resultPromise = RESTBackend.delete(data);
        //
        assert.ok(httpPost.verify());
        const done = assert.async();
        resultPromise.then(actualDeleteCount => {
            assert.equal(actualDeleteCount, 1, 'Pitäisi palauttaa deleteCount int-muodossa');
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