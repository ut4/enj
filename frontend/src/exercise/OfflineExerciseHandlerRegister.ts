import AbstractOfflineHandlerRegister from 'src/offline/AbstractOfflineHandlerRegister';
import OfflineHttp from 'src/common/OfflineHttp';

/**
 * Sisältää handerit, jotka vastaa /api/exercise/* -REST-pyynnöistä yhteydettömän
 * tilan aikana.
 */
class OfflineExerciseHandlerRegister extends AbstractOfflineHandlerRegister<Enj.API.ExerciseRecord> {
    /**
     * Rekisteröi kaikki /api/exercise/* offline-handlerit.
     */
    public registerHandlers(offlineHttp: OfflineHttp) {
        //
        offlineHttp.addHandler('POST', 'exercise', exercise => this.insert(exercise));
        offlineHttp.addHandler('PUT', 'exercise/*', exercise => this.update(exercise));
        //
        offlineHttp.addHandler('POST', 'exercise/variant', exerciseVariant =>
            this.insertVariant(exerciseVariant)
        );
    }
    /**
     * Handlaa POST /api/exercise REST-pyynnön.
     */
    public insert(exercise: Enj.API.ExerciseRecord) {
        return this.updateCache(cachedExercises => {
            // Lisää uusi liike cachetaulukon alkuun (uusin ensin)
            exercise.id = this.backend.utils.uuidv4();
            cachedExercises.unshift(exercise);
            // Palauta feikattu backendin vastaus
            return {insertCount: 1};
        });
    }
    /**
     * Handlaa PUT /api/exercise/{exerciseId} REST-pyynnön.
     */
    public update(exercise: Enj.API.ExerciseRecord) {
        return this.updateCache(cachedExercises => {
            Object.assign(this.findItemById(exercise.id, cachedExercises), exercise);
            return {updateCount: 1};
        });
    }
    /**
     * Handlaa POST /api/exercise/variant REST-pyynnön.
     */
    public insertVariant(exerciseVariant: Enj.API.ExerciseVariantRecord) {
        return this.updateCache(cachedExercises => {
            // Lisää uusi variantti sille kuuluvan liikeen varianttilistaan
            const parentExerciseRef = this.findItemById(exerciseVariant.exerciseId, cachedExercises);
            exerciseVariant.id = this.backend.utils.uuidv4();
            parentExerciseRef.variants.push(exerciseVariant);
            //
            return {insertCount: 1};
        });
    }
}

export default OfflineExerciseHandlerRegister;