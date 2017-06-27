import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import OfflineEndView from 'src/offline/OfflineEndView';
import Offline from 'src/offline/Offline';
import UserState from 'src/user/UserState';
import SyncBackend from 'src/offline/SyncBackend';
import iocFactories from 'src/ioc';

QUnit.module('offline/OfflineEndView', hooks => {
    let offlineStub: Offline;
    let offlineStubIocFactoryOverride: sinon.SinonStub;
    let userStateStub: UserState;
    let userStateStubIocFactoryOverride: sinon.SinonStub;
    let syncBackendStub: SyncBackend;
    let syncBackendIocFactoryOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        offlineStub = Object.create(Offline.prototype);
        offlineStubIocFactoryOverride = sinon.stub(iocFactories, 'offline').returns(offlineStub);
        userStateStub = Object.create(UserState.prototype);
        userStateStubIocFactoryOverride = sinon.stub(iocFactories, 'userState').returns(userStateStub);
        syncBackendStub = Object.create(SyncBackend.prototype);
        syncBackendIocFactoryOverride = sinon.stub(iocFactories, 'syncBackend').returns(syncBackendStub);
    });
    hooks.afterEach(() => {
        offlineStubIocFactoryOverride.restore();
        userStateStubIocFactoryOverride.restore();
        syncBackendIocFactoryOverride.restore();
    });
    QUnit.test('submit-painike on oletuksena disabloituna', assert => {
        //
        const rendered = itu.renderIntoDocument(<OfflineEndView/>);
        //
        const confirmButton = getConfirmButton(rendered);
        assert.ok(confirmButton.disabled);
    });
    QUnit.test('confirm palaa online-tilan', assert => {
        const resumeOnlineCallStub = sinon.stub(offlineStub, 'disable').returns(Promise.resolve(1));
        const loginUserCallStub = sinon.stub(userStateStub, 'setMaybeIsLoggedIn').returns(Promise.resolve());
        const backendSyncCallStub = sinon.stub(syncBackendStub, 'syncAll').returns(Promise.resolve(2));
        const allDoneCallSpy = sinon.spy(OfflineEndView.prototype, 'nah');
        //
        const rendered = itu.renderIntoDocument(<OfflineEndView/>);
        (rendered as any).props.children.children.setState({goodToGo: true});
        const confirmButton = getConfirmButton(rendered);
        //
        confirmButton.click();
        //
        const done = assert.async();
        assert.ok(resumeOnlineCallStub.calledOnce, 'Pitäisi asettaa käytttäjän tila takaisin online');
        resumeOnlineCallStub.firstCall.returnValue.then(() => {
            assert.ok(loginUserCallStub.calledAfter(resumeOnlineCallStub), 'Sen jälkeen pitäisi kirjata käyttäjä sisään');
            return loginUserCallStub.firstCall.returnValue;
        }).then(() => {
            assert.ok(backendSyncCallStub.calledAfter(loginUserCallStub), 'Sen jälkeen pitäisi synkata syncQueue backendiin');
            return backendSyncCallStub.firstCall.returnValue;
        }).then(() => {
            assert.ok(allDoneCallSpy.calledAfter(backendSyncCallStub), 'Pitäisi lopuksi sulkea viewi');
            allDoneCallSpy.restore();
            done();
        });
    });
    function getConfirmButton(rendered): HTMLButtonElement {
        return itu.findRenderedDOMElementWithClass(rendered, 'nice-button-primary') as HTMLButtonElement;
    }
});
