import QUnit from 'qunitjs';
import sinon from 'sinon';
import Offline from 'src/offline/Offline';
import ExerciseBackend, { Exercise } from 'src/exercise/ExerciseBackend';
import OfflineExerciseHandlerRegister from 'src/exercise/OfflineExerciseHandlerRegister';

QUnit.module('exercise/offlineExerciseHandlers', hooks => {
    let shallowOffline: Offline;
    let mockNewUuid: AAGUID = 'uuid90';
    let shallowExerciseBackend: ExerciseBackend;
    let exerciseHandlerRegister: OfflineExerciseHandlerRegister;
    let mockCachedExercises: Array<Enj.API.ExerciseRecord>;
    hooks.beforeEach(() => {
        shallowOffline = Object.create(Offline.prototype);
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        (shallowExerciseBackend as any).urlNamespace = 'exercise';
        shallowExerciseBackend.utils = {uuidv4: () => mockNewUuid};
        exerciseHandlerRegister = new OfflineExerciseHandlerRegister(shallowOffline, shallowExerciseBackend);
        mockCachedExercises = [
            {id: 'someuuid1', name: 'exs', variants: [], userId: 'someuuid101'},
            {id: 'someuuid2', name: 'exs2', variants: [
                {id: 'someuuid10', content: 'var', exerciseId: 'someuuid20', userId: 'someuuid101'}
            ], userId: 'someuuid101'}
        ];
    });
    QUnit.test('insert lisää uuden liikkeen cacheen, ja palauttaa insertCount:n', assert => {
        const cachedExercisesCopy = JSON.parse(JSON.stringify(mockCachedExercises));
        sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(cachedExercisesCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newExercise = new Exercise();
        //
        const done = assert.async();
        exerciseHandlerRegister.insert(newExercise).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'exercise',
                [newExercise].concat(mockCachedExercises as any)
            ], 'Pitäisi päivittää cache uudella liikkeellä varustettuna');
            assert.equal(result, JSON.stringify({insertCount: 1}), 'Pitäisi palauttaa insertCount');
            assert.equal(newExercise.id, mockNewUuid, 'Pitäisi luoda treenille id');
            done();
        });
    });
});