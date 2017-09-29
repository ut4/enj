import QUnit from 'qunitjs';
import CredentialsForm from 'src/auth/CredentialsForm';
import itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';

QUnit.module('auth/CredentialsForm', hooks => {
    let rendered: any;
    let testCredentials: Enj.API.Credentials;
    let credentialsFormInstance: CredentialsForm;
    let usernameInputEl: HTMLInputElement;
    let emailInputEl: HTMLInputElement;
    let currentPasswordInputEl: HTMLInputElement;
    let newPasswordInputEl: HTMLInputElement;
    let newPasswordConfirmationInputEl: HTMLInputElement;
    hooks.beforeEach(() => {
        testCredentials = {username: 'test', email: 'test@email.com', password: 'pass'};
        rendered = itu.renderIntoDocument(
            <CredentialsForm credentials={ testCredentials } onValidityChange={ () => {} }/>
        );
        credentialsFormInstance = rendered.props.children.children;
        const inputEls = itu.scryRenderedDOMElementsWithTag(rendered, 'input');
        usernameInputEl = inputEls[0] as HTMLInputElement;
        emailInputEl = inputEls[1] as HTMLInputElement;
        currentPasswordInputEl = inputEls[2] as HTMLInputElement;
        newPasswordInputEl = inputEls[3] as HTMLInputElement;
        newPasswordConfirmationInputEl = inputEls[4] as HTMLInputElement;
    });
    QUnit.test('Validoi inputit ja näyttää virheviestin arvon ollessa invalid', assert => {
        const initialErrorMessages = vtu.getRenderedValidationErrors(rendered);
        assert.equal(initialErrorMessages.length, 0);
        assert.equal(credentialsFormInstance.state.validity, false);
        // Asettiko initial arvot?
        assert.equal(usernameInputEl.value, testCredentials.username);
        assert.equal(emailInputEl.value, testCredentials.email);
        //
        const asserter = new FormValidityAsserter(credentialsFormInstance, rendered, assert);
        utils.setInputValue('a', usernameInputEl);
        asserter.assertIsValid(false, 1);
        utils.setInputValue('foo', usernameInputEl);
        asserter.assertIsValid(false, 0);
        //
        utils.setInputValue('@test.com', emailInputEl);
        asserter.assertIsValid(false, 1);
        utils.setInputValue('e@mail.com', emailInputEl);
        asserter.assertIsValid(false, 0);
        //
        utils.setInputValue('ba', currentPasswordInputEl);
        asserter.assertIsValid(false, 1);
        utils.setInputValue('bars', currentPasswordInputEl);
        asserter.assertIsValid(true, 0);
        //
        utils.setInputValue('aa', newPasswordInputEl);
        asserter.assertIsValid(false, 2);
        utils.setInputValue('aaaa', newPasswordInputEl);
        asserter.assertIsValid(false, 1);
        //
        utils.setInputValue('aa', newPasswordConfirmationInputEl);
        asserter.assertIsValid(false, 3);
        utils.setInputValue('aaab', newPasswordConfirmationInputEl);
        asserter.assertIsValid(false, 2);
        utils.setInputValue('aaaa', newPasswordConfirmationInputEl);
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
