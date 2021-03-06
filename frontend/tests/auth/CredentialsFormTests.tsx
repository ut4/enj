import QUnit from 'qunitjs';
import CredentialsForm from 'src/auth/CredentialsForm';
import itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';
import { EmailInputMixin } from 'src/auth/ValidatingFormMixins';

QUnit.module('auth/CredentialsForm', hooks => {
    let rendered: any;
    let testCredentials: Enj.API.Credentials;
    let credentialsFormInstance: CredentialsForm;
    let usernameInputEl: HTMLInputElement;
    let emailInputEl: HTMLInputElement;
    let currentPasswordInputEl: HTMLInputElement;
    let newPasswordInputEl: HTMLInputElement;
    let newPasswordConfirmationInputEl: HTMLInputElement;
    const testReservedUsername = 'taken';
    const testReservedEmail = 'taken@mail.com';
    hooks.beforeEach(() => {
        testCredentials = {username: 'test', email: 'test@email.com', password: 'pass'};
        (CredentialsForm as any).reservedUsernames = {[testReservedUsername]: 1};
        EmailInputMixin.reservedEmails = {[testReservedEmail]: 1};
        rendered = itu.renderIntoDocument(
            <CredentialsForm credentials={ testCredentials } onValidityChange={ () => {} }/>
        );
        credentialsFormInstance = rendered.props.children.children;
        const inputEls = utils.getInputs(rendered);
        usernameInputEl = inputEls[0];
        emailInputEl = inputEls[1];
        currentPasswordInputEl = inputEls[2];
        newPasswordInputEl = inputEls[3];
        newPasswordConfirmationInputEl = inputEls[4];
    });
    hooks.afterEach(() => {
        (CredentialsForm as any).reservedUsernames = {};
        EmailInputMixin.reservedEmails = {};
    });
    QUnit.test('Validoi inputit ja näyttää virheviestin arvon ollessa virheellinen', assert => {
        const initialErrorMessages = vtu.getRenderedValidationErrors(rendered);
        assert.equal(initialErrorMessages.length, 0);
        assert.equal(credentialsFormInstance.state.validity, false);
        // Asettiko initial arvot?
        assert.equal(usernameInputEl.value, testCredentials.username);
        assert.equal(emailInputEl.value, testCredentials.email);
        //
        const asserter = new FormValidityAsserter(credentialsFormInstance, rendered, assert);
        utils.setInputValue('a', usernameInputEl);
        asserter.assertIsValid(false, 1, 'Käyttäjänimi');
        utils.setInputValue(testReservedUsername, usernameInputEl);
        asserter.assertIsValid(false, 1, 'Käyttäjänimi', 'on jo käytössä');
        utils.setInputValue('foo', usernameInputEl);
        asserter.assertIsValid(false, 0, 'Käyttäjänimi');
        //
        utils.setInputValue('@test.com', emailInputEl);
        asserter.assertIsValid(false, 1, 'E-mail');
        utils.setInputValue(testReservedEmail, emailInputEl);
        asserter.assertIsValid(false, 1, 'E-mail', 'on jo käytössä');
        utils.setInputValue(('s'.repeat(190)) + '@test.com', emailInputEl);
        asserter.assertIsValid(false, 1, 'E-mail', 'enintään 191 merkkiä pitkä');
        utils.setInputValue('e@mail.com', emailInputEl);
        asserter.assertIsValid(false, 0, 'E-mail');
        //
        utils.setInputValue('ba', currentPasswordInputEl);
        asserter.assertIsValid(false, 1, 'nykyinen salasana');
        utils.setInputValue('bars', currentPasswordInputEl);
        asserter.assertIsValid(true, 0, 'nykyinen salasana');
        //
        utils.setInputValue('aa', newPasswordInputEl);
        asserter.assertIsValid(false, 2, 'uusi salasana');
        utils.setInputValue('aaaa', newPasswordInputEl);
        asserter.assertIsValid(false, 1, 'uusi salasana');
        //
        utils.setInputValue('aa', newPasswordConfirmationInputEl);
        asserter.assertIsValid(false, 3, 'salasanan vahvistus');
        utils.setInputValue('aaab', newPasswordConfirmationInputEl);
        asserter.assertIsValid(false, 2, 'salasanan vahvistus');
        utils.setInputValue('aaaa', newPasswordConfirmationInputEl);
        asserter.assertIsValid(true, 0, 'salasanan vahvistus');
    });
    function FormValidityAsserter(form, rendered, assert) {
        this.assertIsValid = function (expectedValidity: boolean, expectedErrorCount: number, prop: string, errorContains?: string) {
            const errorMessages = vtu.getRenderedValidationErrors(rendered);
            assert.equal(errorMessages.length, expectedErrorCount || 0, `Pitäisi sisältää <n> virhettä (${prop})`);
            assert.equal(form.state.validity, expectedValidity);
            errorContains && assert.ok(errorMessages[0].textContent.indexOf(errorContains) > 0);
            return errorMessages;
        };
    }
});
