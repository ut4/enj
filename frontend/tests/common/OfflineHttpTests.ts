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
        const handler = function () { return 'foo'; };
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
        offlineHttp.addHandler('POST', handlerUrlToCheck, function () {});
        assert.ok(
            offlineHttp.hasHandlerFor('POST', handlerUrlToCheck),
            'Pitäisi palauttaa true mikäli handleri löytyy'
        );
    });
    QUnit.test('handle kutsuu rekisteröityä handleria', assert => {
        const urlToHandle = 'some/url';
        const valueFromHandler = 'fo';
        offlineHttp.addHandler('POST', urlToHandle, function () {
            return valueFromHandler;
        });
        const callWatcher = sinon.spy(OfflineHttp.requestHandlers, 'POST:' + urlToHandle);
        const paramForHandler = 'bas';
        const result = offlineHttp.handle('POST', urlToHandle, paramForHandler);
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
        ret.then(function (result) {
            assert.equal(
                result,
                mockDeleteResult,
                'Pitäisi palauttaa <DexieCollection>.delete() palauttaman arvon'
            );
            done();
        });
    });
});
