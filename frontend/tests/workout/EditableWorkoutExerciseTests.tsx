import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import Modal from 'src/ui/Modal';
import EditableWorkoutExercise from 'src/workout/EditableWorkoutExercise';
import WorkoutBackend, { WorkoutExercise, WorkoutExerciseSet } from 'src/workout/WorkoutBackend';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import workoutTestUtils from 'tests/workout/utils';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

QUnit.module('workout/EditableWorkoutExercise', hooks => {
    let testDropdownExercises: Array<Enj.API.Exercise>;
    let testWorkoutExercise: WorkoutExercise;
    let shallowWorkoutBackend: WorkoutBackend;
    let workoutBackendIocOverride: sinon.SinonStub;
    let shallowExerciseBackend: ExerciseBackend;
    let exerciseBackendIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        testDropdownExercises = [
            {id: 'someuuid', name: 'foo', variants: [{id: 'asd', content: 'fy', exerciseId: 'someuuid', userId: 'u'}], userId: 'u'},
            {id: 'someuuid2', name: 'bar', variants: [], userId: 'u'}
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
    QUnit.test('renderöi treeniliikkeen nimen, ja tyhjän sarjalistan', assert => {
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
    QUnit.test('renderöi treeniliikkeen nimen, ja sarjalistan järjestyksessä', assert => {
        const set1 = {id: 'a', weight: 60.0, reps: 6, ordinal: 1, workoutExerciseId: 'aa'};
        const set2 = {id: 'b', weight: -10.25, reps: 4, ordinal: 0, workoutExerciseId: 'bb'};
        testWorkoutExercise.sets = [set1, set2];
        //
        const rendered = itu.renderIntoDocument(
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        );
        assert.equal(getRenderedExerciseName(rendered), testWorkoutExercise.exerciseName);
        const setItems = getRenderedSetItems(rendered);
        assert.equal(setItems.length, 2);
        assert.equal(setItems[0].textContent, getExpectedSetContent(set2),
            'Pitäisi renderöidä pienemmällä ordinal-arvolla varustettu sarja ensin'
        );
        assert.equal(setItems[1].textContent, getExpectedSetContent(set1),
            'Pitäisi renderöidä suuremmalla ordinal-arvolla varustettu sarja seuraavaksi'
        );
        const totals = itu.findRenderedDOMElementWithClass(rendered, 'footer');
        assert.equal(totals.textContent, getExpectedTotals(testWorkoutExercise.sets));
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
        // Avaa modal klikkaamalla Muokkaa-painiketta
        const editWorkoutExerciseButton = utils.findButtonByAttribute(rendered, 'title', 'Muokkaa');
        editWorkoutExerciseButton.click();
        const done = assert.async();
        // Odota, että liike-dropdown latautuu
        exerciseListFetch.firstCall.returnValue.then(() => {
        // Vaihda liike option[2] -> option[1]
            const exerciseSelectEl = itu.findRenderedDOMElementWithTag(rendered, 'select') as HTMLSelectElement;
            assert.equal(exerciseSelectEl.selectedIndex, 2, 'Nykyinen treeniliike pitäisi olla valittuna');
            const newSelectedExercise = testDropdownExercises[0];
            utils.setDropdownIndex(1, exerciseSelectEl); // note 0 == tyhjä option/-, 1 = testDropdownExercises[0] ...
        // Valitse variantti
            const variantSelectEl = itu.scryRenderedDOMElementsWithTag(rendered, 'select')[1] as HTMLSelectElement;
            const newSelectedVariant = newSelectedExercise.variants[0];
            utils.setDropdownIndex(1, variantSelectEl);
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
    QUnit.test('Muokkaa-painikkeen modal tallentaa muuttuneet sarjat, ja lopuksi renderöi näkymän', assert => {
        sinon.stub(shallowWorkoutBackend, 'updateExercise');
        sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        const setUpdateStub = sinon.stub(shallowWorkoutBackend, 'updateSet').returns(Promise.resolve(1));
        const setDeleteStub = sinon.stub(shallowWorkoutBackend, 'deleteSet');
        testWorkoutExercise.sets = workoutTestUtils.getSomeSets();
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        </div>);
        const originalTotals = itu.findRenderedDOMElementWithClass(rendered, 'footer').textContent;
        // Avaa modal klikkaamalla Muokkaa-painiketta
        const editWorkoutExerciseButton = utils.findButtonByAttribute(rendered, 'title', 'Muokkaa');
        editWorkoutExerciseButton.click();
        const setListInstance = workoutTestUtils.getMountedSetListInstance(rendered);
        const confirmSpy = sinon.spy(workoutTestUtils.getWorkoutExerciseModal(rendered), 'confirm');
        // Päivitä yhden sarjan tietoja modalissa
        const secondSetWeightInput = utils.getInputs(rendered)[2];
        utils.setInputValue(testWorkoutExercise.sets[1].weight + 5, secondSetWeightInput);
        // Hyväksy lomake
        const submitButton = utils.findButtonByContent(rendered, 'Ok');
        submitButton.click();
        // Odota resolve
        const done = assert.async();
        confirmSpy.firstCall.returnValue.then(() => {
            assert.deepEqual(setUpdateStub.firstCall.args, [[setListInstance.state.sets[1]]],
                'Pitäisi päivittää modifioidut sarjat'
            );
            assert.ok(setDeleteStub.notCalled, 'Ei pitäisi yrittää poistaa settejä');
            const renderedSets = getRenderedSetItems(rendered);
            assert.equal(renderedSets[1].textContent, getExpectedSetContent(setListInstance.state.sets[1]),
                'Pitäisi renderöidä päivitetty sarja'
            );
            const totals = itu.findRenderedDOMElementWithClass(rendered, 'footer');
            assert.equal(totals.textContent, getExpectedTotals(setListInstance.state.sets),
                'Pitäisi päivittää totals'
            );
            assert.notEqual(totals, originalTotals);
            done();
        });
    });
    QUnit.test('Muokkaa-painikkeen modal tallentaa muuttuneet ja poistetut sarjat, ja lopuksi renderöi näkymän', assert => {
        sinon.stub(shallowWorkoutBackend, 'updateExercise');
        sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        const setUpdateStub = sinon.stub(shallowWorkoutBackend, 'updateSet');
        const setDeleteStub = sinon.stub(shallowWorkoutBackend, 'deleteSet');
        testWorkoutExercise.sets = workoutTestUtils.getSomeSets();
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        </div>);
        // Avaa modal klikkaamalla Muokkaa-painiketta
        const editWorkoutExerciseButton = utils.findButtonByAttribute(rendered, 'title', 'Muokkaa');
        editWorkoutExerciseButton.click();
        const setListInstance = workoutTestUtils.getMountedSetListInstance(rendered);
        const confirmSpy = sinon.spy(workoutTestUtils.getWorkoutExerciseModal(rendered), 'confirm');
        // Päivitä yhden sarjan tietoja modalissa
        const firstSetRepsInput = utils.getInputs(rendered)[1];
        const modifiedSet = setListInstance.state.sets[0];
        utils.setInputValue('90', firstSetRepsInput);
        // Poista yksi sarja listalta
        const deletedSet = setListInstance.state.sets[1];
        const secondSetDeleteButton = workoutTestUtils.getSetListDeleteButtons(rendered)[1];
        secondSetDeleteButton.click();
        // Hyväksy lomake
        const submitButton = utils.findButtonByContent(rendered, 'Ok');
        submitButton.click();
        // Odota resolve
        const done = assert.async();
        confirmSpy.firstCall.returnValue.then(() => {
            // Lähettikö pyynnön?
            assert.ok(setUpdateStub.calledOnce, 'Pitäisi päivittää modifioidut sarjat');
            assert.deepEqual(setDeleteStub.firstCall.args, [deletedSet],
                'Pitäisi tallentaa poistetut sarjat'
            );
            const renderedSets = getRenderedSetItems(rendered);
            const deletedSetContent = getExpectedSetContent(deletedSet);
            // Päivittikö näkymän modalin sulkemisen jälkeen
            assert.notOk(
                Array.from(renderedSets).some(rs => rs.textContent === deletedSetContent),
                'Ei pitäisi renderöidä poistettua sarjaa'
            );
            assert.equal(renderedSets[0].textContent, getExpectedSetContent(modifiedSet),
                'Pitäisi renderöidä päivitetty sarja'
            );
            done();
        });
    });
    QUnit.test('Muokkaa-painikkeen modal ei tallenna mitään, jos tietoja ei muutu', assert => {
        sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        const workoutExerciseUpdateSpy = sinon.spy(shallowWorkoutBackend, 'updateExercise');
        const setUpdateSpy = sinon.spy(shallowWorkoutBackend, 'updateSet');
        const setDeleteSpy = sinon.spy(shallowWorkoutBackend, 'deleteSet');
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        </div>);
        const renderedContentBefore = itu.findRenderedDOMElementWithTag(rendered, 'li').textContent;
        // Avaa modal klikkaamalla Muokkaa-painiketta
        const editWorkoutExerciseButton = utils.findButtonByAttribute(rendered, 'title', 'Muokkaa');
        editWorkoutExerciseButton.click();
        const confirmSpy = sinon.spy(workoutTestUtils.getWorkoutExerciseModal(rendered), 'confirm');
        // Hyväksy lomake & assertoi, ettei lähettänyt mitään backendiin
        const submitButton = utils.findButtonByContent(rendered, 'Ok');
        submitButton.click();
        // Odota resolve
        const done = assert.async();
        confirmSpy.firstCall.returnValue.then(() => {
            // Skippasiko pyynnöt?
            assert.ok(workoutExerciseUpdateSpy.notCalled, 'Ei pitäisi päivittää treeniliikettä');
            assert.ok(setUpdateSpy.notCalled, 'Ei pitäisi päivittää settejä');
            assert.ok(setDeleteSpy.notCalled, 'Ei pitäisi poistaa settejä');
            // Jättikö näkymän renderöimättä?
            assert.equal(itu.findRenderedDOMElementWithTag(rendered, 'li').textContent,
                renderedContentBefore, 'Ei pitäisi uudelleenrenderöidä mitään'
            );
            done();
        });
    });
    QUnit.test('Uusi sarja -painikkeen modal lähettää uuden sarjan backediin, ja lopuksi renderöi näkymän', assert => {
        const setInsertCallStub = sinon.stub(shallowWorkoutBackend, 'insertSet').returns(Promise.resolve());
        testWorkoutExercise.sets = [{id: 'foo', weight: 45, reps: 2, ordinal: 0, workoutExerciseId: 'asd'}];
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <EditableWorkoutExercise workoutExercise={ testWorkoutExercise }/>
        </div>);
        const renderedSetCountBefore = getRenderedSetItems(rendered).length;
        // Klikkaa "Uusi sarja" -painiketta
        const addSetButton = utils.findButtonByContent(rendered, 'Uusi sarja');
        addSetButton.click();
        // Täytä lomake
        const [weightInput, repsInput] = utils.getInputs(rendered);
        assert.equal(weightInput.value, '45', 'Pitäisi poimia weight edellisestä sarjasta');
        assert.equal(repsInput.value, '2', 'Pitäisi poimia reps edellisestä sarjasta');
        utils.setInputValue('46', weightInput);
        utils.setInputValue('3', repsInput);
        // Hyväksy modal
        const submitButton = utils.findButtonByContent(rendered, 'Ok');
        submitButton.click();
        // Assertoi että lähetti datan backendiin
        assert.ok(setInsertCallStub.called, 'Pitäisi lähettää uusi sarja backediin');
        const expectedNewSet = {weight: 46, reps: 3, ordinal: 1, workoutExerciseId: testWorkoutExercise.id};
        assert.deepEqual(
            setInsertCallStub.firstCall.args,
            [expectedNewSet],
            'Pitäisi lähettää tämä sarja'
        );
        const done = assert.async();
        setInsertCallStub.firstCall.returnValue.then(() => {
            const renderedSetsAfter = getRenderedSetItems(rendered);
            assert.equal(
                renderedSetsAfter.length,
                renderedSetCountBefore + 1,
                'Pitäisi lisätä sarja listaan'
            );
            assert.equal(
                getRenderedSetItems(rendered)[1].textContent,
                getExpectedSetContent(expectedNewSet as any),
                'Pitäisi pushata lisätty sarja listaan'
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
    function getExpectedSetContent(data: Enj.API.WorkoutExerciseSet) {
        return `${data.weight}kg x ${data.reps}`;
    }
    function getExpectedTotals(sets: Array<Enj.API.WorkoutExerciseSet>) {
        const reps = sets.reduce((a, b) => a + b.reps, 0);
        const lifted = sets.reduce((a, b) => a + b.weight * b.reps, 0);
        const count = sets.length;
        return `Yhteensä: ${lifted}kg, ${count} sarjaa, ${reps} toistoa`;
    }
});
