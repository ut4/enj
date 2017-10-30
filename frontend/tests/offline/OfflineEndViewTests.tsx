import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import OfflineEndView from 'src/offline/OfflineEndView';
import UserState from 'src/user/UserState';
import Offline from 'src/offline/Offline';
import AuthService from 'src/auth/AuthService';
import SyncBackend from 'src/offline/SyncBackend';
import iocFactories from 'src/ioc';

QUnit.module('offline/OfflineEndView', hooks => {
    let userStateStub: UserState;
    let userStateStubIocFactoryOverride: sinon.SinonStub;
    let shallowUserState: Offline;
    let offlineStubIocFactoryOverride: sinon.SinonStub;
    let shallowAuthService: AuthService;
    let authServiceStubIocFactoryOverride: sinon.SinonStub;
    let shallowSyncBackend: SyncBackend;
    let syncBackendIocFactoryOverride: sinon.SinonStub;
    let fakeHistory: {goBack: sinon.SinonSpy};
    let historyIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        userStateStub = Object.create(UserState.prototype);
        userStateStubIocFactoryOverride = sinon.stub(iocFactories, 'userState').returns(userStateStub);
        shallowUserState = Object.create(Offline.prototype);
        offlineStubIocFactoryOverride = sinon.stub(iocFactories, 'offline').returns(shallowUserState);
        shallowAuthService = Object.create(AuthService.prototype);
        authServiceStubIocFactoryOverride = sinon.stub(iocFactories, 'authService').returns(shallowAuthService);
        shallowSyncBackend = Object.create(SyncBackend.prototype);
        syncBackendIocFactoryOverride = sinon.stub(iocFactories, 'syncBackend').returns(shallowSyncBackend);
        fakeHistory = {goBack: sinon.spy()};
        historyIocOverride = sinon.stub(iocFactories, 'history').returns(fakeHistory);
    });
    hooks.afterEach(() => {
        userStateStubIocFactoryOverride.restore();
        offlineStubIocFactoryOverride.restore();
        authServiceStubIocFactoryOverride.restore();
        syncBackendIocFactoryOverride.restore();
        historyIocOverride.restore();
    });
    QUnit.test('submit-painike on oletuksena disabloituna', assert => {
        //
        const rendered = itu.renderIntoDocument(<OfflineEndView/>);
        //
        const confirmButton = getConfirmButton(rendered);
        assert.ok(confirmButton.disabled);
    });
    QUnit.test('confirm palaa online-tilan', assert => {
        const loginCallStub = sinon.stub(shallowAuthService, 'login').returns(Promise.resolve(1));
        const resumeOnlineCallStub = sinon.stub(shallowUserState, 'disable').returns(Promise.resolve(1));
        const backendSyncCallStub = sinon.stub(shallowSyncBackend, 'syncAll').returns(Promise.resolve(2));
        //
        const confirmSpy = renderViewAndTriggerConfirm();
        //
        const done = assert.async();
        confirmSpy.firstCall.returnValue.then(() => {
            assert.ok(loginCallStub.calledOnce, 'Pitäisi kirjata käyttäjä sisään');
            assert.ok(resumeOnlineCallStub.calledAfter(loginCallStub), 'Sen jälkeen pitäisi asettaa käyttäjän tila takaisin online');
            assert.ok(backendSyncCallStub.calledAfter(loginCallStub), 'Sen jälkeen pitäisi synkata syncQueue backendiin');
            assert.ok(fakeHistory.goBack.calledAfter(backendSyncCallStub), 'Pitäisi lopuksi sulkea näkymä');
            confirmSpy.restore();
            done();
        });
    });
    QUnit.test('confirm skippaa muut toiminnot, jos kirjautuminen ei onnistu', assert => {
        const loginError = new Error('fus');
        (loginError as any).response = {status: 401};
        sinon.stub(shallowAuthService, 'login').returns(Promise.reject(loginError));
        const resumeOnlineCallSpy = sinon.spy(shallowUserState, 'disable');
        const backendSyncCallSpy = sinon.spy(shallowSyncBackend, 'syncAll');
        const notifySpy = sinon.spy();
        const notifyIocOverride = sinon.stub(iocFactories, 'notify').returns(notifySpy);
        //
        const confirmSpy = renderViewAndTriggerConfirm();
        //
        const done = assert.async();
        confirmSpy.firstCall.returnValue.then(() => {
            assert.deepEqual(notifySpy.firstCall.args, [
                'Käyttäjätunnus tai salasana ei täsmännyt',
                'error'
            ], 'Pitäisi notifioida tilanteeseen sopivalla viestillä');
            assert.ok(resumeOnlineCallSpy.notCalled, 'Ei pitäisi edes yrittää päivittää offline-tilaa');
            assert.ok(backendSyncCallSpy.notCalled, 'Ei pitäisi edes yrittää synkata mitään');
            confirmSpy.restore();
            notifyIocOverride.restore();
            done();
        });
    });
    function getConfirmButton(rendered): HTMLButtonElement {
        return itu.findRenderedDOMElementWithClass(rendered, 'nice-button-primary') as HTMLButtonElement;
    }
    function renderViewAndTriggerConfirm(): sinon.SinonSpy {
        const confirmSpy = sinon.spy(OfflineEndView.prototype, 'confirm');
        const rendered = itu.renderIntoDocument(<OfflineEndView/>);
        (rendered as any).props.children.children.setState({goodToGo: true});
        const confirmButton = getConfirmButton(rendered);
        //
        confirmButton.click();
        return confirmSpy;
    }
});
