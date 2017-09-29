import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as infernoUtils from 'inferno-test-utils';
import ExerciseSelector from 'src/exercise/ExerciseSelector';
import utils from 'tests/utils';

QUnit.module('exercise/ExerciseSelector', hooks => {
    let testExerciseList: Array<Enj.API.ExerciseRecord>;
    hooks.beforeEach(() => {
        testExerciseList = [
            {id: 'uuid1', name: 'foo', variants: [{id: 'uuid3', content: 'foo', exerciseId: 'uuid1', userId: 'u'}], userId: 'u'},
            {id: 'uuid2', name: 'bat', variants: [], userId: 'u'}
        ];
    });
    QUnit.test('informoi valitun liikkeen (tai tyhjennyksen) onSelect-callbackille', assert => {
        const onSelectSpy = sinon.spy();
        //
        const rendered = infernoUtils.renderIntoDocument(
            <ExerciseSelector exerciseList={ testExerciseList } onSelect={ onSelectSpy }/>
        );
        const exerciseSelectInput = getSelectInput(rendered);
        // Simuloi liikeen valinta, ja tyhjennys
        utils.setDropdownIndex(1, exerciseSelectInput);
        utils.setDropdownIndex(0, exerciseSelectInput);
        // Assertoi, että informoi valinnan, ja tyhjennyksen onSelect-callbackille
        assert.ok(onSelectSpy.calledTwice, 'Olisi pitänyt kutsua onSelect kaksi kertaa');
        assert.deepEqual(onSelectSpy.firstCall.args, [
            testExerciseList[0], // selectedExercise
            null             // selectedVariant
        ]);
        assert.deepEqual(onSelectSpy.secondCall.args, [
            null,
            null
        ]);
    });
    QUnit.test('informoi valitun liikevariantin (tai tyhjennyksen) onSelect-callbackille', assert => {
        const onSelectSpy = sinon.spy();
        //
        const rendered = infernoUtils.renderIntoDocument(
            <ExerciseSelector exerciseList={ testExerciseList } onSelect={ onSelectSpy }/>
        );
        // Valitse ensin liike, jolla on variantt(eja)i
        const exerciseSelectInput = getSelectInput(rendered);
        utils.setDropdownIndex(1, exerciseSelectInput);
        onSelectSpy.reset();
        // Simuloi variantin valinta ja tyhjennys
        const variantSelectInput = getSelectInput(rendered, 1);
        utils.setDropdownIndex(1, variantSelectInput); // valinta
        utils.setDropdownIndex(0, variantSelectInput); // tyhjennys
        // Assertoi, että informoi variantin valinnan, ja tyhjennyksen onSelect-callbackille
        assert.ok(onSelectSpy.calledTwice, 'Olisi pitänyt kutsua onSelect kaksi kertaa');
        assert.deepEqual(onSelectSpy.firstCall.args, [
            testExerciseList[0],            // selectedExercise
            testExerciseList[0].variants[0] // selectedVariant
        ]);
        assert.deepEqual(onSelectSpy.secondCall.args, [
            testExerciseList[0],
            null
        ]);
    });
    QUnit.test('asettaa initial-treeniliikkeen valituksi dropdowniin', assert => {
        //
        const rendered = infernoUtils.renderIntoDocument(
            <ExerciseSelector
                exerciseList={ testExerciseList }
                initialExerciseId={ testExerciseList[1].id }
                onSelect={ () => null }/>
        );
        const exerciseSelectInput = getSelectInput(rendered);
        assert.equal(
            exerciseSelectInput.selectedIndex,
            2 // 0 == - (tyhjä option), 1 == testExerciseList[0], 2 == testExerciseList[1]
        );
    });
    QUnit.test('asettaa initial-treeniliikkeen & ja variantin valituksi dropdowniin', assert => {
        //
        const rendered = infernoUtils.renderIntoDocument(
            <ExerciseSelector
                exerciseList={ testExerciseList }
                initialExerciseId={ testExerciseList[0].id }
                initialExerciseVariantId={ testExerciseList[0].variants[0].id }
                onSelect={ () => null }/>
        );
        const exerciseSelectInput = getSelectInput(rendered);
        assert.equal(
            exerciseSelectInput.selectedIndex,
            1 // 0 == - (tyhjä option), 1 == testExerciseList[0], 2 == testExerciseList[1]
        );
        const exerciseVariantSelectInput = getSelectInput(rendered, 1);
        assert.equal(
            exerciseVariantSelectInput.selectedIndex,
            1 // 0 == - (tyhjä option), 1 == testExerciseList[0].variants[0]
        );
    });
    function getSelectInput(rendered, index?: number): HTMLSelectElement {
        return (infernoUtils.scryRenderedDOMElementsWithTag(
            rendered, 'select'
        )[index || 0]) as HTMLSelectElement;
    }
});
