import QUnit from 'qunitjs';
import LoginForm from 'src/auth/LoginForm';
import itu from 'inferno-test-utils';
import utils from 'tests/utils';

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
        const initialErrorMessages = getRenderedErrorMessages();
        assert.equal(initialErrorMessages.length, 0);
        assert.equal(loginFormInstance.state.validity, false);
        //
        usernameInputEl.value = 'f';
        utils.triggerEvent('input', usernameInputEl);
        const errorMessagesAfterFillingInvalidUsername = getRenderedErrorMessages();
        assert.equal(errorMessagesAfterFillingInvalidUsername.length, 1);
        assert.equal(loginFormInstance.state.validity, false);
        //
        usernameInputEl.value = 'foo';
        utils.triggerEvent('input', usernameInputEl);
        const errorMessagesAfterFillingUsername = getRenderedErrorMessages();
        assert.equal(errorMessagesAfterFillingUsername.length, 0);
        assert.equal(loginFormInstance.state.validity, false);
        //
        passwordInputEl.value = 'ba';
        utils.triggerEvent('input', passwordInputEl);
        const errorMessagesAfterFillingInvalidPassword = getRenderedErrorMessages();
        assert.equal(errorMessagesAfterFillingInvalidPassword.length, 1);
        assert.equal(loginFormInstance.state.validity, false);
        //
        passwordInputEl.value = 'bars';
        utils.triggerEvent('input', passwordInputEl);
        const errorMessagesAfterFillingPassword = getRenderedErrorMessages();
        assert.equal(errorMessagesAfterFillingPassword.length, 0);
        assert.equal(loginFormInstance.state.validity, true);
    });
    function getRenderedErrorMessages() {
        return itu.scryRenderedDOMElementsWithClass(rendered, 'text-error');
    }
});