import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import UserBackend from 'src/user/UserBackend';
import UserProfileView from 'src/user/UserProfileView';
import iocFactories from 'src/ioc';

QUnit.module('user/UserProfileView', hooks => {
    let testUser: any;
    let userBackendIocOverride: sinon.SinonStub;
    let shallowUserBackend: UserBackend;
    hooks.beforeEach(() => {
        testUser = {id: 'uuid', username: 'qwe'};
        shallowUserBackend = Object.create(UserBackend.prototype);
        userBackendIocOverride = sinon.stub(iocFactories, 'userBackend').returns(shallowUserBackend);
    });
    hooks.afterEach(() => {
        userBackendIocOverride.restore();
    });
    QUnit.test('lähettää tiedot backendiin', assert => {
        const updateCallStub = sinon.stub(shallowUserBackend, 'update').returns(Promise.resolve(1));
        const userFetchStub = sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve(testUser));
        //
        const rendered = itu.renderIntoDocument(<UserProfileView/>);
        const expectedNewUser = {id: testUser.id, username: 'bfr', bodyWeight: 70, isMale: 0};
        // Odota, että näkymä latautuu
        const done = assert.async();
        userFetchStub.firstCall.returnValue.then(() => {
            //
            assert.equal(getRenderedProfilePic(rendered).src.split('#')[1], 'male');
            // Täytä & lähetä lomake
            const inputs = itu.scryRenderedDOMElementsWithTag(rendered, 'input');
            const [usernameInput, weightInput] = inputs as Array<HTMLInputElement>;
            usernameInput.value = expectedNewUser.username;
            utils.triggerEvent('input', usernameInput);
            weightInput.value = expectedNewUser.bodyWeight.toString();
            utils.triggerEvent('input', weightInput);
            selectGender(rendered, 'female');
            const submitButton = utils.findButtonByContent(rendered, 'Tallenna');
            submitButton.click();
            // Lähettikö?
            assert.ok(updateCallStub.calledOnce, 'Pitäisi PUTata backediin');
            assert.deepEqual(updateCallStub.firstCall.args, [expectedNewUser, '/me']);
            done();
        });
    });
    function selectGender(rendered, gender: string) {
        const genderSelectEl = itu.findRenderedDOMElementWithTag(rendered, 'select') as HTMLSelectElement;
        genderSelectEl.options[gender === 'male' ? 1 : 2].selected = true; // note 0 == tyhjä option...
        utils.triggerEvent('change', genderSelectEl);
    }
    function getRenderedProfilePic(rendered): HTMLImageElement {
        return itu.findRenderedDOMElementWithTag(rendered, 'img') as HTMLImageElement;
    }
});
