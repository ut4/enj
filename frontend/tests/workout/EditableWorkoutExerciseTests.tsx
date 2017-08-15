import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import Modal from 'src/ui/Modal';
import EditableWorkoutExercise from 'src/workout/EditableWorkoutExercise';
import WorkoutBackend, { WorkoutExercise, WorkoutExerciseSet } from 'src/workout/WorkoutBackend';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import { Exercise } from 'src/exercise/ExerciseBackend';
import workoutTestUtils from 'tests/workout/utils';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

QUnit.module('workout/EditableWorkoutExercise', hooks => {
    let testDropdownExercises: Array<Enj.API.ExerciseRecord>;
    let testWorkoutExercise: WorkoutExercise;
    let shallowWorkoutBackend: WorkoutBackend;
    let workoutBackendIocOverride: sinon.SinonStub;
    let shallowExerciseBackend: ExerciseBackend;
    let exerciseBackendIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        testDropdownExercises = [
            {id: 'someuuid', name: 'foo', variants: [{id: 'asd', content: 'fy'}]},
            {id: 'someuuid2', name: 'bar', variants: []}
        ];
        testWorkoutExercise = new WorkoutExercise();
        testWorkoutExercise.exerciseId =  testDropdownExercises[1].id;
        testWorkoutExercise.exerciseName = testDropdownExercises[1].name;
        shallowWorkoutBackend = Object.create(WorkoutBackend.prototype);
        workoutBackendIocOverride = sinon.stub(iocFactories, 'workoutBackend').returns(shallowWorkoutBackend);
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(shallowExerciseBackend);
    });
    hooks.afterEach(() => {
        workoutBackendIocOverride.restore();
        exerciseBackendIocOverride.restore();
    });
    QUnit.test('renderöi treeniliikkeen nimen, ja tyhjän settilistan', assert => {
        const rendered = itu.renderIntoDocument(
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        );
        assert.equal(getRenderedExerciseName(rendered), testWorkoutExercise.exerciseName);
        const setItems = getRenderedSetItems(rendered);
        assert.equal(setItems.length, 1);
        assert.equal(setItems[0].textContent, ' - ');
    });
    QUnit.test('renderöi variantin nimen perään', assert => {
        testWorkoutExercise.exerciseVariantContent = 'somevariant';
        const rendered = itu.renderIntoDocument(
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        );
        assert.equal(getRenderedExerciseName(rendered), testWorkoutExercise.exerciseName + '(somevariant)');
    });
    QUnit.test('renderöi treeniliikkeen nimen, ja settilistan', assert => {
        const set1 = new WorkoutExerciseSet();
        set1.weight = 60.0;
        set1.reps = 6;
        const set2 = new WorkoutExerciseSet();
        set2.weight = -10.25;
        set2.reps = 4;
        testWorkoutExercise.sets = [set1, set2];
        //
        const rendered = itu.renderIntoDocument(
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        );
        assert.equal(getRenderedExerciseName(rendered), testWorkoutExercise.exerciseName);
        const setItems = getRenderedSetItems(rendered);
        assert.equal(setItems.length, 2);
        assert.equal(setItems[0].textContent, getExpectedSetContent(set1));
        assert.equal(setItems[1].textContent, getExpectedSetContent(set2));
    });
    QUnit.test('Muokkaa-painikkeen modal lähettää päivitetyn treeniliikeen backediin, ja lopuksi renderöi näkymän', assert => {
        const updateWorkoutExerciseCallStub = sinon.stub(shallowWorkoutBackend, 'updateExercise').returns(Promise.resolve());
        const setUpdateSpy = sinon.spy(shallowWorkoutBackend, 'updateSet');
        const setDeleteSpy = sinon.spy(shallowWorkoutBackend, 'deleteSet');
        const exerciseListFetch = sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        </div>);
        assert.equal(getRenderedExerciseName(rendered), testDropdownExercises[1].name);
        // Klikkaa Muokkaa-painiketta
        const editWorkoutExerciseButton = utils.findButtonByAttribute(rendered, 'title', 'Muokkaa');
        editWorkoutExerciseButton.click();
        const done = assert.async();
        // Odota, että liike-dropdown latautuu
        exerciseListFetch.firstCall.returnValue.then(() => {
        // Vaihda liike option[2] -> option[1]
            const exerciseSelectEl = itu.findRenderedDOMElementWithTag(rendered, 'select') as HTMLSelectElement;
            assert.equal(exerciseSelectEl.selectedIndex, 2, 'Nykyinen treeniliike pitäisi olla valittuna');
            const newSelectedExercise = testDropdownExercises[0];
            exerciseSelectEl.options[1].selected = true; // note 0 == tyhjä option/-, 1 = testDropdownExercises[0] ...
            utils.triggerEvent('change', exerciseSelectEl);
        // Valitse variantti
            const variantSelectEl = itu.scryRenderedDOMElementsWithTag(rendered, 'select')[1] as HTMLSelectElement;
            const newSelectedVariant = newSelectedExercise.variants[0];
            variantSelectEl.options[1].selected = true;
            utils.triggerEvent('change', variantSelectEl);
        // Hyväksy modal
            const confirmSpy = sinon.spy(workoutTestUtils.getWorkoutExerciseModal(rendered), 'confirm');
            const submitButton = utils.findButtonByContent(rendered, 'Ok');
            submitButton.click();
        // Assertoi että lähetti datan backendiin
            assert.ok(updateWorkoutExerciseCallStub.called);
            const updateData = updateWorkoutExerciseCallStub.firstCall.args[0];
            assert.equal(updateData.exerciseId, newSelectedExercise.id);
            assert.equal(updateData.exerciseVariantId, newSelectedVariant.id);
            return confirmSpy.firstCall.returnValue;
        // Odota fake backend-kutsun resolve
        }).then(() => {
            assert.equal(getRenderedExerciseName(rendered),
                testDropdownExercises[0].name + '(' + testDropdownExercises[0].variants[0].content + ')',
                'Pitäisi lopuksi uudelleenrenderöidä päivitetyillä tiedoilla'
            );
            assert.ok(setUpdateSpy.notCalled, 'Ei pitäisi yrittää päivittää settejä');
            assert.ok(setDeleteSpy.notCalled, 'Ei pitäisi yrittää poistaa settejä');
            done();
        });
    });
    QUnit.test('Muokkaa-painikkeen modal tallentaa muuttuneet setit, ja lopuksi renderöi näkymän', assert => {
        sinon.stub(shallowWorkoutBackend, 'updateExercise');
        sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        const setUpdateStub = sinon.stub(shallowWorkoutBackend, 'updateSet');
        const setDeleteStub = sinon.stub(shallowWorkoutBackend, 'deleteSet');
        testWorkoutExercise.sets = workoutTestUtils.getSomeSets();
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        </div>);
        // Klikkaa Muokkaa-painiketta
        const editWorkoutExerciseButton = utils.findButtonByAttribute(rendered, 'title', 'Muokkaa');
        editWorkoutExerciseButton.click();
        const setListInstance = workoutTestUtils.getMountedSetListInstance(rendered);
        const confirmSpy = sinon.spy(workoutTestUtils.getWorkoutExerciseModal(rendered), 'confirm');
        // Päivitä yhden setin tietoja modalissa
        const secondSetWeightInput = itu.scryRenderedDOMElementsWithTag(rendered, 'input')[2];
        (secondSetWeightInput as any).value = testWorkoutExercise.sets[1].weight + 5;
        utils.triggerEvent('input', secondSetWeightInput);
        // Hyväksy lomake
        const submitButton = utils.findButtonByContent(rendered, 'Ok');
        submitButton.click();
        assert.deepEqual(setUpdateStub.firstCall.args, [[setListInstance.state.sets[1]]],
            'Pitäisi päivittää modifioidut setit'
        );
        assert.ok(setDeleteStub.notCalled, 'Ei pitäisi yrittää poistaa settejä');
        // Assertoi, että päivitti näkymän modalin sulkemisen jälkeen
        const done = assert.async();
        confirmSpy.firstCall.returnValue.then(() => {
            const renderedSets = getRenderedSetItems(rendered);
            assert.equal(renderedSets[1].textContent, getExpectedSetContent(setListInstance.state.sets[1]),
                'Pitäisi renderöidä päivitetty setti'
            );
            done();
        });
    });
    QUnit.test('Muokkaa-painikkeen modal tallentaa muuttuneet ja poistetut setit, ja lopuksi renderöi näkymän', assert => {
        sinon.stub(shallowWorkoutBackend, 'updateExercise');
        sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        const setUpdateStub = sinon.stub(shallowWorkoutBackend, 'updateSet');
        const setDeleteStub = sinon.stub(shallowWorkoutBackend, 'deleteSet');
        testWorkoutExercise.sets = workoutTestUtils.getSomeSets();
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        </div>);
        // Klikkaa Muokkaa-painiketta
        const editWorkoutExerciseButton = utils.findButtonByAttribute(rendered, 'title', 'Muokkaa');
        editWorkoutExerciseButton.click();
        const setListInstance = workoutTestUtils.getMountedSetListInstance(rendered);
        const confirmSpy = sinon.spy(workoutTestUtils.getWorkoutExerciseModal(rendered), 'confirm');
        // Päivitä yhden setin tietoja modalissa
        const firstSetRepsInput = itu.scryRenderedDOMElementsWithTag(rendered, 'input')[1];
        (firstSetRepsInput as any).value = 90;
        const modifiedSet = setListInstance.state.sets[0];
        utils.triggerEvent('input', firstSetRepsInput);
        // Poista yksi setti listalta
        const deletedSet = setListInstance.state.sets[1];
        const secondSetDeleteButton = workoutTestUtils.getSetListDeleteButtons(rendered)[1];
        secondSetDeleteButton.click();
        // Hyväksy lomake
        const submitButton = utils.findButtonByContent(rendered, 'Ok');
        submitButton.click();
        assert.ok(setUpdateStub.calledOnce, 'Pitäisi päivittää modifioidut setit');
        assert.deepEqual(setDeleteStub.firstCall.args, [deletedSet],
            'Pitäisi tallentaa poistetut setit'
        );
        // Assertoi, että päivitti näkymän modalin sulkemisen jälkeen
        const done = assert.async();
        confirmSpy.firstCall.returnValue.then(() => {
            const renderedSets = getRenderedSetItems(rendered);
            const deletedSetContent = getExpectedSetContent(deletedSet);
            assert.notOk(
                Array.from(renderedSets).some(rs => rs.textContent === deletedSetContent),
                'Ei pitäisi renderöidä poistettua settiä'
            );
            assert.equal(renderedSets[0].textContent, getExpectedSetContent(modifiedSet),
                'Pitäisi renderöidä päivitetty setti'
            );
            done();
        });
    });
    QUnit.test('Uusi sarja -painikkeen modal lähettää uuden setin backediin, ja lopuksi renderöi näkymän', assert => {
        const setInsertCallStub = sinon.stub(shallowWorkoutBackend, 'insertSet').returns(Promise.resolve());
        testWorkoutExercise.sets = [{id: 'foo', weight: 45, reps: 2, workoutExerciseId: 'asd'}];
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        </div>);
        const renderedSetCountBefore = getRenderedSetItems(rendered).length;
        // Klikkaa "Uusi sarja" -painiketta
        const addSetButton = utils.findButtonByContent(rendered, 'Uusi sarja');
        addSetButton.click();
        // Hyväksy modal
        const submitButton = utils.findButtonByContent(rendered, 'Ok');
        submitButton.click();
        // Assertoi että lähetti datan backendiin
        assert.ok(setInsertCallStub.called, 'Pitäisi lähettää uusi treeniliikesetti backediin');
        const expectedNewSet = {weight: 8, reps: 6, workoutExerciseId: testWorkoutExercise.id};
        assert.deepEqual(
            setInsertCallStub.firstCall.args,
            [expectedNewSet],
            'Pitäisi lähettää tämä treeniliikesetti'
        );
        const done = assert.async();
        setInsertCallStub.firstCall.returnValue.then(() => {
            const renderedSetsAfter = getRenderedSetItems(rendered);
            assert.equal(
                renderedSetsAfter.length,
                renderedSetCountBefore + 1,
                'Pitäisi lisätä setti listaan'
            );
            assert.equal(
                getRenderedSetItems(rendered)[1].textContent,
                getExpectedSetContent(expectedNewSet as any),
                'Pitäisi pushata lisätty setti listaan'
            );
            done();
        });
    });
    function getRenderedExerciseName(rendered): string {
        return itu.findRenderedDOMElementWithClass(rendered, 'heading').textContent;
    }
    function getRenderedSetItems(rendered): HTMLCollection {
        return itu.findRenderedDOMElementWithClass(rendered, 'content').children;
    }
    function getExpectedSetContent(data: Enj.API.WorkoutExerciseSetRecord) {
        return `${data.weight}kg x ${data.reps}`;
    }
});
