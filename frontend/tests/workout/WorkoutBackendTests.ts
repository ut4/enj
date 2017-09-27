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
    QUnit.test('getDaysWorkouts hakee treenit unixTime rangella', assert => {
        const httpCallStub = sinon.stub(shallowHttp, 'get').returns('foo');
        //
        workoutBackend.getDaysWorkouts();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        workoutBackend.getDaysWorkouts(yesterday);
        //
        assert.ok(httpCallStub.calledTwice);
        const expectedFromUnixTime = getDayStartUnixTime();
        const expectedToUnixTime = expectedFromUnixTime + SECONDS_IN_DAY - 1;
        assert.deepEqual(
            httpCallStub.firstCall.args[0].split('?')[1],
            `startFrom=${expectedFromUnixTime}&startTo=${expectedToUnixTime}`
        );
        const expectedFromUnixTime2 = getDayStartUnixTime(yesterday);
        const expectedToUnixTime2 = expectedFromUnixTime2 + SECONDS_IN_DAY - 1;
        assert.deepEqual(
            httpCallStub.secondCall.args[0].split('?')[1],
            `startFrom=${expectedFromUnixTime2}&startTo=${expectedToUnixTime2}`
        );
    });
    function getDayStartUnixTime(date?: Date): number {
        const d = date || new Date();
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 1);
        return Math.floor(dayStart.getTime() / 1000);
    }
});