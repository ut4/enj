import QUnit from 'qunitjs';
import sinon from 'sinon';
import utils from 'tests/utils';
import * as itu from 'inferno-test-utils';
import StatsProgressView from 'src/stat/StatProgressView';

QUnit.module('stat/StatProgressView', hooks => {
    let testBestSets: Array<Enj.API.BestSet>;
    let rendered;
    let componentInstance;
    hooks.beforeEach(() => {
        testBestSets = [
            {startWeight: 5.0, bestWeight: 10.0, bestWeightReps: 6, exerciseName: 'Penkkipunnerrus', timesImproved: 2},
            {startWeight: 6.0, bestWeight: 11.0, bestWeightReps: 7, exerciseName: 'Jalkakyykky', timesImproved: 1}
        ];
        rendered = itu.renderIntoDocument(<StatsProgressView/>);
        componentInstance = itu.findRenderedVNodeWithType(rendered, StatsProgressView).children as any;
    });
    QUnit.test('listaa propseissa saadut parhaat sarjat', assert => {
        // Triggeröi componentWillReceiveProps, jonka router normaalisti suorittaa
        componentInstance.componentWillReceiveProps({bestSets: testBestSets});
        //
        const titles = itu.scryRenderedDOMElementsWithTag(rendered, 'h2');
        const improvements = itu.scryRenderedDOMElementsWithClass(rendered, 'score');
        const detailTables = itu.scryRenderedDOMElementsWithTag(rendered, 'table');
        assert.equal(titles.length, testBestSets.length, 'Pitäisi renderöidä nth otsikkoa');
        assert.equal(improvements.length, testBestSets.length, 'Pitäisi renderöidä nth .scorea');
        assert.equal(detailTables.length, testBestSets.length, 'Pitäisi renderöidä nth taulukkoa');
        // 1.
        assert.equal(titles[0].textContent, testBestSets[0].exerciseName);
        assert.equal(improvements[0].textContent, getExpectedImprovementDiff(testBestSets[0]));
        assert.equal(detailTables[0].textContent, getExpectedDetails(testBestSets[0]));
        // 2.
        assert.equal(titles[1].textContent, testBestSets[1].exerciseName);
        assert.equal(improvements[1].textContent, getExpectedImprovementDiff(testBestSets[1]));
        assert.equal(detailTables[1].textContent, getExpectedDetails(testBestSets[1]));
    });
    QUnit.test('Näyttää viestin, jos parhaita sarjoja ei vielä ole', assert => {
        componentInstance.componentWillReceiveProps({bestSets: []});
        assert.equal(itu.findRenderedDOMElementWithTag(rendered, 'div').textContent,
            'Ei vielä ennätyksiä.'
        );
    });
    function getExpectedDetails(set: Enj.API.BestSet): string {
        return (
            'Aloitustulos:' + set.startWeight +
            'kgParas tulos:' + set.bestWeight +
            'kgKehitys:' + getExpectedImprovementDiff(set) + '/' +
                getExpectedPercentualImprovement(set) +
            'Tulos parantunut:' + set.timesImproved + ' kertaa'
        );
    }
    function getExpectedPercentualImprovement(set: Enj.API.BestSet): string {
        const perc = ((set.bestWeight - set.startWeight) / set.startWeight * 100).toString();
        return (perc.indexOf('.') < 0 ? perc : parseFloat(perc).toFixed(1)) + '%';
    }
    function getExpectedImprovementDiff(set: Enj.API.BestSet): string {
        return set.bestWeight - set.startWeight + 'kg';
    }
});
