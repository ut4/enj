import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';
import { templates } from 'src/ui/ValidatingComponent';
import UserBackend from 'src/user/UserBackend';
import UserProfileView, { ProfilePicUpdateModal } from 'src/user/UserProfileView';
import Modal from 'src/ui/Modal';
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
            assert.equal(getRenderedProfilePic(rendered).style.backgroundImage.split('#')[1], 'unknown")');
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
            assert.equal(getRenderedProfilePic(rendered).style.backgroundImage.split('#')[1], 'female")');
            done();
        });
    });
    QUnit.test('"Vaihda profiilikuva" -linkin kautta voi vaihtaa profiilikuvan', assert => {
        const userFetchStub = sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve(testUser));
        const mockBase64Image = 'aabbcc';
        const picUploadStub = sinon.stub(shallowUserBackend, 'uploadProfilePic').returns(Promise.resolve({
            base64ProfilePic: mockBase64Image
        }));
        //
        const rendered = itu.renderIntoDocument(<div><Modal/><UserProfileView/></div>);
        // Odota, että näkymä latautuu
        const done = assert.async();
        userFetchStub.firstCall.returnValue.then(() => {
            // Avaa modal linkistä
            (itu.findRenderedDOMElementWithClass(rendered, 'secondary-menu-dark') as any).click();
            utils.findElementByAttribute<HTMLAnchorElement>(rendered, 'a', 'href', '').click();
            const modalSubmitButton = utils.findButtonByContent(rendered, 'Ok');
            assert.notOk(vtu.isSubmitButtonClickable(modalSubmitButton), 'Submit-nappi ei pitäisi olla klikattava');
            const modalInstance = (itu.findRenderedVNodeWithType(rendered, ProfilePicUpdateModal).children as any);
            // Simuloi liian iso tiedostokoko, ja väärä tietostopääte
            const fileInputEl = utils.findInputByName(rendered, 'file');
            modalInstance.handleFileChange({target: {name: fileInputEl.name, files: [
                {size: 4000001, type: 'hax/aus'}
            ]}});
            const validationErrors = vtu.getRenderedValidationErrors(rendered);
            assert.equal(validationErrors[0].textContent, 'Kuva tulisi olla max. 4mb');
            assert.equal(validationErrors[1].textContent, 'Kuva tulisi olla tyyppiä: bmp, gif, ico, jpg, png, tiff');
            // Simuloi validi kuva
            modalInstance.handleFileChange({target: {name: fileInputEl.name, files: [
                {size: 2000000, type: 'image/png'}
            ]}});
            assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0,
                'Ei pitäisi renderöidä validaatiovirheitä'
            );
            assert.ok(vtu.isSubmitButtonClickable(modalSubmitButton), 'Submit-nappi pitäisi olla klikattava');
            // Lähetä lomake, assertoi että lähetti dataa
            const confirmSpy = sinon.spy(modalInstance, 'confirm');
            modalSubmitButton.click();
            confirmSpy.firstCall.returnValue.then(() => {
                const expectedData = new FormData();
                expectedData.append('file', fileInputEl.files[0]);
                assert.deepEqual(picUploadStub.firstCall.args, [expectedData],
                    'Pitäisi lähettää tiedoston backendiin'
                );
                assert.equal((itu.findRenderedDOMElementWithClass(rendered, 'profile-pic') as any).getAttribute('style'),
                    `background-image: url("data:image/png;base64,${mockBase64Image}");`,
                    'Pitäisi päivittää profiilikuvaksi backendin palauttama base64 data'
                );
                done();
            });
        });
    });
    function selectGender(rendered, gender: string) {
        const genderSelectEl = itu.findRenderedDOMElementWithTag(rendered, 'select') as HTMLSelectElement;
        utils.setDropdownIndex(gender === 'male' ? 1 : 2, genderSelectEl); // note 0 == tyhjä option...
    }
    function getRenderedProfilePic(rendered): HTMLDivElement {
        return itu.findRenderedDOMElementWithClass(rendered, 'profile-pic') as HTMLDivElement;
    }
});
