import QUnit from 'qunitjs';
import sinon from 'sinon';
import Component from 'inferno-component';
import * as itu from 'inferno-test-utils';
import StatBackend, { formulae } from 'src/stat/StatBackend';
import StatsView from 'src/stat/StatsView';
import iocFactories from 'src/ioc';

function newRouteAwareStatsViewComponent(url) {
    return class extends StatsView {
        public constructor(props, context) {
            context.router = {url};
            super(props, context);
        }
    };
}

QUnit.module('stat/StatView', hooks => {
    let shallowStatBackend: StatBackend;
    let statBackendIocOverride: sinon.SinonStub;
    let mockSubView: any;
    hooks.beforeEach(() => {
        const MockC = class extends Component<any, any> {};
        mockSubView = <MockC/>;
        mockSubView.props = {};
        //
        shallowStatBackend = Object.create(StatBackend.prototype);
        statBackendIocOverride = sinon.stub(iocFactories, 'statBackend').returns(shallowStatBackend);
    });
    hooks.afterEach(() => {
        statBackendIocOverride.restore();
    });
    function render(mockUrl: string): [any, sinon.SinonSpy] {
        const C = newRouteAwareStatsViewComponent(mockUrl);
        const loadHook = sinon.spy(C.prototype, 'componentWillReceiveProps');
        const rendered = itu.renderIntoDocument(<C children={ mockSubView }/>);
        return [rendered, loadHook];
    }
    QUnit.test('lataa parhaat sarjat StatProgressView alinäkymälle', assert => {
        sinon.stub(shallowStatBackend, 'getBestSets').returns(Promise.resolve('fo'));
        //
        const [rendered, loadHook] = render('/statistiikka/kehitys');
        const done = assert.async();
        loadHook.firstCall.returnValue.then(() => {
            assert.deepEqual(mockSubView.props.bestSets, 'fo', 'Pitäisi passata ' +
                'alinäkymälle parhaat sarjat');
            done();
        });
        //
        assertNthLinkHasCurrentClass(assert, rendered, 0);
    });
    QUnit.test('lataa parhaat sarjat StatStrengthView alinäkymälle', assert => {
        sinon.stub(shallowStatBackend, 'getBestSets').returns(Promise.resolve('fo'));
        const [rendered, loadHook] = render('/statistiikka/voima');
        //
        const done = assert.async();
        loadHook.firstCall.returnValue.then(() => {
            assert.deepEqual(mockSubView.props.bestSets, 'fo', 'Pitäisi passata ' +
                'alinäkymälle parhaat sarjat');
            done();
        });
        //
        assertNthLinkHasCurrentClass(assert, rendered, 1);
    });
    QUnit.test('lataa parhaat sarjat StatOverviewView alinäkymälle', assert => {
        //
        assert.strictEqual('todo', 'foo');
    });
    function assertNthLinkHasCurrentClass(assert, rendered, nth: number) {
        itu.scryRenderedDOMElementsWithTag(rendered, 'a').forEach((link, i) => {
            if (i !== nth) {
                assert.notOk(link.classList.contains('current'), 'Ei pitäisi sisältää CSS-luokkaa "current"');
            } else {
                assert.ok(link.classList.contains('current'), 'Pitäisi sisältää CSS-luokka "current"');
            }
        });
    }
});
