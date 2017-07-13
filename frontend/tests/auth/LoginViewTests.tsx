import QUnit from 'qunitjs';
import sinon from 'sinon';
import itu from 'inferno-test-utils';
import AuthService from 'src/auth/AuthService';
import LoginView from 'src/auth/LoginView';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

QUnit.module('auth/LoginView', hooks => {
    let authServiceStub: AuthService;
    let authServiceIocOverride: sinon.SinonStub;
    let fakeHistory: {push: sinon.SinonSpy};
    let historyIocOverride: sinon.SinonStub;
    let notifySpy: sinon.SinonSpy;
    let notifyIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        authServiceStub = Object.create(AuthService.prototype);
        authServiceIocOverride = sinon.stub(iocFactories, 'authService').returns(authServiceStub);
        fakeHistory = {push: sinon.spy()};
        historyIocOverride = sinon.stub(iocFactories, 'history').returns(fakeHistory);
        notifySpy = sinon.spy();
        notifyIocOverride = sinon.stub(iocFactories, 'notify').returns(notifySpy);
    });
    hooks.afterEach(() => {
        authServiceIocOverride.restore();
        historyIocOverride.restore();
        notifyIocOverride.restore();
    });
    QUnit.test('submit kutsuu authService.login ja ohjaa takaisin #/', assert => {
        const loginCallWatch = sinon.stub(authServiceStub, 'login').returns(Promise.resolve(1));
        // Renderöi view
        const confirmSpy = sinon.spy(LoginView.prototype, 'confirm');
        const rendered = itu.renderIntoDocument(<LoginView/>);
        const confirmButton = getConfirmButton(rendered);
        assert.ok(confirmButton.disabled, 'Submit-painike pitäisi olla aluksi disabled');
        // Täytä username & password inputit & lähetä lomake
        const credentials = fillInputValues(rendered, 'fyy', 'bars');
        confirmButton.click();
        //
        const done = assert.async();
        confirmSpy.firstCall.returnValue.then(() => {
            // Assertoi backendiin POST
            assert.ok(loginCallWatch.calledOnce, 'Pitäisi postata dataa backendiin');
            assert.deepEqual(loginCallWatch.firstCall.args, [credentials], 'Pitäisi passata lomakkeen tiedot authService.loginille');
            // Redirect
            assert.ok(fakeHistory.push.calledAfter(loginCallWatch), 'Pitäisi lopuksi ohjata käyttäjän takaisin');
            assert.deepEqual(fakeHistory.push.firstCall.args, ['/'], 'Pitäisi lopuksi ohjata käyttäjän takaisin /');
            // Notify
            assert.ok(notifySpy.calledOnce, 'Pitäisi notifioida käyttäjää onnistuneesta kirjautumisesta');
            done();
        });
    });
    QUnit.test('submit näyttää virheviestin backendin rejektoidessa', assert => {
        const loginCallWatch = sinon.stub(authServiceStub, 'login');
        loginCallWatch.onFirstCall().returns(Promise.reject({response:{status: 401}}));
        loginCallWatch.onSecondCall().returns(Promise.reject({response:{status: 500}}));
        loginCallWatch.onThirdCall().returns(Promise.reject({}));
        //
        const instance = new LoginView() as any;
        instance.loginForm = {getValues: () => null};
        //
        const done = assert.async();
        Promise.all([
            instance.confirm(),
            instance.confirm(),
            instance.confirm()
        ]).then(res => {
            assert.ok(
                notifySpy.calledThrice,
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
    function fillInputValues(rendered, username, password) {
        const inputEls = itu.scryRenderedDOMElementsWithTag(rendered, 'input');
        const usernameInputEl = inputEls[0] as HTMLInputElement;
        const passwordInputEl = inputEls[1] as HTMLInputElement;
        usernameInputEl.value = username;
        utils.triggerEvent('input', usernameInputEl);
        passwordInputEl.value = password;
        utils.triggerEvent('input', passwordInputEl);
        return {username, password};
    }
});