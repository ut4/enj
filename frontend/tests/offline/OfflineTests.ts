import QUnit from 'qunitjs';
import sinon from 'sinon';
import Db from 'src/common/Db';
import Offline from 'src/offline/Offline';

QUnit.module('offline/Offline', hooks => {
    const testClientId:number = 999;
    hooks.beforeEach(() => {
        this.db = new Db();
        this.mockServiceWorkerContainer = {register: () => {}};
        this.offline = new Offline(this.db, this.mockServiceWorkerContainer);
        this.mockServiceWorker = {state: 'activated', postMessage: () => {}};
    });
    QUnit.test('isEnabled palauttaa false, jos eksplisiittistä tietoa ei löydy selaintietokannasta', assert => {
        sinon.stub(this.db.network, 'get').returns(Promise.resolve(undefined));
        const done = assert.async();
        this.offline.isEnabled(testClientId).then(result => {
            assert.equal(result, false, 'Pitäisi palauttaa oletuksena false');
            done();
        });
    });
    QUnit.test('isEnabled palauttaa false, jos selaintietokanta palauttaa "online"', assert => {
        sinon.stub(this.db.network, 'get').returns(Promise.resolve({status: 'online'}));
        const done = assert.async();
        this.offline.isEnabled(testClientId).then(result => {
            assert.equal(false, result, 'Pitäisi palauttaa false jos status on \'online\'');
            done();
        });
    });
    QUnit.test('isEnabled palauttaa true, jos selaintietokanta palauttaa "offline"', assert => {
        sinon.stub(this.db.network, 'get').returns(Promise.resolve({status: 'offline'}));
        const done = assert.async();
        this.offline.isEnabled(testClientId).then(result => {
            assert.equal(true, result, 'Pitäisi palauttaa true jos status on \'offline\'');
            done();
        });
    });
    QUnit.test('enable asentaa serviceworkerin ja päivittää statuksen selaintietokantaan', assert => {
        const mockRegistration = {installing: this.mockServiceWorker};
        const swRegistration = sinon.mock(this.mockServiceWorkerContainer);
        swRegistration.expects('register').once()
            .withExactArgs('sw-main.js')
            .returns(Promise.resolve(mockRegistration));
        const isOnlineSwStateUpdate = sinon.spy(this.mockServiceWorker, 'postMessage');
        const fakeDbUpdate = sinon.stub(this.db.network, 'put').returns(Promise.resolve(1));
        const done = assert.async();
        this.offline.enable(testClientId).then(() => {
            swRegistration.verify();
            assert.ok(isOnlineSwStateUpdate.called);
            assert.deepEqual(isOnlineSwStateUpdate.firstCall.args, [{
                action: 'setIsOnline',
                value: false
            }]);
            assert.ok(fakeDbUpdate.called);
            assert.deepEqual(fakeDbUpdate.firstCall.args, [{id: testClientId, status: 'offline'}]);
            done();
        });
    });
    // TODO enable serviceWorker epäonnistuu
    // TODO enable serviceWorker jo asennettu
    // TODO enable käyttäjä on jo offline?
    QUnit.test('disable synkkaa syncQueuen ja päivittää statuksen selaintietokantaan', assert => {
        this.mockServiceWorkerContainer.controller = this.mockServiceWorker;
        const isOnlineSwStateUpdate = sinon.spy(this.mockServiceWorker, 'postMessage');
        const fakeDbUpdate = sinon.stub(this.db.network, 'put').returns(Promise.resolve(1));
        const done = assert.async();
        this.offline.disable(testClientId).then(() => {
            assert.ok(isOnlineSwStateUpdate.called);
            assert.deepEqual(isOnlineSwStateUpdate.firstCall.args, [{
                action: 'setIsOnline',
                value: true
            }]);
            assert.ok(fakeDbUpdate.called);
            assert.deepEqual(fakeDbUpdate.firstCall.args, [{id: testClientId, status: 'online'}]);
            done();
        });
    });
    // TODO unregister offline kutsuu unregister jos getregistration palauttaa
});
