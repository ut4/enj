import QUnit from 'qunitjs';
import sinon from 'sinon';
import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';

class SomeComponent extends ValidatingComponent<any, {somekey: string, another: string}> {
    constructor(props, context) {
        super(props, context);
        this.evaluators = {
            somekey: [
                val => val.charAt(0) === 'a',
                val => val.charAt(1) === 'b'
            ],
            another: [
                val => val.length >= 2
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
            { validationMessage(this.evaluators.somekey[0], () => 'Somekey ei ole "a"') }
            { validationMessage(this.evaluators.somekey[1], () => 'Somekey ei ole "b"') }
            <input name="another" value={ this.state.another } onInput={ e => this.receiveInputValue(e) }/>
            { validationMessage(this.evaluators.another[0], templates => templates.minLength('Another', 2)) }
        </div>);
    }
}

interface Entity {
    val: string;
}
class AnotherComponent extends ValidatingComponent<any, {ent: Entity}> {
    protected propertyToValidate: string = 'ent';
    constructor(props, context) {
        super(props, context);
        this.evaluators = {val: [input => !input.length || input.length > 1]};
        this.state = {ent: {val: ''}, validity: false};
    }
    getEvaluators() {
        return this.evaluators;
    }
    render() {
        return (<div>
            <input name="val" value={ this.state.ent.val } onInput={ e => this.receiveInputValue(e) }/>
        </div>);
    }
}

QUnit.module('ui/ValidatingComponent', hooks => {
    let validityChangeCallbackSpy;
    let rendered: any;
    let componentInstance: SomeComponent | AnotherComponent;
    let componentEvaluators: any;
    function renderSomeComponent(setInitials?) {
        validityChangeCallbackSpy = sinon.spy();
        rendered = itu.renderIntoDocument(setInitials === undefined
            ? <SomeComponent onValidityChange={ validityChangeCallbackSpy }/>
            : <SomeComponent onValidityChange={ validityChangeCallbackSpy } setEvaluatorValiditiesOnMount={ setInitials }/>
        );
        componentInstance = rendered.props.children.children;
        componentEvaluators = componentInstance.getEvaluators();
    }
    function renderAnotherComponent() {
        validityChangeCallbackSpy = sinon.spy();
        rendered = itu.renderIntoDocument(<AnotherComponent onValidityChange={ validityChangeCallbackSpy }/>);
        componentInstance = rendered.props.children.children;
        componentEvaluators = componentInstance.getEvaluators();
    }
    QUnit.test('mount asettaa inputien, ja kokonaisvaliditeetin', assert => {
        renderSomeComponent();
        assert.equal(componentEvaluators.somekey[0].validity, false);
        assert.equal(componentEvaluators.somekey[1].validity, false);
        assert.equal(componentEvaluators.another[0].validity, true);
        assert.equal(componentEvaluators.somekey[0].touched, false);
        assert.equal(componentEvaluators.somekey[1].touched, false);
        assert.equal(componentEvaluators.another[0].touched, false);
        assert.equal(componentInstance.state.validity, false);
    });
    QUnit.test('mount asettaa vain kokonaisvaliditeetin, jos props.setEvaluatorValiditiesOnMount = false', assert => {
        renderSomeComponent(false);
        assert.equal(componentEvaluators.somekey[0].validity, undefined);
        assert.equal(componentEvaluators.somekey[1].validity, undefined);
        assert.equal(componentEvaluators.another[0].validity, undefined);
        assert.equal(componentEvaluators.somekey[0].touched, false);
        assert.equal(componentEvaluators.somekey[1].touched, false);
        assert.equal(componentEvaluators.another[0].touched, false);
        assert.equal(componentInstance.state.validity, false);
    });
    QUnit.test('receiveInputValue asettaa inputin, ja kokonaisvaliditeetin', assert => {
        renderSomeComponent();
        assert.equal(vtu.getRenderedValidationErrors(rendered), 0,
            'Pitäisi renderöidä virheviesti vain, jos inputin arvoa on muutettu'
        );
        const inputEls = itu.scryRenderedDOMElementsWithTag(rendered, 'input');
        const somekeyInputEl = inputEls[0] as HTMLInputElement;
        const anotherInputEl = inputEls[1] as HTMLInputElement;
        // Triggeröi receiveInput
        somekeyInputEl.value = 'ac'; // ensimmäinen evaluaattori pitäisi olla ok, toinen ei
        utils.triggerEvent('input', somekeyInputEl);
        anotherInputEl.value = 'b'; // pitäisi mennä true:sta falseksi
        utils.triggerEvent('input', anotherInputEl);
        // Asettiko inputien evaluaattoreihin validiteetit?
        assert.equal(componentEvaluators.somekey[0].validity, true);
        assert.equal(componentEvaluators.somekey[1].validity, false);
        assert.equal(componentEvaluators.another[0].validity, false);
        assert.equal(componentEvaluators.somekey[0].touched, true);
        assert.equal(componentEvaluators.somekey[1].touched, true);
        assert.equal(componentEvaluators.another[0].touched, true);
        assert.equal(componentInstance.state.validity, false);
        // Näyttikö ensimmäisen input kummatkin virheviestit?
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 2);
        // Täytä inputit valideilla arvoilla
        somekeyInputEl.value = 'ab';
        utils.triggerEvent('input', somekeyInputEl);
        anotherInputEl.value = 'fors';
        utils.triggerEvent('input', anotherInputEl);
        // Assertoi että kaikki näyttää validia
        assert.equal(componentEvaluators.somekey[0].validity, true);
        assert.equal(componentEvaluators.somekey[1].validity, true);
        assert.equal(componentEvaluators.another[0].validity, true);
        assert.equal(componentInstance.state.validity, true);
        assert.ok(validityChangeCallbackSpy.calledOnce);
    });
    QUnit.test('receiveInputValue asettaa inputin arvon objektiin', assert => {
        renderAnotherComponent();
        assert.equal(componentEvaluators.val[0].validity, true);
        assert.equal(componentEvaluators.val[0].touched, false);
        // Aseta invalid arvo
        const fooInputEl = itu.findRenderedDOMElementWithTag(rendered, 'input') as HTMLInputElement;
        fooInputEl.value = 'i';
        utils.triggerEvent('input', fooInputEl);
        // Päivittikö staten validiteetin lisäksi state.ent:n (state[propertyToValidate])
        assert.equal(componentEvaluators.val[0].validity, false);
        assert.equal(componentEvaluators.val[0].touched, true);
        assert.equal((componentInstance as AnotherComponent).state.ent.val, 'i');
        // Aseta validi arvo
        fooInputEl.value = 'abc';
        utils.triggerEvent('input', fooInputEl);
        assert.equal((componentInstance as AnotherComponent).state.ent.val, 'abc');
        // Assertoi että kaikki näyttää validia
        assert.equal(componentEvaluators.val[0].validity, true);
        assert.equal(componentInstance.state.validity, true);
        assert.ok(validityChangeCallbackSpy.calledTwice);
    });
});
