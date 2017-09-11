import QUnit from 'qunitjs';
import * as itu from 'inferno-test-utils';
import utils, { validationTestUtils as vtu } from 'tests/utils';
import { templates } from 'src/ui/ValidatingComponent';
import BasicUserInputs from 'src/user/BasicUserInputs';

QUnit.module('user/BasicUserInputs', hooks => {
    QUnit.test('validoi lomakkeen', assert => {
        const testUser = {isMale: 1, bodyWeight: 55.5};
        const rendered = itu.renderIntoDocument(<BasicUserInputs user={ testUser }/>);
        assert.equal(vtu.getRenderedValidationErrors(rendered).length, 0, 'Ei pitäisi renderöidä virheviestejä');
        assert.ok(vtu.isValid(rendered, BasicUserInputs), 'Pitäisi olla validi');
        // Aseta virheellinen paino
        const bodyWeightInput = utils.findInputByName(rendered, 'bodyWeight');
        bodyWeightInput.value = '10';
        utils.triggerEvent('input', bodyWeightInput);
        assert.equal(
            vtu.getRenderedValidationErrors(rendered)[0].textContent,
            templates.min('Paino', 20)
        );
        assert.notOk(vtu.isValid(rendered, BasicUserInputs), 'Ei pitäisi olla validi');
    });
    QUnit.test('asettaa initial-arvot', assert => {
        const testUser = {isMale: 0, bodyWeight: 55.5};
        const rendered = itu.renderIntoDocument(<BasicUserInputs user={ testUser }/>);
        const isMaleInput = utils.findElementByAttribute<HTMLSelectElement>(rendered, 'select', 'name', 'isMale');
        assert.equal(isMaleInput.selectedIndex, 2); // -, Mies, Nainen
        const bodyWeightInput = utils.findInputByName(rendered, 'bodyWeight');
        assert.equal(bodyWeightInput.value, testUser.bodyWeight.toString());
        //
        const testUser2 = {isMale: null, bodyWeight: 0};
        const rendered2 = itu.renderIntoDocument(<BasicUserInputs user={ testUser2 }/>);
        const isMaleInput2 = utils.findElementByAttribute<HTMLSelectElement>(rendered2, 'select', 'name', 'isMale');
        assert.equal(isMaleInput2.selectedIndex, 0); // -, Mies, Nainen
        const bodyWeightInput2 = utils.findInputByName(rendered2, 'bodyWeight');
        assert.equal(bodyWeightInput2.value, '');
    });
});
