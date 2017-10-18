import QUnit from 'qunitjs';
import * as itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';
import ptu from 'tests/program/utils';
import Modal from 'src/ui/Modal';
import { templates } from 'src/ui/ValidatingComponent';
import ProgramWorkoutModal from 'src/program/ProgramWorkoutModal';

QUnit.module('program/ProgramWorkoutModal', hooks => {
    QUnit.test('validoi inputit', assert => {
        const testProgramWorkout = ptu.getSomeTestProgramWorkouts()[1];
        const rendered = itu.renderIntoDocument(<div><Modal/>
            <ProgramWorkoutModal programWorkout={ testProgramWorkout } afterInsert={ () => {} }/>
        </div>);
        // Asettiko initial arvot?
        const [nameInputEl] = utils.getInputs(rendered);
        assert.equal(nameInputEl.value, testProgramWorkout.name,  'Pitäisi asettaa initial-name');
        assertFormIsValid(assert, rendered);
        // Aseta invalid nimi
        utils.setInputValue('f', nameInputEl);
        assert.equal(getFirstValidationError(rendered), templates.lengthBetween('Nimi', 2, 64));
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
        // Aseta validi nimi
        utils.setInputValue('jokinohjelma', nameInputEl);
        assertFormIsValid(assert, rendered);
        // Poista valittu treenipäivä OccurrencesManager-listasta
        const [occurrencesTable, exercisesTable] = itu.scryRenderedDOMElementsWithClass(rendered, 'crud-table');
        (occurrencesTable.querySelector('[title="Poista"]') as any).click();
        assert.equal(getFirstValidationError(rendered), 'Ainakin yksi päivä vaaditaan');
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
        // Aseta uusi valittu treenipäivä
        utils.findButtonByContent(rendered, 'Lisää päivä').click();
        const daySelectInputEl = utils.findElementByAttribute<HTMLSelectElement>(rendered, 'select', 'name', 'weekDay');
        utils.setDropdownIndex(1, daySelectInputEl); // tiistai
        utils.findButtonByContent(rendered, 'Lisää').click();
        assertFormIsValid(assert, rendered);
        // Poista valittu ohjelmatreeniliike ProgramWorkoutExercisesManager-listasta
        (exercisesTable.querySelector('[title="Poista"]') as any).click();
        assert.equal(getFirstValidationError(rendered), 'Ainakin yksi liike vaaditaan');
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
    });
    function getFirstValidationError(rendered): string {
        return vtu.getRenderedValidationErrors(rendered)[0].textContent;
    }
    function assertFormIsValid(assert, rendered) {
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla klikattava');
    }
});
