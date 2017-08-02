import QUnit from 'qunitjs';
import sinon from 'sinon';
import Http from 'src/common/Http';
import UserState from 'src/user/UserState';
import WorkoutBackend from 'src/workout/WorkoutBackend';
const SECONDS_IN_DAY = 86400;

QUnit.module('workout/WorkoutBackend', hooks => {
    let shallowHttp: Http;
    let shallowUserState: UserState;
    let workoutBackend: WorkoutBackend;
    hooks.beforeEach(() => {
        shallowHttp = Object.create(Http.prototype);
        shallowUserState = Object.create(UserState.prototype);
        workoutBackend = new WorkoutBackend(shallowHttp, 'workout', shallowUserState);
    });
    QUnit.test('getTodaysWorkouts hakee treenit timestamp rangella', assert => {
        const httpCallStub = sinon.stub(shallowHttp, 'get').returns('foo');
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