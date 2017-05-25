import QUnit from 'qunitjs';
import sinon from 'sinon';
import UserState from 'src/user/UserState';
import Offline from 'src/offline/Offline';

QUnit.module('offline/Offline', hooks => {
    hooks.beforeEach(() => {
        this.userState = Object.create(UserState.prototype);//new UserState();
        this.mockServiceWorkerContainer = {register: () => {}};
        this.offline = new Offline(this.userState, this.mockServiceWorkerContainer);
        this.mockServiceWorker = {state: 'activated', postMessage: () => {}};
    });
    QUnit.test('enable asentaa serviceworkerin ja päivittää statuksen selaintietokantaan', assert => {
        const mockRegistration = {installing: this.mockServiceWorker};
        const swRegistration = sinon.mock(this.mockServiceWorkerContainer);
        swRegistration.expects('register').once()
            .withExactArgs('sw-main.js')
            .returns(Promise.resolve(mockRegistration));
        const isOnlineSwStateUpdate = sinon.spy(this.mockServiceWorker, 'postMessage');
        const dbUpdate = sinon.stub(this.userState, 'setIsOffline').returns(Promise.resolve(1));
        const done = assert.async();
        this.offline.enable().then(() => {
            swRegistration.verify();
            assert.ok(isOnlineSwStateUpdate.calledOnce);
            assert.deepEqual(isOnlineSwStateUpdate.firstCall.args, [{
                action: 'setIsOnline',
                value: false
            }]);
            assert.ok(dbUpdate.calledOnce);
            assert.deepEqual(dbUpdate.firstCall.args, [true]);
            done();
        });
    });
    // TODO enable serviceWorker epäonnistuu
    // TODO enable serviceWorker jo asennettu
    // TODO enable käyttäjä on jo offline?
    QUnit.test('disable synkkaa syncQueuen ja päivittää statuksen selaintietokantaan', assert => {
        this.mockServiceWorkerContainer.controller = this.mockServiceWorker;
        const isOnlineSwStateUpdate = sinon.spy(this.mockServiceWorker, 'postMessage');
        const fakeDbUpdate = sinon.stub(this.userState, 'setIsOffline').returns(Promise.resolve(1));
        const done = assert.async();
        this.offline.disable().then(() => {
            assert.ok(isOnlineSwStateUpdate.calledOnce);
            assert.deepEqual(isOnlineSwStateUpdate.firstCall.args, [{
                action: 'setIsOnline',
                value: true
            }]);
            assert.ok(fakeDbUpdate.calledOnce);
            assert.deepEqual(fakeDbUpdate.firstCall.args, [false]);
            done();
        });
    });
    // TODO unregister offline kutsuu unregister jos getregistration palauttaa
});
