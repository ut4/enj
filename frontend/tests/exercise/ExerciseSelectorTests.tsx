import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as infernoUtils from 'inferno-test-utils';
import ExerciseSelector from 'src/exercise/ExerciseSelector';
import utils from 'tests/utils';

QUnit.module('exercise/ExerciseSelector', hooks => {
    hooks.beforeEach(() => {
        this.testExerciseList = [{id:1, name:'foo', variants: []}];
    });
    QUnit.test('informoi valitun liikkeen (tai tyhjennyksen) onSelect-callbackille', assert => {
        const onSelectSpy = sinon.spy();
        const exerciseList = this.testExerciseList;
        //
        const rendered = infernoUtils.renderIntoDocument(
            <ExerciseSelector exerciseList={ exerciseList } onSelect={ onSelectSpy }/>
        );
        const exerciseSelectInput = getSelectInput(rendered);
        // Simuloi liikeen valinta, ja tyhjennys
        exerciseSelectInput.options[1].selected = true;
        utils.triggerOnChange(exerciseSelectInput);
        exerciseSelectInput.options[0].selected = true;
        utils.triggerOnChange(exerciseSelectInput);
        // Assertoi, että informoi valinnan, ja tyhjennyksen onSelect-callbackille
        assert.ok(onSelectSpy.calledTwice, 'Olisi pitänyt kutsua onSelect kaksi kertaa');
        assert.deepEqual(onSelectSpy.firstCall.args, [
            exerciseList[0], // selectedExercise
            null             // selectedVariant
        ]);
        assert.deepEqual(onSelectSpy.secondCall.args, [
            null,
            null
        ]);
    });
    QUnit.test('informoi valitun liikevariantin (tai tyhjennyksen) onSelect-callbackille', assert => {
        const onSelectSpy = sinon.spy();
        const exerciseList = this.testExerciseList;
        exerciseList[0].variants = [{id: 2, content: 'foo'}];
        //
        const rendered = infernoUtils.renderIntoDocument(
            <ExerciseSelector exerciseList={ exerciseList } onSelect={ onSelectSpy }/>
        );
        // Valitse ensin liike, jolla on variantt(eja)i
        const exerciseSelectInput = getSelectInput(rendered);
        exerciseSelectInput.options[1].selected = true;
        utils.triggerOnChange(exerciseSelectInput);
        onSelectSpy.reset();
        // Simuloi variantin valinta ja tyhjennys
        const variantSelectInput = getSelectInput(rendered, 1);
        variantSelectInput.options[1].selected = true; // valinta
        utils.triggerOnChange(variantSelectInput);
        variantSelectInput.options[0].selected = true; // tyhjennys
        utils.triggerOnChange(variantSelectInput);
        // Assertoi, että informoi variantin valinnan, ja tyhjennyksen onSelect-callbackille
        assert.ok(onSelectSpy.calledTwice, 'Olisi pitänyt kutsua onSelect kaksi kertaa');
        assert.deepEqual(onSelectSpy.firstCall.args, [
            exerciseList[0],            // selectedExercise
            exerciseList[0].variants[0] // selectedVariant
        ]);
        assert.deepEqual(onSelectSpy.secondCall.args, [
            exerciseList[0],
            null
        ]);
    });
    function getSelectInput(rendered, index?: number): HTMLSelectElement {
        return (infernoUtils.scryRenderedDOMElementsWithTag(
            rendered, 'select'
        )[index || 0]) as HTMLSelectElement;
    }
});
