import QUnit from 'qunitjs';
import sinon from 'sinon';
import itu from 'inferno-test-utils';
import AuthBackend from 'src/auth/AuthBackend';
import UserBackend from 'src/user/UserBackend';
import CredentialsEditView from 'src/auth/CredentialsEditView';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

QUnit.module('auth/CredentialsEditView', hooks => {
    let testUser = {username: 'neo', email: 'e@mail.com'};
    let shallowAuthBackend: AuthBackend;
    let authBackendIocOverride: sinon.SinonStub;
    let shallowUserBackend: UserBackend;
    let userBackendIocOverride: sinon.SinonStub;
    let fakeHistory: {push: sinon.SinonSpy};
    let historyIocOverride: sinon.SinonStub;
    let notifySpy: sinon.SinonSpy;
    let notifyIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        shallowAuthBackend = Object.create(AuthBackend.prototype);
        authBackendIocOverride = sinon.stub(iocFactories, 'authBackend').returns(shallowAuthBackend);
        shallowUserBackend = Object.create(UserBackend.prototype);
        userBackendIocOverride = sinon.stub(iocFactories, 'userBackend').returns(shallowUserBackend);
        fakeHistory = {push: sinon.spy()};
        historyIocOverride = sinon.stub(iocFactories, 'history').returns(fakeHistory);
        notifySpy = sinon.spy();
        notifyIocOverride = sinon.stub(iocFactories, 'notify').returns(notifySpy);
    });
    hooks.afterEach(() => {
        authBackendIocOverride.restore();
        userBackendIocOverride.restore();
        historyIocOverride.restore();
        notifyIocOverride.restore();
    });
    QUnit.test('confirm kutsuu updateCredentials ja ohjaa takaisin profiiliin', assert => {
        const credentialsFetchStub = sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve(testUser));
        const credentialsUpdateStub = sinon.stub(shallowAuthBackend, 'updateCredentials').returns(Promise.resolve(1));
        const confirmSpy = sinon.spy(CredentialsEditView.prototype, 'confirm');
        const currentPassword = 'bars';
        const newCredentials = {username: 'neu', email: 'neu@mail.com', password: 'fars'};
        // Renderöi view
        const rendered = itu.renderIntoDocument(<CredentialsEditView/>);
        // Odota että latautuu
        const done = assert.async();
        credentialsFetchStub.firstCall.returnValue.then(() => {
            const confirmButton = getConfirmButton(rendered);
            assert.ok(confirmButton.disabled, 'Submit-painike pitäisi olla aluksi disabled');
            // Täytä password & newPassword & newPasswordConfirmation & lähetä lomake
            const inputEls = itu.scryRenderedDOMElementsWithTag(rendered, 'input');
            const usernameInputEl = inputEls[0] as HTMLInputElement;
            const emailInputEl = inputEls[1] as HTMLInputElement;
            const passwordInputEl = inputEls[2] as HTMLInputElement;
            const newPasswordInputEl = inputEls[3] as HTMLInputElement;
            const newPasswordConfirmationInputEl = inputEls[4] as HTMLInputElement;
            utils.setInputValue(newCredentials.username, usernameInputEl);
            utils.setInputValue(newCredentials.email, emailInputEl);
            utils.setInputValue(currentPassword, passwordInputEl);
            utils.setInputValue(newCredentials.password, newPasswordInputEl);
            utils.setInputValue(newCredentials.password, newPasswordConfirmationInputEl);
            confirmButton.click();
            //
            return confirmSpy.firstCall.returnValue;
        }).then(() => {
            // Assertoi backendiin POST
            assert.ok(credentialsUpdateStub.calledOnce, 'Pitäisi postata dataa backendiin');
            assert.deepEqual(credentialsUpdateStub.firstCall.args, [{
                username: newCredentials.username,
                email: newCredentials.email,
                password: currentPassword,
                newPassword: newCredentials.password
            }], 'Pitäisi passata lomakkeen tiedot updateCredentialsille');
            // Redirect
            assert.ok(fakeHistory.push.calledAfter(credentialsUpdateStub), 'Pitäisi lopuksi ohjata käyttäjä takaisin');
            assert.deepEqual(fakeHistory.push.firstCall.args, ['/profiili'], 'Pitäisi lopuksi ohjata käyttäjä takaisin /profiili');
            // Notify
            assert.ok(notifySpy.calledOnce, 'Pitäisi notifioida käyttäjää onnistuneesta päivityksestä');
            done();
        });
    });
    QUnit.test('confirm näyttää virheviestin backendin rejektoidessa', assert => {
        const credentialsUpdateStub = sinon.stub(shallowAuthBackend, 'updateCredentials')
            .returns(Promise.reject({response:{status: 400}}));
        //
        const instance = new CredentialsEditView({}, {}) as any;
        instance.credentialsForm = {getValues: () => null};
        //
        const done = assert.async();
        instance.confirm().then(res => {
            assert.ok(notifySpy.calledOnce, 'Pitäisi notifioida käyttäjää backendin failauksista');
            assert.equal(notifySpy.firstCall.args[1], 'error');
            done();
        });
    });
    function getConfirmButton(rendered): HTMLButtonElement {
        return itu.findRenderedDOMElementWithClass(rendered, 'nice-button-primary') as HTMLButtonElement;
    }
});
