import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import ProgramBackend from 'src/program/ProgramBackend';
import ProgramCreateView from 'src/program/ProgramCreateView';
import ProgramForm from 'src/program/ProgramForm';
import Modal from 'src/ui/Modal';
import iocFactories from 'src/ioc';
import ptu from 'tests/program/utils';

function newContextfulProgramCreateViewClass(programTemplateSetByPreCreateModal?: Enj.API.Program) {
    const ProgramCreateViewWithContext = class extends ProgramCreateView {
        public constructor(props, context) {
            context.router = {programTemplate: programTemplateSetByPreCreateModal};
            super(props, context);
        }
    };
    return ProgramCreateViewWithContext;
}

QUnit.module('program/ProgramCreateView', hooks => {
    let programBackendIocOverride: sinon.SinonStub;
    let shallowProgramBackend: ProgramBackend;
    hooks.beforeEach(() => {
        shallowProgramBackend = Object.create(ProgramBackend.prototype);
        programBackendIocOverride = sinon.stub(iocFactories, 'programBackend').returns(shallowProgramBackend);
    });
    hooks.afterEach(() => {
        programBackendIocOverride.restore();
    });
    QUnit.test('lataa props.router.programTemplate:n ohjelmatreenit lomakkeeseen', assert => {
        // Aseta props.context:in programTemplate manuaalisesti, jonka ProgramPreCreateModal normaalisti asettaa
        const programTemplateSetByPreCreateModal = ptu.getSomeTestPrograms()[1];
        const actualProgramWorkouts = programTemplateSetByPreCreateModal.workouts;
        // Renderöi näkymä
        const Cls = newContextfulProgramCreateViewClass(programTemplateSetByPreCreateModal);
        const rendered = itu.renderIntoDocument(<div><Modal/><Cls/></div>);
        // Asettiko props.context programTemplaten ohjelmatreenit lomakkeeseen?
        const populatedProgramWorkoutEls = itu.scryRenderedDOMElementsWithTag(rendered, 'li');
        const actualMondaysProgramWorkoutEl = populatedProgramWorkoutEls[actualProgramWorkouts[0].occurrences[0].weekDay-1];
        const actualWednesdaysProgramWorkoutEl = populatedProgramWorkoutEls[actualProgramWorkouts[1].occurrences[0].weekDay-1];
        assert.ok(actualMondaysProgramWorkoutEl.textContent.indexOf(programTemplateSetByPreCreateModal.workouts[0].name) > -1);
        assert.ok(actualWednesdaysProgramWorkoutEl.textContent.indexOf(programTemplateSetByPreCreateModal.workouts[1].name) > -1);
    });
    QUnit.test('lähettää tiedot backendiin', assert => {
        const insertCallStub = sinon.stub(shallowProgramBackend, 'insert').returns(Promise.resolve(1));
        const insertWorkoutsStub = sinon.stub(shallowProgramBackend, 'insertWorkouts').returns(Promise.resolve(1));
        const insertWorkoutExercisesStub = sinon.stub(shallowProgramBackend, 'insertWorkoutExercises').returns(Promise.resolve(1));
        const expectedNewProgram = {
            name: 'foo',
            start: getExpectedStart(),
            end: getExpectedEnd(),
            description: 'asd',
            workouts: []
        };
        const expectedNewProgramWorkouts = [{
            name: 'foo',
            occurrences: [{weekDay: 1, firstWeek: 0, repeatEvery: 7}],
            ordinal: 0,
            programId: undefined,
            exercises: []
        }];
        const expectedNewProgramWorkoutExercises = [{
            ordinal: 0,
            programWorkoutId: null,
            exerciseId: 'foo',
            exerciseVariantId: null
        }];
        // Renderöi näkymä & assertoi initial-arvot
        const Cls = newContextfulProgramCreateViewClass();
        const rendered = itu.renderIntoDocument(<div><Modal/><Cls/></div>);
        const [nameInputEl, startInputEl, endInputEl] = utils.getInputs(rendered);
        assert.equal(startInputEl.value, getExpectedInitialStartDateStr());
        assert.equal(endInputEl.value, getExpectedInitialEndDateStr());
        // Täytä name & start & end & description
        utils.setInputValue(expectedNewProgram.name, nameInputEl);
        utils.selectDatepickerDate(5, startInputEl);
        utils.selectDatepickerDate(5, endInputEl);
        const descriptionEl = itu.findRenderedDOMElementWithTag(rendered, 'textarea') as HTMLTextAreaElement;
        utils.setInputValue(expectedNewProgram.description, descriptionEl);
        // Lisää ohjelmatreeni modalin kautta
        utils.findButtonByContent(rendered, 'Lisää treeni').click();
        utils.setInputValue(expectedNewProgramWorkouts[0].name, utils.findInputByName(rendered, 'name'));
        // Lisää liike ohjelmatreeniin ohjelmallisesti
        (ptu.getRenderedProgramWorkoutModal(rendered) as any).receiveInputValue(
            {target: {value: expectedNewProgramWorkoutExercises, name: 'exercises'}}
        );
        utils.findButtonByContent(rendered, 'Ok').click();
        // Lähetä lomake
        const confirmSpy = sinon.spy(ptu.getRenderedProgramForm(rendered), 'confirm');
        const submitButton = utils.findButtonByContent(rendered, 'Ok');
        submitButton.click();
        // Lähettikö?
        const done = assert.async();
        confirmSpy.firstCall.returnValue.then(() => {
            assert.ok(insertCallStub.calledOnce, 'Pitäisi lähettää ohjelma backediin');
            assert.deepEqual(insertCallStub.firstCall.args, [expectedNewProgram]);
            assert.ok(insertWorkoutsStub.calledAfter(insertCallStub),
                'Pitäisi lähettää ohjelmatreenit backendiin'
            );
            assert.deepEqual(insertWorkoutsStub.firstCall.args, [expectedNewProgramWorkouts]);
            assert.ok(insertWorkoutExercisesStub.calledAfter(insertWorkoutsStub),
                'Pitäisi lähettää ohjelmatreeniliikkeet backendiin'
            );
            assert.deepEqual(insertWorkoutExercisesStub.firstCall.args, [expectedNewProgramWorkoutExercises]);
            done();
        });
    });
    QUnit.test('Ei insertoi ohjelmatreenejä tai ohjelmatreeniliikkeitä jos ohjelman lisäys epäonnistuu', assert => {
        const insertCallStub = sinon.stub(shallowProgramBackend, 'insert').returns(Promise.reject(false));
        const insertWorkoutsSpy = sinon.spy(shallowProgramBackend, 'insertWorkouts');
        const insertWorkoutExercisesSpy = sinon.spy(shallowProgramBackend, 'insertWorkoutExercises');
        // Renderöi näkymä & assertoi initial-arvot
        const Cls = newContextfulProgramCreateViewClass();
        const rendered = itu.renderIntoDocument(<div><Modal/><Cls/></div>);
        const [nameInputEl, startInputEl, endInputEl] = utils.getInputs(rendered);
        // Täytä name & start & end & description
        utils.setInputValue('foo', nameInputEl);
        utils.selectDatepickerDate(5, startInputEl);
        utils.selectDatepickerDate(5, endInputEl);
        // Lisää ohjelmatreeni ohjelmallisesti
        (ptu.getRenderedProgramForm(rendered) as any).receiveInputValue(
            {target: {value: ptu.getSomeTestPrograms()[0].workouts, name: 'workouts'}}
        );
        // Lähetä lomake
        const confirmSpy = sinon.spy(ptu.getRenderedProgramForm(rendered), 'confirm');
        const submitButton = utils.findButtonByContent(rendered, 'Ok');
        submitButton.click();
        // Skippasiko ohjelmatreenien ja liikkeiden lähettämisen?
        const done = assert.async();
        confirmSpy.firstCall.returnValue.then(() => {
            assert.ok(insertCallStub.calledOnce);
            assert.ok(insertWorkoutsSpy.notCalled,
                'Ei pitäisi lähettää ohjelmatreenejä backendiin'
            );
            assert.ok(insertWorkoutExercisesSpy.notCalled,
                'Ei pitäisi lähettää ohjelmatreeniliikkeitä backendiin'
            );
            done();
        });
    });
    function getExpectedInitialStartDateStr(): string {
        return ptu.getExpectedDateStr(Math.floor(new Date().getTime() / 1000));
    }
    function getExpectedInitialEndDateStr(): string {
        const date = new Date();
        date.setMonth(date.getMonth() + 2);
        return ptu.getExpectedDateStr(Math.floor(date.getTime() / 1000));
    }
    function getExpectedStart(): number {
        const date = new Date();
        date.setDate(5);
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return Math.floor(date.getTime() / 1000);
    }
    function getExpectedEnd(): number {
        const date = new Date(getExpectedStart() * 1000);
        date.setMonth(date.getMonth() + 2);
        date.setDate(5);
        return Math.floor(date.getTime() / 1000);
    }
});
