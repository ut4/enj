import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import EditableWorkout from 'src/workout/EditableWorkout';
import WorkoutBackend, { Workout, WorkoutExercise } from 'src/workout/WorkoutBackend';
import iocFactories from 'src/ioc';
import utils from 'tests/utils';

QUnit.module('workout/EditableWorkout', hooks => {
    let testWorkout: Workout;
    let testWorkoutExercise: WorkoutExercise;
    let workoutBackendIocOverride: sinon.SinonStub;
    let workoutBackend: WorkoutBackend;
    hooks.beforeEach(() => {
        testWorkout = new Workout();
        testWorkout.id = 'someuuid';
        testWorkoutExercise = new WorkoutExercise();
        testWorkoutExercise.exercise = {id: 'someuuid2', name:'exs', variants: []};
        testWorkout.exercises = [testWorkoutExercise];
        workoutBackend = Object.create(WorkoutBackend.prototype);
        workoutBackendIocOverride = sinon.stub(iocFactories, 'workoutBackend').returns(workoutBackend);
    });
    hooks.afterEach(() => {
        workoutBackendIocOverride.restore();
    });
    QUnit.test('endWorkout päivittää treenin lopetusajan backendiin, ja uudeleenrenderöi komponentin', assert => {
        testWorkoutExercise.sets = [{id: 'someuuid3', weight: 10, reps: 5}];
        const rendered = itu.renderIntoDocument(
            <EditableWorkout workout={ testWorkout } onDelete={ () => null }/>
        );
        const updateCallStub = sinon.stub(workoutBackend, 'update').returns(Promise.resolve('fo'));
        const expectedEndTime = Math.floor(new Date().getTime() / 1000);
        // Klikkaa Valmis!-painiketta
        const endWorkoutButton = utils.findButtonByContent(rendered, 'Valmis!');
        endWorkoutButton.click();
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
            done();
        });
    });
    QUnit.test('endWorkout poistaa treenin, jos siinä ei ollut tehtyjä settejä, ja kutsuu onDelete', assert => {
        const onDelete = sinon.spy();
        const rendered = itu.renderIntoDocument(
            <EditableWorkout workout={ testWorkout } onDelete={ onDelete }/>
        );
        const deleteCallStub = sinon.stub(workoutBackend, 'delete').returns(Promise.resolve('fo'));
        // Klikkaa Valmis!-painiketta
        const endWorkoutButton = utils.findButtonByContent(rendered, 'Valmis!');
        endWorkoutButton.click();
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
