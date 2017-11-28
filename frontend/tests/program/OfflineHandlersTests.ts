import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import Offline from 'src/offline/Offline';
import UserState from 'src/user/UserState';
import ProgramBackend from 'src/program/ProgramBackend';
import ProgramOfflineHandlers from 'src/program/OfflineHandlers';
import ptu from 'tests/program/utils';

QUnit.module('program/OfflineHandlers', hooks => {
    let shallowOffline: Offline;
    let fetchContainer: GlobalFetch = window;
    let shallowOfflineHttp: OfflineHttp;
    let mockNewUuid: AAGUID = 'uuid90';
    let programBackend: ProgramBackend;
    let programHandlerRegister: ProgramOfflineHandlers;
    let mockCachedPrograms: Array<Enj.API.Program>;
    let cachedProgramsCopy: Array<Enj.API.Program>;
    // beforeAll
    const shallowUserState: UserState = Object.create(UserState.prototype);
    sinon.stub(shallowUserState, 'isOffline').returns(Promise.resolve(true));
    //
    hooks.beforeEach(() => {
        shallowOffline = Object.create(Offline.prototype);
        shallowOfflineHttp = Object.create(OfflineHttp.prototype);
        sinon.stub(shallowOfflineHttp, 'logRequestToSyncQueue').returns(Promise.resolve());
        programBackend = new ProgramBackend(new Http(fetchContainer, shallowOfflineHttp, shallowUserState, '/'), 'program');
        programBackend.utils.uuidv4 = () => mockNewUuid;
        const programHandlerRegister = new ProgramOfflineHandlers(shallowOffline, programBackend);
        programHandlerRegister.registerHandlers(shallowOfflineHttp);
        mockCachedPrograms = ptu.getSomeTestPrograms();
        cachedProgramsCopy = JSON.parse(JSON.stringify(mockCachedPrograms));
        sinon.stub(programBackend, 'getAll').returns(Promise.resolve(cachedProgramsCopy));
    });
    QUnit.test('insert lisää uuden ohjelman cacheen, ja palauttaa insertCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newProgram = {name: 'foo'} as any;
        //
        const done = assert.async();
        programBackend.insert(newProgram).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää offline-cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'program/mine',
                [newProgram].concat(mockCachedPrograms as any)
            ], 'Pitäisi lisätä uusi ohjelma cacheen');
            assert.equal(result, 1, 'Pitäisi palauttaa insertCount');
            assert.equal(newProgram.id, mockNewUuid, 'Pitäisi luoda ohjelmalle id');
            done();
        });
    });
    QUnit.test('update päivittää ohjelman cacheen, ja palauttaa updateCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Tee jotain muutoksia
        const updatedProgram = Object.assign({}, cachedProgramsCopy[0]);
        updatedProgram.name = 'sss';
        // Päivitä
        const done = assert.async();
        programBackend.update(updatedProgram, '/' + updatedProgram.id).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'program/mine',
                [updatedProgram, mockCachedPrograms[1]]
            ], 'Pitäisi päivittää ohjelma cacheen');
            assert.equal(result, 1, 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('delete poistaa ohjelman ohjelmacachesta, ja palauttaa deleteCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Poista cachen ensimmäinen liike
        const done = assert.async();
        programBackend.delete(cachedProgramsCopy[0]).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'program/mine',
                [mockCachedPrograms[1]]
            ], 'Pitäisi poistaa ensimmäinen ohjelma');
            assert.equal(result, 1, 'Pitäisi palauttaa deleteCount');
            done();
        });
    });
    QUnit.test('insertWorkouts lisää uuden ohjelmatreenin ohjelmacacheen, ja palauttaa insertCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newProgramWorkout = {id: null, name: 'foo', programId: cachedProgramsCopy[1].id} as any;
        // Lisää ohjelmatreeni cachen jälkimmäiseen ohjelmaan
        const done = assert.async();
        programBackend.insertWorkouts([newProgramWorkout]).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'program/mine',
                [mockCachedPrograms[0], Object.assign(mockCachedPrograms[1], {
                    workouts: mockCachedPrograms[1].workouts.concat([newProgramWorkout] as any)
                })]
            ], 'Pitäisi lisätä uusi ohjelmatreeni ohjelmacachen oikeaan ohjelmaan');
            assert.equal(result, 1, 'Pitäisi palauttaa insertCount');
            assert.equal(newProgramWorkout.id, mockNewUuid, 'Pitäisi luoda ohjelmatreenille id');
            done();
        });
    });
    QUnit.test('updateWorkouts päivittää ohjelmatreenit ohjelmacacheen, ja palauttaa updateCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Suorita jotain muutoksia
        const updated1 = JSON.parse(JSON.stringify(mockCachedPrograms[0].workouts[0]));
        updated1.name = 'New workout name';
        const updated2 = JSON.parse(JSON.stringify(mockCachedPrograms[1].workouts[1]));
        updated2.ordinal = 5;
        const done = assert.async();
        programBackend.updateWorkout([updated1, updated2]).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.equal(cacheUpdate.firstCall.args[0], 'program/mine');
            assert.equal(
                JSON.stringify(cacheUpdate.firstCall.args[1][0]),
                JSON.stringify(Object.assign(mockCachedPrograms[0],{workouts:[updated1]})),
                'Pitäisi päivittää treeni siihen kuuluvan ohjelman listaan'
            );
            assert.equal(
                JSON.stringify(cacheUpdate.firstCall.args[1][1]),
                JSON.stringify(Object.assign(mockCachedPrograms[1],{workouts:[mockCachedPrograms[1].workouts[0], updated2]})),
                'Pitäisi päivittää treeni siihen kuuluvan ohjelman listaan'
            );
            assert.equal(result, 2, 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('deleteWorkout poistaa ohjelmatreenin ohjelmacachesta, ja palauttaa deleteCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Poista cachen ensimmäiseen ohjelmaan kuuluva treeni
        const done = assert.async();
        programBackend.deleteWorkout(cachedProgramsCopy[0].workouts[0]).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'program/mine',
                [
                    Object.assign(mockCachedPrograms[0], {workouts: []}),
                    mockCachedPrograms[1]
                ]
            ], 'Pitäisi poistaa ohjelmatreeni ohjelmacachesta');
            assert.equal(result, 1, 'Pitäisi palauttaa deleteCount');
            done();
        });
    });
    QUnit.test('insertWorkoutExercises lisää uuden ohjelmatreeniliikkeen ohjelmacacheen, ja palauttaa insertCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newProgramWorkoutExercise = {
            ordinal: 2,
            exerciseId: 'foo',
            exerciseVariantId: null,
            programWorkoutId: mockCachedPrograms[1].workouts[0].id
        } as any;
        // Lisää liike cachen jälkimmäisen ohjelman ensimmäiseen ohjelmatreeniin
        const done = assert.async();
        programBackend.insertWorkoutExercises([newProgramWorkoutExercise]).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args[0], 'program/mine');
            const actualUpdatedCache = cacheUpdate.firstCall.args[1];
            assert.deepEqual(actualUpdatedCache[0], mockCachedPrograms[0],
                'Ei pitäisi muuttaa ensimmäistä ohjelmaa'
            );
            assert.deepEqual(actualUpdatedCache[1], Object.assign(actualUpdatedCache[1],
                {workouts: [Object.assign(mockCachedPrograms[1].workouts[0], {
                    exercises: mockCachedPrograms[1].workouts[0].exercises.concat(
                        [newProgramWorkoutExercise as any]
                    )
                })]}
            ), 'Pitäisi lisätä uusi liike ohjelmacachen oikean ohjelman oikeaan ohjelmatreeniin');
            assert.equal(result, 1, 'Pitäisi palauttaa insertCount');
            assert.equal(newProgramWorkoutExercise.id, mockNewUuid, 'Pitäisi luoda ohjelmatreenille id');
            done();
        });
    });
    QUnit.test('updateWorkoutExercise päivittää ohjelmatreeniliikkeen ohjelmacacheen, ja palauttaa updateCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newData = Object.assign({}, mockCachedPrograms[1].workouts[0].exercises[0]);
        newData.ordinal = 45;
        newData.exerciseId = 'fyy';
        // Päivitä cachen jälkimmäisen ohjelman ensimmäisen ohjelmatreenin ensimmäinen liike
        const done = assert.async();
        programBackend.updateWorkoutExercise([newData]).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args[0], 'program/mine');
            const actualUpdatedCache = cacheUpdate.firstCall.args[1];
            assert.deepEqual(actualUpdatedCache[0], mockCachedPrograms[0],
                'Ei pitäisi muuttaa ensimmäistä ohjelmaa'
            );
            assert.deepEqual(actualUpdatedCache[1], Object.assign(actualUpdatedCache[1],
                {workouts: [Object.assign(mockCachedPrograms[1].workouts[0], {
                    exercises: [newData]
                })]}
            ), 'Pitäisi päivittää ohjelmacachen oikean ohjelman oikean ohjelmatreenin oikean liikkeen tiedot');
            assert.equal(result, 1, 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('deleteWorkoutExercise poistaa ohjelmatreeniliikkeen ohjelmacachesta, ja palauttaa deleteCountin', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const deletable = mockCachedPrograms[0].workouts[0].exercises[0];
        //
        const done = assert.async();
        programBackend.deleteWorkoutExercise(deletable).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args[0], 'program/mine');
            const actualUpdatedCache = cacheUpdate.firstCall.args[1];
            assert.deepEqual(actualUpdatedCache[0], Object.assign(actualUpdatedCache[0],
                {workouts: [Object.assign(mockCachedPrograms[0].workouts[0], {exercises: []})]}
            ), 'Pitäisi poistaa liike ohjelmacachen oikean ohjelman oikeasta ohjelmatreenistä');
            assert.deepEqual(actualUpdatedCache[1], mockCachedPrograms[1],
                'Ei pitäisi muuttaa toista ohjelmaa'
            );
            assert.equal(result, 1, 'Pitäisi palauttaa deleteCount');
            done();
        });
    });
});