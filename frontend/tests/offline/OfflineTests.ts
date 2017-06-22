import QUnit from 'qunitjs';
import sinon from 'sinon';
import UserState from 'src/user/UserState';
import Offline from 'src/offline/Offline';

QUnit.module('offline/Offline', hooks => {
    let userState: UserState;
    let mockServiceWorkerContainer: {register: Function, controller: Object};
    let offline: Offline;
    let mockServiceWorker: {state: string, postMessage: Function};
    hooks.beforeEach(() => {
        userState = Object.create(UserState.prototype);//new UserState();
        mockServiceWorkerContainer = {register: () => {}, controller: null};
        offline = new Offline(userState, mockServiceWorkerContainer as any);
        mockServiceWorker = {state: 'activated', postMessage: () => {}};
    });
    QUnit.test('enable asentaa serviceworkerin ja päivittää statuksen selaintietokantaan', assert => {
        const mockRegistration = {installing: mockServiceWorker};
        const swRegistration = sinon.mock(mockServiceWorkerContainer);
        swRegistration.expects('register').once()
            .withExactArgs('sw-main.js')
            .returns(Promise.resolve(mockRegistration));
        const isOnlineSwStateUpdate = sinon.spy(mockServiceWorker, 'postMessage');
        const dbUpdate = sinon.stub(userState, 'setIsOffline').returns(Promise.resolve(1));
        const done = assert.async();
        offline.enable().then(() => {
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
        mockServiceWorkerContainer.controller = mockServiceWorker;
        const isOnlineSwStateUpdate = sinon.spy(mockServiceWorker, 'postMessage');
        const fakeDbUpdate = sinon.stub(userState, 'setIsOffline').returns(Promise.resolve(1));
        const done = assert.async();
        offline.disable().then(() => {
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
    QUnit.test('utils.nextId palauttaa taulukon itemeistä suurimman id:n + 1', assert => {
        //
        const nextId1 = offline.utils.getNextId([]);
        const nextId2 = offline.utils.getNextId([{id: 3}, {id: 2}]);
        const nextId3 = offline.utils.getNextId([{rd: 4}, {rd: 5}], 'rd');
        //
        assert.equal(nextId1, 1, 'Pitäisi palauttaa 1, jos edellistä id:tä ei ole');
        assert.equal(nextId2, 4, 'Pitäisi palauttaa suurimman id:n arvo + 1');
        assert.equal(nextId3, 6, 'Pitäisi palauttaa suurimman rd:n arvo + 1');
    });
});
