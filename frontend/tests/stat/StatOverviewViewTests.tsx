import QUnit from 'qunitjs';
import * as itu from 'inferno-test-utils';
import StatOverviewView from 'src/stat/StatOverviewView';

QUnit.module('stat/StatOverviewView', hooks => {
    let testStats: Enj.API.Statistics;
    function renderComponent(): [any, any] {
        const rendered = itu.renderIntoDocument(<StatOverviewView/>);
        const componentInstance = itu.findRenderedVNodeWithType(rendered, StatOverviewView).children as any;
        return [rendered, componentInstance];
    }
    hooks.beforeEach(() => {
        testStats = {
            totalWorkoutCount: 4,
            totalWorkoutTime: 4184,
            averageWorkoutTime: 3460,
            longestWorkoutTime: 3866,
            shortestWorkoutTime: 1560,
            lifted: 45769,
            reps: 23674
        };
    });
    QUnit.test('Renderöi yleiset statistiikkatiedot', assert => {
        //
        const [rendered, componentInstance] = renderComponent();
        // Triggeröi componentWillReceiveProps, jonka router normaalisti suorittaa
        componentInstance.props.stats = testStats;
        componentInstance.componentWillReceiveProps({stats: testStats});
        //
        const statBoxes = itu.scryRenderedDOMElementsWithClass(rendered, 'box');
        assert.equal(statBoxes.length, 4, '$("div.box").length');
        assert.equal(statBoxes[0].textContent, getExpectedTotalCount(testStats));
        assert.equal(statBoxes[1].textContent, getExpectedWeightAndReps(testStats));
        const times = statBoxes[2].querySelectorAll('tr'); // otsikko pois
        assert.equal(times[0].textContent, getExpectedTime(testStats, 0));
        assert.equal(times[1].textContent, getExpectedTime(testStats, 1));
        assert.equal(times[2].textContent, getExpectedTime(testStats, 2));
        assert.equal(times[3].textContent, getExpectedTime(testStats, 3));
        assert.equal(statBoxes[3].textContent, 'todo');
    });
    QUnit.test('näyttää viestin mikäli dataa ei ole', assert => {
        //
        const [rendered, componentInstance] = renderComponent();
        componentInstance.props.stats = null;
        componentInstance.componentWillReceiveProps({stats: null});
        //
        const content = itu.findRenderedDOMElementWithTag(rendered, 'div');
        assert.equal(content.textContent, 'Ei löytynyt mitään.');
    });
    function getExpectedTotalCount(stats: Enj.API.Statistics): string {
        return `Treenejä${stats.totalWorkoutCount} kpl`;
    }
    function getExpectedWeightAndReps(stats: Enj.API.Statistics): string {
        return `Nostettu yhteensä${stats.lifted} kg${stats.reps} toistoa`;
    }
    function getExpectedTime(stats: Enj.API.Statistics, nth): string {
        switch (nth) {
            case 0 :
                return `${getExpectedReadableTime(stats.totalWorkoutTime)}Yhteensä`;
            case 1 :
                return `${getExpectedReadableTime(stats.averageWorkoutTime)}Keskimäärin`;
            case 2 :
                return `${getExpectedReadableTime(stats.longestWorkoutTime)}Pisin`;
            case 3 :
                return `${getExpectedReadableTime(stats.shortestWorkoutTime)}Lyhin`;
        }
    }
    // https://stackoverflow.com/questions/8211744/convert-time-interval-given-in-seconds-into-more-human-readable-form#answer-8211778
    function getExpectedReadableTime(seconds: number): string {
        const numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
        const numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
        const numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
        return `${numhours}h${numminutes}m${numseconds}s`;
    }
});
