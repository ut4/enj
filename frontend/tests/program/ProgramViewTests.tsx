import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import ProgramBackend from 'src/program/ProgramBackend';
import ProgramView from 'src/program/ProgramView';
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
        someTestPrograms = [
            {id:'uuid1', name: 'foo', start: 323384400, end: 323470800, userId: 'u'},
            {id:'uuid2', name: 'bar', start: 318204000, end: 318290400, description: '...', userId: 'u'}
        ];
    });
    hooks.afterEach(() => {
        programBackendIocOverride.restore();
    });
    QUnit.test('mount hakee liikkeet backendistä ja renderöi ne', assert => {
        const programsFetch = sinon.stub(shallowProgramBackend, 'getAll')
            .returns(Promise.resolve(someTestPrograms));
        //
        const rendered = itu.renderIntoDocument(<ProgramView/>);
        //
        const done = assert.async();
        programsFetch.firstCall.returnValue.then(() => {
            const programListItems = getRenderedProgramItems(rendered);
            assert.equal(programListItems.length, 2);
            assert.equal(programListItems[0].textContent, getExpectedTrContent(someTestPrograms[0]));
            assert.equal(programListItems[1].textContent, getExpectedTrContent(someTestPrograms[1]));
            done();
        });
    });
    QUnit.test('mount näyttää viestin mikäli current-treenejä ei löydy', assert => {
        const programsFetch = sinon.stub(shallowProgramBackend, 'getAll')
            .returns(Promise.resolve([]));
        //
        const rendered = itu.renderIntoDocument(<ProgramView/>);
        //
        const done = assert.async();
        programsFetch.firstCall.returnValue.then(() => {
            const programListItems = getRenderedProgramItems(rendered);
            assert.equal(programListItems.length, 0);
            const rootElem = itu.scryRenderedDOMElementsWithTag(rendered, 'div')[0];
            assert.ok(emptyMessageRegExp.test(rootElem.innerHTML));
            done();
        });
    });
    function getRenderedProgramItems(rendered) {
        return itu.scryRenderedDOMElementsWithTag(rendered, 'tr').slice(1); // thead tr pois
    }
    function getExpectedTrContent(p: Enj.API.ProgramRecord): string {
        return `${p.name}${getExpectedDateStr(p.start)}${getExpectedDateStr(p.end)}${p.description||'-'}MuokkaaPoista`;
    }
    function getExpectedDateStr(unixTime: number): string {
        return iocFactories.dateUtils().getLocaleDateString(new Date(unixTime * 1000));
    }
});
