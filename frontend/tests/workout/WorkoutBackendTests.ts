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
    QUnit.test('getDaysWorkouts hakee treenit timestamp rangella', assert => {
        const httpCallStub = sinon.stub(shallowHttp, 'get').returns('foo');
        //
        workoutBackend.getDaysWorkouts();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        workoutBackend.getDaysWorkouts(yesterday);
        //
        assert.ok(httpCallStub.calledTwice);
        const expectedFromTimestamp = getDayStartTimestamp();
        const expectedToTimestamp = expectedFromTimestamp + SECONDS_IN_DAY - 1;
        assert.deepEqual(
            httpCallStub.firstCall.args[0].split('?')[1],
            `startFrom=${expectedFromTimestamp}&startTo=${expectedToTimestamp}`
        );
        const expectedFromTimestamp2 = getDayStartTimestamp(yesterday);
        const expectedToTimestamp2 = expectedFromTimestamp2 + SECONDS_IN_DAY - 1;
        assert.deepEqual(
            httpCallStub.secondCall.args[0].split('?')[1],
            `startFrom=${expectedFromTimestamp2}&startTo=${expectedToTimestamp2}`
        );
    });
    function getDayStartTimestamp(date?: Date): number {
        const d = date || new Date();
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 1);
        return Math.floor(dayStart.getTime() / 1000);
    }
});