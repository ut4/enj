import QUnit from 'qunitjs';
import sinon from 'sinon';
import itu from 'inferno-test-utils';
import AuthService from 'src/auth/AuthService';
import LoginView from 'src/auth/LoginView';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

class ContextFakingLoginView extends LoginView {
    constructor(props, context) {
        context.router = {location: {search: ''}};
        super(props, context);
    }
}

QUnit.module('auth/LoginView', hooks => {
    let shallowAuthService: AuthService;
    let authServiceIocOverride: sinon.SinonStub;
    let fakeHistory: {push: sinon.SinonSpy};
    let historyIocOverride: sinon.SinonStub;
    let notifySpy: sinon.SinonSpy;
    let notifyIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        shallowAuthService = Object.create(AuthService.prototype);
        authServiceIocOverride = sinon.stub(iocFactories, 'authService').returns(shallowAuthService);
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
    QUnit.test('confirm kutsuu authService.login ja ohjaa takaisin #/', assert => {
        const loginCallWatch = sinon.stub(shallowAuthService, 'login').returns(Promise.resolve(1));
        // Renderöi view
        const confirmSpy = sinon.spy(ContextFakingLoginView.prototype, 'confirm');
        const rendered = itu.renderIntoDocument(<ContextFakingLoginView/>);
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
            assert.ok(fakeHistory.push.calledAfter(loginCallWatch), 'Pitäisi lopuksi ohjata käyttäjä takaisin');
            assert.deepEqual(fakeHistory.push.firstCall.args, ['/'], 'Pitäisi lopuksi ohjata käyttäjä takaisin /');
            // Notify
            assert.ok(notifySpy.calledOnce, 'Pitäisi notifioida käyttäjää onnistuneesta kirjautumisesta');
            done();
        });
    });
    QUnit.test('confirm ohjaa takaisin ?returnTo:hn\'dt', assert => {
        const loginCallWatch = sinon.stub(shallowAuthService, 'login').returns(Promise.resolve(1));
        const instance = new ContextFakingLoginView({}, {}) as any;
        instance.context.router.location.search = '?returnTo=/foo';
        instance.loginForm = {getValues: () => null};
        instance.componentWillMount();
        //
        const done = assert.async();
        instance.confirm().then(res => {
            assert.deepEqual(fakeHistory.push.firstCall.args, ['/foo'],
                'Pitäisi ohjata käyttäjä returnTo-lokaatioon'
            );
            done();
        });
    });
    QUnit.test('confirm näyttää virheviestin backendin rejektoidessa', assert => {
        const loginCallWatch = sinon.stub(shallowAuthService, 'login');
        loginCallWatch.onFirstCall().returns(Promise.reject({response:{status: 401}}));
        loginCallWatch.onSecondCall().returns(Promise.reject({response:{status: 500}}));
        loginCallWatch.onThirdCall().returns(Promise.reject({}));
        //
        const instance = new ContextFakingLoginView({}, {}) as any;
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
        utils.setInputValue(username, usernameInputEl);
        utils.setInputValue(password, passwordInputEl);
        return {username, password};
    }
});
