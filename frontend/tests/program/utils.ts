import iocFactories from 'src/ioc';
import * as itu from 'inferno-test-utils';
import ProgramForm from 'src/program/ProgramForm';
import ProgramWorkoutModal from 'src/program/ProgramWorkoutModal';
import { dateUtils } from 'src/common/utils';

const programTestUtils = {
    getExpectedDateStr(unixTime: number): string {
        return dateUtils.getLocaleDateString(new Date(unixTime * 1000));
    },
    getSomeTestPrograms(): Array<Enj.API.Program> {
        return [
            {
                id:'uuid1',
                name: 'foo',
                start: 323384400,
                end: 323470800,
                workouts: this.getSomeTestProgramWorkouts(0, 'uuid1').slice(0, 1),
                userId: 'u'
            },
            {
                id:'uuid2',
                name: 'bar',
                start: 318204000,
                end: 318290400,
                workouts: this.getSomeTestProgramWorkouts(1, 'uuid2'),
                description: '...',
                userId: 'u'
            }
        ];
    },
    getSomeTestProgramWorkouts(nth: number = 0, programId: AAGUID = 'uuid1'): Array<Enj.API.ProgramWorkout> {
        const pwId1 = 'uuid' + (10 + nth * 2);
        const pwId2 = 'uuid' + (11 + nth * 2);
        return [
            {
                id: pwId1,
                name: 'fooworkout' + nth,
                occurrences: [{weekDay: 1, firstWeek: 0, repeatEvery: null}], // Ma, alkaen vk:sta 0, ei toistu
                ordinal: 1,
                exercises: [{
                    id: 'uuid' + (20 + nth * 2),
                    ordinal: 0,
                    programWorkoutId: pwId1,
                    exerciseId: 'uuid30',
                    exerciseName: 'asd',
                    exerciseVariantId: null,
                    exerciseVariantContent: null
                }],
                programId
            },
            {
                id: pwId2,
                name: 'barworkout' + nth,
                occurrences: [{weekDay: 3, firstWeek: 0, repeatEvery: null}], // Ke, alkaen vk:sta 0, ei toistu
                ordinal: 2,
                exercises: [{
                    id: 'uuid' + (21 + nth * 2),
                    ordinal: 1,
                    programWorkoutId: pwId2,
                    exerciseId: 'uuid31',
                    exerciseName: 'yui',
                    exerciseVariantId: null,
                    exerciseVariantContent: null
                }],
                programId
            }
        ];
    },
    getRenderedProgramForm(rendered): ProgramForm {
        return (itu.findRenderedVNodeWithType(rendered, ProgramForm).children as any) as ProgramForm;
    },
    getRenderedProgramWorkoutModal(rendered): ProgramWorkoutModal {
        return (itu.findRenderedVNodeWithType(rendered, ProgramWorkoutModal).children as any) as ProgramWorkoutModal;
    }
};

export default programTestUtils;
