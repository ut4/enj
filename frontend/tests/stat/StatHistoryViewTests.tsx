import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';
import StatHistoryView from 'src/stat/StatHistoryView';
import StatBackend from 'src/stat/StatBackend';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import exerciseTestUtils from 'tests/exercise/utils';
import iocFactories from 'src/ioc';

QUnit.module('stat/StatHistoryView', hooks => {
    let testProgressSets: Array<Enj.API.ProgressSet>;
    let statBackendIocOverride: sinon.SinonStub;
    let shallowStatBackend: StatBackend;
    let testDropdownExercises: Array<Enj.API.ExerciseRecord>;
    let exerciseBackendIocOverride: sinon.SinonStub;
    let shallowExerciseBackend: ExerciseBackend;
    let fakeHistory;
    let historyIocOverride: sinon.SinonStub;
    hooks.beforeEach(() => {
        testProgressSets = [
            // Note. calculatedResultit hatusta vedettyjä
            {weight: 65, reps: 6, calculatedResult: 72.5, liftedAt: 1505987485-86320, exerciseName: 'exs'},
            {weight: 65, reps: 7, calculatedResult: 73.5, liftedAt: 1505987485, exerciseName: 'exs'},
            {weight: 70, reps: 6, calculatedResult: 74.25, liftedAt: 1505987485+86480, exerciseName: 'exs'},
            {weight: 72.5, reps: 6, calculatedResult: 74.3, liftedAt: 1505987485+172960, exerciseName: 'exs'},
            {weight: 72.5, reps: 7, calculatedResult: 75, liftedAt: 1505987485+259440, exerciseName: 'exs'}
        ];
        shallowStatBackend = Object.create(StatBackend.prototype);
        statBackendIocOverride = sinon.stub(iocFactories, 'statBackend').returns(shallowStatBackend);
        testDropdownExercises = exerciseTestUtils.getSomeDropdownExercises();
        shallowExerciseBackend = Object.create(ExerciseBackend.prototype);
        exerciseBackendIocOverride = sinon.stub(iocFactories, 'exerciseBackend').returns(shallowExerciseBackend);
        fakeHistory = {push: () => {}};
        historyIocOverride = sinon.stub(iocFactories, 'history').returns(fakeHistory);
    });
    hooks.afterEach(() => {
        statBackendIocOverride.restore();
        exerciseBackendIocOverride.restore();
        historyIocOverride.restore();
    });
    function renderView(progressSets, withParams?): Promise<{
        rendered: any;
        progressFetch: sinon.SinonStub;
        historyView: StatHistoryView
    }> {
        const progressFetch = typeof progressSets !== 'function'
            ? sinon.stub(shallowStatBackend, 'getProgress').returns(Promise.resolve(progressSets))
            : progressSets();
        const exerciseListFetch = sinon.stub(shallowExerciseBackend, 'getAll').returns(Promise.resolve(testDropdownExercises));
        //
        let params = {exerciseId: null, formula: null, before: null};
        if (withParams) { params = Object.assign(params, withParams); }
        const rendered = itu.renderIntoDocument(<StatHistoryView params={ params }/>);
        const historyView = itu.findRenderedVNodeWithType(rendered, StatHistoryView).children as any;
        historyView.PAGE_SIZE = 2;
        // Odota, että historia, ja liikelista latautuu
        return Promise.all([
            progressFetch.firstCall.returnValue,
            exerciseListFetch.firstCall.returnValue
        ]).then(
            () => typeof progressSets === 'function' || progressSets.length
        // Odota, että chart latautuu
                ? new Promise(resolve => {
                    historyView.getChart().on('created', () => resolve({rendered, progressFetch, historyView}));
                })
                : Promise.resolve({rendered, progressFetch, historyView: null}) as any
        );
    }
    QUnit.test('mount hakee historian backendistä ja renderöi ne chartiin', assert => {
        const done = assert.async();
        renderView(testProgressSets.slice(0, 3)).then(({rendered}) => {
            const labels = getRenderedChartLabels(rendered);
            assert.equal(labels.length, 3);
            assert.equal(labels[0].textContent, getExpectedLabelContent(testProgressSets[0].liftedAt));
            assert.equal(labels[1].textContent, getExpectedLabelContent(testProgressSets[1].liftedAt));
            assert.equal(labels[2].textContent, getExpectedLabelContent(testProgressSets[2].liftedAt));
            const points = getRenderedPoints(rendered);
            assert.equal(points.length, 3);
            assert.equal(points[0].getAttribute('ct:value'), testProgressSets[0].calculatedResult);
            assert.equal(points[1].getAttribute('ct:value'), testProgressSets[1].calculatedResult);
            assert.equal(points[2].getAttribute('ct:value'), testProgressSets[2].calculatedResult);
            done();
        });
    });
    QUnit.test('Käyttää urlissa passattua exerciseId:tä datan hakuun', assert => {
        const done = assert.async();
        const params = {exerciseId: testDropdownExercises[1].id};
        renderView([testProgressSets[0]], params).then(({rendered, progressFetch}) => {
            assert.deepEqual(progressFetch.firstCall.args[0], params.exerciseId); // 0=exerciseId, 1=formula, 2=before
            const exerciseSelectDropdown = getRenderedDropdowns(rendered)[0];
            assert.equal(exerciseSelectDropdown.selectedIndex, 1 + 1,// 0 = -
                'Pitäisi asettaa exercise-dropdownin selected-arvo'
            );
            done();
        });
    });
    QUnit.test('Käyttää urlissa passattua formulaa datan hakuun', assert => {
        const done = assert.async();
        const params = {formula: 'wathan'};
        renderView([testProgressSets[0]], params).then(({rendered, progressFetch}) => {
            assert.deepEqual(progressFetch.firstCall.args[1], params.formula); // 0=exerciseId, 1=formula, 2=before
            const formulaSelectDropdown = getRenderedDropdowns(rendered)[1];
            assert.equal(formulaSelectDropdown.value, params.formula,
                'Pitäisi asettaa formula-dropdownin selected-arvo'
            );
            done();
        });
    });
    QUnit.test('Käyttää urlissa passattua before-unixTimea datan hakuun', assert => {
        const done = assert.async();
        const params = {before: 1456992647};
        renderView([testProgressSets[0]], params).then(({rendered, progressFetch}) => {
            assert.deepEqual(progressFetch.firstCall.args[2], params.before); // 0=exerciseId, 1=formula, 2=before
            done();
        });
    });
    QUnit.test('mount näyttää viestin mikäli current-treenejä ei löydy', assert => {
        const done = assert.async();
        renderView([]).then(({rendered}) => {
            const rootElem = itu.scryRenderedDOMElementsWithTag(rendered, 'div')[0];
            assert.ok(/Ei sarjoja/.test(rootElem.innerHTML));
            done();
        });
    });
    QUnit.test('ExerciseSelectorin valinta triggeröi uudelleenohjauksen', assert => {
        const redirectSpy = sinon.spy(fakeHistory, 'push');
        const done = assert.async();
        renderView([testProgressSets[0]]).then(({rendered, progressFetch, historyView}) => {
            // Valitse jokin liike listasta
            const exerciseSelectDropdown = getRenderedDropdowns(rendered)[0];
            exerciseSelectDropdown.value = testDropdownExercises[1].id;
            utils.triggerEvent('change', exerciseSelectDropdown);
            const selectedExerciseId = exerciseSelectDropdown.value;
            // Ohjautuiko?
            assert.ok(redirectSpy.calledOnce, 'Pitäisi päivittää url uudella exerciseId:llä');
            assert.deepEqual(redirectSpy.firstCall.args,
                [`/treenihistoria/${selectedExerciseId}/${historyView.props.params.formula}`],
                'Pitäisi ohjautua tänne'
            );
            done();
        });
    });
    QUnit.test('Laskukaava-dropdownin valinta triggeröi uudelleenohjauksen', assert => {
        const redirectSpy = sinon.spy(fakeHistory, 'push');
        const done = assert.async();
        renderView([testProgressSets[0]]).then(({rendered, progressFetch, historyView}) => {
            // Valitse toinen laskukaava
            const formulaSelectDropdown = getRenderedDropdowns(rendered)[1];
            formulaSelectDropdown.value = 'wathan';
            utils.triggerEvent('change', formulaSelectDropdown);
            const selectedFormula = formulaSelectDropdown.value;
            // Ohjautuiko?
            assert.ok(redirectSpy.calledOnce, 'Pitäisi päivittää url uudella formulalla');
            assert.deepEqual(redirectSpy.firstCall.args,
                [`/treenihistoria/${historyView.props.params.exerciseId}/wathan`],
                'Pitäisi ohjautua tänne'
            );
            done();
        });
    });
    QUnit.test('"< Vanhemmat"-sivutuspainikkeen klikkaus triggeröi uudelleenohjauksen', assert => {
        const redirectSpy = sinon.spy(fakeHistory, 'push');
        const done = assert.async();
        let prevPaginationButton;
        let expectedParams;
        renderView(() => {
            const progressFetchStub = sinon.stub(shallowStatBackend, 'getProgress');
            progressFetchStub.onFirstCall().returns(Promise.resolve(testProgressSets.slice(2, 4)));
            progressFetchStub.onSecondCall().returns(Promise.resolve(testProgressSets.slice(0, 2)));
            return progressFetchStub;
        }).then(({rendered, progressFetch, historyView}) => {
            // Klikkaa "< Vanhemmat"(tulokset) -painiketta
            prevPaginationButton = utils.findButtonByContent(rendered, '< Vanhemmat');
            prevPaginationButton.click();
            // Ohjautuiko?
            expectedParams = {
                exerciseId: historyView.props.params.exerciseId,
                formula: historyView.props.params.formula,
                page: '-1',
                before: testProgressSets[2].liftedAt,
                after: 0
            };
            assert.ok(redirectSpy.calledOnce, 'Pitäisi päivittää urliin before-unixTime');
            assert.deepEqual(redirectSpy.firstCall.args,
                [
                    [
                        '/treenihistoria',
                        expectedParams.exerciseId,
                        expectedParams.formula,
                        expectedParams.page,
                        expectedParams.before,
                        expectedParams.after
                    ].join('/')
                ],
                'Pitäisi ohjautua tänne'
            );
            // Simuloi routerin normaalisti triggeröimä componentWillReceiveProps
            historyView.componentWillReceiveProps({params: expectedParams});
            return progressFetch.secondCall.returnValue;
        }).then(() => {
            // Klikkaa "< Vanhemmat" -painiketta uudestaan
            prevPaginationButton.click();
            // Ohjautuiko?
            const expectedParams2 = Object.assign(expectedParams, {
                page: '-2',
                before: testProgressSets[2].liftedAt,
                after: 0
            });
            assert.ok(redirectSpy.calledTwice, 'Pitäisi päivittää urliin before, ja after-unixTime');
            assert.deepEqual(redirectSpy.secondCall.args,
                [
                    [
                        '/treenihistoria',
                        expectedParams2.exerciseId,
                        expectedParams2.formula,
                        expectedParams2.page,
                        expectedParams2.before,
                        expectedParams2.after
                    ].join('/')
                ],
                'Pitäisi ohjautua tänne'
            );
            done();
        });
    });
    QUnit.test('"Uudemmat >"-sivutuspainikkeen klikkaus triggeröi uudelleenohjauksen', assert => {
        const redirectSpy = sinon.spy(fakeHistory, 'push');
        const done = assert.async();
        renderView(testProgressSets.slice(2, 4), {
            page: '-1',
            before: testProgressSets[2].liftedAt
        }).then(({rendered, progressFetch, historyView}) => {
            // Klikkaa "Uudemmat >"(tulokset) -painiketta
            const nextPaginationButton = utils.findButtonByContent(rendered, 'Uudemmat >');
            nextPaginationButton.click();
            // Ohjautuiko?
            assert.ok(redirectSpy.calledOnce, 'Pitäisi päivittää url');
            assert.deepEqual(redirectSpy.firstCall.args,
                [
                    [
                        '/treenihistoria',
                        historyView.props.params.exerciseId,
                        historyView.props.params.formula
                        // pitäisi poistaa page-parametri, koska uusin sivu
                        // pitäisi poistaa before-parametri, koska uusin sivu
                    ].join('/')
                ],
                'Pitäisi ohjautua tänne'
            );
            done();
        });
    });
    function getRenderedChartLabels(rendered): NodeListOf<HTMLSpanElement> {
        return getRenderedChart(rendered).querySelectorAll('.ct-label.ct-horizontal') as NodeListOf<HTMLSpanElement>;
    }
    function getRenderedPoints(rendered): NodeListOf<HTMLElement> {
        return getRenderedChart(rendered).querySelectorAll('.ct-point') as NodeListOf<HTMLElement>;
    }
    function getRenderedChart(rendered): HTMLDivElement {
        const chart = itu.findRenderedDOMElementWithClass(rendered, 'line-chart') as HTMLDivElement;
        if (!chart) {
            throw new Error('div.line-chart:ia ei löytynyt');
        }
        return chart;
    }
    function getRenderedDropdowns(rendered): Array<HTMLSelectElement> {
        return itu.scryRenderedDOMElementsWithTag(rendered, 'select') as Array<HTMLSelectElement>;
    }
    function getExpectedLabelContent(unixTime: number) {
        const d = new Date(unixTime * 1000);
        return `${d.getDate()}.${d.getMonth() + 1}`;
    }
});
