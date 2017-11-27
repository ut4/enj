import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import Modal from 'src/ui/Modal';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import ExerciseView from 'src/exercise/ExerciseView';
import iocFactories from 'src/ioc';
import UserState from 'src/user/UserState';
const emptyMessageRegExp: RegExp = /Ei liikkeitä/;
const someUserId = 'uuid34';

QUnit.module('exercise/ExerciseView', hooks => {
    let someTestExercises: Array<Enj.API.Exercise>;
    let shallowExerciseBackend: ExerciseBackend;
    let exerciseBackendIocOverride: sinon.SinonStub;
    let shallowUserState: UserState;
    let userStateIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(shallowExerciseBackend);
        shallowUserState = Object.create(UserState.prototype);
        sinon.stub(shallowUserState, 'getUserId').returns(Promise.resolve('u'));
        userStateIocOverride = sinon.stub(iocFactories, 'userState').returns(shallowUserState);
        someTestExercises = [
            {id:'uuid1', name: 'aaa', variants: [], userId: 'u'},
            {id:'uuid2', name: 'bbb', variants: [
                {id: 'uuid20', content: 'naz', exerciseId: 'uuid2', userId: 'u'},
                {id: 'uuid21', content: 'gas', exerciseId: 'uuid2', userId: 'u'}
            ], userId: 'u'},
            {id:'uuid3', name: 'ccc', variants: [
                {id: 'uuid22', content: 'frt', exerciseId: 'uuid3', userId: 'u'},
                {id: 'uuid23', content: 'global', exerciseId: 'uuid3', userId: null}
            ], userId: 'u'}
        ];
    });
    hooks.afterEach(() => {
        exerciseBackendIocOverride.restore();
        userStateIocOverride.restore();
    });
    function renderView(assert, exercises: Array<Enj.API.Exercise>, then: Function) {
        const exercisesFetch = sinon.stub(shallowExerciseBackend, 'getAll')
            .returns(Promise.resolve(exercises));
        //
        const rendered = itu.renderIntoDocument(<div><Modal/><ExerciseView/></div>);
        //
        const done = assert.async();
        exercisesFetch.firstCall.returnValue.then(()=>{}).then(() => {
            const promise = then(rendered);
            !promise ? done() : promise.then(() => done());
        });
    }
    QUnit.test('mount hakee liikkeet backendistä ja renderöi ne', assert => {
        renderView(assert, someTestExercises, rendered => {
            const exerciseListItems = getRenderedExerciseItems(rendered);
            assert.equal(exerciseListItems.length, 3);
            assert.equal(exerciseListItems[0].textContent, getExpectedTrContent(someTestExercises[0]));
            assert.equal(exerciseListItems[1].textContent, getExpectedTrContent(someTestExercises[1]));
            assert.equal(exerciseListItems[2].textContent, getExpectedTrContent(someTestExercises[2]));
        });
    });
    QUnit.test('mount näyttää viestin mikäli current-treenejä ei löydy', assert => {
        renderView(assert, [], rendered => {
            const exerciseListItems = getRenderedExerciseItems(rendered);
            assert.equal(exerciseListItems.length, 0);
            const rootElem = itu.scryRenderedDOMElementsWithTag(rendered, 'div')[0];
            assert.ok(emptyMessageRegExp.test(rootElem.innerHTML));
        });
    });
    QUnit.test('"Poista"(liike)-linkistä avautuvan modalin hyväksyminen poistaa liikkeen ja renderöi sen näkymästä', assert => {
        const exerciseDeleteStub = sinon.stub(shallowExerciseBackend, 'delete')
            .returns(Promise.resolve(1));
        const exercisesBefore = someTestExercises.slice(0);
        renderView(assert, someTestExercises, rendered => {
            let renderedExercises = getRenderedExerciseItems(rendered);
            const renderedItemCountBefore = renderedExercises.length;
            // Avaa & hyväksy liikkeen poistomodal
            const exerciseDeleteLink = renderedExercises[0].querySelector('a:last-of-type') as HTMLAnchorElement;
            exerciseDeleteLink.click();
            utils.findButtonByContent(rendered, 'Ok').click();
            // Lähettikö liikkeen backendiin poistettavaksi?
            assert.ok(exerciseDeleteStub.calledOnce);
            const expectedExercise = someTestExercises[0];
            assert.deepEqual(exerciseDeleteStub.firstCall.args, [expectedExercise]);
            return exerciseDeleteStub.firstCall.returnValue.then(() => {
                // Renderöikö poistetun liikkeen näkymästä?
                renderedExercises = getRenderedExerciseItems(rendered);
                assert.equal(renderedExercises.length, renderedItemCountBefore - 1);
                assert.equal(renderedExercises[0].textContent, getExpectedTrContent(exercisesBefore[1]));
            });
        });
    });
    QUnit.test('"Poista"(variantti)-linkistä avautuvan modalin hyväksyminen poistaa variantin ja renderöi sen näkymästä', assert => {
        const exerciseVariantDeleteStub = sinon.stub(shallowExerciseBackend, 'deleteVariant')
            .returns(Promise.resolve(1));
        const variantsBefore = someTestExercises[1].variants.slice(0);
        renderView(assert, someTestExercises, rendered => {
            const renderedVariants = getRenderedExerciseItems(rendered)[1].querySelector('ul').children;
            const renderedItemCountBefore = renderedVariants.length;
            // Avaa & hyväksy variantin poistomodal
            const variantDeleteLink = renderedVariants[0].querySelector('a:last-of-type') as HTMLAnchorElement;
            variantDeleteLink.click();
            utils.findButtonByContent(rendered, 'Ok').click();
            // Lähettikö variantin backendiin poistettavaksi?
            assert.ok(exerciseVariantDeleteStub.calledOnce);
            const expectedExerciseVariant = someTestExercises[1].variants[0];
            assert.deepEqual(exerciseVariantDeleteStub.firstCall.args, [expectedExerciseVariant]);
            return exerciseVariantDeleteStub.firstCall.returnValue.then(() => {
                // Renderöikö poistetun variantin näkymästä?
                assert.equal(renderedVariants.length, renderedItemCountBefore - 1);
                assert.equal(renderedVariants[0].textContent, joinVariants([variantsBefore[1]]));
            });
        });
    });
    function getRenderedExerciseItems(rendered) {
        return itu.scryRenderedDOMElementsWithTag(rendered, 'tr').slice(1); // thead pois
    }
    function getExpectedTrContent(exs: Enj.API.Exercise): string {
        return `${exs.name}${joinVariants(exs.variants)}MuokkaaPoista`;
    }
    function joinVariants(variants: Array<Enj.API.ExerciseVariant>): string {
        return variants.length
            ? variants
                .filter(v => v.userId !== null) // Ei pitäisi sisältää globaaleja liikkeitä
                .map(v => v.content).join('')
            : '-';
    }
});
