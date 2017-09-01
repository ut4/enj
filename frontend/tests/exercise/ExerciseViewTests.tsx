import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import ExerciseView from 'src/exercise/ExerciseView';
import iocFactories from 'src/ioc';
const emptyMessageRegExp: RegExp = /Ei liikkeitä/;
const someUserId = 'uuid34';

QUnit.module('exercise/ExerciseView', hooks => {
    let someTestExercises: Array<Enj.API.ExerciseRecord>;
    let exerciseBackendIocOverride: sinon.SinonStub;
    let shallowExerciseBackend: ExerciseBackend;
    hooks.beforeEach(() => {
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(shallowExerciseBackend);
        someTestExercises = [
            {id:'uuid1', name: 'foo', variants: []},
            {id:'uuid2', name: 'bar', variants: [
                {id: 'uuid20', content: 'naz', exerciseId: 'uuid2'},
                {id: 'uuid21', content: 'gas', exerciseId: 'uuid2'}
            ]},
            {id:'uuid3', name: 'baz', variants: [
                {id: 'uuid22', content: 'frt', exerciseId: 'uuid3'}
            ]}
        ];
    });
    hooks.afterEach(() => {
        exerciseBackendIocOverride.restore();
    });
    QUnit.test('mount hakee liikkeet backendistä ja renderöi ne', assert => {
        const todaysExercisesFetch = sinon.stub(shallowExerciseBackend, 'getAll')
            .returns(Promise.resolve(someTestExercises));
        //
        const rendered = itu.renderIntoDocument(<ExerciseView/>);
        //
        const done = assert.async();
        todaysExercisesFetch.firstCall.returnValue.then(() => {
            const exerciseListItems = getRenderedExerciseItems(rendered);
            assert.equal(exerciseListItems.length, 3);
            assert.equal(exerciseListItems[0].textContent, getExpectedTrContent(someTestExercises[0]));
            assert.equal(exerciseListItems[1].textContent, getExpectedTrContent(someTestExercises[1]));
            assert.equal(exerciseListItems[2].textContent, getExpectedTrContent(someTestExercises[2]));
            done();
        });
    });
    QUnit.test('mount näyttää viestin mikäli current-treenejä ei löydy', assert => {
        const exercisesFetch = sinon.stub(shallowExerciseBackend, 'getAll')
            .returns(Promise.resolve([]));
        //
        const rendered = itu.renderIntoDocument(<ExerciseView/>);
        //
        const done = assert.async();
        exercisesFetch.firstCall.returnValue.then(() => {
            const exerciseListItems = getRenderedExerciseItems(rendered);
            assert.equal(exerciseListItems.length, 0);
            const rootElem = itu.scryRenderedDOMElementsWithTag(rendered, 'div')[0];
            assert.ok(emptyMessageRegExp.test(rootElem.innerHTML));
            done();
        });
    });
    function getRenderedExerciseItems(rendered) {
        return itu.scryRenderedDOMElementsWithTag(rendered, 'tr').slice(1);
    }
    function getExpectedTrContent(exs: Enj.API.ExerciseRecord): string {
        return `${exs.name}${joinVariants(exs.variants)}MuokkaaPoista`;
    }
    function joinVariants(variants: Array<Enj.API.ExerciseVariantRecord>): string {
        return variants.length ? variants.map(v=>v.content).join(', ') : '-';
    }
});
