import QUnit from 'qunitjs';
import sinon from 'sinon';
import utils from 'tests/utils';
import * as itu from 'inferno-test-utils';
import { formulae } from 'src/stat/StatBackend';
import UserBackend from 'src/user/UserBackend';
import StatsStrengthView from 'src/stat/StatStrengthView';
import SettingsForm from 'src/stat/SettingsForm';
import iocFactories from 'src/ioc';

QUnit.module('stat/StatStrengthView', hooks => {
    let testBestSets: Array<Enj.API.BestSet>;
    let shallowUserBackend: UserBackend;
    let userBackendIocOverride: sinon.SinonStub;
    function renderComponent(): [any, any] {
        const rendered = itu.renderIntoDocument(<StatsStrengthView/>);
        const componentInstance = itu.findRenderedVNodeWithType(rendered, StatsStrengthView).children as any;
        return [rendered, componentInstance];
    }
    hooks.beforeEach(() => {
        testBestSets = [
            {startWeight: 5.0, bestWeight: 60.0, bestWeightReps: 6, exerciseName: 'Penkkipunnerrus', timesImproved: 1},
            {startWeight: 6.0, bestWeight: 71.0, bestWeightReps: 7, exerciseName: 'Jalkakyykky', timesImproved: 2},
            {startWeight: 7.0, bestWeight: 82.0, bestWeightReps: 8, exerciseName: 'foo', timesImproved: 3},
            {startWeight: 8.0, bestWeight: 93.0, bestWeightReps: 9, exerciseName: 'Maastaveto', timesImproved: 4}
        ];
        shallowUserBackend = Object.create(UserBackend.prototype);
        userBackendIocOverride = sinon.stub(iocFactories, 'userBackend').returns(shallowUserBackend);
    });
    hooks.afterEach(() => {
        userBackendIocOverride.restore();
    });
    QUnit.test('laskee parhaista voimanostoista kokonaistulokset', assert => {
        const testUser: Enj.API.UserRecord = {id: 'uid', bodyWeight: 45, isMale: 1};
        sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve(testUser));
        //
        const [rendered, componentInstance] = renderComponent();
        const done = assert.async();
        // Triggeröi componentWillReceiveProps, jonka router normaalisti suorittaa
        componentInstance.props.bestSets = testBestSets;
        componentInstance.componentWillReceiveProps({bestSets: testBestSets}).then(() => {
            //
            const totalScores = itu.scryRenderedDOMElementsWithClass(rendered, 'score');
            assert.equal(totalScores.length, 5, 'Pitäisi renderöidä 5 kokonaistulosta');
            const [total, wilks] = totalScores;
            const expectedTotal = getExpectedTotal();
            assert.equal(total.textContent, expectedTotal, 'Yhteistulos pitäisi olla tämä');
            assert.equal(wilks.textContent, getExpectedWilks(testUser.bodyWeight, true), 'Wilks pitäisi olla tämä');
            assert.equal(itu.findRenderedDOMElementWithTag(rendered, 'ul').textContent, getExpectedStrengthLevelsContent(testUser));
            //
            const powerLiftDetails = itu.scryRenderedDOMElementsWithTag(rendered, 'tr');
            assert.equal(powerLiftDetails[0].textContent, getExpectedPowerLiftDetails(testBestSets[1]));
            assert.equal(powerLiftDetails[1].textContent, getExpectedPowerLiftDetails(testBestSets[0]));
            assert.equal(powerLiftDetails[2].textContent, getExpectedPowerLiftDetails(testBestSets[3]));
            done();
        });
    });
    QUnit.test('näyttää tulokset, vaikkei kaikkia voimanostoliikkeitä ole saatavilla', assert => {
        const testUser = {id: 'uid', bodyWeight: null, isMale: null};
        sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve(testUser));
        //
        const [rendered, componentInstance] = renderComponent();
        const done = assert.async();
        // bestSets, josta puuttuu jalkakyykky, ja maastaveto
        componentInstance.props.bestSets = [testBestSets[0]];
        componentInstance.componentWillReceiveProps({bestSets: componentInstance.props.bestSets}).then(() => {
            //
            const totalScores = itu.scryRenderedDOMElementsWithClass(rendered, 'score');
            const [total, wilks] = totalScores;
            assert.equal(total.textContent, getExpectedTotal([0]), 'Yhteistulos pitäisi olla tämä');
            assert.equal(wilks.textContent, getExpectedWilks(0, true, [0]), 'Wilks pitäisi olla tämä');
            assert.equal(itu.findRenderedDOMElementWithTag(rendered, 'ul').textContent, getExpectedStrengthLevelsContent(testUser, {
                squat: '-',
                deadlift: '-'
            }));
            //
            const [squatDetails, benchDetails, deadliftDetails] = itu.scryRenderedDOMElementsWithTag(rendered, 'tr');
            assert.equal(squatDetails.textContent, testBestSets[1].exerciseName+'--');
            assert.equal(benchDetails.textContent, getExpectedPowerLiftDetails(testBestSets[0]));
            assert.equal(deadliftDetails.textContent, testBestSets[3].exerciseName+'--');
            done();
        });
    });
    QUnit.test('Laskee tulokset uudelleen Asetukset-lomakkeen arvoilla', assert => {
        const testUser: Enj.API.UserRecord = {id: 'uid', bodyWeight: 50, isMale: 1};
        sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve(testUser));
        const userDataUpdateSpy = sinon.spy(shallowUserBackend, 'update');
        //
        const [rendered, componentInstance] = renderComponent();
        const done = assert.async();
        const newBodyWeight = 60;
        let levelsBefore;
        componentInstance.props.bestSets = testBestSets;
        componentInstance.componentWillReceiveProps({bestSets: testBestSets}).then(() => {
            const scores = itu.scryRenderedDOMElementsWithClass(rendered, 'score');
            levelsBefore = [scores[2].textContent, scores[3].textContent, scores[4].textContent];
            // Avaa lomake & muuta jotain
            utils.findButtonByContent(rendered, 'Asetukset').click();
            const weightInput = itu.scryRenderedDOMElementsWithTag(rendered, 'input')[0] as HTMLInputElement;
            weightInput.value = newBodyWeight.toString();
            utils.triggerEvent('input', weightInput);
            // Hyväksy arvot
            const confirmSpy = sinon.spy(itu.findRenderedVNodeWithType(rendered, SettingsForm).children, 'confirm');
            utils.findButtonByContent(rendered, 'Ok').click();
            return confirmSpy.firstCall.returnValue;
        // Odota, että lomakkeen confirm-promise resolvaa
        }).then(() => {
            // Assertoi, että lomake sulkeutui, ja arvot laskettiin uudestaan
            assert.ok(userDataUpdateSpy.notCalled, 'Ei pitäisi tallentaa arvoja,' +
                ' jos checkboxia ei valittuna');
            assertNewScores(assert, rendered, Object.assign(testUser, {bodyWeight: newBodyWeight}), levels => {
                assert.notEqual(levels[0].textContent, levelsBefore[0], 'Pitäisi renderöidä uusi Jalkakyykky-level');
                assert.notEqual(levels[1].textContent, levelsBefore[1], 'Pitäisi renderöidä uusi Penkkipunnerrus-level');
                assert.notEqual(levels[2].textContent, levelsBefore[2], 'Pitäisi renderöidä uusi Maastaveto-level');
            });
            done();
        });
    });
    QUnit.test('Tallentaa uudet Asetukset-lomakkeen arvot, jos checkbox on valittuna', assert => {
        const testUser: Enj.API.UserRecord = {id: 'ud', bodyWeight: 30, isMale: null};
        sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve(testUser));
        const userDataUpdateStub = sinon.stub(shallowUserBackend, 'update')
            .returns(Promise.resolve(1));
        //
        const [rendered, componentInstance] = renderComponent();
        const done = assert.async();
        componentInstance.props.bestSets = testBestSets;
        let firstStrengthTableRowBefore;
        componentInstance.componentWillReceiveProps({bestSets: testBestSets}).then(() => {
            utils.findButtonByAttribute(rendered, 'title', 'Näytä taulukko').click();
            firstStrengthTableRowBefore = getRenderedStrengthTableRows(rendered)[1].textContent;
            // Avaa lomake & muuta isMale null -> 2
            utils.findButtonByContent(rendered, 'Asetukset').click();
            const isMaleSelectlist = itu.scryRenderedDOMElementsWithTag(rendered, 'select')[0] as HTMLSelectElement;
            isMaleSelectlist.selectedIndex = 2; // 0 = null, 1 = Mies, 2 = Nainen
            utils.triggerEvent('change', isMaleSelectlist);
            const saveValuesCheckbox = itu.scryRenderedDOMElementsWithTag(rendered, 'input')[1] as HTMLInputElement;
            saveValuesCheckbox.checked = true;
            utils.triggerEvent('change', saveValuesCheckbox);
            // Hyväksy arvot
            const confirmSpy = sinon.spy(itu.findRenderedVNodeWithType(rendered, SettingsForm).children, 'confirm');
            utils.findButtonByContent(rendered, 'Ok').click();
            return confirmSpy.firstCall.returnValue;
        }).then(() => {
            assert.ok(userDataUpdateStub.calledOnce, 'Pitäisi tallentaa arvot');
            const expextedNewUser = Object.assign({}, testUser, {isMale: 0});
            assert.deepEqual(userDataUpdateStub.firstCall.args, [expextedNewUser, '/me']);
            assertNewScores(assert, rendered, expextedNewUser);
            assert.notDeepEqual(getRenderedStrengthTableRows(rendered)[1].textContent,
                firstStrengthTableRowBefore,
                'Pitäisi päivittää strengthLevel-taulukon sisältö (male -> female)'
            );
            done();
        });
    });
    function getExpectedStrengthLevelsContent(testUser: Enj.API.UserRecord, expected = {} as any): string {
        return (
            'Jalkakyykky ' + (expected.squat || getExpectedStrengthLevel('squat', testBestSets[1], testUser)) +
            'Penkkipunnerrus ' + (expected.bench || getExpectedStrengthLevel('bench',testBestSets[0], testUser)) +
            'Maastaveto ' + (expected.deadlift || getExpectedStrengthLevel('deadlift', testBestSets[3], testUser))
        );
    }
    function assertNewScores(assert, rendered, testUser: Enj.API.UserRecord, and?: Function) {
        assert.deepEqual(itu.findRenderedDOMElementWithClass(rendered, 'inline-form'),
            undefined, 'Pitäisi sulkea asetuslomake');
        const scores = itu.scryRenderedDOMElementsWithClass(rendered, 'score');
        const wilks = scores[1].textContent;
        assert.equal(wilks, getExpectedWilks(testUser.bodyWeight, testUser.isMale !== 0), 'Wilks pitäisi olla tämä');
        assert.equal(itu.findRenderedDOMElementWithTag(rendered, 'ul').textContent, getExpectedStrengthLevelsContent(testUser));
        and && and(scores.slice(2));
    }
    function getExpectedTotal(includedTestSets: Array<number> = [1, 0, 3]) {
        let total = 0;
        includedTestSets.forEach(i => {
            total += formulae.oneRepMax(testBestSets[i].bestWeight, testBestSets[i].bestWeightReps);
        });
        return Math.round(total);
    }
    function getExpectedWilks(bodyWeight: number, isMale: boolean, includedTestSets?: Array<number>): number {
        return Math.round(formulae.wilksCoefficient(bodyWeight, isMale) * getExpectedTotal(includedTestSets));
    }
    function getExpectedStrengthLevel(lift: keyof Enj.powerLift, set: Enj.API.BestSet, user: Enj.API.UserRecord): string {
        return formulae.strengthLevel(lift, formulae.oneRepMax(set.bestWeight, set.bestWeightReps), user.bodyWeight, user.isMale !== 0);
    }
    function getExpectedPowerLiftDetails(set: Enj.API.BestSet): string {
        // esim Penkkipunnerrus 12 (10 x 6)
        return (
            set.exerciseName +
            Math.round(formulae.oneRepMax(set.bestWeight, set.bestWeightReps)) +
            `(${set.bestWeight} x ${set.bestWeightReps})`
        );
    }
    function getRenderedStrengthTableRows(rendered) {
        const table = itu.findRenderedDOMElementWithClass(rendered, 'striped');
        return table.querySelectorAll('tr');
    }
});
