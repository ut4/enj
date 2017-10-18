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
    QUnit.test('lähettää tiedot backendiin', assert => {
        const insertCallStub = sinon.stub(shallowProgramBackend, 'insert').returns(Promise.resolve(1));
        const expectedNewProgram = {
            name: 'foo',
            start: getExpectedStart(),
            end: getExpectedEnd(),
            description: 'asd',
            workouts: [{
                name: 'foo',
                occurrences: [{weekDay: 1, firstWeek: 0, repeatEvery: 7}],
                exercises: [{
                    ordinal: 0,
                    programWorkoutId: null,
                    exerciseId: 'foo',
                    exerciseVariantId: null
                }],
                ordinal: 0,
                programId: undefined
            }]
        };
        // Renderöi näkymä & assertoi initial-arvot
        const rendered = itu.renderIntoDocument(<div><Modal/><ProgramCreateView/></div>);
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
        utils.setInputValue(expectedNewProgram.workouts[0].name, utils.findInputByName(rendered, 'name'));
        // Lisää liike ohjelmatreeniin ohjelmallisesti
        (ptu.getRenderedProgramWorkoutModal(rendered) as any).receiveInputValue(
            {target: {value: expectedNewProgram.workouts[0].exercises, name: 'exercises'}}
        );
        utils.findButtonByContent(rendered, 'Ok').click();
        // Lähetä lomake
        const submitButton = utils.findButtonByContent(rendered, 'Ok');
        submitButton.click();
        // Lähettikö?
        assert.ok(insertCallStub.calledOnce, 'Pitäisi lähettää pyyntö backediin');
        assert.deepEqual(insertCallStub.firstCall.args, [expectedNewProgram]);
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
