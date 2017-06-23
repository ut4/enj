import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import SyncBackend from 'src/offline/SyncBackend';

QUnit.module('offline/SyncBackend', hooks => {
    let httpStub: Http;
    let offlineHttpStub: OfflineHttp;
    let syncBackend: SyncBackend;
    let someSyncableItems: Array<Enj.OfflineDbSchema.SyncQueueRecord>;
    hooks.beforeEach(() => {
        httpStub = Object.create(Http.prototype);
        offlineHttpStub = Object.create(OfflineHttp.prototype);
        syncBackend = new SyncBackend(httpStub, offlineHttpStub);
        someSyncableItems = [
            {id: 1, url: 'foo', data: {k: 'v'}, method: 'POST', response: 45},
            {id: 2, url: 'bar', data: {g: 'w'}, method: 'POST', response: 46}
        ];
    });
    QUnit.test('syncAll postaa synkattavat itemit backendiin ja siivoaa ne lopuksi selaintietokannasta', assert => {
        sinon.stub(offlineHttpStub, 'getRequestSyncQueue').returns(Promise.resolve(someSyncableItems));
        const httpCallStub = sinon.stub(httpStub, 'post').returns(Promise.resolve(someSyncableItems.length));
        const cleanUpCallStub = sinon.stub(offlineHttpStub, 'removeRequestsFromQueue').returns(Promise.resolve(3));
        const done = assert.async();
        syncBackend.syncAll().then(results => {
            assert.ok(httpCallStub.calledOnce);
            assert.deepEqual(
                httpCallStub.firstCall.args,
                ['api/sync', someSyncableItems],
                'Pitäisi POSTata datan backendiin synkattavaksi'
            );
            assert.ok(cleanUpCallStub.calledAfter(httpCallStub));
            assert.deepEqual(
                cleanUpCallStub.firstCall.args,
                [someSyncableItems.map(ssi => ssi.id)],
                'Pitäisi siivota kaikki synkattavat itemit selaintietokannasta'
            );
            assert.deepEqual(
                results,
                3,
                'Pitäisi palauttaa siivottujen itemien lukumäärän ' +
                '(removeRequestsFromQueue paluuarvo)'
            );
            done();
        });
    });
    QUnit.test('syncAll rejektoi jos backend epäonnistuu _yhdenkään_ itemin synkkauksessa', assert => {
        sinon.stub(offlineHttpStub, 'getRequestSyncQueue').returns(Promise.resolve(someSyncableItems));
        // Simuloi backendin vastaus, jossa kaikkien itemeiden synkkaus ei ole onnistunut
        sinon.stub(httpStub, 'post').returns(Promise.resolve(someSyncableItems.length - 1));
        const cleanUpCallSpy = sinon.spy(offlineHttpStub, 'removeRequestsFromQueue');
        const done = assert.async();
        syncBackend.syncAll().then(null, results => {
            assert.ok(cleanUpCallSpy.notCalled, 'Ei pitäisi siivota selaintietokantaa epäonnistuessa');
            assert.equal(results, 0, 'Olisi pitänyt synkata 0 (ei yhtään) itemiä');
            done();
        });
    });
    QUnit.test('syncAll ei lähetä itemeitä backendiin, jos niitä ei ole', assert => {
        sinon.stub(offlineHttpStub, 'getRequestSyncQueue').returns(Promise.resolve([]));
        const httpCallSpy = sinon.spy(httpStub, 'post');
        const cleanUpCallSpy = sinon.spy(offlineHttpStub, 'removeRequestsFromQueue');
        const done = assert.async();
        syncBackend.syncAll().then(result => {
            assert.ok(httpCallSpy.notCalled, 'Ei pitäisi lähettää backendiin mitään');
            assert.ok(cleanUpCallSpy.notCalled, 'Ei pitäisi yrittää siivota selaintietokantaa');
            assert.equal(result, 0, 'Olisi pitänyt synkata 0 (ei yhtään) itemiä');
            done();
        });
    });
});