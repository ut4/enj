import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';

const exerciseTestUtils = {
    selectExercise(rendered, exercise: Enj.API.Exercise) {
        const exerciseNameInput = this.getExerciseAutocomplete(rendered);
        utils.setInputValue(exercise.name, exerciseNameInput);
        utils.triggerEvent('awesomplete-selectcomplete', exerciseNameInput);
    },
    getSomeDropdownExercises(): Array<Enj.API.Exercise> {
         return [
             {id: 'someuuid', name: 'bar', variants: [], userId: 'u'},
             {id: 'someuuid2', name: 'byr', variants: [], userId: 'u'}
         ];
    },
    getSelectedExerciseName(rendered): string {
        return this.getExerciseAutocomplete(rendered).value;
    },
    getExerciseAutocomplete(rendered): HTMLInputElement {
        return utils.findInputByName(rendered, 'exerciseAutocomplete');
    },
    getContentInput(rendered): HTMLInputElement {
        return utils.findInputByName(rendered, 'content');
    }
};

export default exerciseTestUtils;
