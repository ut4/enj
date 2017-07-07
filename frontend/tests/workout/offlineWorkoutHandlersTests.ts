import QUnit from 'qunitjs';
import sinon from 'sinon';
import Offline from 'src/offline/Offline';
import WorkoutBackend, { Workout, WorkoutExercise } from 'src/workout/WorkoutBackend';
import OfflineWorkoutHandlerRegister from 'src/workout/OfflineWorkoutHandlerRegister';

QUnit.module('workout/offlineWorkoutHandlers', hooks => {
    let offlineStub: Offline;
    let workoutBackendStub: WorkoutBackend;
    let workoutHandlerRegister: OfflineWorkoutHandlerRegister;
    let mockCachedWorkouts: Array<Enj.API.WorkoutRecord>;
    hooks.beforeEach(() => {
        offlineStub = Object.create(Offline.prototype);
        offlineStub.utils = {getNextId: () => 32};
        workoutBackendStub = Object.create(WorkoutBackend.prototype);
        workoutHandlerRegister = new OfflineWorkoutHandlerRegister(offlineStub, workoutBackendStub);
        mockCachedWorkouts = [
            {id: 1, start: 2, exercises: []},
            {id: 2, start: 2, exercises: []}
        ];
    });
    QUnit.test('insert lisää uuden treenin cacheen, ja palauttaa uuden id:n', assert => {
        const cacheWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(workoutBackendStub, 'getTodaysWorkouts').returns(Promise.resolve(cacheWorkoutsCopy));
        sinon.stub(workoutBackendStub, 'completeUrl').returns('foo');
        const cacheUpdate = sinon.stub(offlineStub, 'updateCache').returns(Promise.resolve());
        const newWorkout = new Workout();
        newWorkout.id = 2;
        //
        const done = assert.async();
        workoutHandlerRegister.insert(newWorkout).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'foo' + workoutBackendStub.makeTimestampRangeUrlParams(),
                [newWorkout].concat(mockCachedWorkouts as any)
            ], 'Pitäisi päivittää current-day-treenicache uudella liikkeellä varustettuna');
            assert.equal(result, JSON.stringify({insertId: 32}), 'Pitäisi palauttaa uusi id');
            assert.equal(newWorkout.id, 32, 'Pitäisi asettaa uusi id treeniin');
            done();
        });
    });
    QUnit.test('addExercise lisää uuden liikkeen treenicacheen, ja palauttaa uuden id:n', assert => {
        const cacheWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(workoutBackendStub, 'getTodaysWorkouts').returns(Promise.resolve(cacheWorkoutsCopy));
        sinon.stub(workoutBackendStub, 'completeUrl').returns('foo');
        const cacheUpdate = sinon.stub(offlineStub, 'updateCache').returns(Promise.resolve());
        const newWorkoutExercise = new WorkoutExercise();
        newWorkoutExercise.workoutId = 2;
        //
        const done = assert.async();
        workoutHandlerRegister.addExercise(newWorkoutExercise).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'foo' + workoutBackendStub.makeTimestampRangeUrlParams(),
                // Ei pitäis muuttaa [0], koska id != newWorkoutExercise.workoutId
                [mockCachedWorkouts[0], Object.assign(mockCachedWorkouts[1], {
                    exercises: [newWorkoutExercise]
                })]
            ], 'Pitäisi lisätä uusi liike current-day-treenicachen oikeaan treeniin');
            assert.equal(result, JSON.stringify({insertId: 32}), 'Pitäisi palauttaa uusi id');
            assert.equal(newWorkoutExercise.id, 32, 'Pitäisi asettaa uusi id liikkeeseen');
            done();
        });
    });
});