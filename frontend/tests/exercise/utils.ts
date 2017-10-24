import * as itu from 'inferno-test-utils';
import utils from 'tests/utils';

const exerciseTestUtils = {
    selectExercise(rendered, nth) {
        const exerciseSelectEl = this.getExerciseSelect(rendered);
        exerciseSelectEl.options[nth].selected = true; // note 0 == tyhjä option...
        utils.triggerEvent('change', exerciseSelectEl);
    },
    getSomeDropdownExercises(): Array<Enj.API.Exercise> {
         return [
             {id: 'someuuid', name: 'bar', variants: [], userId: 'u'},
             {id: 'someuuid2', name: 'byr', variants: [], userId: 'u'}
         ];
    },
    getSelectedExerciseIndex(rendered): number {
        return this.getExerciseSelect(rendered).selectedIndex;
    },
    getExerciseSelect(rendered): HTMLSelectElement {
        return itu.findRenderedDOMElementWithTag(rendered, 'select') as HTMLSelectElement;
    },
    getContentInput(rendered): HTMLInputElement {
        return itu.findRenderedDOMElementWithTag(rendered, 'input') as HTMLInputElement;
    }
};

export default exerciseTestUtils;
