import QUnit from 'qunitjs';
import { formulae } from 'src/stat/StatBackend';

QUnit.module('stat/StatBackend', hooks => {
    QUnit.test('strengthLevel', function (assert) {
        // [51.7,117.9,197.3,231.3,326.6,419.6]
        assert.equal(formulae.strengthLevel(0,50), 'Subpar');
        assert.equal(formulae.strengthLevel(117.8,51.6), 'Subpar');
        assert.equal(formulae.strengthLevel(117.8,51.7), 'Subpar');
        assert.equal(formulae.strengthLevel(117.9,51.7), 'Untrained');
        assert.equal(formulae.strengthLevel(117.9,51.8), 'Untrained');
        assert.equal(formulae.strengthLevel(197.2,51.8), 'Untrained');
        assert.equal(formulae.strengthLevel(197.3,51.8), 'Novice');
        assert.equal(formulae.strengthLevel(170,82), 'Untrained');
        assert.equal(formulae.strengthLevel(280,82), 'Novice');
        // [144.7,217.7,365.1,430.9,582.9,728],
        // [145.1,224.5,371.9,440,591.9,741.6]
        assert.equal(formulae.strengthLevel(200,145), 'Subpar');
        assert.equal(formulae.strengthLevel(431,145), 'Intermediate');
        assert.equal(formulae.strengthLevel(431,145.1), 'Novice');
        assert.equal(formulae.strengthLevel(741.5,145.1), 'Advanced');
        assert.equal(formulae.strengthLevel(741.6,145.1), 'Elite');
    });
});