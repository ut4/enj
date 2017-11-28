import QUnit from 'qunitjs';
import sinon from 'sinon';
import UserState from 'src/user/UserState';
import Offline from 'src/offline/Offline';
import Http from 'src/common/Http';
import OfflineHttp from 'src/common/OfflineHttp';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import ExerciseOfflineHandlers from 'src/exercise/OfflineHandlers';

QUnit.module('exercise/OfflineHandlers', hooks => {
    let shallowOffline: Offline;
    let shallowOfflineHttp: OfflineHttp;
    let fetchContainer: GlobalFetch = window;
    let exerciseBackend: ExerciseBackend;
    let mockCachedExercises: Array<Enj.API.Exercise>;
    let cachedExercisesCopy: Array<Enj.API.Exercise>;
    let mockNewUuid: AAGUID = 'uuid90';
    // beforeAll
    const shallowUserState: UserState = Object.create(UserState.prototype);
    sinon.stub(shallowUserState, 'isOffline').returns(Promise.resolve(true));
    //
    hooks.beforeEach(() => {
        shallowOffline = Object.create(Offline.prototype);
        shallowOfflineHttp = Object.create(OfflineHttp.prototype);
        sinon.stub(shallowOfflineHttp, 'logRequestToSyncQueue').returns(Promise.resolve());
        exerciseBackend = new ExerciseBackend(new Http(fetchContainer, shallowOfflineHttp, shallowUserState, '/'), 'exercise');
        exerciseBackend.utils.uuidv4 = () => mockNewUuid;
        const exerciseHandlerRegister = new ExerciseOfflineHandlers(shallowOffline, exerciseBackend);
        exerciseHandlerRegister.registerHandlers(shallowOfflineHttp);
        mockCachedExercises = [
            {id: 'someuuid1', name: 'exs', variants: [], userId: 'someuuid101'},
            {id: 'someuuid2', name: 'gxs', variants: [
                {id: 'someuuid10', content: 'var', exerciseId: 'someuuid2', userId: 'someuuid101'},
                {id: 'someuuid11', content: 'sar', exerciseId: 'someuuid2', userId: 'someuuid101'}
            ], userId: 'someuuid101'}
        ];
        cachedExercisesCopy = JSON.parse(JSON.stringify(mockCachedExercises));
        sinon.stub(exerciseBackend, 'getAll').returns(Promise.resolve(cachedExercisesCopy));
    });
    QUnit.test('insert lisää uuden liikkeen offline-cacheen aakkosjärjestyksen mukaiseen positioon, ja palauttaa insertResponse:n', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newExercise = {name: 'foo'} as any;
        //
        const done = assert.async();
        exerciseBackend.insert(newExercise).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää offline-cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'exercise',
                [
                    mockCachedExercises[0], // (e)xs
                    newExercise,            // (f)oo
                    mockCachedExercises[1]  // (g)xs
                ]
            ], 'Pitäisi lisätä uusi liike cacheen');
            assert.equal(result, 1, 'Pitäisi palauttaa insertCount');
            assert.equal(newExercise.id, mockNewUuid, 'Pitäisi luoda liikkeelle id');
            done();
        });
    });
    QUnit.test('update päivittää liikkeen cacheen, siirtää sen aakkosjärjestyksen mukaiseen positioon, ja palauttaa updateResponse:n', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        // Tee jotain muutoksia
        const updatedExercise = Object.assign({}, cachedExercisesCopy[0]);
        updatedExercise.name = 'sss';
        // Päivitä
        const done = assert.async();
        exerciseBackend.update(updatedExercise, '/' + updatedExercise.id).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'exercise',
                [
                    mockCachedExercises[1], // (g)xs
                    updatedExercise         // (s)ss
                ]
            ], 'Pitäisi päivittää liike cacheen');
            assert.equal(result, 1, 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('delete poistaa liikkeen liikecachesta, ja palauttaa deleteResponse:n', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const testExercise = mockCachedExercises[0];
        // Poista cachen ensimmäinen liike
        const done = assert.async();
        exerciseBackend.delete(testExercise).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'exercise',
                [
                    // Tämä olisi pitänyt lähteä liikenteeseen
                    mockCachedExercises[1]
                ]
            ], 'Pitäisi poistaa ensimmäinen liike');
            assert.equal(result, 1, 'Pitäisi palauttaa deleteCount');
            done();
        });
    });
    QUnit.test('insertVariant lisää variantin liikecacheen, ja palauttaa insertResponse:n', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const newExerciseVariant: Enj.API.ExerciseVariant = {
            content: 'rte',
            exerciseId: cachedExercisesCopy[1].id,
            userId: 'u'
        };
        // Lisää variantti cachen jälkimmäiseen itemiin
        const done = assert.async();
        exerciseBackend.insertVariant(newExerciseVariant).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
            assert.ok(cacheUpdate.called, 'Pitäisi päivittää cache');
            assert.deepEqual(cacheUpdate.firstCall.args, [
                'exercise',
                [mockCachedExercises[0], Object.assign(mockCachedExercises[1], {
                    variants: mockCachedExercises[1].variants.concat([newExerciseVariant])
                })]
            ], 'Pitäisi lisätä uusi variantti liikecachen oikeaan itemiin');
            assert.equal(result, 1, 'Pitäisi palauttaa insertCount');
            assert.equal(newExerciseVariant.id, mockNewUuid, 'Pitäisi luoda variantille id');
            done();
        });
    });
    QUnit.test('updateVariant päivittää variantin liikecacheen, ja palauttaa updateResponse:n', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const testVariant = Object.assign({}, mockCachedExercises[1].variants[1]);
        testVariant.content = 'wewe';
        // Päivitä cachen jälkimmäisen liikkeen jälkimmäinen variantti
        const done = assert.async();
        exerciseBackend.updateVariant(testVariant, '/' + testVariant.id).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
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
            assert.equal(result, 1, 'Pitäisi palauttaa updateCount');
            done();
        });
    });
    QUnit.test('deleteVariant poistaa variantin liikecachesta, ja palauttaa deleteResponse:n', assert => {
        const realHttpCallSpy = sinon.spy(fetchContainer.fetch);
        const offlineHttpCallSpy = sinon.spy(shallowOfflineHttp, 'handle');
        const cacheUpdate = sinon.stub(shallowOffline, 'updateCache').returns(Promise.resolve());
        const testVariant = mockCachedExercises[1].variants[1];
        // Poista cachen jälkimmäisen liikkeen jälkimmäinen variantti
        const done = assert.async();
        exerciseBackend.deleteVariant(testVariant).then(result => {
            assert.ok(realHttpCallSpy.notCalled, 'Ei saisi kutsua window.fetch:iä');
            assert.ok(offlineHttpCallSpy.calledOnce, 'Pitäisi ohjata pyyntö offlineHttp:lle');
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
            assert.equal(result, 1, 'Pitäisi palauttaa deleteCount');
            done();
        });
    });
});