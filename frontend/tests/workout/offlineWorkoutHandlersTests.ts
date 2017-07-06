import QUnit from 'qunitjs';
import sinon from 'sinon';
import Offline from 'src/offline/Offline';
import WorkoutBackend, { WorkoutExercise } from 'src/workout/WorkoutBackend';
import OfflineWorkoutHandlerRegister from 'src/workout/OfflineWorkoutHandlerRegister';

QUnit.module('workout/offlineWorkoutHandlers', hooks => {
    let offlineStub: Offline;
    let workoutBackendStub: WorkoutBackend;
    let handlerRegister: OfflineWorkoutHandlerRegister;
    hooks.beforeEach(() => {
        offlineStub = Object.create(Offline.prototype);
        offlineStub.utils = {getNextId: () => 32};
        workoutBackendStub = Object.create(WorkoutBackend.prototype);
        handlerRegister = new OfflineWorkoutHandlerRegister(offlineStub, workoutBackendStub);
    });
    QUnit.test('addExercise lisää uuden liikkeen treenicacheen, ja palauttaa uuden id:n', assert => {
        const mockCachedWorkouts = [
            {id: 1, start: 2, exercises: []}, // Pitäisi ignorettaa, koska id != newWorkoutExercise.workoutId
            {id: 2, start: 2, exercises: []}
        ];
        const cacheWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(workoutBackendStub, 'getTodaysWorkouts').returns(Promise.resolve(cacheWorkoutsCopy));
        sinon.stub(workoutBackendStub, 'completeUrl').returns('foo');
        const cacheUpdate = sinon.stub(offlineStub, 'updateCache').returns(Promise.resolve());
        const newWorkoutExercise = new WorkoutExercise();
        newWorkoutExercise.workoutId = 2;
        //
        const done = assert.async();
        handlerRegister.addExercise(newWorkoutExercise).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'foo' + workoutBackendStub.makeTimestampRangeUrlParams(),      // url
                [mockCachedWorkouts[0], Object.assign(mockCachedWorkouts[1], { // data
                    exercises: [newWorkoutExercise]
                })]
            ], 'Pitäisi lisätä uusi liike current-day-treenincachen oikeaan treeniin');
            assert.equal(result, JSON.stringify({insertId: 32}), 'Pitäisi palauttaa uusi id');
            assert.equal(newWorkoutExercise.id, 32, 'Pitäisi asettaa uusi id liikkeeseen');
            done();
        });
    });
});