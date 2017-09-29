import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import ProgramBackend from 'src/program/ProgramBackend';
import ProgramCreateView from 'src/program/ProgramCreateView';
import iocFactories from 'src/ioc';
import programTestUtils from 'tests/program/utils';

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
        //
        const rendered = itu.renderIntoDocument(<ProgramCreateView/>);
        const expectedNewProgram = {
            name: 'foo',
            start: getExpectedStart(),
            end: getExpectedEnd(),
            description: 'asd'
        };
        // Täytä & lähetä lomake
        const [nameInputEl, startInputEl, endInputEl] = getInputs(rendered);
        utils.setInputValue(expectedNewProgram.name, nameInputEl);
        utils.selectDatepickerDate(5, startInputEl);
        utils.selectDatepickerDate(5, endInputEl);
        const descriptionEl = itu.findRenderedDOMElementWithTag(rendered, 'textarea') as HTMLTextAreaElement;
        utils.setInputValue(expectedNewProgram.description, descriptionEl);
        const submitButton = utils.findButtonByContent(rendered, 'Ok');
        submitButton.click();
        // Lähettikö?
        assert.ok(insertCallStub.calledOnce, 'Pitäisi lähettää pyyntö backediin');
        console.log(new Date(expectedNewProgram.end*1000));
        console.log(new Date(insertCallStub.firstCall.args[0].end*1000));
        assert.deepEqual(insertCallStub.firstCall.args, [expectedNewProgram]);
    });
    function getInputs(rendered): Array<HTMLInputElement> {
        return itu.scryRenderedDOMElementsWithTag(rendered, 'input') as Array<HTMLInputElement>;
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
