import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import ProgramBackend from 'src/program/ProgramBackend';
import ProgramEditView from 'src/program/ProgramEditView';
import iocFactories from 'src/ioc';

QUnit.module('program/ProgramEditView', hooks => {
    let programBackendIocOverride: sinon.SinonStub;
    let shallowProgramBackend: ProgramBackend;
    hooks.beforeEach(() => {
        shallowProgramBackend = Object.create(ProgramBackend.prototype);
        programBackendIocOverride = sinon.stub(iocFactories, 'programBackend').returns(shallowProgramBackend);
    });
    hooks.afterEach(() => {
        programBackendIocOverride.restore();
    });
    QUnit.test('Tallentaa tiedot backendiin', assert => {
        const testProgram: Enj.API.ProgramRecord = {id: 'uid', name: 'tyu', start: 86401, end: 86400*2+1, workouts: [], userId: 'u'};
        const programFetchStub = sinon.stub(shallowProgramBackend, 'get')
            .returns(Promise.resolve(testProgram));
        const programSaveStub = sinon.stub(shallowProgramBackend, 'update')
            .returns(Promise.resolve(1));
        const rendered = itu.renderIntoDocument(
            <ProgramEditView params={ {id: testProgram.id} }/>
        );
        assert.ok(programFetchStub.calledOnce, 'Pitäisi hakea ohjelma backendistä');
        assert.deepEqual(programFetchStub.firstCall.args, ['/' + testProgram.id], 'Pitäisi hake urlin ohjelma');
        const done = assert.async();
        programFetchStub.firstCall.returnValue.then(() => {
            const [nameInputEl, startInputEl, endInputEl] = utils.getInputs(rendered);
            utils.setInputValue('sydd', nameInputEl);
            utils.selectDatepickerDate(24, startInputEl);
            utils.selectDatepickerDate(26, endInputEl);
            //
            utils.findButtonByContent(rendered, 'Tallenna').click();
            //
            assert.ok(programSaveStub.calledOnce, 'Pitäisi lähettää backendiin dataa');
            assert.deepEqual(programSaveStub.firstCall.args, [
                Object.assign(testProgram, {
                    name: 'sydd',
                    start: Math.floor(new Date(1970, 0, 24).getTime() / 1000),
                    end: Math.floor(new Date(1970, 0, 26).getTime() / 1000),
                    description: null
                }),
                '/' + testProgram.id
            ], 'Pitäisi tallentaa muuttuneet tiedot');
            done();
        });
    });
});
