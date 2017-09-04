import QUnit from 'qunitjs';
import { formulae } from 'src/stat/StatBackend';

QUnit.module('stat/StatBackend', hooks => {
    QUnit.test('formulae.strengthLevel(squat, men)', function (assert) {
        // 1. painoluokka/rivi
        assert.equal(formulae.strengthLevel('squat',0,50,true), 'Subpar');
        assert.equal(formulae.strengthLevel('squat',36.28,51.70,true), 'Subpar');
        assert.equal(formulae.strengthLevel('squat',36.29,51.71,true), 'Untrained');
        assert.equal(formulae.strengthLevel('squat',65.75,51.71,true), 'Untrained');
        assert.equal(formulae.strengthLevel('squat',65.78,51.71,true), 'Novice');
        assert.equal(formulae.strengthLevel('squat',108.86,51.71,true), 'Advanced');
        assert.equal(formulae.strengthLevel('squat',145.15,51.71,true), 'Elite');
        // 3. painoluokka/rivi
        assert.equal(formulae.strengthLevel('squat',40.81,59.87,true), 'Subpar');
        assert.equal(formulae.strengthLevel('squat',40.82,59.87,true), 'Untrained');
        assert.equal(formulae.strengthLevel('squat',77.12,59.87,true), 'Novice');
        assert.equal(formulae.strengthLevel('squat',167.83,59.87,true), 'Elite');
        // Viimeinen painoluokka/rivi and beyond
        assert.equal(formulae.strengthLevel('squat',68.03,145.15,true), 'Subpar');
        assert.equal(formulae.strengthLevel('squat',68.03,14515,true), 'Subpar');
        assert.equal(formulae.strengthLevel('squat',68.04,145.15,true), 'Untrained');
        assert.equal(formulae.strengthLevel('squat',149.69,145.15,true), 'Intermediate');
        assert.equal(formulae.strengthLevel('squat',269.89,145.15,true), 'Elite');
        assert.equal(formulae.strengthLevel('squat',269.89,200,true), 'Elite');
    });
    QUnit.test('formulae.strengthLevel palauttaa eri tuloksen jos isMale = false', function (assert) {
        const strengthLevelMen = formulae.strengthLevel('squat',65.78,51.71,true);
        const strengthLevelWomen = formulae.strengthLevel('squat',65.78,51.71,false);
        assert.notEqual(strengthLevelWomen, strengthLevelMen, 'Pitäisi palauttaa eri tulos');
    });
});