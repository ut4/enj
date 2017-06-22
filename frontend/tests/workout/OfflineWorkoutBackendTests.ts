import QUnit from 'qunitjs';
import sinon from 'sinon';
import Offline from 'src/offline/Offline';
import WorkoutBackend, { WorkoutExercise } from 'src/workout/WorkoutBackend';
import OfflineWorkoutBackend from 'src/workout/OfflineWorkoutBackend';

QUnit.module('workout/OfflineWorkoutBackend', hooks => {
    let offlineStub: Offline;
    let workoutBackendStub: WorkoutBackend;
    let offlineWorkoutBackend: OfflineWorkoutBackend;
    hooks.beforeEach(() => {
        offlineStub = Object.create(Offline.prototype);
        offlineStub.utils = {getNextId: () => 32};
        workoutBackendStub = Object.create(WorkoutBackend.prototype);
        offlineWorkoutBackend = new OfflineWorkoutBackend(offlineStub, workoutBackendStub)
    });
    QUnit.test('addExercise lisää uuden liikkeen treenicacheen, ja palauttaa uuden id:n', assert => {
        const mockCachedWorkouts = [{id: 1, start: 2, exercises: []}];
        const cacheWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(workoutBackendStub, 'getTodaysWorkouts').returns(Promise.resolve(cacheWorkoutsCopy));
        const cacheUpdate = sinon.stub(offlineStub, 'sendAsyncMessage').returns(Promise.resolve());
        const newWorkoutExercise = new WorkoutExercise();
        //
        const done = assert.async();
        offlineWorkoutBackend.addExercise(newWorkoutExercise).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cachen');
            assert.deepEqual(cacheUpdate.firstCall.args, [{
                action: 'updateCache',
                url: '/api/workout' + workoutBackendStub.makeTimestampRangeUrlParams(),
                data: [Object.assign(mockCachedWorkouts[0], {
                    exercises: [newWorkoutExercise]
                })]
            }], 'Pitäisi päivittää tämän päivän treenien cache uudella liikeellä varustettuna');
            assert.equal(result, 32, 'Pitäisi palauttaa uusi id');
            assert.equal(newWorkoutExercise.id, 32, 'Pitäisi asettaa uusi id liikkeeseen');
            done();
        });
    });
});