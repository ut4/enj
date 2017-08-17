import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import WorkoutBackend, { Workout } from 'src/workout/WorkoutBackend';
import WorkoutView from 'src/workout/WorkoutView';
import EditableWorkout from 'src/workout/EditableWorkout';
import Datepicker from 'src/ui/Datepicker';
import iocFactories from 'src/ioc';
const emptyMessageRegExp: RegExp = /Ei treenejä/;
const someUserId = 'uuid56';

QUnit.module('workout/WorkoutView', hooks => {
    let someTestWorkouts: Array<Enj.API.WorkoutRecord>;
    let workoutBackendIocOverride: sinon.SinonStub;
    let shallowWorkoutBackend: WorkoutBackend;
    hooks.beforeEach(() => {
        shallowWorkoutBackend = Object.create(WorkoutBackend.prototype);
        workoutBackendIocOverride = sinon.stub(iocFactories, 'workoutBackend').returns(shallowWorkoutBackend);
        someTestWorkouts = [
            {id:'uuid1', start: 1, exercises: [], userId: 'uuid2'},
            {id:'uuid2', start: 2, exercises: [], userId: 'uuid2'}
        ];
    });
    hooks.afterEach(() => {
        workoutBackendIocOverride.restore();
    });
    QUnit.test('mount hakee current-treenit backendistä ja renderöi ne', assert => {
        const todaysWorkoutsFetch = sinon.stub(shallowWorkoutBackend, 'getDaysWorkouts')
            .returns(Promise.resolve(someTestWorkouts));
        //
        const rendered = itu.renderIntoDocument(<WorkoutView/>);
        //
        const done = assert.async();
        todaysWorkoutsFetch.firstCall.returnValue.then(() => {
            const currentWorkoutListItems = getRenderedWorkoutItems(rendered);
            assert.equal(currentWorkoutListItems.length, 2);
            done();
        });
    });
    QUnit.test('mount näyttää viestin mikäli current-treenejä ei löydy', assert => {
        const currentWorkoutsFetch = sinon.stub(shallowWorkoutBackend, 'getDaysWorkouts')
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
        const currentWorkoutsFetch = sinon.stub(shallowWorkoutBackend, 'getDaysWorkouts')
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
    QUnit.test('Datepickerin valinta hakee valitun päivän treenit, ja renderöi ne näkymään', assert => {
        const currentWorkoutsFetch = sinon.stub(shallowWorkoutBackend, 'getDaysWorkouts');
        currentWorkoutsFetch.onFirstCall().returns(Promise.resolve([someTestWorkouts[1]]));
        currentWorkoutsFetch.onSecondCall().returns(Promise.resolve([someTestWorkouts[0]]));
        //
        const rendered = itu.renderIntoDocument(<WorkoutView/>);
        let renderedWorkoutBefore;
        // Odota, että initial-treeni latautuu
        const done = assert.async();
        currentWorkoutsFetch.firstCall.returnValue.then(() => {
            renderedWorkoutBefore = getRenderedWorkoutItems(rendered)[0];
            // Avaa datepicker
            const datePickerOpenButton = utils.findButtonByAttribute(rendered, 'title', 'Valitse päivä');
            datePickerOpenButton.click();
            // Simuloi datepickerin klikkaus (datePicker.props.onSelect(...))
            const expectedDate = new Date();
            expectedDate.setDate(new Date().getDate() !== 1 ? expectedDate.getDate() - 1 : expectedDate.getDate() + 1);
            const datePicker = itu.findRenderedVNodeWithType(rendered, Datepicker).children;
            (datePicker as any).props.onSelect(expectedDate);
            //
            assert.ok(currentWorkoutsFetch.calledTwice, 'Pitäisi hakea uudet treenit');
            assert.ok(currentWorkoutsFetch.secondCall.args, [expectedDate],
                'Pitäisi hakea uudet treenit valitulta päivältä'
            );
            return currentWorkoutsFetch.secondCall.returnValue;
        // Odota, että toinen treeni latautuu
        }).then(() => {
            assert.notDeepEqual(getRenderedWorkoutItems(rendered)[0],
                renderedWorkoutBefore, 'Pitäisi renderöidä uusi treeni'
            );
            done();
        });
    });
    QUnit.test('"Aloita uusi"-painike luo uuden tyhjän treenin, ja lisää sen listan alkuun', assert => {
        const workoutFetchStub = sinon.stub(shallowWorkoutBackend, 'getDaysWorkouts').returns(Promise.resolve([someTestWorkouts[0]]));
        const workoutFromService = new Workout();
        workoutFromService.userId = someUserId;
        const newWorkoutStub = sinon.stub(shallowWorkoutBackend, 'newWorkout').returns(Promise.resolve(workoutFromService));
        const workoutsInsertStub = sinon.stub(shallowWorkoutBackend, 'insert').returns(Promise.resolve());
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
            assert.ok(newWorkoutStub.calledOnce, 'Pitäisi hakea uusi treeni');
            newWorkoutStub.firstCall.returnValue.then(() => {
                assert.ok(workoutsInsertStub.calledOnce, 'Pitäisi postata treeni backendiin');
                return workoutsInsertStub.firstCall.returnValue;
            }).then(() => {
                const renderedWorkoutsAfter = getRenderedWorkoutItems(rendered);
                assert.equal(renderedWorkoutsAfter.length, workoutCountBefore + 1, 'Pitäisi renderöidä uusi treeni');
                assert.deepEqual(renderedWorkoutsAfter[0].props.workout, expectedWorkout, 'Pitäisi lisätä treeni listan alkuun');
                assert.deepEqual(renderedWorkoutsAfter[1].props.workout, someTestWorkouts[0], '1. initial treeni pitäisi olla nyt listan 2.');
                done();
            });
        });
    });
    function getRenderedWorkoutItems(rendered) {
        return itu.scryRenderedVNodesWithType(rendered, EditableWorkout);
    }
    function getExpectedNewWorkout() {
        const workout = new Workout();
        workout.start = Math.floor(Date.now() / 1000);
        workout.end = 0;
        workout.exercises = [];
        workout.userId = someUserId;
        return workout;
    }
});
