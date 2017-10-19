import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';
import ptu from 'tests/program/utils';
import etu from 'tests/exercise/utils';
import Modal from 'src/ui/Modal';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import ProgramBackend from 'src/program/ProgramBackend';
import { templates } from 'src/ui/ValidatingComponent';
import ProgramWorkoutModal from 'src/program/ProgramWorkoutModal';
import iocFactories from 'src/ioc';

QUnit.module('program/ProgramWorkoutModal', hooks => {
    let programBackendIocOverride: sinon.SinonStub;
    let shallowProgramBackend: ProgramBackend;
    let exerciseBackendIocOverride: sinon.SinonStub;
    let shallowExerciseBackend: ExerciseBackend;
    hooks.beforeEach(() => {
        shallowProgramBackend = Object.create(ProgramBackend.prototype);
        programBackendIocOverride = sinon.stub(iocFactories, 'programBackend').returns(shallowProgramBackend);
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(shallowExerciseBackend);
    });
    hooks.afterEach(() => {
        programBackendIocOverride.restore();
        exerciseBackendIocOverride.restore();
    });
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
    QUnit.test('Lähettää liikkeitä backendiin', assert => {
        const exerciseFetchStub = sinon.stub(shallowExerciseBackend, 'getAll')
            .returns(Promise.resolve(etu.getSomeDropdownExercises()));
        const pweInsertStub = sinon.stub(shallowProgramBackend, 'insertWorkoutExercises')
            .returns(Promise.resolve(1));
        const pweDeleteStub = sinon.stub(shallowProgramBackend, 'deleteWorkoutExercise')
            .returns(Promise.resolve(1));
        const rendered = itu.renderIntoDocument(<div><Modal/>
            <ProgramWorkoutModal programWorkout={ ptu.getSomeTestProgramWorkouts()[1] } afterUpdate={ () => {} }/>
        </div>);
        // Poista yksi, ja lisää yksi liike
        const exercisesTable = itu.scryRenderedDOMElementsWithClass(rendered, 'crud-table')[1];
        (exercisesTable.querySelector('[title="Poista"]') as any).click();
        utils.findButtonByContent(rendered, 'Lisää liike').click();
        const done = assert.async();
        exerciseFetchStub.firstCall.returnValue.then(() => {
            const exerciseSelectInputEl = utils.findElementByAttribute<HTMLSelectElement>(rendered, 'select', 'name', 'exercise');
            utils.setDropdownIndex(1, exerciseSelectInputEl);
            utils.findButtonByContent(rendered, 'Lisää').click();
        // Hyväksy ohjelmatreenilomake
            const confirmSpy = sinon.spy(ptu.getRenderedProgramWorkoutModal(rendered), 'confirm');
            utils.findButtonByContent(rendered, 'Ok').click();
            return confirmSpy.firstCall.returnValue;
        }).then(() => {
        // Lähettikö lisätyn, ja poistetun liikkeen backendiin?
            assert.ok(pweInsertStub.calledOnce, 'Pitäisi postata lisätty ohjelmatreeniliike backendiin');
            assert.ok(pweDeleteStub.calledAfter(pweInsertStub), 'Pitäisi deletata poistettu ohjelmatreeniliike backendiin');
            done();
        });
    });
    function getFirstValidationError(rendered): string {
        return vtu.getRenderedValidationErrors(rendered)[0].textContent;
    }
    function assertFormIsValid(assert, rendered) {
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla klikattava');
    }
});
