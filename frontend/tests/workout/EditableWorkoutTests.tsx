import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import Modal from 'src/ui/Modal';
import EditableWorkout from 'src/workout/EditableWorkout';
import EditableWorkoutExercise from 'src/workout/EditableWorkoutExercise';
import WorkoutBackend, { Workout, WorkoutExerciseBackend, WorkoutExercise } from 'src/workout/WorkoutBackend';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import Timer from 'src/ui/Timer';
import iocFactories from 'src/ioc';
import workoutTestUtils from 'tests/workout/utils';
import utils from 'tests/utils';

QUnit.module('workout/EditableWorkout', hooks => {
    let testWorkout: Workout;
    let testWorkoutExercise: WorkoutExercise;
    let testWorkoutExercise2: WorkoutExercise;
    let shallowWorkoutBackend: WorkoutBackend;
    let workoutBackendIocOverride: sinon.SinonStub;
    let shallowExerciseBackend: ExerciseBackend;
    let exerciseBackendIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        testWorkout = new Workout();
        testWorkout.id = 'someuuid';
        testWorkoutExercise = new WorkoutExercise();
        testWorkoutExercise.ordinal = 1;
        testWorkoutExercise.exerciseId = 'someuuid2';
        testWorkoutExercise.exerciseName = 'exs';
        testWorkoutExercise2 = new WorkoutExercise();
        testWorkoutExercise2.ordinal = 2;
        testWorkoutExercise2.exerciseId = 'someuuid3';
        testWorkoutExercise2.exerciseName = 'exs2';
        testWorkout.exercises = [testWorkoutExercise, testWorkoutExercise2];
        shallowWorkoutBackend = Object.create(WorkoutBackend.prototype);
        shallowWorkoutBackend.workoutExerciseBackend = Object.create(WorkoutExerciseBackend.prototype);
        workoutBackendIocOverride = sinon.stub(iocFactories, 'workoutBackend').returns(shallowWorkoutBackend);
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(shallowExerciseBackend);
    });
    hooks.afterEach(() => {
        workoutBackendIocOverride.restore();
        exerciseBackendIocOverride.restore();
    });
    QUnit.test('"Valmis!" päivittää treenin lopetusajan backendiin, ja uudelleenrenderöi komponentin', assert => {
        testWorkoutExercise.sets = [{id: 'someuuid3', weight: 10, reps: 5, workoutExerciseId: testWorkoutExercise.id}];
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <EditableWorkout workout={ testWorkout } onDelete={ () => null }/>
        </div>);
        const timerStopSpy = sinon.spy(itu.findRenderedVNodeWithType(rendered, Timer).children, 'stop');
        const updateCallStub = sinon.stub(shallowWorkoutBackend, 'update').returns(Promise.resolve('fo'));
        // Klikkaa Valmis!-painiketta
        const endWorkoutButton = utils.findButtonByContent(rendered, 'Valmis!');
        endWorkoutButton.click();
        // Hyväksy lopetus
        const modalConfirmButton = utils.findButtonByContent(rendered, 'Ok');
        assert.ok(modalConfirmButton instanceof HTMLButtonElement, 'Pitäisi confirmoida treenin lopetus');
        const expectedEndTime = Math.floor(Date.now() / 1000);
        modalConfirmButton.click();
        //
        assert.ok(updateCallStub.calledOnce, 'Pitäisi päivittää lopetusaika backendiin');
        const done = assert.async();
        updateCallStub.firstCall.returnValue.then(() => {
            assert.equal(JSON.stringify(updateCallStub.firstCall.args), JSON.stringify([[
                Object.assign({}, testWorkout, {end: expectedEndTime})
            ]]), 'Pitäisi PUT:ata lopetusaika backendiin');
            assert.deepEqual(utils.findButtonByContent(rendered, 'Valmis!'), undefined,
                'Pitäisi piilottaa Valmis!-painike'
            );
            assert.ok(timerStopSpy.calledOnce, 'Pitäisi pysäyttää treenin timer');
            done();
        });
    });
    QUnit.test('"Valmis!" poistaa treenin, jos siinä ei ollut tehtyjä settejä, ja kutsuu onDelete', assert => {
        const onDelete = sinon.spy();
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <EditableWorkout workout={ testWorkout } onDelete={ onDelete }/>
        </div>);
        const deleteCallStub = sinon.stub(shallowWorkoutBackend, 'delete').returns(Promise.resolve('fo'));
        // Klikkaa Valmis!-painiketta
        const endWorkoutButton = utils.findButtonByContent(rendered, 'Valmis!');
        endWorkoutButton.click();
        // Hyväksy lopetus
        const modalConfirmButton = utils.findButtonByContent(rendered, 'Ok');
        assert.ok(modalConfirmButton instanceof HTMLButtonElement, 'Pitäisi confirmoida treenin lopetus');
        modalConfirmButton.click();
        //
        assert.ok(deleteCallStub.calledOnce, 'Pitäisi poistaa tyhjä treeni');
        const done = assert.async();
        deleteCallStub.firstCall.returnValue.then(() => {
            assert.deepEqual(JSON.stringify(deleteCallStub.firstCall.args),
                JSON.stringify([testWorkout]), 'Pitäisi DELEToida treeni'
            );
            assert.ok(onDelete.calledOnce, 'Pitäisi delegoida uudelleenrenderöinti ' +
                'parent-komponentin passamalle onDelete-callbackille'
            );
            done();
        });
    });
    QUnit.test('"Lisää liike" luo liikkeen, postaa sen backendiin, ja renderöi sen lopuksi näkymään', assert => {
        const addExerciseCallStub = sinon.stub(shallowWorkoutBackend, 'addExercise').returns(Promise.resolve());
        const testExercises = [{id: 'someuuuid', name: 'foo', variants: []}];
        const exerciseListFetch = sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testExercises));
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <EditableWorkout workout={ testWorkout }/>
        </div>);
        const renderedWorkoutExerciseCountBefore = itu.scryRenderedVNodesWithType(rendered, EditableWorkoutExercise).length;
        // Klikkaa "Lisää liike"-painiketta
        utils.findButtonByContent(rendered, 'Lisää liike').click();
        let insertedWorkoutExercise;
        // Odota, että liikelista latautuu
        const done = assert.async();
        exerciseListFetch.firstCall.returnValue
            .then(() => {
        // Valitse liike listasta
                const exerciseSelectEl = itu.findRenderedDOMElementWithTag(rendered, 'select') as HTMLSelectElement;
                exerciseSelectEl.options[1].selected = true;
                utils.triggerEvent('change', exerciseSelectEl);
        // Hyväksy modal
                const confirmSpy = sinon.spy(workoutTestUtils.getWorkoutExerciseModal(rendered), 'confirm');
                const submitButton = utils.findButtonByContent(rendered, 'Ok');
                submitButton.click();
        // Assertoi että lähetti datan backendiin
                assert.ok(addExerciseCallStub.called);
                const insertedWorkoutExercise = addExerciseCallStub.firstCall.args[0];
                assert.equal(insertedWorkoutExercise.workoutId, testWorkout.id);
                assert.equal(insertedWorkoutExercise.ordinal, testWorkout.exercises.length);
                assert.equal(insertedWorkoutExercise.exerciseId, testExercises[0].id);
                assert.equal(insertedWorkoutExercise.exerciseName, testExercises[0].name);
                assert.equal(insertedWorkoutExercise.exerciseVariantId, null);
                assert.equal(insertedWorkoutExercise.exerciseVariantContent, null);
                assert.deepEqual(insertedWorkoutExercise.sets, []);
                return confirmSpy.firstCall.returnValue;
        // Odota resolve & assertoi että renderöi lisätyn liikkeen
            })
            .then(() => {
                assert.equal(itu.scryRenderedVNodesWithType(rendered, EditableWorkoutExercise).length,
                    renderedWorkoutExerciseCountBefore + 1,  'Pitäisi renderöidä lisätty treeniliike'
                );
                done();
            });
    });
    QUnit.test('Liikkeen Poista-painikkeen modal lähettää poistettavan treeniliikkeen backendiin, ja renderöi näkymän', assert => {
        const deleteWorkoutExerciseCallStub = sinon.stub(shallowWorkoutBackend, 'deleteExercise').returns(Promise.resolve());
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <EditableWorkout workout={ testWorkout }/>
        </div>);
        const workoutExerciseToDelete = testWorkout.exercises[0];
        const renderedWorkoutExerciseCountBefore = itu.scryRenderedVNodesWithType(rendered, EditableWorkoutExercise).length;
        // Klikkaa Poista-painiketta
        const deleteWorkoutExerciseButton = utils.findButtonByAttribute(rendered, 'title', 'Poista');
        deleteWorkoutExerciseButton.click();
        // Hyväksy poisto modalista
        const modalConfirmButton = utils.findButtonByContent(rendered, 'Ok');
        assert.ok(modalConfirmButton instanceof HTMLButtonElement, 'Pitäisi confirmoida treeniliikkeen poisto');
        modalConfirmButton.click();
        //
        assert.ok(deleteWorkoutExerciseCallStub.calledOnce, 'Pitäisi lähettää poistettava treeniliike backendiin');
        assert.deepEqual(deleteWorkoutExerciseCallStub.firstCall.args, [
            workoutExerciseToDelete
        ], 'Pitäisi lähettää poistettava treeniliike backendiin');
        //
        const done = assert.async();
        deleteWorkoutExerciseCallStub.firstCall.returnValue.then(() => {
            assert.equal(
                itu.scryRenderedVNodesWithType(rendered, EditableWorkoutExercise).length,
                renderedWorkoutExerciseCountBefore - 1,
                'Pitäisi renderöidä poistettu treeni pois näkymästä'
            );
            done();
        });
    });
    QUnit.test('Liikkeen Siirrä alas-painike modal swappaa kahden treenin ordinal-arvot, ja renderöi näkymän', assert => {
        const workoutExerciseUpdate = sinon.stub(shallowWorkoutBackend.workoutExerciseBackend, 'update').returns(Promise.resolve());
        const originalWorkoutExerciseList = JSON.parse(JSON.stringify(testWorkout.exercises));
        const rendered = itu.renderIntoDocument(<EditableWorkout workout={ testWorkout }/>);
        const firstRenderedWorkoutExerciseBefore = itu.scryRenderedVNodesWithType(rendered, EditableWorkoutExercise)[0];
        assert.ok(firstRenderedWorkoutExerciseBefore !== undefined);
        // Klikkaa Siirrä alas-painiketta
        const moveWorkoutExerciseDownButton = utils.findButtonByAttribute(rendered, 'title', 'Siirrä alas');
        moveWorkoutExerciseDownButton.click();
        //
        assert.ok(workoutExerciseUpdate.calledOnce, 'Pitäisi lähettää uudet ordinal-arvot backendiin');
        const expectedPUTJSON = JSON.stringify([
            Object.assign(originalWorkoutExerciseList[1], {ordinal: 1}),
            Object.assign(originalWorkoutExerciseList[0], {ordinal: 2})
        ]);
        assert.deepEqual(JSON.stringify(workoutExerciseUpdate.firstCall.args), `[${expectedPUTJSON}]`,
            'Pitäisi lähettää treeniliikkeet päivitetyillä ordinal-arvoilla backendiin'
        );
        assert.equal(JSON.stringify(testWorkout.exercises), JSON.stringify(originalWorkoutExerciseList),
            'Ei pitäisi mutatoida props.workout.exercises-listaa ennen toiminnon resolvaamista'
        );
        //
        const done = assert.async();
        workoutExerciseUpdate.firstCall.returnValue.then(() => {
            assert.notDeepEqual(
                itu.scryRenderedVNodesWithType(rendered, EditableWorkoutExercise)[0],
                firstRenderedWorkoutExerciseBefore,
                'Pitäisi renderöidä näkymän treeniliikkeet swapattuna'
            );
            assert.equal(
                JSON.stringify(testWorkout.exercises),
                expectedPUTJSON,
                'Pitäisi mutatoida props.workout.exercises backend-kutsun jälkeen'
            );
            done();
        });
    });
});
