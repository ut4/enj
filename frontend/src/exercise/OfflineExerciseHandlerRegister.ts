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
        offlineHttp.addHandler('PUT', 'exercise/variant/*', exerciseVariant =>
            this.updateVariant(exerciseVariant)
        );
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
    /**
     * Handlaa PUT /api/exercise/variant/{exerciseVariantId} REST-pyynnön.
     */
    public updateVariant(exerciseVariant: Enj.API.ExerciseVariantRecord) {
        return this.updateCache(cachedExercises => {
            // Päivitä liikevariantti sille kuuluvan liikeen varianttilistaan
            const exerciseVariantListRef = this.findItemById(exerciseVariant.exerciseId, cachedExercises).variants;
            Object.assign(exerciseVariantListRef.find(ev => ev.id === exerciseVariant.id), exerciseVariant);
            return {updateCount: 1};
        });
    }
}

export default OfflineExerciseHandlerRegister;
