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
            totalSetCount: 23,
            totalLifted: 45769,
            totalReps: 23674
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
        assert.equal(statBoxes.length, 5, '$("div.box").length');
        const totalWorkoutCountBox = statBoxes[0];
        const totalSetCountBox = statBoxes[1];
        const totalRepsBox = statBoxes[2];
        const totalLiftedBox = statBoxes[3];
        const workoutDurationsBox = statBoxes[4];
        assert.equal(totalWorkoutCountBox.textContent, getExpectedInfoBoxContent('totalWorkoutCount', testStats));
        assert.equal(totalSetCountBox.textContent, getExpectedInfoBoxContent('totalSetCount', testStats));
        assert.equal(totalRepsBox.textContent, getExpectedInfoBoxContent('totalReps', testStats));
        assert.equal(totalLiftedBox.textContent, getExpectedInfoBoxContent('totalLifted', testStats));
        const durations = workoutDurationsBox.querySelectorAll('li');
        assert.equal(durations[0].textContent, getExpectedDuration(testStats, 0));
        assert.equal(durations[1].textContent, getExpectedDuration(testStats, 1));
        assert.equal(durations[2].textContent, getExpectedDuration(testStats, 2));
        assert.equal(durations[3].textContent, getExpectedDuration(testStats, 3));
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
    function getExpectedInfoBoxContent(infoType: keyof Enj.API.Statistics, stats: Enj.API.Statistics) {
        switch (infoType) {
            case 'totalWorkoutCount':
                return `Treenejä${stats.totalWorkoutCount} kpl`;
            case 'totalSetCount':
                return `Sarjoja${stats.totalSetCount} kpl`;
            case 'totalLifted':
                return `Nostettu yhteensä${stats.totalLifted} kg`;
            case 'totalReps':
                return `Toistoja${stats.totalReps} kpl`;
        }
    }
    function getExpectedDuration(stats: Enj.API.Statistics, nth): string {
        switch (nth) {
            case 0 :
                return `Yhteensä${getExpectedReadableDuration(stats.totalWorkoutTime)}`;
            case 1 :
                return `Keskimäärin${getExpectedReadableDuration(stats.averageWorkoutTime)}`;
            case 2 :
                return `Pisin${getExpectedReadableDuration(stats.longestWorkoutTime)}`;
            case 3 :
                return `Lyhin${getExpectedReadableDuration(stats.shortestWorkoutTime)}`;
        }
    }
    // https://stackoverflow.com/questions/8211744/convert-time-interval-given-in-seconds-into-more-human-readable-form#answer-8211778
    function getExpectedReadableDuration(seconds: number): string {
        const numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
        const numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
        const numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
        return `${numhours}h ${numminutes}m ${numseconds}s`;
    }
});
