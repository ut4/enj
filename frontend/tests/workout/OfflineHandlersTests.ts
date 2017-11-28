import QUnit from 'qunitjs';
import sinon from 'sinon';
import Offline from 'src/offline/Offline';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import UserState from 'src/user/UserState';
import WorkoutBackend, { Workout, WorkoutExercise, WorkoutExerciseSet } from 'src/workout/WorkoutBackend';
import WorkoutOfflineHandlers from 'src/workout/OfflineHandlers';

QUnit.module('workout/OfflineHandlersTests', hooks => {
    let shallowOffline: Offline;
    let shallowOfflineHttp: OfflineHttp;
    let fetchContainer: GlobalFetch = window;
    let workoutBackend: WorkoutBackend;
    let workoutHandlerRegister: WorkoutOfflineHandlers;
    let mockCachedWorkouts: Array<Enj.API.Workout>;
    let mockNewUuid: AAGUID = 'uuid32';
    // beforeAll
    const shallowUserState: UserState = Object.create(UserState.prototype);
    sinon.stub(shallowUserState, 'isOffline').returns(Promise.resolve(true));
    //
    hooks.beforeEach(() => {
        shallowOffline = Object.create(Offline.prototype);
        shallowOfflineHttp = Object.create(OfflineHttp.prototype);
        sinon.stub(shallowOfflineHttp, 'logRequestToSyncQueue').returns(Promise.resolve());
        workoutBackend = new WorkoutBackend(new Http(fetchContainer, shallowOfflineHttp, shallowUserState, '/'), 'workout', shallowUserState);
        workoutBackend.utils.uuidv4 = () => mockNewUuid;
        const workoutHandlerRegister = new WorkoutOfflineHandlers(shallowOffline, workoutBackend);
        workoutHandlerRegister.registerHandlers(shallowOfflineHttp);
        mockCachedWorkouts = [
            {id: 'someuuid1', start: 2, exercises: [], userId: 'someuuid100'},
            {id: 'someuuid2', start: 3, exercises: [
                {id: 'someuuid10', workoutId: 'someuuid2', exerciseId: 'someuuid20', sets: []} as any
            ], userId: 'someuuid101'},
            {id: 'someuuid3', start: 4, exercises: [
                {id: 'someuuid11', workoutId: 'someuuid3', exerciseId: 'someuuid21', sets: [
                    {id: 'someuuid30', workoutExerciseId: 'someuuid11', weight: 10, reps: 5},
                    {id: 'someuuid31', workoutExerciseId: 'someuuid11', weight: 11, reps: 6}
                ]} as any,
                {id: 'someuuid12', workoutId: 'someuuid3', exerciseId: 'someuuid22', sets: []} as any
            ], userId: 'someuuid102'}
        ];
    });
    QUnit.test('insert lisää uuden treenin cacheen, ja palauttaa insertCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(workoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newWorkout = new Workout();
        //
        const done = assert.async();
        workoutBackend.insert(newWorkout).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                [newWorkout].concat(mockCachedWorkouts as any)
            ], 'Pitäisi lisätä uusi treeni cacheen');
            assert.equal(result, 1, 'Pitäisi palauttaa insertCount');
            assert.equal(newWorkout.id, mockNewUuid, 'Pitäisi luoda treenille id');
            done();
        });
    });
    QUnit.test('update päivittää treenit cacheen, ja palauttaa deleteCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(workoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Tee jotain muutoksia
        const workoutsToUpdate = [mockCachedWorkouts[2], mockCachedWorkouts[1]];
        workoutsToUpdate[0].start += 1;
        workoutsToUpdate[1].end = 41;
        // Päivitä kumpikin
        const done = assert.async();
        workoutBackend.update(workoutsToUpdate).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                [mockCachedWorkouts[0], workoutsToUpdate[1], workoutsToUpdate[0]]
            ], 'Pitäisi päivittää treenit treenicacheen');
            assert.equal(result, 2, 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('delete poistaa treenin cachesta, ja palauttaa deleteCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(workoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Poista cachen keskimmäinen treeni
        const done = assert.async();
        workoutBackend.delete(mockCachedWorkouts[1]).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                [mockCachedWorkouts[0], mockCachedWorkouts[2]]
            ], 'Pitäisi poistaa treeni treenicachesta');
            assert.equal(result, 1, 'Pitäisi palauttaa deleteCount');
            done();
        });
    });
    QUnit.test('addExercise lisää uuden liikkeen treenicacheen, ja palauttaa insertCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(workoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newWorkoutExercise = new WorkoutExercise();
        newWorkoutExercise.workoutId = cachedWorkoutsCopy[1].id;
        // Lisää liike cachen keskimmäiseen treeniin
        const done = assert.async();
        workoutBackend.addExercise(newWorkoutExercise).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                // Ei pitäisi muuttaa [0] & [2], koska eri treeni (id != newWorkoutExercise.workoutId)
                [mockCachedWorkouts[0], Object.assign(mockCachedWorkouts[1], {
                    exercises: mockCachedWorkouts[1].exercises.concat([newWorkoutExercise])
                }), mockCachedWorkouts[2]]
            ], 'Pitäisi lisätä uusi liike treenicachen oikeaan treeniin');
            assert.equal(result, 1, 'Pitäisi palauttaa insertCount');
            assert.equal(newWorkoutExercise.id, mockNewUuid, 'Pitäisi luoda liikkeelle id');
            done();
        });
    });
    QUnit.test('addExercises lisää uudet liikkeet treenicacheen, ja palauttaa insertCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(workoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newWorkoutExercise = new WorkoutExercise();
        newWorkoutExercise.ordinal = 0;
        newWorkoutExercise.workoutId = cachedWorkoutsCopy[1].id;
        const newWorkoutExercise2 = new WorkoutExercise();
        newWorkoutExercise2.ordinal = 1;
        newWorkoutExercise2.workoutId = cachedWorkoutsCopy[1].id;
        // Lisää liike cachen keskimmäiseen treeniin
        const done = assert.async();
        const newWorkoutExercises = [newWorkoutExercise, newWorkoutExercise2];
        workoutBackend.addExercises(newWorkoutExercises).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                // Ei pitäisi muuttaa [0] & [2], koska eri treeni (id != newWorkoutExercise.workoutId)
                [mockCachedWorkouts[0], Object.assign(mockCachedWorkouts[1], {
                    exercises: mockCachedWorkouts[1].exercises.concat(newWorkoutExercises)
                }), mockCachedWorkouts[2]]
            ], 'Pitäisi lisätä uusi liike treenicachen oikeaan treeniin');
            assert.equal(result, 2, 'Pitäisi palauttaa insertCount');
            assert.equal(newWorkoutExercise.id, mockNewUuid, 'Pitäisi luoda liikkeelle id');
            assert.equal(newWorkoutExercise2.id, mockNewUuid, 'Pitäisi luoda liikkeelle id');
            done();
        });
    });
    QUnit.test('updateExercises päivittää liikeet treenicacheen, ja palauttaa updateCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        // Lisää 1. treenille yksi, ja 2. treenille kaksi treeniliikettä
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        const workoutExercise = cachedWorkoutsCopy[1].exercises[0];
        const workoutExercise2 = cachedWorkoutsCopy[2].exercises[0];
        const workoutExercise3 = cachedWorkoutsCopy[2].exercises[1];
        //
        sinon.stub(workoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Suorita jotain muutoksia
        const updated1 = JSON.parse(JSON.stringify(workoutExercise));
        updated1.exerciseId = 'someuuid22';
        updated1.exerciseVariantId = 'someuuid30';
        const updated2 = JSON.parse(JSON.stringify(workoutExercise2));
        updated2.ordinal = 3;
        const updated3 = JSON.parse(JSON.stringify(workoutExercise3));
        updated3.ordinal = 2;
        const updatedExercises = [updated2, updated3, updated1];
        //
        const done = assert.async();
        workoutBackend.updateExercise(updatedExercises).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.equal(cacheUpdate.firstCall.args[0], 'workout');
            assert.equal(
                JSON.stringify(cacheUpdate.firstCall.args[1][0]),
                JSON.stringify(mockCachedWorkouts[0]),
                '1. treenin pitäisi pysyä muuttumattomana'
            );
            assert.equal(
                JSON.stringify(cacheUpdate.firstCall.args[1][1]),
                JSON.stringify(Object.assign(mockCachedWorkouts[1],{exercises:[updated1]})),
                'Pitäisi päivittää liike siihen kuuluvan treenin listaan'
            );
            assert.equal(
                JSON.stringify(cacheUpdate.firstCall.args[1][2]),
                JSON.stringify(Object.assign(mockCachedWorkouts[2],{exercises:[updated2, updated3]})),
                'Pitäisi päivittää liike siihen kuuluvan treenin listaan'
            );
            assert.equal(result, 3, 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('deleteExercise poistaa treeniliikkeen cachesta, ja palauttaa deleteCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        const workoutExercise = new WorkoutExercise();
        workoutExercise.id = 'someuuid10';
        workoutExercise.workoutId = cachedWorkoutsCopy[0].id;
        cachedWorkoutsCopy[0].exercises.push(workoutExercise);
        sinon.stub(workoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Poista cachen ensimmäiseen treeniin kuuluva liike
        const done = assert.async();
        workoutBackend.deleteExercise(cachedWorkoutsCopy[0].exercises[0]).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                [
                    Object.assign(mockCachedWorkouts[0], {exercises: []}),
                    mockCachedWorkouts[1],
                    mockCachedWorkouts[2]
                ]
            ], 'Pitäisi poistaa treeni treenicachesta');
            assert.equal(result, 1, 'Pitäisi palauttaa deleteCount');
            done();
        });
    });
    QUnit.test('insertSet lisää uuden sarjan treenicacheen, ja palauttaa insertCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        const workoutExercise = cachedWorkoutsCopy[2].exercises[0];
        const workoutExercise2 = cachedWorkoutsCopy[2].exercises[1];
        sinon.stub(workoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Luo sarja & lisää viimeisen treenin toiseen liikkeeseen
        const newWorkoutExerciseSet = new WorkoutExerciseSet();
        newWorkoutExerciseSet.weight = 40;
        newWorkoutExerciseSet.reps = 20;
        newWorkoutExerciseSet.workoutExerciseId = workoutExercise2.id;
        const done = assert.async();
        workoutBackend.insertSet(newWorkoutExerciseSet).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                // Ei pitäisi muuttaa [0] & [1], koska eri treeni
                [mockCachedWorkouts[0], mockCachedWorkouts[1], Object.assign(mockCachedWorkouts[2], {
                    exercises: [
                        workoutExercise, // Ei pitäisi muuttaa ensimmäistä liikettä
                        Object.assign(workoutExercise2, {
                            sets: [newWorkoutExerciseSet]
                        })
                    ]
                })]
            ], 'Pitäisi pushata uusi liike treenicachen oikean treenin oikean liikkeen liikelistaan');
            assert.equal(result, 1, 'Pitäisi palauttaa insertCount');
            assert.equal(newWorkoutExerciseSet.id, mockNewUuid, 'Pitäisi luoda sarjalle id');
            done();
        });
    });
    QUnit.test('updateSet päivittää sarjat treenicachesta, ja palauttaa deleteCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(workoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Päivitä viimeisen treenin ensimmäisen liikkeen kummankin sarjan arvoja
        const setsParent = mockCachedWorkouts[2].exercises[0];
        const setsToUpdate = [
            Object.assign({}, setsParent.sets[0], {weight: 1}),
            Object.assign({}, setsParent.sets[1], {reps: 2}),
        ];
        const done = assert.async();
        workoutBackend.updateSet(setsToUpdate).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                // Ei pitäisi muuttaa [0] & [1]
                [mockCachedWorkouts[0], mockCachedWorkouts[1], Object.assign(mockCachedWorkouts[2], {
                    exercises: [
                        Object.assign(setsParent, {
                            sets: setsToUpdate
                        }),
                        mockCachedWorkouts[2].exercises[1]
                    ]
                })]
            ], 'Pitäisi päivittää kumpikin sarja treenicachen oikean treenin oikean liikkeen sarjalistasta');
            assert.equal(result, 2, 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('deleteSet poistaa sarjan treenicachesta, ja palauttaa deleteCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cachedWorkoutsCopy = JSON.parse(JSON.stringify(mockCachedWorkouts));
        sinon.stub(workoutBackend, 'getAll').returns(Promise.resolve(cachedWorkoutsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Poista sarja viimeisen treenin ensimmäisen liikkeen sarjalistasta
        const setsParent = mockCachedWorkouts[2].exercises[0];
        const setToDelete = setsParent.sets[0];
        const done = assert.async();
        workoutBackend.deleteSet(setToDelete).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'workout',
                // Ei pitäisi muuttaa [0] & [1]
                [mockCachedWorkouts[0], mockCachedWorkouts[1], Object.assign(mockCachedWorkouts[2], {
                    exercises: [
                        Object.assign(setsParent, {
                            sets: [setsParent.sets[1]]
                        }),
                        mockCachedWorkouts[2].exercises[1]
                    ]
                })]
            ], 'Pitäisi poistaa sarja treenicachen oikean treenin oikean liikkeen sarjalistasta');
            assert.equal(result, 1, 'Pitäisi palauttaa deleteCount');
            done();
        });
    });
});