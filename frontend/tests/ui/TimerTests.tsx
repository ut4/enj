import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import Timer from 'src/ui/Timer';

QUnit.module('ui/Timer', hooks => {
    let clock: sinon.SinonFakeTimers;
    hooks.beforeEach(() => {
        clock = sinon.useFakeTimers();
    });
    hooks.afterEach(() => {
        clock.restore();
    });
    QUnit.test('renderöi ajan sekunnin välein oikeassa muodossa', assert => {
        //
        const start = Math.floor(Date.now() / 1000) - 9;
        const rendered = itu.renderIntoDocument(<Timer start={ start } end={ 0 }/>);
        //
        assert.equal(getTimeDisplayContents(rendered), '00:00:09');
        clock.tick(2000);
        assert.equal(getTimeDisplayContents(rendered), '00:00:11');
        clock.tick(1000*50);
        assert.equal(getTimeDisplayContents(rendered), '00:01:01');
        clock.tick(1000*60*10);
        assert.equal(getTimeDisplayContents(rendered), '00:11:01');
        clock.tick(1000*60*50);
        assert.equal(getTimeDisplayContents(rendered), '01:01:01');
    });
    QUnit.test('renderöi ajan vain kerran jos props.end > 0', assert => {
        //
        const rendered = itu.renderIntoDocument(<Timer start={ 1 } end={ 2 }/>);
        const expectedContents = '00:00:01';
        assert.equal(getTimeDisplayContents(rendered), expectedContents);
        clock.tick(2000);
        assert.equal(getTimeDisplayContents(rendered), expectedContents,
            'Ei pitäisi päivittää aikaa'
        );
    });
    QUnit.test('stop pysäyttää timerin', assert => {
        //
        const start = Math.floor(Date.now() / 1000) - 1;
        const rendered = itu.renderIntoDocument(<Timer start={ start } end={ 0 }/>);
        const timer = itu.findRenderedVNodeWithType(rendered, Timer).children;
        //
        assert.equal(getTimeDisplayContents(rendered), '00:00:01');
        clock.tick(1000);
        assert.equal(getTimeDisplayContents(rendered), '00:00:02');
        //
        (timer as any).stop();
        clock.tick(1000);
        assert.equal(getTimeDisplayContents(rendered), '00:00:02',
            'Ei pitäisi päivittää aikaa pysäytyksen jälkeen'
        );
    });
    function getTimeDisplayContents(rendered): string {
        return itu.findRenderedDOMElementWithTag(rendered, 'span').textContent;
    }
});
