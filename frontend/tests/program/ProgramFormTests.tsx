import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';
import ptu from 'tests/program/utils';
import { templates } from 'src/ui/ValidatingComponent';
import ProgramBackend from 'src/program/ProgramBackend';
import ProgramForm from 'src/program/ProgramForm';
import iocFactories from 'src/ioc';

QUnit.module('program/ProgramForm', hooks => {
    let programBackendIocOverride: sinon.SinonStub;
    let shallowProgramBackend: ProgramBackend;
    hooks.beforeEach(() => {
        shallowProgramBackend = Object.create(ProgramBackend.prototype);
        programBackendIocOverride = sinon.stub(iocFactories, 'programBackend').returns(shallowProgramBackend);
    });
    hooks.afterEach(() => {
        programBackendIocOverride.restore();
    });
    QUnit.test('validoi inputit', assert => {
        const testProgram = ptu.getSomeTestPrograms()[1];
        const rendered = itu.renderIntoDocument(
            <ProgramForm program={ testProgram } afterInsert={ () => {} }/>
        );
        // Asettiko initial arvot?
        const [nameInputEl, startInputEl, endInputEl] = utils.getInputs(rendered);
        const descriptionEl = itu.findRenderedDOMElementWithTag(rendered, 'textarea') as HTMLTextAreaElement;
        assert.equal(nameInputEl.value, testProgram.name,  'Pitäisi asettaa initial-name');
        assert.equal(startInputEl.value, ptu.getExpectedDateStr(testProgram.start),  'Pitäisi asettaa initial-start');
        assert.equal(endInputEl.value, ptu.getExpectedDateStr(testProgram.end),  'Pitäisi asettaa initial-end');
        assert.equal(descriptionEl.value, testProgram.description,  'Pitäisi asettaa initial-description');
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla klikattava');
        // Aseta invalid nimi
        utils.setInputValue('f', nameInputEl);
        assert.equal(getFirstValidationError(rendered), templates.lengthBetween('Nimi', 2, 64));
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
        // Aseta validi nimi
        utils.setInputValue('jokinohjelma', nameInputEl);
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla klikattava');
        // Liian pitkä description
        utils.setInputValue('a'.repeat(129), descriptionEl);
        assert.equal(getFirstValidationError(rendered), templates.maxLength('Kuvaus', 128));
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
        // Validi description takaisin
        utils.setInputValue('Dis is my new brogram', descriptionEl);
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi taas olla klikattava');
    });
    QUnit.test('lähettää tiedot backendiin ja kutsuu afterInsert', assert => {
        const insertCallStub = sinon.stub(shallowProgramBackend, 'insert').returns(Promise.resolve(1));
        const afterInsertSpy = sinon.spy();
        //
        const newProgram = ptu.getSomeTestPrograms()[0];
        const rendered = itu.renderIntoDocument(<ProgramForm program={ newProgram } afterInsert={ afterInsertSpy }/>);
        // Täytä & lähetä lomake
        const [nameInputEl, startInputEl, endInputEl] = utils.getInputs(rendered);
        const newProgramName = 'some program';
        utils.setInputValue(newProgramName, nameInputEl);
        // Aseta start&end datepickerista & lähetä lomake
        utils.selectDatepickerDate(2, startInputEl);
        utils.selectDatepickerDate(3, endInputEl);
        utils.findButtonByContent(rendered, 'Ok').click();
        // Lähettikö?
        assert.ok(insertCallStub.calledOnce, 'Pitäisi lähettää pyyntö backediin');
        assert.deepEqual(insertCallStub.firstCall.args, [Object.assign({
            start: 86400,
            end: 86400 * 2
        }, newProgram)]);
        const done = assert.async();
        insertCallStub.firstCall.returnValue.then(() => {
            assert.ok(afterInsertSpy.calledAfter(insertCallStub),
                'Pitäisi lopuksi kutsua afterInsert-callbackia'
            );
            done();
        });
    });
    function getFirstValidationError(rendered): string {
        return vtu.getRenderedValidationErrors(rendered)[0].textContent;
    }
});