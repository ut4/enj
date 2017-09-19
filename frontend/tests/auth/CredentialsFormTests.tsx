import QUnit from 'qunitjs';
import CredentialsForm from 'src/auth/CredentialsForm';
import itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';

QUnit.module('auth/CredentialsForm', hooks => {
    let rendered: any;
    let testCredentials: Enj.API.Credentials;
    let credentialsFormInstance: CredentialsForm;
    let emailInputEl: HTMLInputElement;
    let currentPasswordInputEl: HTMLInputElement;
    let newPasswordInputEl: HTMLInputElement;
    let newPasswordConfirmationInputEl: HTMLInputElement;
    hooks.beforeEach(() => {
        testCredentials = {email: 'test@email.com', password: 'test'};
        rendered = itu.renderIntoDocument(
            <CredentialsForm credentials={ testCredentials } onValidityChange={ () => {} }/>
        );
        credentialsFormInstance = rendered.props.children.children;
        const inputEls = itu.scryRenderedDOMElementsWithTag(rendered, 'input');
        emailInputEl = inputEls[0] as HTMLInputElement;
        currentPasswordInputEl = inputEls[1] as HTMLInputElement;
        newPasswordInputEl = inputEls[2] as HTMLInputElement;
        newPasswordConfirmationInputEl = inputEls[3] as HTMLInputElement;
    });
    QUnit.test('Validoi inputit ja näyttää virheviestin arvon ollessa invalid', assert => {
        const initialErrorMessages = vtu.getRenderedValidationErrors(rendered);
        assert.equal(initialErrorMessages.length, 0);
        assert.equal(credentialsFormInstance.state.validity, false);
        // Asettiko initial arvon?
        assert.equal(emailInputEl.value, testCredentials.email);
        //
        const asserter = new FormValidityAsserter(credentialsFormInstance, rendered, assert);
        emailInputEl.value = '@test.com';
        utils.triggerEvent('input', emailInputEl);
        asserter.assertIsValid(false, 1);
        emailInputEl.value = 'e@mail.com';
        utils.triggerEvent('input', emailInputEl);
        asserter.assertIsValid(false, 0);
        //
        currentPasswordInputEl.value = 'ba';
        utils.triggerEvent('input', currentPasswordInputEl);
        asserter.assertIsValid(false, 1);
        currentPasswordInputEl.value = 'bars';
        utils.triggerEvent('input', currentPasswordInputEl);
        asserter.assertIsValid(true, 0);
        //
        newPasswordInputEl.value = 'aa';
        utils.triggerEvent('input', newPasswordInputEl);
        asserter.assertIsValid(false, 2);
        newPasswordInputEl.value = 'aaaa';
        utils.triggerEvent('input', newPasswordInputEl);
        asserter.assertIsValid(false, 1);
        //
        newPasswordConfirmationInputEl.value = 'aa';
        utils.triggerEvent('input', newPasswordConfirmationInputEl);
        asserter.assertIsValid(false, 3);
        newPasswordConfirmationInputEl.value = 'aaab';
        utils.triggerEvent('input', newPasswordConfirmationInputEl);
        asserter.assertIsValid(false, 2);
        newPasswordConfirmationInputEl.value = 'aaaa';
        utils.triggerEvent('input', newPasswordConfirmationInputEl);
        asserter.assertIsValid(true, 0);
    });
    function FormValidityAsserter(form, rendered, assert) {
        this.assertIsValid = function (expectedValidity: boolean, expectedErrorCount?: number) {
            const errorMessages = vtu.getRenderedValidationErrors(rendered);
            assert.equal(errorMessages.length, expectedErrorCount || 0);
            assert.equal(form.state.validity, expectedValidity);
            return errorMessages;
        };
    }
});
