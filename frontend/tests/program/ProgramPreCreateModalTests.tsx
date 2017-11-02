import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import ptu from 'tests/program/utils';
import Modal from 'src/ui/Modal';
import ProgramBackend from 'src/program/ProgramBackend';
import ProgramPreCreateModal from 'src/program/ProgramPreCreateModal';
import iocFactories from 'src/ioc';

QUnit.module('program/ProgramPreCreateModal', hooks => {
    let programBackendIocOverride: sinon.SinonStub;
    let shallowProgramBackend: ProgramBackend;
    let fakeHistory: {push: sinon.SinonSpy};
    let historyIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        shallowProgramBackend = Object.create(ProgramBackend.prototype);
        programBackendIocOverride = sinon.stub(iocFactories, 'programBackend').returns(shallowProgramBackend);
        fakeHistory = {push: sinon.spy()};
        historyIocOverride = sinon.stub(iocFactories, 'history').returns(fakeHistory);
    });
    hooks.afterEach(() => {
        programBackendIocOverride.restore();
        historyIocOverride.restore();
    });
    function render(assert, then: Function, preAssertions?: Function) {
        const testProgramTemplates = ptu.getSomeTestPrograms();
        const templateFetchStub = sinon.stub(shallowProgramBackend, 'getAll').returns(Promise.resolve(testProgramTemplates));
        const rendered = itu.renderIntoDocument(<div><Modal/><ProgramPreCreateModal/></div>);
        const instance = itu.findRenderedVNodeWithType(rendered, ProgramPreCreateModal).children as any;
        instance.context = {router: {}};
        //
        preAssertions && preAssertions(templateFetchStub);
        //
        const done = assert.async();
        templateFetchStub.firstCall.returnValue.then(() => {
            then(rendered, templateFetchStub, instance, testProgramTemplates);
            done();
        });
    }
    QUnit.test('Hakee ohjelmatemplaatit backendistä, lataa ne dropdowniin ja passaa valinnan ohjelman luontinäkymään', assert => {
        render(assert, (rendered, templateFetchStub, instance, testProgramTemplates) => {
            // Valitse testProgramTemplates[0] ohjelmatemplaatti
            const templateSelectInputEl = itu.findRenderedDOMElementWithTag(rendered , 'select') as HTMLSelectElement;
            utils.setDropdownIndex(0 + 2, templateSelectInputEl); // [0] == - Ei templaattia -
            // Renderöikö valitun ohjemplatemplaatin esikatseluun?
            const previewTitle = itu.scryRenderedDOMElementsWithTag(rendered, 'h4')[0];
            assert.equal(previewTitle.textContent, testProgramTemplates[1].name);
            // Hyväksy modal
            utils.findButtonByContent(rendered, 'Ok').click();
            // Ohjasiko ohjelman luontinäkymään?
            assert.ok(fakeHistory.push.calledOnce);
            assert.deepEqual(fakeHistory.push.firstCall.args, ['ohjelmat/luo-uusi']);
            assert.deepEqual(instance.context.router.programTemplate, testProgramTemplates[1]);
            // Resetoiko ohjelmatemplaatin id:t?
            const newTemplate: Enj.API.Program = instance.context.router.programTemplate;
            assert.equal(newTemplate.id, null);
            newTemplate.workouts.forEach((programWorkout, i) => {
                assert.equal(programWorkout.id, null, `newTemplate.workouts[${i}].id pitäisi olla null`);
                assert.equal(programWorkout.programId, null, `newTemplate.workouts[${i}].programId pitäisi olla null`);
                programWorkout.exercises.forEach((pwe, i2) => {
                    assert.equal(pwe.id, null, `newTemplate.workouts[${i}].exercises[${i2}].id pitäisi olla null`);
                    assert.equal(pwe.programWorkoutId, null, `newTemplate.workouts[${i}].exercises[${i2}].programWorkoutId pitäisi olla null`);
                });
            });
        }, templateFetchStub => {
            assert.ok(templateFetchStub.calledOnce);
            assert.deepEqual(templateFetchStub.firstCall.args, ['/templates']);
        });
    });
    QUnit.test('Ei passaa ohjelman luontinäkymään arvoa, jos templaattia ei valita', assert => {
        render(assert, (rendered, templateFetchStub, instance, testProgramTemplates) => {
            // Jätä dropdownin valinnaksi [0], joka on - Ei templaattia - && Hyväksy modal
            utils.findButtonByContent(rendered, 'Ok').click();
            // Ohjasiko ohjelman luontinäkymään ilman arvoa?
            assert.ok(fakeHistory.push.calledOnce);
            assert.deepEqual(fakeHistory.push.firstCall.args, ['ohjelmat/luo-uusi']);
            assert.deepEqual(instance.context.router.programTemplate, undefined);
        });
    });
});
