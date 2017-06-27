import QUnit from 'qunitjs';
import sinon from 'sinon';
import itu from 'inferno-test-utils';
import AuthBackend from 'src/auth/AuthBackend';
import LoginView from 'src/auth/LoginView';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

QUnit.module('auth/LoginView', hooks => {
    let authBackendStub: AuthBackend;
    let authBackendIocOverride: sinon.SinonStub;
    let fakeHistory: {push: sinon.SinonSpy};
    let historyIocOverride: sinon.SinonStub;
    let notifySpy: sinon.SinonSpy;
    let notifyIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        authBackendStub = Object.create(AuthBackend.prototype);
        authBackendIocOverride = sinon.stub(iocFactories, 'authBackend').returns(authBackendStub);
        fakeHistory = {push: sinon.spy()};
        historyIocOverride = sinon.stub(iocFactories, 'history').returns(fakeHistory);
        notifySpy = sinon.spy();
        notifyIocOverride = sinon.stub(iocFactories, 'notify').returns(notifySpy);
    });
    hooks.afterEach(() => {
        authBackendIocOverride.restore();
        historyIocOverride.restore();
        notifyIocOverride.restore();
    });
    QUnit.test('submit postaa credentiansit backendiin, ja ohjaa takaisin #/', assert => {
        //
        const rendered = itu.renderIntoDocument(<LoginView/>);
        //
        const confirmButton = getConfirmButton(rendered);
        assert.ok(confirmButton.disabled, 'Submit-painike pitäisi olla aluksi disabled');
        //
        const testUsername = 'fyy';
        const testPassword = 'byrs';
        const inputEls = itu.scryRenderedDOMElementsWithTag(rendered, 'input');
        const usernameInputEl = inputEls[0] as HTMLInputElement;
        const passwordInputEl = inputEls[1] as HTMLInputElement;
        usernameInputEl.value = testUsername;
        utils.triggerEvent('input', usernameInputEl);
        passwordInputEl.value = testPassword;
        utils.triggerEvent('input', passwordInputEl);
        //
        const loginCallWatch = sinon.stub(authBackendStub, 'login').returns(Promise.resolve());
        confirmButton.click();
        //
        assert.ok(loginCallWatch.calledOnce, 'Pitäisi postata datan backendiin');
        assert.deepEqual(loginCallWatch.firstCall.args, [{
            username: testUsername,
            password: testPassword
        }], 'Pitäisi postata lomakkeen tiedot backendiin');
        const done = assert.async();
        loginCallWatch.firstCall.returnValue.then(() => {
            assert.ok(
                fakeHistory.push.calledOnce,
                'Pitäisi lopuksi ohjata käyttäjän takaisin'
            );
            assert.deepEqual(
                fakeHistory.push.firstCall.args, ['/'],
                'Pitäisi lopuksi ohjata käyttäjän takaisin /'
            );
            assert.ok(
                notifySpy.calledOnce,
                'Pitäisi notifioida käyttäjää onnistuneesta kirjautumisesta'
            );
            done();
        });
    });
    QUnit.test('submit näyttää virheviestin backendin rejektoidessa', assert => {
        const loginCallWatch = sinon.stub(authBackendStub, 'login');
        loginCallWatch.onFirstCall().returns(Promise.reject({status: 401}));
        loginCallWatch.onSecondCall().returns(Promise.reject({status: 500}));
        //
        const instance = new LoginView() as any;
        instance.loginForm = {getValues: () => null};
        //
        const done = assert.async();
        Promise.all([
            instance.confirm(),
            instance.confirm()
        ]).then(res => {
            assert.ok(
                notifySpy.calledTwice,
                'Pitäisi notifioida käyttäjää backendin failauksista'
            );
            assert.equal(
                notifySpy.firstCall.args[1],// 0 = message, 1 = level
                'notice'
            );
            assert.equal(
                notifySpy.secondCall.args[1],
                'error'
            );
            done();
        });
    });
    function getConfirmButton(rendered): HTMLButtonElement {
        return itu.findRenderedDOMElementWithClass(rendered, 'nice-button-primary') as HTMLButtonElement;
    }
});
