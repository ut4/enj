import QUnit from 'qunitjs';
import sinon from 'sinon';
import Offline from 'src/offline/Offline';
import WorkoutBackend, { Workout, WorkoutExercise } from 'src/workout/WorkoutBackend';
import OfflineWorkoutHandlerRegister from 'src/workout/OfflineWorkoutHandlerRegister';

QUnit.module('workout/offlineWorkoutHandlers', hooks => {
    let offlineStub: Offline;
    let mockNewUuid: AAGUID = 'uuid32';
    let workoutBackendStub: WorkoutBackend;
    let workoutHandlerRegister: OfflineWorkoutHandlerRegister;
    let mockCachedWorkouts: Array<Enj.API.WorkoutRecord>;
    hooks.beforeEach(() => {
        offlineStub = Object.create(Offline.prototype);
        workoutBackendStub = Object.create(WorkoutBackend.prototype);
        workoutBackendStub.utils = {uuidv4: () => mockNewUuid};
        workoutHandlerRegister = new OfflineWorkoutHandlerRegister(offlineStub, workoutBackendStub);
        mockCachedWorkouts = [
            {id: 'someuuid1', start: 2, exercises: [], userId: 'someuuid2'},
            {id: 'someuuid3', start: 2, exercises: [], userId: 'someuuid4'}
        ];
    });
    QUnit.test('insert lisää uuden treenin cacheen, ja palauttaa insertCount:n', assert => {
        const cacheWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(workoutBackendStub, 'getAll').returns(Promise.resolve(cacheWorkoutsCopy));
        const cacheUpdate = sinon.stub(offlineStub, 'updateCache').returns(Promise.resolve());
        const newWorkout = new Workout();
        //
        const done = assert.async();
        workoutHandlerRegister.insert(newWorkout).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                [newWorkout].concat(mockCachedWorkouts as any)
            ], 'Pitäisi päivittää current-day-treenicache uudella liikkeellä varustettuna');
            assert.equal(result, JSON.stringify({insertCount: 1}), 'Pitäisi palauttaa insertCount');
            assert.equal(newWorkout.id, mockNewUuid, 'Pitäisi luoda treenille id');
            done();
        });
    });
    QUnit.test('addExercise lisää uuden liikkeen treenicacheen, ja palauttaa insertCount:n', assert => {
        const cacheWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(workoutBackendStub, 'getAll').returns(Promise.resolve(cacheWorkoutsCopy));
        const cacheUpdate = sinon.stub(offlineStub, 'updateCache').returns(Promise.resolve());
        const newWorkoutExercise = new WorkoutExercise();
        newWorkoutExercise.workoutId = cacheWorkoutsCopy[1].id;
        //
        const done = assert.async();
        workoutHandlerRegister.addExercise(newWorkoutExercise).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                // Ei pitäis muuttaa [0], koska eri treeni (id != newWorkoutExercise.workoutId)
                [mockCachedWorkouts[0], Object.assign(mockCachedWorkouts[1], {
                    exercises: [newWorkoutExercise]
                })]
            ], 'Pitäisi lisätä uusi liike current-day-treenicachen oikeaan treeniin');
            assert.equal(result, JSON.stringify({insertCount: 1}), 'Pitäisi palauttaa insertCount');
            assert.equal(newWorkoutExercise.id, mockNewUuid, 'Pitäisi luoda treenille id');
            done();
        });
    });
});