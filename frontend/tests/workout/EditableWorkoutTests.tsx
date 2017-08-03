import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import Modal from 'src/ui/Modal';
import EditableWorkout from 'src/workout/EditableWorkout';
import WorkoutBackend, { Workout, WorkoutExercise } from 'src/workout/WorkoutBackend';
import Timer from 'src/ui/Timer';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

QUnit.module('workout/EditableWorkout', hooks => {
    let testWorkout: Workout;
    let testWorkoutExercise: WorkoutExercise;
    let workoutBackendIocOverride: sinon.SinonStub;
    let shallowWorkoutBackend: WorkoutBackend;
    hooks.beforeEach(() => {
        testWorkout = new Workout();
        testWorkout.id = 'someuuid';
        testWorkoutExercise = new WorkoutExercise();
        testWorkoutExercise.exercise = {id: 'someuuid2', name:'exs', variants: []};
        testWorkout.exercises = [testWorkoutExercise];
        shallowWorkoutBackend = Object.create(WorkoutBackend.prototype);
        workoutBackendIocOverride = sinon.stub(iocFactories, 'workoutBackend').returns(shallowWorkoutBackend);
    });
    hooks.afterEach(() => {
        workoutBackendIocOverride.restore();
    });
    QUnit.test('endWorkout päivittää treenin lopetusajan backendiin, ja uudelleenrenderöi komponentin', assert => {
        testWorkoutExercise.sets = [{id: 'someuuid3', weight: 10, reps: 5}];
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <EditableWorkout workout={ testWorkout } onDelete={ () => null }/>
        </div>);
        const timerStopSpy = sinon.spy(itu.findRenderedVNodeWithType(rendered, Timer).children, 'stop');
        const updateCallStub = sinon.stub(shallowWorkoutBackend, 'update').returns(Promise.resolve('fo'));
        const expectedEndTime = Math.floor(Date.now() / 1000);
        // Klikkaa Valmis!-painiketta
        const endWorkoutButton = utils.findButtonByContent(rendered, 'Valmis!');
        endWorkoutButton.click();
        // Hyväksy lopetus
        const modalConfirmButton = utils.findButtonByContent(rendered, 'Ok');
        assert.ok(modalConfirmButton instanceof HTMLButtonElement, 'Pitäisi confirmoida treenin lopetus');
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
    QUnit.test('endWorkout poistaa treenin, jos siinä ei ollut tehtyjä settejä, ja kutsuu onDelete', assert => {
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
});
