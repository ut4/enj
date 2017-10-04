import iocFactories from 'src/ioc';

const programTestUtils = {
    getExpectedDateStr(unixTime: number): string {
        return iocFactories.dateUtils().getLocaleDateString(new Date(unixTime * 1000));
    },
    getSomeTestPrograms(): Array<Enj.API.ProgramRecord> {
        return [
            {
                id:'uuid1',
                name: 'foo',
                start: 323384400,
                end: 323470800,
                workouts: this.getSomeTestProgramWorkouts().slice(0, 1),
                userId: 'u'
            },
            {
                id:'uuid2',
                name: 'bar',
                start: 318204000,
                end: 318290400,
                workouts: this.getSomeTestProgramWorkouts(),
                description: '...',
                userId: 'u'
            }
        ];
    },
    getSomeTestProgramWorkouts(): Array<Enj.API.ProgramWorkoutRecord> {
        return [
            {
                id:'uuid10',
                name: 'fooworkout',
                occurrences: [{weekDay: 1, repeatEvery: null}], // Ma, ei toistu
                ordinal: 1,
                programId: 'uuid1'
            },
            {
                id:'uuid11',
                name: 'barworkout',
                occurrences: [{weekDay: 3, repeatEvery: null}], // Ke, ei toistu
                ordinal: 2,
                programId: 'uuid1'
            }
        ];
    }
};

export default programTestUtils;
