import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';
import { templates } from 'src/ui/ValidatingComponent';
import UserBackend from 'src/user/UserBackend';
import UserProfileView from 'src/user/UserProfileView';
import iocFactories from 'src/ioc';

QUnit.module('user/UserProfileView', hooks => {
    let testUser: any;
    let userBackendIocOverride: sinon.SinonStub;
    let shallowUserBackend: UserBackend;
    hooks.beforeEach(() => {
        testUser = {id: 'uuid', username: 'qwe', signature: null};
        shallowUserBackend = Object.create(UserBackend.prototype);
        userBackendIocOverride = sinon.stub(iocFactories, 'userBackend').returns(shallowUserBackend);
    });
    hooks.afterEach(() => {
        userBackendIocOverride.restore();
    });
    QUnit.test('validoi tietot', assert => {
        const userFetchStub = sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve(testUser));
        //
        const rendered = itu.renderIntoDocument(<UserProfileView/>);
        // Odota, että näkymä latautuu
        const done = assert.async();
        userFetchStub.firstCall.returnValue.then(() => {
            // Aseta validi allekirjoitus
            const signatureInput = utils.findElementByAttribute<HTMLTextAreaElement>(rendered, 'textarea', 'name', 'signature');
            utils.setInputValue('abc', signatureInput);
            assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla klikattava');
            // Aseta invalid allekirjoitus
            utils.setInputValue('a'.repeat(256), signatureInput);
            assert.equal(
                vtu.getRenderedValidationErrors(rendered)[0].textContent,
                templates.maxLength('Allekirjoitus', 255)
            );
            assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
            // Aseta validi allekirjoitus
            signatureInput.value = 'houhou';
            utils.setInputValue('houhou', signatureInput);
            assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
            assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla taas klikattava');
            done();
        });
    });
    QUnit.test('lähettää tiedot backendiin', assert => {
        const updateCallStub = sinon.stub(shallowUserBackend, 'update').returns(Promise.resolve(1));
        const userFetchStub = sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve(testUser));
        //
        const rendered = itu.renderIntoDocument(<UserProfileView/>);
        const expectedNewUser = {
            id: testUser.id,
            username: testUser.username,
            signature: 'shiz',
            bodyWeight: 70,
            isMale: 0
        };
        // Odota, että näkymä latautuu
        const done = assert.async();
        userFetchStub.firstCall.returnValue.then(() => {
            //
            assert.equal(getRenderedProfilePic(rendered).src.split('#')[1], 'unknown');
            // Täytä allekirjoitus
            const signatureInput = utils.findElementByAttribute<HTMLTextAreaElement>(rendered, 'textarea', 'name', 'signature');
            utils.setInputValue(expectedNewUser.signature, signatureInput);
            // Täytä paino
            const weightInput = utils.findInputByName(rendered, 'bodyWeight');
            utils.setInputValue(expectedNewUser.bodyWeight.toString(), weightInput);
            // Valitse sukupuoli
            selectGender(rendered, 'female');
            // Lähetä lomake
            const submitButton = utils.findButtonByContent(rendered, 'Tallenna');
            submitButton.click();
            // Lähettikö?
            assert.ok(updateCallStub.calledOnce, 'Pitäisi PUTata backediin');
            assert.deepEqual(updateCallStub.firstCall.args, [expectedNewUser, '/me']);
            return updateCallStub.firstCall.returnValue;
        }).then(() => {
            // Päivittikö staten?
            assert.equal(getRenderedProfilePic(rendered).src.split('#')[1], 'female');
            done();
        });
    });
    function selectGender(rendered, gender: string) {
        const genderSelectEl = itu.findRenderedDOMElementWithTag(rendered, 'select') as HTMLSelectElement;
        utils.setDropdownIndex(gender === 'male' ? 1 : 2, genderSelectEl); // note 0 == tyhjä option...
    }
    function getRenderedProfilePic(rendered): HTMLImageElement {
        return itu.findRenderedDOMElementWithTag(rendered, 'img') as HTMLImageElement;
    }
});
