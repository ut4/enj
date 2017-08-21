import QUnit from 'qunitjs';
import sinon from 'sinon';
import utils from 'tests/utils';
import * as itu from 'inferno-test-utils';
import { formulae } from 'src/stat/StatBackend';
import StatsStrengthView from 'src/stat/StatsStrengthView';

QUnit.module('stat/StatStrengthView', hooks => {
    let testBestSets: Array<Enj.API.BestSet>;
    hooks.beforeEach(() => {
        testBestSets = [
            {startWeight: 5.0, bestWeight: 10.0, bestWeightReps: 6, exerciseName: 'Penkkipunnerrus', timesImproved: 1},
            {startWeight: 6.0, bestWeight: 11.0, bestWeightReps: 7, exerciseName: 'Jalkakyykky', timesImproved: 2},
            {startWeight: 7.0, bestWeight: 12.0, bestWeightReps: 8, exerciseName: 'foo', timesImproved: 3},
            {startWeight: 8.0, bestWeight: 13.0, bestWeightReps: 9, exerciseName: 'Maastaveto', timesImproved: 4}
        ];
    });
    QUnit.test('laskee parhaista voimanostoista kokonaistulokset', assert => {
        //
        const rendered = itu.renderIntoDocument(<StatsStrengthView bestSets={ testBestSets }/>);
        //
        const totalScores = itu.scryRenderedDOMElementsWithClass(rendered, 'score');
        assert.equal(totalScores.length, 3, 'Pitäisi renderöidä 3 kokonaistulosta');
        const [total, wilks, level] = totalScores;
        assert.equal(total.textContent, getExpectedTotal(), 'Yhteistulos pitäisi olla tämä');
        assert.equal(wilks.textContent, getExpectedWilks(), 'Wilks pitäisi olla tämä');
        assert.equal(level.textContent, getExpectedStrengthLevel(), 'Level pitäisi olla tämä');
        //
        const powerLiftDetails = itu.scryRenderedDOMElementsWithTag(rendered, 'tr');
        assert.equal(powerLiftDetails[0].textContent, getExpectedPowerLiftDetails(testBestSets[1]));
        assert.equal(powerLiftDetails[1].textContent, getExpectedPowerLiftDetails(testBestSets[0]));
        assert.equal(powerLiftDetails[2].textContent, getExpectedPowerLiftDetails(testBestSets[3]));
    });
    QUnit.test('näyttää tulokset, vaikkei kaikkia voimanostoliikkeitä ole saatavilla', assert => {
        //
        const rendered = itu.renderIntoDocument(<StatsStrengthView bestSets={ [testBestSets[0]] }/>);
        //
        const totalScores = itu.scryRenderedDOMElementsWithClass(rendered, 'score');
        const [total, wilks, level] = totalScores;
        assert.equal(total.textContent, getExpectedTotal([0]), 'Yhteistulos pitäisi olla tämä');
        assert.equal(wilks.textContent, getExpectedWilks(0, [0]), 'Wilks pitäisi olla tämä');
        assert.equal(level.textContent, getExpectedStrengthLevel(), 'Level pitäisi olla tämä');
        //
        const [squatDetails, benchDetails, deadliftDetails] = itu.scryRenderedDOMElementsWithTag(rendered, 'tr');
        assert.equal(squatDetails.textContent, testBestSets[1].exerciseName+'--');
        assert.equal(benchDetails.textContent, getExpectedPowerLiftDetails(testBestSets[0]));
        assert.equal(deadliftDetails.textContent, testBestSets[3].exerciseName+'--');
    });
    QUnit.test('Laskee tulokset uudelleen Asetukset-lomakkeen arvoilla', assert => {
        //
        const userData = {weight: 2, isMale: '1'};
        const rendered = itu.renderIntoDocument(<StatsStrengthView bestSets={ testBestSets } userData={ userData }/>);
        const componentInstance = itu.findRenderedVNodeWithType(rendered, StatsStrengthView).children as any;
        // Odota, että latautuu
        const done = assert.async();
        componentInstance.componentWillReceiveProps({bestSets: testBestSets}).then(() => {
            // Avaa lomake & muuta jotain
            utils.findButtonByContent(rendered, 'Asetukset').click();
            const weightInput = itu.scryRenderedDOMElementsWithTag(rendered, 'input')[0] as HTMLInputElement;
            weightInput.value = weightInput.value + 20;
            utils.triggerEvent('input', weightInput);
            // Hyväksy arvot
            utils.findButtonByContent(rendered, 'Ok').click();
            // Assertoi, että lomake sulkeutui, ja arvot laskettiin uudestaan
            assert.deepEqual(itu.findRenderedDOMElementWithClass(rendered, 'inline-form'),
                undefined, 'Pitäisi sulkea asetuslomake');
            const totalScores = itu.scryRenderedDOMElementsWithClass(rendered, 'score');
            const [wilks, level] = [totalScores[1], totalScores[2]];
            assert.equal(wilks.textContent, getExpectedWilks(parseFloat(weightInput.value)), 'Wilks pitäisi olla tämä');
            // TODO - assertoi että muuttuu
            assert.equal(level.textContent, getExpectedStrengthLevel(), 'Level pitäisi olla tämä');
            done();
        });
    });
    function getExpectedTotal(includedTestSets: Array<number> = [1, 0, 3]) {
        let total = 0;
        includedTestSets.forEach(i => {
            total += formulae.oneRepMax(testBestSets[i].bestWeight, testBestSets[i].bestWeightReps);
        });
        return Math.round(total);
    }
    function getExpectedWilks(weight?, includedTestSets?: Array<number>): number {
        return Math.round(formulae.wilksCoefficient(weight || 0, true) * getExpectedTotal(includedTestSets));
    }
    function getExpectedStrengthLevel(): string {
        return (formulae as any).strengthLevel();
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
