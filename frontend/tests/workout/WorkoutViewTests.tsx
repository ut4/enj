import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import WorkoutBackend, { Workout } from 'src/workout/WorkoutBackend';
import WorkoutView from 'src/workout/WorkoutView';
import EditableWorkout from 'src/workout/EditableWorkout';
import iocFactories from 'src/ioc';
const emptyMessageRegExp: RegExp = /Ei treenejä/;

QUnit.module('workout/WorkoutView', hooks => {
    let someTestWorkout: Enj.API.WorkoutRecord;
    let workoutBackendIocOverride: sinon.SinonStub;
    let workoutBackend: WorkoutBackend;
    hooks.beforeEach(() => {
        workoutBackend = Object.create(WorkoutBackend.prototype);
        workoutBackendIocOverride = sinon.stub(iocFactories, 'workoutBackend').returns(workoutBackend);
        someTestWorkout = {id:1, start: 2, exercises: []};
    });
    hooks.afterEach(() => {
        workoutBackendIocOverride.restore();
    });
    QUnit.test('mount hakee current-treenit backendistä ja renderöi ne', assert => {
        const currentWorkoutsFetch = sinon.stub(workoutBackend, 'getTodaysWorkouts')
            .returns(Promise.resolve([someTestWorkout]));
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
        const currentWorkoutsFetch = sinon.stub(workoutBackend, 'getTodaysWorkouts')
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
        const currentWorkoutsFetch = sinon.stub(workoutBackend, 'getTodaysWorkouts')
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
    QUnit.test('"Aloita treeni"-painike luo uuden tyhjän treenin, ja lisää sen listan alkuun', assert => {
        const workoutFetchStub = sinon.stub(workoutBackend, 'getTodaysWorkouts').returns(Promise.resolve([someTestWorkout]));
        const workoutsInsertStub = sinon.stub(workoutBackend, 'insert').returns(Promise.resolve());
        //
        const rendered = itu.renderIntoDocument(<WorkoutView/>);
        // odota, että näkymä latautuu
        const done = assert.async();
        workoutFetchStub.firstCall.returnValue.then(() => {
            const workoutsBefore = getRenderedWorkoutItems(rendered);
            const workoutCountBefore = workoutsBefore.length;
            //
            const addWorkoutButton = utils.findButtonByContent(rendered, 'Aloita uusi');
            const expectedWorkout = getExpectedNewWorkout();
            addWorkoutButton.click();
            //
            assert.ok(workoutsInsertStub, 'Pitäisi luoda treeni');
            workoutsInsertStub.firstCall.returnValue.then(() => {
                const renderedWorkoutsAfter = getRenderedWorkoutItems(rendered);
                assert.equal(renderedWorkoutsAfter.length, workoutCountBefore + 1, 'Pitäisi renderöidä uusi treeni');
                assert.deepEqual(renderedWorkoutsAfter[0].props.workout, expectedWorkout, 'Pitäisi lisätä treeni listan alkuun');
                assert.deepEqual(renderedWorkoutsAfter[1].props.workout, someTestWorkout, 'Initial treeni pitäisi olla nyt listan 2.');
                done();
            });
        });
    });
    function getRenderedWorkoutItems(rendered) {
        return itu.scryRenderedVNodesWithType(rendered, EditableWorkout);
    }
    function getExpectedNewWorkout() {
        const workout = new Workout();
        workout.start = Math.floor(new Date().getTime() / 1000);
        workout.end = 0;
        workout.exercises = [];
        return workout;
    }
});
