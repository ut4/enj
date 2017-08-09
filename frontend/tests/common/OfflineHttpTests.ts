import QUnit from 'qunitjs';
import sinon from 'sinon';
import Db from 'src/common/Db';
import OfflineHttp from 'src/common/OfflineHttp';

QUnit.module('common/OfflineHttp', hooks => {
    let db: Db;
    let offlineHttp: OfflineHttp;
    hooks.beforeEach(() => {
        OfflineHttp.requestHandlers = {};
        db = new Db();// oikea instanssi prototyypin sijasta, että voi viitata db.syncQueue etc.
        offlineHttp = new OfflineHttp(db);
    });
    QUnit.test('addHandler lisää handerin listaan & getHandler palauttaa sen', assert => {
        const method = 'POST';
        const urlToHandle = 'some/url';
        const handler = () => Promise.resolve('foo');
        offlineHttp.addHandler(method, urlToHandle, handler);
        const expected = {};
        expected[method + ':' + urlToHandle] = handler;
        assert.deepEqual(OfflineHttp.requestHandlers, expected);
        const getd = offlineHttp.getHandler(method, urlToHandle);
        assert.deepEqual(getd, handler);
    });
    QUnit.test('getHandler etsii handerin regexpillä', assert => {
        const postExact = () => Promise.resolve('1');
        offlineHttp.addHandler('POST', 'some/url', postExact);
        const putExact = () => Promise.resolve('2');
        offlineHttp.addHandler('PUT', 'some/url', putExact);
        const firstRegexp = () => Promise.resolve('3');
        offlineHttp.addHandler('PUT', 'some/*', firstRegexp);
        const secondRegexp = () => Promise.resolve('4');
        offlineHttp.addHandler('PUT', 'some/url/*', secondRegexp);
        //
        assert.deepEqual(offlineHttp.getHandler('PUT', 'some/url'), putExact);
        assert.deepEqual(offlineHttp.getHandler('POST', 'some/url'), postExact);
        assert.deepEqual(offlineHttp.getHandler('PUT', 'some/string'), firstRegexp);
        assert.deepEqual(offlineHttp.getHandler('PUT', 'some/url/string'), secondRegexp);
    });
    QUnit.test('logRequestToSyncQueue kirjoittaa selaintietokantaan', assert => {
        const requestToQueue = {
            route: {method: 'POST' as 'POST', url: 'some/url'},
            data: {foo: 'bar'}
        };
        const logInsertWatcher = sinon.stub(db.syncQueue, 'add').returns('foo');
        const result = offlineHttp.logRequestToSyncQueue(requestToQueue);
        assert.ok(logInsertWatcher.calledOnce, 'Pitäisi kirjoittaa selaintietokantaan');
        assert.deepEqual(
            logInsertWatcher.firstCall.args,
            [requestToQueue],
            'Pitäisi kirjoittaa selaintietokantaan nämä tiedot'
        );
        assert.equal(
            result,
            logInsertWatcher.firstCall.returnValue,
            'Pitäisi palauttaa handlerin palauttaman arvon'
        );
    });
    QUnit.test('logRequestToSyncQueue ei kirjoita selaintietokantaan jos url löytyy ignore-listalta', assert => {
        const logInsertWatcher = sinon.stub(db.syncQueue, 'add');
        const requestThatShouldBeIgnored = 'url/bar';
        const request = {route: {method: 'POST' as 'POST', url: requestThatShouldBeIgnored}, data: null};
        // Kutsu 1
        offlineHttp.logRequestToSyncQueue(request);
        offlineHttp.ignore('POST', requestThatShouldBeIgnored);
        // Kutsu 2
        const result2 = offlineHttp.logRequestToSyncQueue(request);
        assert.equal(
            logInsertWatcher.callCount,
            1,
            'Ei pitäisi kirjoittaa selaintietokantaan mitään ignoren jälkeen'
        );
        assert.equal(
            result2,
            undefined,
            'Pitäisi palauttaa undefined'
        );
    });
    QUnit.test('removeRequestsFromQueue kutsuu dbServiceä oikein', assert => {
        const testIdsToRemove = [1, 2];
        const mockDeleteResult = 'sdc';
        // Stubbaa "takaperin" db.syncQueue.where('id').anyOf(ids).delete()
        const mockCollection = {delete: sinon.stub().returns(Promise.resolve(mockDeleteResult))};
        const mockWhere = {anyOf: sinon.stub().returns(mockCollection)};
        const whereFactoryStub = sinon.stub(db.syncQueue, 'where').returns(mockWhere);
        // suorita
        const ret = offlineHttp.removeRequestsFromQueue(testIdsToRemove);
        // assertoi
        assert.ok(whereFactoryStub.calledOnce, 'Pitäisi kutsua ensin db.syncQueue.where');
        assert.deepEqual(whereFactoryStub.firstCall.args, ['id'], 'Pitäisi kutsua ensin db.syncQueue.where');
        assert.ok(mockWhere.anyOf.calledOnce, 'Sen jälkeen pitäisi kutsua <where>.anyOf(<idsToRemove>)');
        assert.deepEqual(mockWhere.anyOf.firstCall.args, [testIdsToRemove], 'Sen jälkeen pitäisi kutsua <where>.anyOf(<idsToRemove>)');
        assert.ok(mockCollection.delete.calledOnce, 'Lopuksi pitäisi kutsua <filteredQueueItems>.delete()');
        const done = assert.async();
        ret.then(result => {
            assert.equal(
                result,
                mockDeleteResult,
                'Pitäisi palauttaa <DexieCollection>.delete() palauttaman arvon'
            );
            done();
        });
    });
    QUnit.test('handle kutsuu handleria ja loggaa pyynnön queueen', assert => {
        const mockHandlerResponse = 'd';
        const testUrl = 'baz/haz';
        const testHandlerFnSpy = sinon.spy(() => Promise.resolve(mockHandlerResponse));
        offlineHttp.addHandler('POST', testUrl, testHandlerFnSpy);
        const requestQueuerWatcher = sinon.stub(offlineHttp, 'logRequestToSyncQueue');
        const request = {
            route: {method: 'POST' as 'POST', url: testUrl},
            data: {baz: 'haz'}
        };
        const done = assert.async();
        offlineHttp.handle(request.route.url, {method: request.route.method, data: request.data})
            .then(result => {
                assert.ok(
                    testHandlerFnSpy.called,
                    'Pitäisi kutsua handleria'
                );
                assert.deepEqual(
                    testHandlerFnSpy.firstCall.args,
                    [request.data, request.route.url],
                    'Pitäisi passata handlerille pyynnön data & url'
                );
                assert.ok(
                    requestQueuerWatcher.called,
                    'Pitäisi logata pyyntö queueen'
                );
                assert.deepEqual(
                    requestQueuerWatcher.firstCall.args,
                    [request],
                    'Pitäisi logata synqQueueen nämä tiedot'
                );
                assert.deepEqual(
                    result,
                    new Response(mockHandlerResponse),
                    'Pitäisi palauttaa response, jonka bodyna jossa handlerin palauttama data'
                );
                done();
            });
    });
    QUnit.test('handle palauttaa 454 Responsen jos handleria ei löydy', assert => {
        const requestQueuerWatcher = sinon.spy(offlineHttp, 'logRequestToSyncQueue');
        const done = assert.async();
        offlineHttp.handle('foo', {method:'POST'}).then(result => {
            assert.equal(
                requestQueuerWatcher.called,
                false,
                'Ei pitäisi logata queueen mitään'
            );
            assert.equal(
                result.status,
                454,
                'Pitäisi palauttaa response jonka statuksena tämä'
            );
            done();
        });
    });
});
