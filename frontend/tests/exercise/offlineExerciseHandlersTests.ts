import QUnit from 'qunitjs';
import sinon from 'sinon';
import Offline from 'src/offline/Offline';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import OfflineExerciseHandlerRegister from 'src/exercise/OfflineExerciseHandlerRegister';

QUnit.module('exercise/offlineExerciseHandlers', hooks => {
    let shallowOffline: Offline;
    let mockNewUuid: AAGUID = 'uuid90';
    let shallowExerciseBackend: ExerciseBackend;
    let exerciseHandlerRegister: OfflineExerciseHandlerRegister;
    let mockCachedExercises: Array<Enj.API.Exercise>;
    hooks.beforeEach(() => {
        shallowOffline = Object.create(Offline.prototype);
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        (shallowExerciseBackend as any).urlNamespace = 'exercise';
        shallowExerciseBackend.utils = {uuidv4: () => mockNewUuid};
        exerciseHandlerRegister = new OfflineExerciseHandlerRegister(shallowOffline, shallowExerciseBackend);
        mockCachedExercises = [
            {id: 'someuuid1', name: 'exs', variants: [], userId: 'someuuid101'},
            {id: 'someuuid2', name: 'exs2', variants: [
                {id: 'someuuid10', content: 'var', exerciseId: 'someuuid2', userId: 'someuuid101'},
                {id: 'someuuid11', content: 'sar', exerciseId: 'someuuid2', userId: 'someuuid101'}
            ], userId: 'someuuid101'}
        ];
    });
    QUnit.test('insert lisää uuden liikkeen cacheen, ja palauttaa insertResponse:n', assert => {
        const cachedExercisesCopy = JSON.parse(JSON.stringify(mockCachedExercises));
        sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(cachedExercisesCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newExercise = {name: 'foo'} as any;
        //
        const done = assert.async();
        exerciseHandlerRegister.insert(newExercise).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'exercise',
                [newExercise].concat(mockCachedExercises as any)
            ], 'Pitäisi lisätä uusi liike cacheen');
            assert.equal(result, JSON.stringify({insertCount: 1, insertId: mockNewUuid}), 'Pitäisi palauttaa insertResponse');
            assert.equal(newExercise.id, mockNewUuid, 'Pitäisi luoda liikkeelle id');
            done();
        });
    });
    QUnit.test('update päivittää liikkeen cacheen, ja palauttaa updateResponse:n', assert => {
        const cachedExercisesCopy = JSON.parse(JSON.stringify(mockCachedExercises));
        sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(cachedExercisesCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Tee jotain muutoksia
        const updatedExercise = Object.assign({}, cachedExercisesCopy[0]);
        updatedExercise.name = 'sss';
        // Päivitä kumpikin
        const done = assert.async();
        exerciseHandlerRegister.update(updatedExercise).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'exercise',
                [updatedExercise, mockCachedExercises[1]]
            ], 'Pitäisi päivittää liike cacheen');
            assert.equal(result, JSON.stringify({updateCount: 1}), 'Pitäisi palauttaa updateResponse');
            done();
        });
    });
    QUnit.test('delete poistaa liikkeen liikecachesta, ja palauttaa deleteResponse:n', assert => {
        const cachedExercisesCopy = JSON.parse(JSON.stringify(mockCachedExercises));
        sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(cachedExercisesCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const testExercise = mockCachedExercises[0];
        // Poista cachen ensimmäinen liike
        const done = assert.async();
        exerciseHandlerRegister.delete(testExercise.id).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'exercise',
                [
                    // Tämä olisi pitänyt lähteä liikenteeseen
                    mockCachedExercises[1]
                ]
            ], 'Pitäisi poistaa ensimmäinen liike');
            assert.equal(result, JSON.stringify({deleteCount: 1}), 'Pitäisi palauttaa deleteResponse');
            done();
        });
    });
    QUnit.test('insertVariant lisää variantin liikecacheen, ja palauttaa insertResponse:n', assert => {
        const cachedExercisesCopy = JSON.parse(JSON.stringify(mockCachedExercises));
        sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(cachedExercisesCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newExerciseVariant: Enj.API.ExerciseVariant = {
            content: 'rte',
            exerciseId: cachedExercisesCopy[1].id,
            userId: 'u'
        };
        // Lisää variantti cachen jälkimmäiseen itemiin
        const done = assert.async();
        exerciseHandlerRegister.insertVariant(newExerciseVariant).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'exercise',
                [mockCachedExercises[0], Object.assign(mockCachedExercises[1], {
                    variants: mockCachedExercises[1].variants.concat([newExerciseVariant])
                })]
            ], 'Pitäisi lisätä uusi variantti liikecachen oikeaan itemiin');
            assert.equal(result, JSON.stringify({insertCount: 1, insertId: mockNewUuid}), 'Pitäisi palauttaa insertResponse');
            assert.equal(newExerciseVariant.id, mockNewUuid, 'Pitäisi luoda variantille id');
            done();
        });
    });
    QUnit.test('updateVariant päivittää variantin liikecacheen, ja palauttaa updateResponse:n', assert => {
        const cachedExercisesCopy = JSON.parse(JSON.stringify(mockCachedExercises));
        sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(cachedExercisesCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const testVariant = Object.assign({}, mockCachedExercises[1].variants[1]);
        testVariant.content = 'wewe';
        // Päivitä cachen jälkimmäisen liikkeen jälkimmäinen variantti
        const done = assert.async();
        exerciseHandlerRegister.updateVariant(testVariant).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'exercise',
                [mockCachedExercises[0], Object.assign(mockCachedExercises[1], {
                    variants: [
                        mockCachedExercises[1].variants[0],
                        Object.assign(mockCachedExercises[1].variants[1], testVariant)
                    ]
                })]
            ], 'Pitäisi päivittää variantti oikeaan itemiin');
            assert.equal(result, JSON.stringify({updateCount: 1}), 'Pitäisi palauttaa updateResponse');
            done();
        });
    });
    QUnit.test('deleteVariant poistaa variantin liikecachesta, ja palauttaa deleteResponse:n', assert => {
        const cachedExercisesCopy = JSON.parse(JSON.stringify(mockCachedExercises));
        sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(cachedExercisesCopy));
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const testVariant = mockCachedExercises[1].variants[1];
        // Poista cachen jälkimmäisen liikkeen jälkimmäinen variantti
        const done = assert.async();
        exerciseHandlerRegister.deleteVariant(testVariant.id).then(result => {
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'exercise',
                [mockCachedExercises[0], Object.assign(mockCachedExercises[1], {
                    variants: [
                        mockCachedExercises[1].variants[0]
                        // Tämä olisi pitänyt lähteä liikenteeseen
                    ]
                })]
            ], 'Pitäisi poistaa variantti oikeasta itemistä');
            assert.equal(result, JSON.stringify({deleteCount: 1}), 'Pitäisi palauttaa deleteResponse');
            done();
        });
    });
});