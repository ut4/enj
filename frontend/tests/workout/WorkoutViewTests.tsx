import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import WorkoutBackend, { Workout } from 'src/workout/WorkoutBackend';
import WorkoutView from 'src/workout/WorkoutView';
import EditableWorkout from 'src/workout/EditableWorkout';
import ProgramBackend from 'src/program/ProgramBackend';
import ptu from 'tests/program/utils';
import Datepicker from 'src/ui/Datepicker';
import iocFactories from 'src/ioc';
const noWorkoutsMessage = 'Ei treenejä';
const noProgramWorkoutsMessage = 'Ei ohjelmatreeniä tälle päivälle';
const someUserId = 'uuid56';

QUnit.module('workout/WorkoutView', hooks => {
    let someTestWorkouts: Array<Enj.API.WorkoutRecord>;
    let workoutBackendIocOverride: sinon.SinonStub;
    let shallowWorkoutBackend: WorkoutBackend;
    let programBackendIocOverride: sinon.SinonStub;
    let shallowProgramBackend: WorkoutBackend;
    let fakeHistory;
    let historyIocOverride: sinon.SinonStub;
    let componentWillReceivePropsSpy: sinon.SinonSpy;
    hooks.beforeEach(() => {
        shallowWorkoutBackend = Object.create(WorkoutBackend.prototype);
        workoutBackendIocOverride = sinon.stub(iocFactories, 'workoutBackend').returns(shallowWorkoutBackend);
        shallowProgramBackend = Object.create(ProgramBackend.prototype);
        programBackendIocOverride = sinon.stub(iocFactories, 'programBackend').returns(shallowProgramBackend);
        someTestWorkouts = [
            {id:'uuid1', start: 1, exercises: [], userId: 'uuid2'},
            {id:'uuid2', start: 2, exercises: [], userId: 'uuid2'}
        ];
        fakeHistory = {push: () => {}};
        historyIocOverride = sinon.stub(iocFactories, 'history').returns(fakeHistory);
    });
    hooks.afterEach(() => {
        workoutBackendIocOverride.restore();
        programBackendIocOverride.restore();
        historyIocOverride.restore();
        componentWillReceivePropsSpy && componentWillReceivePropsSpy.restore();
    });
    QUnit.test('mount hakee current-treenit backendistä ja renderöi ne', assert => {
        const todaysWorkoutsFetch = sinon.stub(shallowWorkoutBackend, 'getDaysWorkouts')
            .returns(Promise.resolve(someTestWorkouts));
        //
        const rendered = itu.renderIntoDocument(<WorkoutView params={ {date: 'tanaan'} }/>);
        //
        const done = assert.async();
        todaysWorkoutsFetch.firstCall.returnValue.then(() => {
            const currentWorkoutListItems = getRenderedWorkoutItems(rendered);
            assert.equal(currentWorkoutListItems.length, 2);
            done();
        });
    });
    QUnit.test('mount näyttää current-ohjelman ohjelmatreenin, jos current-treeniä ei löytynyt', assert => {
        sinon.stub(shallowWorkoutBackend, 'getDaysWorkouts').returns(Promise.resolve([]));
        const testProgram = ptu.getSomeTestPrograms()[1];
        testProgram.start = Math.floor(new Date().getTime() / 1000);
        testProgram.workouts[0].occurrences[0].weekDay = new Date().getDay();
        const programsFetch = sinon.stub(shallowProgramBackend, 'getAll').returns(
            Promise.resolve([testProgram])
        );
        //
        componentWillReceivePropsSpy = sinon.spy(WorkoutView.prototype, 'componentWillReceiveProps');
        const rendered = itu.renderIntoDocument(<WorkoutView params={ {date: 'tanaan'} }/>);
        //
        const done = assert.async();
        componentWillReceivePropsSpy.firstCall.returnValue.then(() => {
            assert.equal(
                new Date(programsFetch.firstCall.args[0].split('when=')[1] * 1000).toDateString(),
                new Date().toDateString(),
                'Pitäisi hakea ohjelmia kuluvan päivän unixTimella'
            );
            assert.equal(
                itu.findRenderedDOMElementWithTag(rendered, 'h2').textContent,
                'Ohjelmassa tänään'
            );
            const actualProgramWorkoutHeading = itu.findRenderedDOMElementWithClass(rendered, 'heading');
            const actualProgramWorkoutContent = itu.findRenderedDOMElementWithClass(rendered, 'content');
            const pw = testProgram.workouts[0];
            assert.equal(actualProgramWorkoutHeading.textContent, pw.name, 'Pitäisi');
            assert.equal(actualProgramWorkoutContent.textContent, pw.exercises.map(e => e.exerciseName).join(''));
            done();
        });
    });
    QUnit.test('mount näyttää viestin jos current-ohjelmasta ei löytynyt ohjelmatreeniä kuluvalle päivälle', assert => {
        sinon.stub(shallowWorkoutBackend, 'getDaysWorkouts').returns(Promise.resolve([]));
        const testProgram = ptu.getSomeTestPrograms()[1];
        testProgram.workouts[0].occurrences[0].weekDay = new Date().getDay() + 1;
        const programsFetch = sinon.stub(shallowProgramBackend, 'getAll').returns(
            Promise.resolve([testProgram])
        );
        //
        componentWillReceivePropsSpy = sinon.spy(WorkoutView.prototype, 'componentWillReceiveProps');
        const rendered = itu.renderIntoDocument(<WorkoutView params={ {date: 'tanaan'} }/>);
        //
        const done = assert.async();
        componentWillReceivePropsSpy.firstCall.returnValue.then(() => {
            assert.ok(itu.findRenderedDOMElementWithTag(rendered, 'p').textContent
                .indexOf('Ei ohjelmatreeniä tälle päivälle') > -1);
            done();
        });
    });
    QUnit.test('mount näyttää viestin mikäli current-treenejä, eikä ohjelmia löydy', assert => {
        const currentWorkoutsFetch = sinon.stub(shallowWorkoutBackend, 'getDaysWorkouts')
            .returns(Promise.resolve([]));
        const currentProgramsFetch = sinon.stub(shallowProgramBackend, 'getAll')
            .returns(Promise.resolve([]));
        //
        const rendered = itu.renderIntoDocument(<WorkoutView params={ {date: 'tanaan'} }/>);
        //
        const done = assert.async();
        currentWorkoutsFetch.firstCall.returnValue.then(() => {
            const currentWorkoutListItems = getRenderedWorkoutItems(rendered);
            assert.equal(currentWorkoutListItems.length, 0);
            const rootElem = itu.scryRenderedDOMElementsWithTag(rendered, 'p')[0];
            assert.ok(rootElem.innerHTML.indexOf(noWorkoutsMessage) > -1);
            done();
        });
    });
    QUnit.test('mount ei hae ohjelmaa, jos params.date ei ole tänään', assert => {
        const currentWorkoutsFetch = sinon.stub(shallowWorkoutBackend, 'getDaysWorkouts')
            .returns(Promise.resolve([]));
        const currentProgramsFetch = sinon.spy(shallowProgramBackend, 'getAll');
        //
        const rendered = itu.renderIntoDocument(<WorkoutView params={ {date: 'tanaan'} }/>);
        //
        const done = assert.async();
        currentWorkoutsFetch.firstCall.returnValue.then(() => {
            assert.ok(currentProgramsFetch.notCalled, 'Ei pitäisi hakea ohjelmia');
            done();
        });
    });
    QUnit.test('mount handlaa epäonnistuneen current-treenien haun', assert => {
        const currentWorkoutsFetch = sinon.stub(shallowWorkoutBackend, 'getDaysWorkouts')
            .returns(Promise.reject({err: 'fo'}));
        //
        const rendered = itu.renderIntoDocument(<WorkoutView params={ {date: 'tanaan'} }/>);
        // Assertoi että initial render on tyhjä
        assert.equal(itu.scryRenderedDOMElementsWithTag(rendered, 'div').length, 0);
        // Assertoi että thenin jälkeinen render ei ole tyhjä
        const done = assert.async();
        currentWorkoutsFetch.firstCall.returnValue.then(null, () => {
            const currentWorkoutListItems = getRenderedWorkoutItems(rendered);
            assert.equal(currentWorkoutListItems.length, 0);
            const rootElem = itu.scryRenderedDOMElementsWithTag(rendered, 'div')[0];
            assert.ok(rootElem.innerHTML.indexOf(noWorkoutsMessage) > -1);
            done();
        });
    });
    QUnit.test('Lataa urlissa passatun päivän treenit, ja renderöi ne näkymään', assert => {
        const workoutsFetch = sinon.stub(shallowWorkoutBackend, 'getDaysWorkouts')
            .returns(Promise.resolve([someTestWorkouts[0]]));
        //
        const date = '2010-07-12';
        const rendered = itu.renderIntoDocument(<WorkoutView params={ {date} }/>);
        assert.deepEqual(workoutsFetch.firstCall.args, [new Date(date)],
            'Pitäisi hakea treenit urliin määritellyltä päivältä'
        );
        //
        const done = assert.async();
        workoutsFetch.firstCall.returnValue.then(() => {
            const currentWorkoutListItems = getRenderedWorkoutItems(rendered);
            assert.equal(currentWorkoutListItems.length, 1);
            // Asettiko urliin määritellyn päivän datepickerin selected-päiväksi?
            const datePickerOpenButton = utils.findButtonByAttribute(rendered, 'title', 'Valitse päivä');
            datePickerOpenButton.click();
            const openDatePicker = itu.findRenderedVNodeWithType(rendered, Datepicker).children as any;
            const selected = openDatePicker.container.querySelector('td.is-selected');
            assert.equal(selected.getAttribute('data-day'), '12',
                'Pitäisi asettaa initial-dateksi tämä'
            );
            done();
        });
    });
    QUnit.test('Datepickerin valinta ohjaa valitun päivän treeniin', assert => {
        const currentWorkoutsFetch = sinon.stub(shallowWorkoutBackend, 'getDaysWorkouts')
            .returns(Promise.resolve([someTestWorkouts[1]]));
        const redirectSpy = sinon.spy(fakeHistory, 'push');
        //
        const rendered = itu.renderIntoDocument(<WorkoutView params={ {date: 'tanaan'} }/>);
        // Odota, että initial-treeni latautuu
        const done = assert.async();
        currentWorkoutsFetch.firstCall.returnValue.then(() => {
            // Avaa datepicker
            const datePickerOpenButton = utils.findButtonByAttribute(rendered, 'title', 'Valitse päivä');
            datePickerOpenButton.click();
            // Simuloi datepickerin klikkaus (datePicker.props.onSelect(...))
            const expectedDate = new Date();
            expectedDate.setDate(new Date().getDate() !== 1 ? expectedDate.getDate() - 1 : expectedDate.getDate() + 1);
            const datePicker = itu.findRenderedVNodeWithType(rendered, Datepicker).children;
            (datePicker as any).props.onSelect(expectedDate);
            //
            assert.ok(redirectSpy.calledOnce, 'Pitäisi ohjata valitun päivän treeneihin');
            assert.deepEqual(redirectSpy.firstCall.args,
                ['/treeni/' + expectedDate.toISOString().split('T')[0]],
                'Pitäisi ohjautua tänne'
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
        const rendered = itu.renderIntoDocument(<WorkoutView params={ {date: 'tanaan'} }/>);
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
