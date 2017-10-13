import iocFactories from 'src/ioc';
import * as itu from 'inferno-test-utils';
import ProgramForm from 'src/program/ProgramForm';
import { dateUtils } from 'src/common/utils';

const programTestUtils = {
    getExpectedDateStr(unixTime: number): string {
        return dateUtils.getLocaleDateString(new Date(unixTime * 1000));
    },
    getSomeTestPrograms(): Array<Enj.API.ProgramRecord> {
        return [
            {
                id:'uuid1',
                name: 'foo',
                start: 323384400,
                end: 323470800,
                workouts: this.getSomeTestProgramWorkouts('uuid1').slice(0, 1),
                userId: 'u'
            },
            {
                id:'uuid2',
                name: 'bar',
                start: 318204000,
                end: 318290400,
                workouts: this.getSomeTestProgramWorkouts('uuid2'),
                description: '...',
                userId: 'u'
            }
        ];
    },
    getSomeTestProgramWorkouts(programId: AAGUID = 'uuid1'): Array<Enj.API.ProgramWorkoutRecord> {
        return [
            {
                id:'uuid10',
                name: 'fooworkout',
                occurrences: [{weekDay: 1, firstWeek: 0, repeatEvery: null}], // Ma, alkaen vk:sta 0, ei toistu
                ordinal: 1,
                programId
            },
            {
                id:'uuid11',
                name: 'barworkout',
                occurrences: [{weekDay: 3, firstWeek: 0, repeatEvery: null}], // Ke, alkaen vk:sta 0, ei toistu
                ordinal: 2,
                programId
            }
        ];
    },
    getRenderedProgramForm(rendered): ProgramForm {
        return (itu.findRenderedVNodeWithType(rendered, ProgramForm).children as any) as ProgramForm;
    }
};

export default programTestUtils;
