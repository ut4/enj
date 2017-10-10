import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import ptu from 'tests/program/utils';
import ProgramBackend from 'src/program/ProgramBackend';
import ProgramView from 'src/program/ProgramView';
import Modal from 'src/ui/Modal';
import iocFactories from 'src/ioc';
const emptyMessageRegExp: RegExp = /Ei vielä ohjelmia/;
const someUserId = 'uuid34';

QUnit.module('program/ProgramView', hooks => {
    let someTestPrograms: Array<Enj.API.ProgramRecord>;
    let programBackendIocOverride: sinon.SinonStub;
    let shallowProgramBackend: ProgramBackend;
    hooks.beforeEach(() => {
        shallowProgramBackend = Object.create(ProgramBackend.prototype);
        programBackendIocOverride = sinon.stub(iocFactories, 'programBackend').returns(shallowProgramBackend);
        someTestPrograms = ptu.getSomeTestPrograms();
    });
    hooks.afterEach(() => {
        programBackendIocOverride.restore();
    });
    function renderView(assert, programs: Array<Enj.API.ProgramRecord>, then: Function) {
        const programsFetch = sinon.stub(shallowProgramBackend, 'getAll')
            .returns(Promise.resolve(programs));
        //
        const rendered = itu.renderIntoDocument(<div><Modal/><ProgramView/></div>);
        //
        const done = assert.async();
        programsFetch.firstCall.returnValue.then(() => {
            then(rendered, done);
        });
    }
    QUnit.test('mount hakee liikkeet backendistä ja renderöi ne', assert => {
        renderView(assert, someTestPrograms, (rendered, done) => {
            const programListItems = getRenderedProgramItems(rendered);
            assert.equal(programListItems.length, 2);
            assert.equal(programListItems[0].textContent, getExpectedTrContent(someTestPrograms[0]));
            assert.equal(programListItems[1].textContent, getExpectedTrContent(someTestPrograms[1]));
            done();
        });
    });
    QUnit.test('mount näyttää viestin mikäli current-treenejä ei löydy', assert => {
        renderView(assert, [], (rendered, done) => {
            const programListItems = getRenderedProgramItems(rendered);
            assert.equal(programListItems.length, 0);
            const rootElem = itu.scryRenderedDOMElementsWithTag(rendered, 'div')[0];
            assert.ok(emptyMessageRegExp.test(rootElem.innerHTML));
            done();
        });
    });
    QUnit.test('"Poista"-painikkeen modalin hyväksyminen poistaa ohjelman ja renderöi sen näkymästä', assert => {
        const programDeleteStub = sinon.stub(shallowProgramBackend, 'delete')
            .returns(Promise.resolve(1));
        renderView(assert, someTestPrograms, (rendered, done) => {
            // Poista ensimmäinen ohjelma modalin kautta
            const renderedRows = getRenderedProgramItems(rendered);
            const firstRowDeleteLink = renderedRows[0].querySelector('td a:last-of-type') as HTMLAnchorElement;
            firstRowDeleteLink.click();
            utils.findButtonByContent(rendered, 'Ok').click();
            // Lähettikö ohjelman backendiin poistettavaksi?
            assert.ok(programDeleteStub.calledOnce);
            const expectedProgram = someTestPrograms[0];
            assert.deepEqual(programDeleteStub.firstCall.args, [expectedProgram]);
            programDeleteStub.firstCall.returnValue.then(() => {
                // Renderöikö poistetun ohjelman näkymästä?
                const renderedItemsAfter = getRenderedProgramItems(rendered);
                assert.equal(renderedItemsAfter.length, 1);
                assert.notEqual(renderedItemsAfter[0].textContent, getExpectedTrContent(expectedProgram));
                done();
            });
        });
    });
    function getRenderedProgramItems(rendered) {
        return itu.scryRenderedDOMElementsWithTag(rendered, 'tr').slice(1); // thead tr pois
    }
    function getExpectedTrContent(p: Enj.API.ProgramRecord): string {
        return (
            p.name +
            ptu.getExpectedDateStr(p.start) +
            ptu.getExpectedDateStr(p.end) +
            (p.description || '-') +
            'MuokkaaPoista'
        );
    }
});
