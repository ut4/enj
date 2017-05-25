import QUnit from 'qunitjs';
import sinon from 'sinon';
import Db from 'src/common/Db';
import OfflineHttp from 'src/common/OfflineHttp';

QUnit.module('common/OfflineHttp', hooks => {
    hooks.beforeEach(() => {
        OfflineHttp.requestHandlers = {};
        this.db = new Db();
        this.offlineHttp = new OfflineHttp(this.db);
    });
    QUnit.test('addHandler lisää handerin listaan', assert => {
        const urlToHandle = 'some/url';
        const handler = function () { return 'foo'; };
        this.offlineHttp.addHandler(urlToHandle, handler);
        const expected = {};
        expected[urlToHandle] = handler;
        assert.deepEqual(OfflineHttp.requestHandlers, expected);
    });
    QUnit.test('hasHandler palauttaa tiedon onko handleri rekisteröity', assert => {
        const handlerUrlToCheck = 'foor/var';
        assert.notOk(
            this.offlineHttp.hasHandlerFor(handlerUrlToCheck),
            'Pitäisi palauttaa false mikäli handleria ei löydy'
        );
        this.offlineHttp.addHandler(handlerUrlToCheck, function () {});
        assert.ok(
            this.offlineHttp.hasHandlerFor(handlerUrlToCheck),
            'Pitäisi palauttaa true mikäli handleri löytyy'
        );
    });
    QUnit.test('handle kutsuu rekisteröityä handleria', assert => {
        var urlToHandle = 'some/url';
        var valueFromHandler = 'fo';
        this.offlineHttp.addHandler(urlToHandle, function () {
            return valueFromHandler;
        });
        var callWatcher = sinon.spy(
            OfflineHttp.requestHandlers, urlToHandle
        );
        var paramForHandler = 'bas';
        var result = this.offlineHttp.handle(urlToHandle, paramForHandler);
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
        var requestToQueue = {
            url: 'some/url',
            data: {foo: 'bar'}
        };
        var logInsertWatcher = sinon.stub(this.db.syncQueue, 'add').returns('foo');
        var result = this.offlineHttp.logRequestToSyncQueue(
            requestToQueue.url,
            requestToQueue.data
        );
        assert.ok(logInsertWatcher.calledOnce, 'Pitäisi kirjoittaa selaintietokantaan');
        assert.deepEqual(
            logInsertWatcher.firstCall.args,
            [
                {
                    url: requestToQueue.url,
                    data: requestToQueue.data
                }
            ],
            'Pitäisi kirjoittaa selaintietokantaan nämä tiedot'
        );
        assert.equal(
            result,
            logInsertWatcher.firstCall.returnValue,
            'Pitäisi palauttaa handlerin palauttaman arvon'
        );
    });
    QUnit.test('logRequestToSyncQueue ei kirjoita selaintietokantaan jos url löytyy ignore-listalta', assert => {
        var logInsertWatcher = sinon.stub(this.db.syncQueue, 'add');
        // Kutsu 1
        this.offlineHttp.logRequestToSyncQueue(
            requestThatShouldBeIgnored
        );
        var requestThatShouldBeIgnored = 'url/bar';
        this.offlineHttp.ignore(requestThatShouldBeIgnored);
        // Kutsu 2
        var result2 = this.offlineHttp.logRequestToSyncQueue(
            requestThatShouldBeIgnored
        );
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
        var testIdsToRemove = [1, 2];
        var mockDeleteResult = 'sdc';
        // Stubbaa "takaperin" db.syncQueue.where('id').anyOf(ids).delete()
        var mockCollection = {delete: sinon.stub().returns(Promise.resolve(mockDeleteResult))};
        var mockWhere = {anyOf: sinon.stub().returns(mockCollection)};
        var whereFactoryStub = sinon.stub(this.db.syncQueue, 'where').returns(mockWhere);
        // suorita
        var ret = this.offlineHttp.removeRequestsFromQueue(testIdsToRemove);
        // assertoi
        assert.ok(whereFactoryStub.calledOnce, 'Pitäisi kutsua ensin this.db.syncQueue.where');
        assert.deepEqual(whereFactoryStub.firstCall.args, ['id'], 'Pitäisi kutsua ensin this.db.syncQueue.where');
        assert.ok(mockWhere.anyOf.calledOnce, 'Sen jälkeen pitäisi kutsua <where>.anyOf(<idsToRemove>)');
        assert.deepEqual(mockWhere.anyOf.firstCall.args, [testIdsToRemove], 'Sen jälkeen pitäisi kutsua <where>.anyOf(<idsToRemove>)');
        assert.ok(mockCollection.delete.calledOnce, 'Lopuksi pitäisi kutsua <filteredQueueItems>.delete()');
        var done = assert.async();
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
