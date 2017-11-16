import QUnit from 'qunitjs';
import sinon from 'sinon';
import * as itu from 'inferno-test-utils';
import ExerciseSelector from 'src/exercise/ExerciseSelector';
import utils from 'tests/utils';

QUnit.module('exercise/ExerciseSelector', hooks => {
    let testExerciseList: Array<Enj.API.Exercise>;
    hooks.beforeEach(() => {
        testExerciseList = [
            {id: 'uuid1', name: 'foo', variants: [{id: 'uuid3', content: 'foo', exerciseId: 'uuid1', userId: 'u'}], userId: 'u'},
            {id: 'uuid2', name: 'bat', variants: [], userId: 'u'}
        ];
    });
    QUnit.test('informoi valitun liikkeen (tai tyhjennyksen) onSelect-callbackille', assert => {
        const onSelectSpy = sinon.spy();
        //
        const rendered = itu.renderIntoDocument(
            <ExerciseSelector exerciseList={ testExerciseList } onSelect={ onSelectSpy }/>
        );
        const exerciseNameInput = getAutocompleteInput(rendered);
        // Simuloi liikeen valinta, ja tyhjennys
        utils.setInputValue(testExerciseList[0].name, exerciseNameInput);
        utils.triggerEvent('awesomplete-selectcomplete', exerciseNameInput);
        utils.setInputValue('', exerciseNameInput);
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
        const rendered = itu.renderIntoDocument(
            <ExerciseSelector exerciseList={ testExerciseList } onSelect={ onSelectSpy }/>
        );
        // Valitse ensin liike, jolla on variantt(eja)i
        const exerciseNameInput = getAutocompleteInput(rendered);
        utils.setInputValue(testExerciseList[0].name, exerciseNameInput);
        utils.triggerEvent('awesomplete-selectcomplete', exerciseNameInput);
        onSelectSpy.reset();
        // Simuloi variantin valinta ja tyhjennys
        const variantSelectInput = getVariantSelectInput(rendered);
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
    QUnit.test('resetoi variantin, jos liike vaihtuu', assert => {
        const onSelectSpy = sinon.spy();
        //
        const rendered = itu.renderIntoDocument(
            <ExerciseSelector exerciseList={ testExerciseList } onSelect={ onSelectSpy }/>
        );
        // Valitse ensin liike, ja sen yksi variantti
        const exerciseNameInput = getAutocompleteInput(rendered);
        utils.setInputValue(testExerciseList[0].name, exerciseNameInput);
        utils.triggerEvent('awesomplete-selectcomplete', exerciseNameInput);
        const variantSelectInput = getVariantSelectInput(rendered, 1);
        utils.setDropdownIndex(1, variantSelectInput); // valinta
        onSelectSpy.reset();
        // Valitse sitten toinen liike
        utils.setInputValue(testExerciseList[1].name, exerciseNameInput);
        utils.triggerEvent('awesomplete-selectcomplete', exerciseNameInput);
        // Resetoiko edellisestä liikkeestä valitun variantin?
        assert.deepEqual(onSelectSpy.firstCall.args, [
            testExerciseList[1], // selectedExercise
            null                 // selectedVariant
        ]);
    });
    QUnit.test('asettaa initial-treeniliikkeen valituksi dropdowniin', assert => {
        //
        const rendered = itu.renderIntoDocument(
            <ExerciseSelector
                exerciseList={ testExerciseList }
                initialExerciseId={ testExerciseList[1].id }
                onSelect={ () => null }/>
        );
        const exerciseNameInput = getAutocompleteInput(rendered);
        assert.equal(
            exerciseNameInput.value,
            testExerciseList[1].name
        );
    });
    QUnit.test('asettaa initial-treeniliikkeen & ja variantin valituksi dropdowniin', assert => {
        //
        const rendered = itu.renderIntoDocument(
            <ExerciseSelector
                exerciseList={ testExerciseList }
                initialExerciseId={ testExerciseList[0].id }
                initialExerciseVariantId={ testExerciseList[0].variants[0].id }
                onSelect={ () => null }/>
        );
        const exerciseNameInput = getAutocompleteInput(rendered);
        assert.equal(
            exerciseNameInput.value,
            testExerciseList[0].name
        );
        const exerciseVariantSelectInput = getVariantSelectInput(rendered, 1);
        assert.equal(
            exerciseVariantSelectInput.selectedIndex,
            1 // 0 == - (tyhjä option), 1 == testExerciseList[0].variants[0]
        );
    });
    function getAutocompleteInput(rendered, index?: number): HTMLInputElement {
        return itu.findRenderedDOMElementWithTag(rendered, 'input') as HTMLInputElement;
    }
    function getVariantSelectInput(rendered, index?: number): HTMLSelectElement {
        return itu.findRenderedDOMElementWithTag(rendered, 'select') as HTMLSelectElement;
    }
});
