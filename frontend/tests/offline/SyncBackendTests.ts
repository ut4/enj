import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import SyncBackend from 'src/offline/SyncBackend';

QUnit.module('offline/SyncBackend', hooks => {
    let shallowHttp: Http;
    let shallowOfflineHttp: OfflineHttp;
    let syncBackend: SyncBackend;
    let someSyncableItems: Array<Enj.OfflineDbSchema.SyncQueueRecord>;
    hooks.beforeEach(() => {
        shallowHttp = Object.create(Http.prototype);
        shallowOfflineHttp = Object.create(OfflineHttp.prototype);
        syncBackend = new SyncBackend(shallowHttp, 'sync', shallowOfflineHttp);
        someSyncableItems = [
            {id: 1, route: {method: 'POST', url: 'foo'}, data: {k: 'v'}},
            {id: 2, route: {method: 'POST', url: 'bar'}, data: {g: 'w'}},
            {id: 3, route: {method: 'POST', url: 'baz'}, data: {c: 'y'}},
        ];
    });
    QUnit.test('syncAll postaa synkattavat itemit backendiin, ja siivoaa onnistuneesti synkatut itemit selaintietokannasta', assert => {
        sinon.stub(shallowOfflineHttp, 'getRequestSyncQueue').returns(Promise.resolve(someSyncableItems));
        const mockSuccesfullySyncIds = [6, 7];
        const httpCallStub = sinon.stub(shallowHttp, 'post').returns(Promise.resolve(mockSuccesfullySyncIds));
        const cleanUpCallStub = sinon.stub(shallowOfflineHttp, 'removeRequestsFromQueue').returns(Promise.resolve(678));
        const done = assert.async();
        syncBackend.syncAll().then(results => {
            assert.ok(httpCallStub.calledOnce, 'Pitäisi lähettää HTTP-pyyntö');
            assert.deepEqual(
                httpCallStub.firstCall.args, // 0 = url, 1 = data, 2 = forceRequest/skipOfflineCheck
                ['sync', someSyncableItems, undefined],
                'Pitäisi POSTata syncQueue backendiin'
            );
            assert.ok(cleanUpCallStub.calledAfter(httpCallStub));
            assert.deepEqual(
                cleanUpCallStub.firstCall.args,
                [mockSuccesfullySyncIds],
                'Pitäisi siivota onnistuneesti synkatut itemit selaintietokannasta'
            );
            assert.equal(
                results,
                678,
                'Pitäisi palauttaa onnistuneesti synkattujen&siivottujen itemeiden lukumäärä'
            );
            done();
        });
    });
    QUnit.test('syncAll ei lähetä itemeitä backendiin, jos niitä ei ole', assert => {
        sinon.stub(shallowOfflineHttp, 'getRequestSyncQueue').returns(Promise.resolve([]));
        const httpCallSpy = sinon.spy(shallowHttp, 'post');
        const cleanUpCallSpy = sinon.spy(shallowOfflineHttp, 'removeRequestsFromQueue');
        const done = assert.async();
        syncBackend.syncAll().then(result => {
            assert.ok(httpCallSpy.notCalled, 'Ei pitäisi lähettää backendiin mitään');
            assert.ok(cleanUpCallSpy.notCalled, 'Ei pitäisi yrittää siivota selaintietokantaa');
            assert.equal(result, 0, 'Olisi pitänyt synkata 0 (ei yhtään) itemiä');
            done();
        });
    });
});