import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import ProgramBackend from 'src/program/ProgramBackend';
import ProgramEditView from 'src/program/ProgramEditView';
import ptu from 'tests/program/utils';
import Modal from 'src/ui/Modal';
import iocFactories from 'src/ioc';

QUnit.module('program/ProgramEditView', hooks => {
    let testProgram: Enj.API.ProgramRecord;
    let programBackendIocOverride: sinon.SinonStub;
    let shallowProgramBackend: ProgramBackend;
    hooks.beforeEach(() => {
        testProgram = ptu.getSomeTestPrograms()[0];
        shallowProgramBackend = Object.create(ProgramBackend.prototype);
        programBackendIocOverride = sinon.stub(iocFactories, 'programBackend').returns(shallowProgramBackend);
    });
    hooks.afterEach(() => {
        programBackendIocOverride.restore();
    });
    function renderEditView(assert, testProgram, then: Function) {
        const programFetchStub = sinon.stub(shallowProgramBackend, 'get')
            .returns(Promise.resolve(testProgram));
        const programSaveStub = sinon.stub(shallowProgramBackend, 'update')
            .returns(Promise.resolve(1));
        const rendered = itu.renderIntoDocument(<div>
            <Modal/>
            <ProgramEditView params={ {id: testProgram.id} }/>
        </div>);
        assert.ok(programFetchStub.calledOnce, 'Pitäisi hakea ohjelma backendistä');
        assert.deepEqual(programFetchStub.firstCall.args, ['/' + testProgram.id], 'Pitäisi hake urlin ohjelma');
        const done = assert.async();
        programFetchStub.firstCall.returnValue.then(() => {
            then(rendered, programSaveStub, done);
        });
    }
    QUnit.test('Tallentaa tiedot backendiin', assert => {
        renderEditView(assert, testProgram, (rendered, programSaveStub, done) => {
            const [nameInputEl, startInputEl, endInputEl] = utils.getInputs(rendered);
            utils.setInputValue('sydd', nameInputEl);
            utils.selectDatepickerDate(24, startInputEl);
            utils.selectDatepickerDate(26, endInputEl);
            // Lähetä muokkauslomake
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
    QUnit.test('Tallentaa lisätyt ohjelmatreenit backendiin', assert => {
        const programWorkoutInsertStub = sinon.stub(shallowProgramBackend, 'insertWorkouts')
            .returns(Promise.resolve(1));
        const programWorkoutSaveStub = sinon.stub(shallowProgramBackend, 'updateWorkout');
        const programWorkoutDeleteStub = sinon.stub(shallowProgramBackend, 'deleteWorkout');
        renderEditView(assert, testProgram, (rendered, programSaveStub, done) => {
            // Lisää ohjelmatreeni modalin kautta
            utils.findButtonByContent(rendered, 'Lisää treeni').click();
            const programWorkoutNameInputEl = utils.findInputByName(rendered, 'name');
            const newProgramWorkoutName = 'New workout';
            utils.setInputValue(newProgramWorkoutName, programWorkoutNameInputEl);
            utils.findButtonByContent(rendered, 'Ok').click();
            // Lähetä muokkauslomake
            utils.findButtonByContent(rendered, 'Tallenna').click();
            //
            assert.ok(programSaveStub.notCalled, 'Ei pitäisi tallentaa ohjelmaa');
            assert.ok(programWorkoutSaveStub.notCalled, 'Ei pitäisi päivittää ohjelmatreenejä');
            assert.ok(programWorkoutDeleteStub.notCalled, 'Ei pitäisi poistaa ohjelmatreenejä');
            assert.deepEqual(programWorkoutInsertStub.firstCall.args, [[{
                name: newProgramWorkoutName,
                programId: testProgram.id,
                ordinal: testProgram.workouts[0].ordinal + 1,
                occurrences: [{weekDay: 1, repeatEvery: null}]
            }]], 'Pitäisi tallentaa uusi ohjelmatreeni');
            done();
        });
    });
    QUnit.test('Tallentaa muuttuneet ohjelmatreenit backendiin', assert => {
        const programWorkoutInsertStub = sinon.stub(shallowProgramBackend, 'insertWorkouts');
        const programWorkoutSaveStub = sinon.stub(shallowProgramBackend, 'updateWorkout')
            .returns(Promise.resolve(1));
        const programWorkoutDeleteStub = sinon.stub(shallowProgramBackend, 'deleteWorkout');
        renderEditView(assert, testProgram, (rendered, programSaveStub, done) => {
            // Päivitä ohjelmatreenin nimeä modalin kautta
            utils.findButtonByAttribute(rendered, 'title', 'Muokkaa').click();
            const programWorkoutNameInputEl = utils.findInputByName(rendered, 'name');
            utils.setInputValue('fooo', programWorkoutNameInputEl);
            utils.findButtonByContent(rendered, 'Ok').click();
            // Lähetä muokkauslomake
            utils.findButtonByContent(rendered, 'Tallenna').click();
            //
            assert.ok(programSaveStub.notCalled, 'Ei pitäisi tallentaa ohjelmaa');
            assert.ok(programWorkoutInsertStub.notCalled, 'Ei pitäisi lisätä ohjelmatreenejä');
            assert.ok(programWorkoutDeleteStub.notCalled, 'Ei pitäisi poistaa ohjelmatreenejä');
            assert.ok(programWorkoutSaveStub.calledOnce, 'Pitäisi tallentaa muuttunut ohjelmatreeni');
            assert.deepEqual(programWorkoutSaveStub.firstCall.args, [[
                Object.assign(testProgram.workouts[0], {
                    name: 'fooo'
                })
            ]], 'Pitäisi tallentaa muuttuneen ohjelmatreenin tiedot');
            done();
        });
    });
    QUnit.test('Tallentaa poistetut ohjelmatreenit backendiin', assert => {
        const programWorkoutInsertStub = sinon.stub(shallowProgramBackend, 'insertWorkouts');
        const programWorkoutSaveStub = sinon.stub(shallowProgramBackend, 'updateWorkout');
        const programWorkoutDeleteStub = sinon.stub(shallowProgramBackend, 'deleteWorkout')
            .returns(Promise.resolve(1));
        testProgram = ptu.getSomeTestPrograms()[1];
        renderEditView(assert, testProgram, (rendered, programSaveStub, done) => {
            // Poista ensimmäinen ohjelmatreeni listalta
            utils.findButtonByAttribute(rendered, 'title', 'Poista').click();
            // Lähetä muokkauslomake
            utils.findButtonByContent(rendered, 'Tallenna').click();
            //
            assert.ok(programSaveStub.notCalled, 'Ei pitäisi tallentaa ohjelmaa');
            assert.ok(programWorkoutInsertStub.notCalled, 'Ei pitäisi lisätä ohjelmatreenejä');
            assert.ok(programWorkoutSaveStub.notCalled, 'Ei pitäisi päivittää ohjelmatreenejä');
            assert.ok(programWorkoutDeleteStub.calledOnce, 'Pitäisi tallentaa poistettu ohjelmatreeni');
            assert.deepEqual(programWorkoutDeleteStub.firstCall.args, [
                testProgram.workouts[0]
            ], 'Pitäisi poistaa poistettu ohjelmatreeni');
            done();
        });
    });
});
