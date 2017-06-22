import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import WorkoutBackend from 'src/workout/WorkoutBackend';
const SECONDS_IN_DAY = 86400;

QUnit.module('workout/WorkoutBackend', hooks => {
    let httpStub: Http;
    let workoutBackend: WorkoutBackend;
    hooks.beforeEach(() => {
        httpStub = Object.create(Http.prototype);
        workoutBackend = new WorkoutBackend(httpStub, 'workout');
    });
    QUnit.test('getTodaysWorkouts hakee treenit timestamp rangella', assert => {
        const httpCallStub = sinon.stub(httpStub, 'get').returns('foo');
        //
        workoutBackend.getTodaysWorkouts();
        //
        assert.ok(httpCallStub.called);
        const expectedFromTimestamp = getDayStartTimestamp();
        const expectedToTimestamp = expectedFromTimestamp + SECONDS_IN_DAY - 1;
        assert.deepEqual(
            httpCallStub.firstCall.args[0].split('?')[1],
            `startFrom=${expectedFromTimestamp}&startTo=${expectedToTimestamp}`
        );
    });
    function getDayStartTimestamp() {
        const d = new Date();
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 1);
        return Math.floor(dayStart.getTime() / 1000);
    }
});