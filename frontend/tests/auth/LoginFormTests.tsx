import QUnit from 'qunitjs';
import LoginForm from 'src/auth/LoginForm';
import itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';

QUnit.module('auth/LoginForm', hooks => {
    let rendered: any;
    let loginFormInstance: LoginForm;
    let usernameInputEl: HTMLInputElement;
    let passwordInputEl: HTMLInputElement;
    hooks.beforeEach(() => {
        rendered = itu.renderIntoDocument(<LoginForm onValidityChange={ () => {} }/>);
        loginFormInstance = rendered.props.children.children;
        const inputEls = itu.scryRenderedDOMElementsWithTag(rendered, 'input');
        usernameInputEl = inputEls[0] as HTMLInputElement;
        passwordInputEl = inputEls[1] as HTMLInputElement;
    });
    QUnit.test('Validoi inputit ja näyttää virheviestin arvon ollessa invalid', assert => {
        const initialErrorMessages = vtu.getRenderedValidationErrors(rendered);
        assert.equal(initialErrorMessages.length, 0);
        assert.equal(loginFormInstance.state.validity, false);
        //
        utils.setInputValue('f', usernameInputEl);
        const errorMessagesAfterFillingInvalidUsername = vtu.getRenderedValidationErrors(rendered);
        assert.equal(errorMessagesAfterFillingInvalidUsername.length, 1);
        assert.equal(loginFormInstance.state.validity, false);
        //
        utils.setInputValue('foo', usernameInputEl);
        const errorMessagesAfterFillingUsername = vtu.getRenderedValidationErrors(rendered);
        assert.equal(errorMessagesAfterFillingUsername.length, 0);
        assert.equal(loginFormInstance.state.validity, false);
        //
        utils.setInputValue('ba', passwordInputEl);
        const errorMessagesAfterFillingInvalidPassword = vtu.getRenderedValidationErrors(rendered);
        assert.equal(errorMessagesAfterFillingInvalidPassword.length, 1);
        assert.equal(loginFormInstance.state.validity, false);
        //
        utils.setInputValue('bars', passwordInputEl);
        const errorMessagesAfterFillingPassword = vtu.getRenderedValidationErrors(rendered);
        assert.equal(errorMessagesAfterFillingPassword.length, 0);
        assert.equal(loginFormInstance.state.validity, true);
    });
});
