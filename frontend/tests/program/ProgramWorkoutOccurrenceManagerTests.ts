import QUnit from 'qunitjs';
import sinon from 'sinon';
import { occurrenceFinder } from 'src/program/ProgramWorkoutOccurrencesManager';

const MONDAY = 1;
const FIRST_WEEK = 0;

QUnit.module('program/occurrenceFinder', hooks => {
    QUnit.test('validoi inputit', assert => {
        const testProgramWorkouts = [
            {name: 'pw1', occurrences: [{weekDay: 1, firstWeek: 0, repeatEvery: 0}]},
            {name: 'pw2', occurrences: [{weekDay: 3, firstWeek: 0, repeatEvery: 7}]},
            {name: 'pw3', occurrences: [{weekDay: 5, firstWeek: 1, repeatEvery: 7}]},
            {name: 'pw4', occurrences: [{weekDay: 0, firstWeek: 1, repeatEvery: 14}]}
        ] as any;
        // -- Maanantain treeni (testProgramWorkouts[0]) -----------------------
        assertFindsProgramWorkout(MONDAY, FIRST_WEEK, 0);
        assertFindsProgramWorkout(MONDAY, FIRST_WEEK + 1, -1);
        assertFindsProgramWorkout(MONDAY + 1, FIRST_WEEK, -1);
        // -- Keskiviikon treeni (testProgramWorkouts[1]) ----------------------
        assertFindsProgramWorkout(MONDAY + 2, FIRST_WEEK, 1);
        assertFindsProgramWorkout(MONDAY + 2, FIRST_WEEK + 1, 1);
        assertFindsProgramWorkout(MONDAY + 2, FIRST_WEEK + 2, 1);
        // -- Perjantain treeni (testProgramWorkouts[2])- ----------------------
        assertFindsProgramWorkout(MONDAY + 4, FIRST_WEEK, -1);
        assertFindsProgramWorkout(MONDAY + 4, FIRST_WEEK + 1, 2);
        assertFindsProgramWorkout(MONDAY + 4, FIRST_WEEK + 2, 2);
        // -- Sunnuntain treeni (testProgramWorkouts[3])- ----------------------
        assertFindsProgramWorkout(MONDAY - 1, FIRST_WEEK, -1);
        assertFindsProgramWorkout(MONDAY - 1, FIRST_WEEK + 1, 3);
        assertFindsProgramWorkout(MONDAY - 1, FIRST_WEEK + 2, -1);
        assertFindsProgramWorkout(MONDAY - 1, FIRST_WEEK + 3, 3);
        //
        function assertFindsProgramWorkout(weekDay: number, nthWeek: number, expectedNthPrgramWorkout: number) {
            assert.deepEqual(
                occurrenceFinder.findWorkout(testProgramWorkouts, weekDay, nthWeek),
                expectedNthPrgramWorkout > -1
                    ? [testProgramWorkouts[expectedNthPrgramWorkout], expectedNthPrgramWorkout]
                    : [undefined, -1],
                `findWorkout(testProgramWorkouts, ${weekDay}, ${nthWeek})`
            );
        }
    });
});
