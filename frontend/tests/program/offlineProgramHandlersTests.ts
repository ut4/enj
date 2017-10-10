import QUnit from 'qunitjs';
import sinon from 'sinon';
import Offline from 'src/offline/Offline';
import ProgramBackend from 'src/program/ProgramBackend';
import OfflineProgramHandlerRegister from 'src/program/OfflineProgramHandlerRegister';
import ptu from 'tests/program/utils';

QUnit.module('program/offlineProgramHandlers', hooks => {
    let shallowOffline: Offline;
    let mockNewUuid: AAGUID = 'uuid90';
    let shallowProgramBackend: ProgramBackend;
    let programHandlerRegister: OfflineProgramHandlerRegister;
    let mockCachedPrograms: Array<Enj.API.ProgramRecord>;
    hooks.beforeEach(() => {
        shallowOffline = Object.create(Offline.prototype);
        shallowProgramBackend = Object.create(ProgramBackend.prototype);
        (shallowProgramBackend as any).urlNamespace = 'program';
        shallowProgramBackend.utils = {uuidv4: () => mockNewUuid};
        programHandlerRegister = new OfflineProgramHandlerRegister(shallowOffline, shallowProgramBackend);
        mockCachedPrograms = ptu.getSomeTestPrograms();
    });
    QUnit.test('insert lisää uuden ohjelman cacheen, ja palauttaa insertCount:n', assert => {
        const cachedProgramsCopy = JSON.parse(JSON.stringify(mockCachedPrograms));
        sinon.stub(shallowProgramBackend, 'getAll').returns(Promise.resolve(cachedProgramsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newProgram = {name: 'foo'} as any;
        //
        const done = assert.async();
        programHandlerRegister.insert(newProgram, '/mine').then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'program/mine',
                [newProgram].concat(mockCachedPrograms as any)
            ], 'Pitäisi lisätä uusi ohjelma cacheen');
            assert.equal(result, JSON.stringify({insertCount: 1, insertId: mockNewUuid}), 'Pitäisi palauttaa insertCount');
            assert.equal(newProgram.id, mockNewUuid, 'Pitäisi luoda ohjelmalle id');
            done();
        });
    });
    QUnit.test('update päivittää ohjelman cacheen, ja palauttaa updateCount:n', assert => {
        const cachedProgramsCopy = JSON.parse(JSON.stringify(mockCachedPrograms));
        sinon.stub(shallowProgramBackend, 'getAll').returns(Promise.resolve(cachedProgramsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Tee jotain muutoksia
        const updatedProgram = Object.assign({}, cachedProgramsCopy[0]);
        updatedProgram.name = 'sss';
        // Päivitä kumpikin
        const done = assert.async();
        programHandlerRegister.update(updatedProgram, '/mine').then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'program/mine',
                [updatedProgram, mockCachedPrograms[1]]
            ], 'Pitäisi päivittää ohjelma cacheen');
            assert.equal(result, JSON.stringify({updateCount: 1}), 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('delete poistaa ohjelman ohjelmacachesta, ja palauttaa deleteCount:n', assert => {
        const cachedProgramsCopy = JSON.parse(JSON.stringify(mockCachedPrograms));
        sinon.stub(shallowProgramBackend, 'getAll').returns(Promise.resolve(cachedProgramsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Poista cachen ensimmäinen ohjelma
        const done = assert.async();
        programHandlerRegister.delete(cachedProgramsCopy[0].id, '/mine').then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'program/mine',
                [mockCachedPrograms[1]]
            ], 'Pitäisi poistaa ohjelma ohjelmacachesta');
            assert.equal(result, JSON.stringify({deleteCount: 1}), 'Pitäisi palauttaa deleteCount');
            done();
        });
    });
    QUnit.test('insertWorkouts lisää uuden ohjelmatreenin ohjelmacacheen, ja palauttaa insertCount:n', assert => {
        const cachedProgramsCopy = JSON.parse(JSON.stringify(mockCachedPrograms));
        sinon.stub(shallowProgramBackend, 'getAll').returns(Promise.resolve(cachedProgramsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newProgramWorkout = {id: null, name: 'foo', programId: cachedProgramsCopy[1].id};
        // Lisää ohjelmatreeni cachen jälkimmäiseen ohjelmaan
        const done = assert.async();
        programHandlerRegister.insertWorkouts([newProgramWorkout] as any).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'program/mine',
                [mockCachedPrograms[0], Object.assign(mockCachedPrograms[1], {
                    workouts: mockCachedPrograms[1].workouts.concat([newProgramWorkout] as any)
                })]
            ], 'Pitäisi lisätä uusi ohjelmatreeni ohjelmacachen oikeaan ohjelmaan');
            assert.equal(result, JSON.stringify({insertCount: 1, insertIds: [mockNewUuid]}), 'Pitäisi palauttaa insertCount');
            assert.equal(newProgramWorkout.id, mockNewUuid, 'Pitäisi luoda ohjelmatreenille id');
            done();
        });
    });
    QUnit.test('updateWorkouts päivittää ohjelmatreenit ohjelmacacheen, ja palauttaa updateCount:n', assert => {
        //
        const mockCachedProgramsCopy = JSON.parse(JSON.stringify(mockCachedPrograms));
        //
        sinon.stub(shallowProgramBackend, 'getAll').returns(Promise.resolve(mockCachedProgramsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Suorita jotain muutoksia
        const updated1 = JSON.parse(JSON.stringify(mockCachedProgramsCopy[0].workouts[0]));
        updated1.name = 'New workout name';
        const updated2 = JSON.parse(JSON.stringify(mockCachedProgramsCopy[1].workouts[1]));
        updated2.ordinal = 5;
        //
        const done = assert.async();
        programHandlerRegister.updateWorkouts([updated2, updated1]).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.equal(cacheUpdate.firstCall.args[0], 'program/mine');
            assert.equal(
                JSON.stringify(cacheUpdate.firstCall.args[1][0]),
                JSON.stringify(Object.assign(mockCachedPrograms[0],{workouts:[updated1]})),
                'Pitäisi päivittää treeni siihen kuuluvan ohjelman listaan'
            );
            assert.equal(
                JSON.stringify(cacheUpdate.firstCall.args[1][1]),
                JSON.stringify(Object.assign(mockCachedPrograms[1],{workouts:[mockCachedProgramsCopy[1].workouts[0], updated2]})),
                'Pitäisi päivittää treeni siihen kuuluvan ohjelman listaan'
            );
            assert.equal(result, JSON.stringify({updateCount: 2}), 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('deleteWorkout poistaa ohjelmatreenin ohjelmacachesta, ja palauttaa deleteCount:n', assert => {
        const cachedProgramsCopy = JSON.parse(JSON.stringify(mockCachedPrograms));
        sinon.stub(shallowProgramBackend, 'getAll').returns(Promise.resolve(cachedProgramsCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Poista cachen ensimmäiseen ohjelmaan kuuluva treeni
        const done = assert.async();
        programHandlerRegister.deleteWorkout(cachedProgramsCopy[0].workouts[0].id).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'program/mine',
                [
                    Object.assign(mockCachedPrograms[0], {workouts: []}),
                    mockCachedPrograms[1]
                ]
            ], 'Pitäisi poistaa ohjelmatreeni ohjelmacachesta');
            assert.equal(result, JSON.stringify({deleteCount: 1}), 'Pitäisi palauttaa deleteCount');
            done();
        });
    });
});