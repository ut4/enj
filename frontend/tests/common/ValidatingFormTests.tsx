import QUnit from 'qunitjs';
import sinon from 'sinon';
import ValidatingForm from 'src/common/ValidatingForm';
import itu from 'inferno-test-utils';
import utils from 'tests/utils';

class SomeForm extends ValidatingForm<any, {somekey: string, another: string}> {
    constructor(props, context) {
        super(props, context);
        this.evaluators = {
            somekey: [
                val => val.charAt(0) === 'a',
                val => val.charAt(1) === 'b'
            ],
            another: [
                val => val.length > 1
            ]
        };
        this.state = {somekey: 'foo', another: 'bar', validity: false};
    }
    getEvaluators() {
        return this.evaluators;
    }
    render() {
        return (<div>
            <input name="somekey" value={ this.state.somekey } onInput={ e => this.receiveInputValue(e) }/>
            <input name="another" value={ this.state.another } onInput={ e => this.receiveInputValue(e) }/>
        </div>);
    }
}

QUnit.module('common/ValidatingForm', hooks => {
    let validityChangeCallbackSpy = sinon.spy();
    let rendered: any;
    let someFormInstance: SomeForm;
    let someFormEvaluators: any;
    const render = (setInitials?) => {
        rendered = itu.renderIntoDocument(setInitials === undefined
            ? <SomeForm onValidityChange={ validityChangeCallbackSpy }/>
            : <SomeForm onValidityChange={ validityChangeCallbackSpy } setEvaluatorValiditiesOnMount={ setInitials }/>
        );
        someFormInstance = rendered.props.children.children;
        someFormEvaluators = someFormInstance.getEvaluators();
    };
    QUnit.test('mount asettaa inputien, ja kokonaisvaliditeetin', assert => {
        render();
        assert.equal(someFormEvaluators.somekey[0].validity, false);
        assert.equal(someFormEvaluators.somekey[1].validity, false);
        assert.equal(someFormEvaluators.another[0].validity, true);
        assert.equal(someFormInstance.state.validity, false);
    });
    QUnit.test('mount asettaa vain kokonaisvaliditeetin, jos props.setEvaluatorValiditiesOnMount = false', assert => {
        render(false);
        assert.equal(someFormEvaluators.somekey[0].validity, undefined);
        assert.equal(someFormEvaluators.somekey[1].validity, undefined);
        assert.equal(someFormEvaluators.another[0].validity, undefined);
        assert.equal(someFormInstance.state.validity, false);
    });
    QUnit.test('receiveInputValue asettaa inputin, ja kokonaisvaliditeetin', assert => {
        render();
        // Triggeröi receiveInput
        const inputEls = itu.scryRenderedDOMElementsWithTag(rendered, 'input');
        const somekeyInputEl = inputEls[0] as HTMLInputElement;
        const anotherInputEl = inputEls[1] as HTMLInputElement;
        somekeyInputEl.value = 'ac'; // ensimmäinen evaluaattori pitäisi olla ok, toinen ei
        utils.triggerEvent('input', somekeyInputEl);
        anotherInputEl.value = 'b'; // pitäisi mennä true:sta falseksi
        utils.triggerEvent('input', anotherInputEl);
        // Assertoi että asetti inputien evaluaattoreihin validiteetit
        assert.equal(someFormEvaluators.somekey[0].validity, true);
        assert.equal(someFormEvaluators.somekey[1].validity, false);
        assert.equal(someFormEvaluators.another[0].validity, false);
        assert.equal(someFormInstance.state.validity, false);
        // Täytä inputit valideilla arvoilla
        somekeyInputEl.value = 'ab';
        utils.triggerEvent('input', somekeyInputEl);
        anotherInputEl.value = 'fors';
        utils.triggerEvent('input', anotherInputEl);
        // Assertoi että kaikki näyttää validia
        assert.equal(someFormEvaluators.somekey[0].validity, true);
        assert.equal(someFormEvaluators.somekey[1].validity, true);
        assert.equal(someFormEvaluators.another[0].validity, true);
        assert.equal(someFormInstance.state.validity, true);
        assert.ok(validityChangeCallbackSpy.calledOnce);
    });
});
