import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import EditableWorkoutExerciseSetList from 'src/workout/EditableWorkoutExerciseSetList';
import WorkoutExerciseSetForm from 'src/workout/WorkoutExerciseSetForm';
import workoutTestUtils from 'tests/workout/utils';

QUnit.module('workout/EditableWorkoutExerciseSetList', hooks => {
    let testSets: Array<Enj.API.WorkoutExerciseSetRecord>;
    hooks.beforeEach(() => {
        testSets = workoutTestUtils.getSomeSets();
    });
    QUnit.test('Siirrä-painike swappaa kahden itemin paikat', assert => {
        const onChangeSpy = sinon.spy();
        const rendered = itu.renderIntoDocument(
            <EditableWorkoutExerciseSetList workoutExerciseSets={ testSets } onChange={ onChangeSpy }/>
        );
        const originalSets = JSON.parse(JSON.stringify(testSets));
        const setListInstance = workoutTestUtils.getMountedSetListInstance(rendered);
        assert.equal(getSetPosition(rendered, testSets[1]), 1);
        // Swappaa keskimmäinen treeni alimman kanssa & assertoi että vaihtui
        const swapButtons = workoutTestUtils.getSetListSwapButtons(rendered);
        swapButtons[1].click();
        assert.equal(getSetPosition(rendered, testSets[1]), 2,
            'Pitäisi siirtää keskimmäinen treeni alimmaksi'
        );
        assert.equal(getSetPosition(rendered, testSets[2]), 1,
            'Pitäisi siirtää alimmainen treeni keskimmäiseksi'
        );
        assert.deepEqual(setListInstance.getModifiedSets(), [testSets[2], testSets[1]],
            'getModifiedSets pitäisi palauttaa tähän mennessä muutetut itemit'
        );
        assert.deepEqual(setListInstance.props.workoutExerciseSets, originalSets,
            'Ei pitäisi mutatoida propseja ennen lomakkeen hyväksymistä'
        );
        assert.ok(onChangeSpy.calledOnce, 'Pitäisi triggeröidä props.onChange');
    });
    QUnit.test('Settilistan Poista-painike poistaa setin', assert => {
        const onChangeSpy = sinon.spy();
        const rendered = itu.renderIntoDocument(
            <EditableWorkoutExerciseSetList workoutExerciseSets={ testSets } onChange={ onChangeSpy }/>
        );
        const originalSets = JSON.parse(JSON.stringify(testSets));
        const setListInstance = workoutTestUtils.getMountedSetListInstance(rendered);
        assert.equal(getSetPosition(rendered, testSets[1]), 1);
        assert.deepEqual(setListInstance.getDeletedSets(), [],
            'getDeletedSets pitäisi palauttaa tyhjä taulukko, jos poistettuja settejä ei ole'
        );
        // Poista keskimmäinen itemi & assertoi että poistui
        const deleteButtons = workoutTestUtils.getSetListDeleteButtons(rendered);
        deleteButtons[1].click();
        assert.equal(getSetPosition(rendered, testSets[1]), -1,
            'Pitäisi renderöidä poistettu itemi näkymästä'
        );
        assert.deepEqual(setListInstance.getDeletedSets(), [testSets[1]],
            'getDeletedSets pitäisi palauttaa tähän mennessä poistetut itemit'
        );
        // Poista ensimmäinen itemi & assertoi että poistui
        deleteButtons[0].click();
        assert.equal(getSetPosition(rendered, testSets[0]), -1,
            'Pitäisi renderöidä poistettu itemi näkymästä'
        );
        assert.deepEqual(setListInstance.getDeletedSets(),
            [testSets[0], testSets[1]],
            'getDeletedSets pitäisi palauttaa tähän mennessä poistetut itemit'
        );
        assert.ok(onChangeSpy.calledTwice, 'Pitäisi triggeröidä props.onChange');
        assert.deepEqual(setListInstance.props.workoutExerciseSets, originalSets,
            'Ei pitäisi mutatoida propseja ennen lomakkeen hyväksymistä'
        );
    });
    function getSetPosition(rendered, set: Enj.API.WorkoutExerciseSetRecord): number {
        const list = itu.scryRenderedVNodesWithType(rendered, WorkoutExerciseSetForm);
        for (const item of list) {
            const {weight, reps} = item.props.workoutExerciseSet;
            if (weight === set.weight && reps === set.reps) {
                return list.indexOf(item);
            }
        }
        return -1;
    }
});