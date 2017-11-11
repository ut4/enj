import QUnit from 'qunitjs';
import sinon from 'sinon';
import itu from 'inferno-test-utils';
import AuthBackend from 'src/auth/AuthBackend';
import PasswordCreateView from 'src/auth/PasswordCreateView';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

const CORRECT_RESET_KEY_LENGTH = 64;

QUnit.module('auth/PasswordCreateView', hooks => {
    let shallowAuthBackend: AuthBackend;
    let authBackendIocOverride: sinon.SinonStub;
    let fakeHistory: {push: sinon.SinonSpy};
    let historyIocOverride: sinon.SinonStub;
    let notifySpy: sinon.SinonSpy;
    let notifyIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        shallowAuthBackend = Object.create(AuthBackend.prototype);
        authBackendIocOverride = sinon.stub(iocFactories, 'authBackend').returns(shallowAuthBackend);
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
    QUnit.test('confirm lähettää datan backendiin, ja ohjaa sen jälkeen kirjautumisnäkymään', assert => {
        const putPasswordStub = sinon.stub(shallowAuthBackend, 'update').returns(Promise.resolve({ok: true}));
        const confirmSpy = sinon.spy(PasswordCreateView.prototype, 'confirm');
        const urlParams = {resetKey: 'a'.repeat(CORRECT_RESET_KEY_LENGTH), base64Email: btoa('a@a.a')};
        const newPassword = 'fars';
        // Renderöi view
        const rendered = itu.renderIntoDocument(<PasswordCreateView params={ urlParams }/>);
        const confirmButton = utils.findButtonByContent(rendered, 'Ok');
        assert.ok(confirmButton.disabled, 'Submit-painike pitäisi olla aluksi disabled');
        // Täytä newPassword & newPasswordConfirmation & lähetä lomake
        const inputEls = utils.getInputs(rendered);
        const newPasswordInputEl = inputEls[0];
        const newPasswordConfirmationInputEl = inputEls[1];
        utils.setInputValue(newPassword, newPasswordInputEl);
        utils.setInputValue(newPassword, newPasswordConfirmationInputEl);
        confirmButton.click();
        //
        const done = assert.async();
        confirmSpy.firstCall.returnValue.then(() => {
            // Assertoi backendiin POST
            assert.ok(putPasswordStub.calledOnce, 'Pitäisi postata dataa backendiin');
            assert.deepEqual(putPasswordStub.firstCall.args, [{
                newPassword: newPassword,
                passwordResetKey: urlParams.resetKey,
                email: atob(urlParams.base64Email)
            }, '/password'], 'Pitäisi lähettää uusi salasana + preparoidut url-params:t backendiin');
            // Redirect
            assert.ok(fakeHistory.push.calledAfter(putPasswordStub));
            assert.deepEqual(fakeHistory.push.firstCall.args, ['/kirjaudu']);
            // Notify
            assert.ok(notifySpy.calledOnce, 'Pitäisi notifioida käyttäjää onnistuneesta päivityksestä');
            done();
        });
    });
    QUnit.test('componentDidMount ohjaa etusivulle, jos params.resetkey on väärän pituinen', assert => {
        const urlParams = {resetKey: 'too-short', base64Email: btoa('a@a.a')};
        //
        const rendered = itu.renderIntoDocument(<PasswordCreateView params={ urlParams }/>);
        //
        assert.deepEqual(fakeHistory.push.firstCall.args, ['/']);
        assert.deepEqual(notifySpy.firstCall.args, ['Virheellinen salasanan palautuslinkki', 'error']);
    });
    QUnit.test('componentDidMount ohjaa etusivulle, jos params.base64Email dekoodaus ei onnistu', assert => {
        const urlParams = {resetKey: 'b'.repeat(CORRECT_RESET_KEY_LENGTH), base64Email: '&/()'};
        //
        const rendered = itu.renderIntoDocument(<PasswordCreateView params={ urlParams }/>);
        //
        assert.deepEqual(fakeHistory.push.firstCall.args, ['/']);
        assert.deepEqual(notifySpy.firstCall.args, ['Virheellinen salasanan palautuslinkki', 'error']);
    });
});
