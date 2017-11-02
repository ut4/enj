import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';
import ptu from 'tests/program/utils';
import { templates } from 'src/ui/ValidatingComponent';
import ProgramBackend from 'src/program/ProgramBackend';
import ProgramForm from 'src/program/ProgramForm';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import etu from 'tests/exercise/utils';
import Modal from 'src/ui/Modal';
import iocFactories from 'src/ioc';

QUnit.module('program/ProgramForm', hooks => {
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
        assert.equal(vtu.getFirstValidationError(rendered), templates.lengthBetween('Nimi', 2, 64));
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
        // Aseta validi nimi
        utils.setInputValue('jokinohjelma', nameInputEl);
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi olla klikattava');
        // Liian pitkä description
        utils.setInputValue('a'.repeat(129), descriptionEl);
        assert.equal(vtu.getFirstValidationError(rendered), templates.maxLength('Kuvaus', 128));
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
        // Validi description takaisin
        utils.setInputValue('Dis is my new brogram', descriptionEl);
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi pitäisi taas olla klikattava');
        // Simuloi tyhjä ohjelmatreenilista
        (ptu.getRenderedProgramForm(rendered) as any).receiveInputValue({target: {value: [], name: 'workouts'}});
        assert.notOk(vtu.isSubmitButtonClickable(rendered), 'Submit-nappi ei pitäisi olla klikattava');
    });
    QUnit.test('"Lisää treeni"-painikkeesta voi lisätä uuden treenin ohjelmaan', assert => {
        const exerciseDropdownFetch = sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(etu.getSomeDropdownExercises()));
        const newProgram = ptu.getSomeTestPrograms()[0];
        newProgram.id = null;
        const programWorkoutLengthBefore = newProgram.workouts.length;
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <ProgramForm program={ newProgram } afterInsert={ () => {} }/>
        </div>);
        // Avaa modal klikkaamalla Lisää treeni-painiketta
        const addWorkoutButton = utils.findButtonByContent(rendered, 'Lisää treeni');
        addWorkoutButton.click();
        // Täytä lomake & hyväksy lomake
        const programWorkoutNameInputEl = utils.findInputByName(rendered, 'name');
        const testNewProgramWorkoutName = 'Someworkout';
        utils.setInputValue(testNewProgramWorkoutName, programWorkoutNameInputEl);
        // Lisää oletuksena valitun maanantain lisäksi toinen treeniviikonpäivä
        utils.findButtonByContent(rendered, 'Lisää päivä').click();
        const daySelectInputEl = utils.findElementByAttribute<HTMLSelectElement>(rendered, 'select', 'name', 'weekDay');
        utils.setDropdownIndex(2, daySelectInputEl); // 0 = Ma, 1 = Ti jne..
        const repeatEverySelectInputEl = utils.findElementByAttribute<HTMLSelectElement>(rendered, 'select', 'name', 'repeatEvery');
        utils.setDropdownIndex(0, repeatEverySelectInputEl);
        utils.findButtonByContent(rendered, 'Lisää').click();
        // Lisää yksi ohjelmatreeniliike
        utils.findButtonByContent(rendered, 'Lisää liike').click();
        const done = assert.async();
        exerciseDropdownFetch.firstCall.returnValue.then(() => {
            const exerciseSelectInputEl = utils.findElementByAttribute<HTMLSelectElement>(rendered, 'select', 'name', 'exercise');
            utils.setDropdownIndex(1, exerciseSelectInputEl);
            utils.findButtonByContent(rendered, 'Lisää').click();
            // Hyväksy ohjelmatreenilomake
            const submitButton = utils.findButtonByContent(rendered, 'Ok');
            submitButton.click();
            // Lisäsikö treenin?
            const programWorkoutLengthAfter = newProgram.workouts.length;
            assert.equal(programWorkoutLengthAfter, programWorkoutLengthBefore + 1);
            assert.equal(newProgram.workouts[programWorkoutLengthAfter - 1].name,
                testNewProgramWorkoutName
            );
            assert.deepEqual(
                newProgram.workouts[programWorkoutLengthAfter - 1].occurrences,
                [
                    {weekDay: 1, firstWeek: 0, repeatEvery: 7}, // oletuksena valittu ma
                    {weekDay: 3, firstWeek: 0, repeatEvery: null}  // yllä valittu ke
                ]
            );
            done();
        });
    });
});
