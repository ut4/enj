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
    QUnit.test('sendAsyncMessage lähettää viestin serviceWorkerille, ja passaa sille ' +
        'messageportin, jolla worker voi palauttaa tietoa takaisin', assert => {
        mockServiceWorkerContainer.controller = mockServiceWorker;
        const postMessageSpy = sinon.spy(mockServiceWorkerContainer.controller, 'postMessage');
        const someMessage = {foo: 'bar'};
        //
        const promise = offline.sendAsyncMessage(someMessage);
        //
        assert.ok(postMessageSpy.calledOnce, 'Pitäisi lähettää viesti');
        assert.deepEqual(
            postMessageSpy.firstCall.args[0],// 0 = message, 1 = [MessagePort]
            someMessage,
            'Pitäisi lähettää viestin data'
        );
        const portPassedToSW = postMessageSpy.firstCall.args[1][0];
        assert.ok(
            portPassedToSW instanceof MessagePort,
            'Pitäisi passata viestissä messagechannel-portin, jolla ser' +
            'viceWorker voi palauttaa tietoa takaisin'
        );
        // Simuloi sw-main.js:ssä normaalisti tapahtuva kuittaus / tiedon palautus
        const mockValueFromServiceWorker = {foo: 'bar'};
        portPassedToSW.postMessage(mockValueFromServiceWorker);
        //
        const done = assert.async();
        promise.then(value => {
            assert.deepEqual(
                value,
                mockValueFromServiceWorker,
                'Pitäisi resolvata serviceWorkerin porttiin lähettämä data'
            );
            done();
        });
    });
    QUnit.test('sendAsyncMessage rejektoi, jos serviceWorkerin porttiin kuittaama arvo sisältää {error:...}', assert => {
        mockServiceWorkerContainer.controller = mockServiceWorker;
        const postMessageSpy = sinon.spy(mockServiceWorkerContainer.controller, 'postMessage');
        //
        const promise = offline.sendAsyncMessage({fo: 'bar'});
        //
        const portsPassedToSW = postMessageSpy.firstCall.args[1];
        portsPassedToSW[0].postMessage({error: 'someerror'});
        //
        const done = assert.async();
        promise.then(null, value => {
            assert.equal(
                value,
                'someerror',
                'Pitäisi rejektoida servieWorkerin kuittaama virhe'
            );
            done();
        });
    });
    QUnit.test('updateCache lähettää serviceWorkerille updateCache-komennon', assert => {
        mockServiceWorkerContainer.controller = mockServiceWorker;
        const postMessageStub = sinon.stub(mockServiceWorkerContainer.controller, 'postMessage');
        const someUrl = 'foo/bar';
        const someData = {foo: 'bar'};
        //
        offline.updateCache(someUrl, someData);
        //
        assert.ok(postMessageStub.calledOnce, 'Pitäisi lähettää viesti');
        assert.deepEqual(
            postMessageStub.firstCall.args[0],// 0 = message, 1 = [MessagePort]
            {
                action: 'updateCache',
                url: someUrl,
                data: someData
            }
        );
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
