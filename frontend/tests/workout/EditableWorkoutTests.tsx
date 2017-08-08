import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import Modal from 'src/ui/Modal';
import EditableWorkout from 'src/workout/EditableWorkout';
import EditableWorkoutExercise from 'src/workout/EditableWorkoutExercise';
import WorkoutBackend, { Workout, WorkoutExercise } from 'src/workout/WorkoutBackend';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import Timer from 'src/ui/Timer';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

QUnit.module('workout/EditableWorkout', hooks => {
    let testWorkout: Workout;
    let testWorkoutExercise: WorkoutExercise;
    let workoutBackendIocOverride: sinon.SinonStub;
    let shallowWorkoutBackend: WorkoutBackend;
    let shallowExerciseBackend: ExerciseBackend;
    let exerciseBackendIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        testWorkout = new Workout();
        testWorkout.id = 'someuuid';
        testWorkoutExercise = new WorkoutExercise();
        testWorkoutExercise.exerciseId = 'someuuid2';
        testWorkoutExercise.exerciseName = 'exs';
        testWorkout.exercises = [testWorkoutExercise];
        shallowWorkoutBackend = Object.create(WorkoutBackend.prototype);
        workoutBackendIocOverride = sinon.stub(iocFactories, 'workoutBackend').returns(shallowWorkoutBackend);
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(shallowExerciseBackend);
    });
    hooks.afterEach(() => {
        workoutBackendIocOverride.restore();
        exerciseBackendIocOverride.restore();
    });
    QUnit.test('"Valmis!" päivittää treenin lopetusajan backendiin, ja uudelleenrenderöi komponentin', assert => {
        testWorkoutExercise.sets = [{id: 'someuuid3', weight: 10, reps: 5}];
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
                const submitButton = utils.findButtonByContent(rendered, 'Ok');
                submitButton.click();
        // Assertoi että lähetti datan backendiin
                assert.ok(addExerciseCallStub.called);
                const insertedWorkoutExercise = addExerciseCallStub.firstCall.args[0];
                assert.equal(insertedWorkoutExercise.workoutId, testWorkout.id);
                assert.equal(insertedWorkoutExercise.orderDef, testWorkout.exercises.length);
                assert.equal(insertedWorkoutExercise.exerciseId, testExercises[0].id);
                assert.equal(insertedWorkoutExercise.exerciseName, testExercises[0].name);
                assert.equal(insertedWorkoutExercise.exerciseVariantId, null);
                assert.equal(insertedWorkoutExercise.exerciseVariantContent, null);
                assert.deepEqual(insertedWorkoutExercise.sets, []);
                return addExerciseCallStub.returnValue;
        // Odota resolve & assertoi että renderöi lisätyn liikkeen
            })
            .then(() => {
                assert.equal(itu.scryRenderedVNodesWithType(rendered, EditableWorkoutExercise).length,
                    renderedWorkoutExerciseCountBefore + 1,  'Pitäisi renderöidä lisätty treeniliike'
                );
                done();
            });
    });
});
