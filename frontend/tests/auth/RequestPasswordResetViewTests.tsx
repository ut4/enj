import QUnit from 'qunitjs';
import sinon from 'sinon';
import itu from 'inferno-test-utils';
import AuthBackend from 'src/auth/AuthBackend';
import RequestPasswordResetView from 'src/auth/RequestPasswordResetView';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

QUnit.module('auth/RequestPasswordResetView', hooks => {
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
    QUnit.test('confirm lähettää datan backendiin, ja ohjaa sen jälkeen päänäkymään', assert => {
        const postResetRequestStub = sinon.stub(shallowAuthBackend, 'insert').returns(Promise.resolve({ok: true}));
        const confirmSpy = sinon.spy(RequestPasswordResetView.prototype, 'confirm');
        const email = 'e@mai.com';
        // Renderöi view
        const rendered = itu.renderIntoDocument(<RequestPasswordResetView/>);
        const confirmButton = utils.findButtonByContent(rendered, 'Ok');
        assert.ok(confirmButton.disabled, 'Submit-painike pitäisi olla aluksi disabled');
        // Täytä email & lähetä lomake
        utils.setInputValue(email, utils.getInputs(rendered)[0]);
        confirmButton.click();
        //
        const done = assert.async();
        confirmSpy.firstCall.returnValue.then(() => {
            assert.ok(postResetRequestStub.calledOnce, 'Pitäisi postata dataa backendiin');
            assert.deepEqual(postResetRequestStub.firstCall.args, [{email}, '/request-password-reset'],
                'Pitäisi lähettää email backendiin'
            );
            // Redirect
            assert.ok(fakeHistory.push.calledAfter(postResetRequestStub));
            assert.deepEqual(fakeHistory.push.firstCall.args, ['/']);
            // Notify
            assert.ok(notifySpy.calledOnce, 'Pitäisi notifioida käyttäjää onnistuneesta päivityksestä');
            done();
        });
    });
});
