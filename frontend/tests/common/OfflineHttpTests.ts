import QUnit from 'qunitjs';
import sinon from 'sinon';
import Db from 'src/common/Db';
import OfflineHttp from 'src/common/OfflineHttp';

QUnit.module('common/OfflineHttp', hooks => {
    let db: Db;
    let offlineHttp: OfflineHttp;
    hooks.beforeEach(() => {
        OfflineHttp.requestHandlers = {};
        db = new Db();
        offlineHttp = new OfflineHttp(db);
    });
    QUnit.test('addHandler lisää handerin listaan', assert => {
        const urlToHandle = 'some/url';
        const handler = () => Promise.resolve('foo');
        offlineHttp.addHandler('POST', urlToHandle, handler);
        const expected = {};
        expected['POST:' + urlToHandle] = handler;
        assert.deepEqual(OfflineHttp.requestHandlers, expected);
    });
    QUnit.test('hasHandler palauttaa tiedon onko handleri rekisteröity', assert => {
        const handlerUrlToCheck = 'foor/var';
        assert.notOk(
            offlineHttp.hasHandlerFor('POST', handlerUrlToCheck),
            'Pitäisi palauttaa false mikäli handleria ei löydy'
        );
        offlineHttp.addHandler('POST', handlerUrlToCheck, () => Promise.resolve(''));
        assert.ok(
            offlineHttp.hasHandlerFor('POST', handlerUrlToCheck),
            'Pitäisi palauttaa true mikäli handleri löytyy'
        );
    });
    QUnit.test('callHandler kutsuu rekisteröityä handleria', assert => {
        const urlToHandle = 'some/url';
        const valueFromHandler = 'fo';
        offlineHttp.addHandler('POST', urlToHandle, () =>
            Promise.resolve(valueFromHandler)
        );
        const callWatcher = sinon.spy(OfflineHttp.requestHandlers, 'POST:' + urlToHandle);
        const paramForHandler = 'bas';
        //
        const done = assert.async();
        offlineHttp.callHandler('POST', urlToHandle, paramForHandler).then(result => {
            assert.deepEqual(
                callWatcher.getCall(0).args,
                [paramForHandler],
                'Pitäisi kutsua handleria ja passata sille annetun argumentin'
            );
            assert.equal(
                result,
                valueFromHandler,
                'Pitäisi palauttaa handlerin palauttaman arvon'
            );
            done();
        });
    });
    QUnit.test('logRequestToSyncQueue kirjoittaa selaintietokantaan', assert => {
        const requestToQueue = {
            method: 'POST',
            url: 'some/url',
            data: {foo: 'bar'},
            response: 'somthinh'
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
        const request = {method: 'POST', url: requestThatShouldBeIgnored, response: 'a', data: null};
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
        sinon.stub(offlineHttp, 'hasHandlerFor').returns(true);
        const mockHandlerResponse = 'd';
        const handlerCallWatcher = sinon.stub(offlineHttp, 'callHandler')
            .returns(Promise.resolve(mockHandlerResponse));
        const requestQueuerWatcher = sinon.stub(offlineHttp, 'logRequestToSyncQueue');
        const request = {
            method: 'POST' as any,
            url: 'baz/haz',
            data: {baz: 'haz'}
        };
        const done = assert.async();
        offlineHttp.handle(request.url, {method: request.method, data: request.data})
            .then(result => {
                assert.ok(
                    handlerCallWatcher.called,
                    'Pitäisi kutsua handleria'
                );
                assert.deepEqual(
                    handlerCallWatcher.firstCall.args,
                    [request.method, request.url, request.data],
                    'Pitäisi passata handlerille nämä argumentit '
                );
                assert.ok(
                    requestQueuerWatcher.called,
                    'Pitäisi logata pyynnön queueen'
                );
                assert.deepEqual(
                    requestQueuerWatcher.firstCall.args,
                    [Object.assign(request, {
                        response: mockHandlerResponse
                    })],
                    'Pitäisi logata synqQueueen nämä'
                );
                assert.deepEqual(
                    result,
                    new Response(mockHandlerResponse),
                    'Pitäisi palauttaa reponse, jonka bodyna jossa handlerin palauttama data'
                );
                done();
            });
    });
    QUnit.test('handle palauttaa 454 Responsen jos handleria ei löydy', assert => {
        sinon.stub(offlineHttp, 'hasHandlerFor').returns(false);
        const requestQueuerWatcher = sinon.spy(offlineHttp, 'logRequestToSyncQueue');
        const done = assert.async();
        offlineHttp.handle('foo', {method:'POST'}).then((result: Response) => {
            assert.equal(
                requestQueuerWatcher.called,
                false,
                'Ei pitäisi logata queueen mitään failatessa'
            );
            assert.equal(
                result.status,
                454,
                'Pitäisi palauttaa responsen jonka statuksena tämä'
            );
            done();
        });
    });
});
