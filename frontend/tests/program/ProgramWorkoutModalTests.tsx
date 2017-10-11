import QUnit from 'qunitjs';
import * as itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';
import ptu from 'tests/program/utils';
import { templates } from 'src/ui/ValidatingComponent';
import ProgramWorkoutModal from 'src/program/ProgramWorkoutModal';

QUnit.module('program/ProgramWorkoutModal', hooks => {
    QUnit.test('validoi inputit', assert => {
        const testProgramWorkout = ptu.getSomeTestProgramWorkouts()[1];
        const rendered = itu.renderIntoDocument(
            <ProgramWorkoutModal programWorkout={ testProgramWorkout } afterInsert={ () => {} }/>
        );
        // Asettiko initial arvot?
        const [nameInputEl] = utils.getInputs(rendered);
        assert.equal(nameInputEl.value, testProgramWorkout.name,  'Pitäisi asettaa initial-name');
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
        // Poista valittu treenipäivä
        let checkboxEl = utils.findElementByAttribute<HTMLInputElement>(rendered, 'input', 'id', 'cb' + testProgramWorkout.occurrences[0].weekDay);
        utils.setChecked(false, checkboxEl);
        assert.equal(getFirstValidationError(rendered), 'Ainakin yksi päivä vaaditaan');
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
        // Aseta uusi valittu treenipäivä
        checkboxEl = utils.findElementByAttribute<HTMLInputElement>(rendered, 'input', 'id', 'cb2'); // tiistai
        utils.setChecked(true, checkboxEl);
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla klikattava');
    });
    function getFirstValidationError(rendered): string {
        return vtu.getRenderedValidationErrors(rendered)[0].textContent;
    }
});
