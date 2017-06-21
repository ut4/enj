import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import WorkoutBackend from 'src/workout/WorkoutBackend';
import WorkoutView from 'src/workout/WorkoutView';
import EditableWorkout from 'src/workout/EditableWorkout';
import iocFactories from 'src/ioc';
const emptyMessageRegExp: RegExp = /Ei treenejä/;

QUnit.module('workout/WorkoutView', hooks => {
    let workoutBackendIocOverride: sinon.SinonStub;
    let workoutBackend: WorkoutBackend;
    hooks.beforeEach(() => {
        workoutBackend = Object.create(WorkoutBackend.prototype);
        workoutBackendIocOverride = sinon.stub(iocFactories, 'workoutBackend').returns(workoutBackend);
    });
    hooks.afterEach(() => {
        workoutBackendIocOverride.restore();
    });
    QUnit.test('mount hakee current-treenit backendistä ja renderöi ne', assert => {
        const currentWorkoutsFetch = sinon.stub(workoutBackend, 'getAll')
            .returns(Promise.resolve([{id:1, start: 2, exercises: []}]));
        //
        const rendered = itu.renderIntoDocument(<WorkoutView/>);
        //
        const done = assert.async();
        currentWorkoutsFetch.firstCall.returnValue.then(() => {
            const currentWorkoutListItems = getRenderedWorkoutItems(rendered);
            assert.equal(currentWorkoutListItems.length, 1);
            done();
        });
    });
    QUnit.test('mount näyttää viestin mikäli current-treenejä ei löydy', assert => {
        const currentWorkoutsFetch = sinon.stub(workoutBackend, 'getAll')
            .returns(Promise.resolve([]));
        //
        const rendered = itu.renderIntoDocument(<WorkoutView/>);
        //
        const done = assert.async();
        currentWorkoutsFetch.firstCall.returnValue.then(() => {
            const currentWorkoutListItems = getRenderedWorkoutItems(rendered);
            assert.equal(currentWorkoutListItems.length, 0);
            const rootElem = itu.scryRenderedDOMElementsWithTag(rendered, 'div')[0];
            assert.ok(emptyMessageRegExp.test(rootElem.innerHTML));
            done();
        });
    });
    QUnit.test('mount handlaa epäonnistuneen current-treenien haun', assert => {
        const currentWorkoutsFetch = sinon.stub(workoutBackend, 'getAll')
            .returns(Promise.reject({err: 'fo'}));
        //
        const rendered = itu.renderIntoDocument(<WorkoutView/>);
        // Assertoi että initial render on tyhjä
        const rootElem = itu.scryRenderedDOMElementsWithTag(rendered, 'div')[0];
        assert.equal(emptyMessageRegExp.test(rootElem.innerHTML), false);
        // Assertoi että thenin jälkeinen render ei ole tyhjä
        const done = assert.async();
        currentWorkoutsFetch.firstCall.returnValue.then(null, () => {
            const currentWorkoutListItems = getRenderedWorkoutItems(rendered);
            assert.equal(currentWorkoutListItems.length, 0);
            assert.ok(emptyMessageRegExp.test(rootElem.innerHTML));
            done();
        });
    });
    function getRenderedWorkoutItems(rendered) {
        return itu.scryRenderedVNodesWithType(rendered, EditableWorkout);
    }
});
