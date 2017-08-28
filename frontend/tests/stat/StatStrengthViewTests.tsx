import QUnit from 'qunitjs';
import sinon from 'sinon';
import utils from 'tests/utils';
import * as itu from 'inferno-test-utils';
import { formulae } from 'src/stat/StatBackend';
import UserBackend from 'src/user/UserBackend';
import StatsStrengthView from 'src/stat/StatsStrengthView';
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
        const testBodyWeight = 45;
        sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve({bodyWeight: testBodyWeight}));
        //
        const [rendered, componentInstance] = renderComponent();
        const done = assert.async();
        // Triggeröi componentWillReceiveProps, jonka router normaalisti suorittaa
        componentInstance.props.bestSets = testBestSets;
        componentInstance.componentWillReceiveProps({bestSets: testBestSets}).then(() => {
            //
            const totalScores = itu.scryRenderedDOMElementsWithClass(rendered, 'score');
            assert.equal(totalScores.length, 3, 'Pitäisi renderöidä 3 kokonaistulosta');
            const [total, wilks, level] = totalScores;
            const expectedTotal = getExpectedTotal();
            assert.equal(total.textContent, expectedTotal, 'Yhteistulos pitäisi olla tämä');
            assert.equal(wilks.textContent, getExpectedWilks(testBodyWeight, false), 'Wilks pitäisi olla tämä');
            assert.equal(level.textContent, getExpectedStrengthLevel(expectedTotal, testBodyWeight),
                'Level pitäisi olla tämä'
            );
            //
            const powerLiftDetails = itu.scryRenderedDOMElementsWithTag(rendered, 'tr');
            assert.equal(powerLiftDetails[0].textContent, getExpectedPowerLiftDetails(testBestSets[1]));
            assert.equal(powerLiftDetails[1].textContent, getExpectedPowerLiftDetails(testBestSets[0]));
            assert.equal(powerLiftDetails[2].textContent, getExpectedPowerLiftDetails(testBestSets[3]));
            done();
        });
    });
    QUnit.test('näyttää tulokset, vaikkei kaikkia voimanostoliikkeitä ole saatavilla', assert => {
        sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve({bodyWeight: 0}));
        //
        const [rendered, componentInstance] = renderComponent();
        const done = assert.async();
        componentInstance.props.bestSets = [testBestSets[0]];
        componentInstance.componentWillReceiveProps({bestSets: componentInstance.props.bestSets}).then(() => {
            //
            const totalScores = itu.scryRenderedDOMElementsWithClass(rendered, 'score');
            const [total, wilks, level] = totalScores;
            assert.equal(total.textContent, getExpectedTotal([0]), 'Yhteistulos pitäisi olla tämä');
            assert.equal(wilks.textContent, getExpectedWilks(0, false, [0]), 'Wilks pitäisi olla tämä');
            assert.equal(level.textContent, getExpectedStrengthLevel(0, 0), 'Level pitäisi olla tämä');
            //
            const [squatDetails, benchDetails, deadliftDetails] = itu.scryRenderedDOMElementsWithTag(rendered, 'tr');
            assert.equal(squatDetails.textContent, testBestSets[1].exerciseName+'--');
            assert.equal(benchDetails.textContent, getExpectedPowerLiftDetails(testBestSets[0]));
            assert.equal(deadliftDetails.textContent, testBestSets[3].exerciseName+'--');
            done();
        });
    });
    QUnit.test('Laskee tulokset uudelleen Asetukset-lomakkeen arvoilla', assert => {
        const userData = {bodyWeight: 50, isMale: 1};
        sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve(userData));
        const userDataUpdateSpy = sinon.spy(shallowUserBackend, 'update');
        //
        const [rendered, componentInstance] = renderComponent();
        const done = assert.async();
        const newBodyWeight = 60;
        let levelBefore;
        componentInstance.props.bestSets = testBestSets;
        componentInstance.componentWillReceiveProps({bestSets: testBestSets}).then(() => {
            levelBefore = itu.scryRenderedDOMElementsWithClass(rendered, 'score')[2].textContent;
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
            assertNewScores(assert, rendered, newBodyWeight, true, level => {
                assert.notEqual(level, levelBefore);
            });
            done();
        });
    });
    QUnit.test('Tallentaa uudet Asetukset-lomakkeen arvot, jos checkbox on valittuna', assert => {
        const userData = {bodyWeight: 30, isMale: 0};
        sinon.stub(shallowUserBackend, 'get').returns(Promise.resolve(userData));
        const userDataUpdateStub = sinon.stub(shallowUserBackend, 'update')
            .returns(Promise.resolve(1));
        //
        const [rendered, componentInstance] = renderComponent();
        const done = assert.async();
        componentInstance.props.bestSets = testBestSets;
        componentInstance.componentWillReceiveProps({bestSets: testBestSets}).then(() => {
            // Avaa lomake & muuta jotain
            utils.findButtonByContent(rendered, 'Asetukset').click();
            const isMaleSelectlist = itu.findRenderedDOMElementWithTag(rendered, 'select') as HTMLSelectElement;
            isMaleSelectlist.selectedIndex = 0; // 0 = null, 1 = Mies, 2 = Nainen
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
            assert.deepEqual(userDataUpdateStub.firstCall.args, [{
                bodyWeight: userData.bodyWeight,
                isMale: null
            }, '/me']);
            assertNewScores(assert, rendered, userData.bodyWeight, false);
            done();
        });
    });
    function assertNewScores(assert, rendered, bodyWeight: number, isMale: boolean, and?: Function) {
        assert.deepEqual(itu.findRenderedDOMElementWithClass(rendered, 'inline-form'),
            undefined, 'Pitäisi sulkea asetuslomake');
        const totalScores = itu.scryRenderedDOMElementsWithClass(rendered, 'score');
        const [wilks, level] = [totalScores[1], totalScores[2]];
        assert.equal(wilks.textContent, getExpectedWilks(bodyWeight, isMale), 'Wilks pitäisi olla tämä');
        assert.equal(level.textContent, getExpectedStrengthLevel(getExpectedTotal(), bodyWeight),
            'Level pitäisi olla tämä'
        );
        and && and(level.textContent);
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
    function getExpectedStrengthLevel(totalScore: number, bodyWeigth: number): string {
        return formulae.strengthLevel(totalScore, bodyWeigth);
    }
    function getExpectedPowerLiftDetails(set: Enj.API.BestSet): string {
        // esim Penkkipunnerrus 12 (10 x 6)
        return (
            set.exerciseName +
            Math.round(formulae.oneRepMax(set.bestWeight, set.bestWeightReps)) +
            `(${set.bestWeight} x ${set.bestWeightReps})`
        );
    }
});
