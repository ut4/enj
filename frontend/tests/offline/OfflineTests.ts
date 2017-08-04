import QUnit from 'qunitjs';
import sinon from 'sinon';
import UserState from 'src/user/UserState';
import Offline from 'src/offline/Offline';

QUnit.module('offline/Offline', hooks => {
    let shallowUserState: UserState;
    let mockServiceWorkerContainer: {register: Function, controller: Object};
    let offline: Offline;
    let mockServiceWorker: {state: string, postMessage: Function};
    hooks.beforeEach(() => {
        shallowUserState = Object.create(UserState.prototype);
        mockServiceWorkerContainer = {register: () => {}, controller: null};
        mockServiceWorker = {state: 'activated', postMessage: () => {}};
        offline = new Offline(shallowUserState, mockServiceWorkerContainer as any);
    });
    QUnit.test('enable asentaa serviceworkerin ja päivittää statuksen selaintietokantaan', assert => {
        const mockRegistration = {installing: mockServiceWorker};
        const swRegistration = sinon.mock(mockServiceWorkerContainer);
        swRegistration.expects('register').once().withExactArgs('sw-main.js').returns(Promise.resolve(mockRegistration));
        const swInformOperation = sinon.spy(mockServiceWorker, 'postMessage');
        const dbUpdateOperation = sinon.stub(shallowUserState, 'setIsOffline').returns(Promise.resolve(1));
        assert.deepEqual((offline as any).controllingServiceWorker, null,
            'Initial controllingServiceWorker pitäisi olla null'
        );
        const done = assert.async();
        offline.enable().then(() => {
            swRegistration.verify();
            assert.ok(swInformOperation.calledOnce, 'Pitäisi lähettää uusi status workerille');
            assert.deepEqual(swInformOperation.firstCall.args, [{
                action: 'setIsOnline',
                value: false
            }]);
            assert.ok(dbUpdateOperation.calledOnce, 'Pitäisi päivittää offline-status selaintietokantaan');
            assert.deepEqual(dbUpdateOperation.firstCall.args, [true]);
            assert.deepEqual((offline as any).controllingServiceWorker, mockServiceWorker,
                'Pitäisi asettaa rekisteröity worker this.controllingServiceWorker:iin'
            );
            done();
        });
    });
    // TODO enable serviceWorker epäonnistuu
    // TODO enable serviceWorker jo asennettu
    // TODO enable käyttäjä on jo offline?
    QUnit.test('disable synkkaa syncQueuen ja päivittää statuksen selaintietokantaan', assert => {
        (offline as any).controllingServiceWorker = mockServiceWorker;
        const isOnlineSwStateUpdate = sinon.spy(mockServiceWorker, 'postMessage');
        const fakeDbUpdate = sinon.stub(shallowUserState, 'setIsOffline').returns(Promise.resolve(1));
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
        (offline as any).controllingServiceWorker = mockServiceWorker;
        const postMessageSpy = sinon.spy(mockServiceWorker, 'postMessage');
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
        (offline as any).controllingServiceWorker = mockServiceWorker;
        const postMessageSpy = sinon.spy(mockServiceWorker, 'postMessage');
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
        (offline as any).controllingServiceWorker = mockServiceWorker;
        const postMessageStub = sinon.stub(mockServiceWorker, 'postMessage');
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
});
