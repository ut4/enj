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
            assert.equal(result, JSON.stringify({insertCount: 1}), 'Pitäisi palauttaa insertCount');
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
});