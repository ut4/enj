import QUnit from 'qunitjs';
import sinon from 'sinon';
import itu from 'inferno-test-utils';
import AuthService from 'src/auth/AuthService';
import UserBackend from 'src/user/UserBackend';
import CredentialsDeleteView from 'src/auth/CredentialsDeleteView';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

QUnit.module('auth/CredentialsDeleteView', hooks => {
    let testUser = {id: 'uid'};
    let shallowAuthService: AuthService;
    let authServiceIocOverride: sinon.SinonStub;
    let shallowUserBackend: UserBackend;
    let userBackendIocOverride: sinon.SinonStub;
    let fakeHistory: {push: sinon.SinonSpy};
    let historyIocOverride: sinon.SinonStub;
    let notifySpy: sinon.SinonSpy;
    let notifyIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        shallowAuthService = Object.create(AuthService.prototype);
        authServiceIocOverride = sinon.stub(iocFactories, 'authService').returns(shallowAuthService);
        shallowUserBackend = Object.create(UserBackend.prototype);
        userBackendIocOverride = sinon.stub(iocFactories, 'userBackend').returns(shallowUserBackend);
        fakeHistory = {push: sinon.spy()};
        historyIocOverride = sinon.stub(iocFactories, 'history').returns(fakeHistory);
        notifySpy = sinon.spy();
        notifyIocOverride = sinon.stub(iocFactories, 'notify').returns(notifySpy);
    });
    hooks.afterEach(() => {
        authServiceIocOverride.restore();
        userBackendIocOverride.restore();
        historyIocOverride.restore();
        notifyIocOverride.restore();
    });
    QUnit.test('confirm kutsuu authService.deleteUser ja ohjaa takaisin profiiliin', assert => {
        const credentialsFetchStub = sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve(testUser));
        const authServiceCallStub = sinon.stub(shallowAuthService, 'deleteUser').returns(Promise.resolve({ok:true}));
        const confirmSpy = sinon.spy(CredentialsDeleteView.prototype, 'confirm');
        // Renderöi view
        const rendered = itu.renderIntoDocument(<CredentialsDeleteView/>);
        // Odota että latautuu
        const done = assert.async();
        credentialsFetchStub.firstCall.returnValue.then(() => {
            const confirmButton = utils.findButtonByContent(rendered, 'Poista tili');
            assert.ok(confirmButton.disabled, 'Submit-painike pitäisi olla aluksi disabled');
            // Ruksaa confirmation checkbox
            const confirmationCheckox = utils.getInputs(rendered)[0];
            utils.setChecked(true, confirmationCheckox);
            confirmButton.click();
            //
            return confirmSpy.firstCall.returnValue;
        }).then(() => {
            assert.deepEqual(authServiceCallStub.firstCall.args, [testUser]);
            // Redirect
            assert.ok(fakeHistory.push.calledAfter(authServiceCallStub), 'Pitäisi ohjata käyttäjä takaisin');
            assert.deepEqual(fakeHistory.push.firstCall.args, ['/'], 'Pitäisi lopuksi ohjata käyttäjä takaisin päänäkymään');
            // Notify
            assert.ok(notifySpy.calledOnce, 'Pitäisi notifioida käyttäjää onnistuneesta toiminnosta');
            done();
        });
    });
});
