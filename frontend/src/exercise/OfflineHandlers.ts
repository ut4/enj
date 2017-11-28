import AbstractOfflineHandlerRegister from 'src/offline/AbstractOfflineHandlerRegister';
import OfflineHttp from 'src/common/OfflineHttp';

/**
 * Sisältää handerit, jotka vastaa /api/exercise/* -REST-pyynnöistä offline-
 * tilan aikana.
 */
class OfflineHandlers extends AbstractOfflineHandlerRegister<Enj.API.Exercise> {
    /**
     * Rekisteröi kaikki /api/exercise/* offline-handlerit.
     */
    public registerHandlers(offlineHttp: OfflineHttp) {
        //
        offlineHttp.addHandler('POST', 'exercise', exercise => this.insert(exercise, null, 'name'));
        offlineHttp.addHandler('PUT', 'exercise/*', exercise => this.update(exercise, null, 'name'));
        offlineHttp.addHandler('DELETE', 'exercise/*', exercise => this.delete(exercise.id));
        //
        offlineHttp.addHandler('POST', 'exercise/variant', exerciseVariant =>
            this.insertVariant(exerciseVariant)
        );
        offlineHttp.addHandler('PUT', 'exercise/variant/*', exerciseVariant =>
            this.updateVariant(exerciseVariant)
        );
        offlineHttp.addHandler('DELETE', 'exercise/variant/*', exerciseVariant =>
            this.deleteVariant(exerciseVariant.id)
        );
    }
    /**
     * Handlaa POST /api/exercise/variant REST-pyynnön.
     */
    public insertVariant(exerciseVariant: Enj.API.ExerciseVariant) {
        return this.updateCache(cachedExercises => {
            // Lisää uusi variantti sille kuuluvan liikeen varianttilistaan
            const parentExerciseRef = this.findItemById(exerciseVariant.exerciseId, cachedExercises);
            exerciseVariant.id = this.backend.utils.uuidv4();
            parentExerciseRef.variants.push(exerciseVariant);
            //
            return {insertCount: 1, insertId: exerciseVariant.id};
        });
    }
    /**
     * Handlaa PUT /api/exercise/variant/{exerciseVariantId} REST-pyynnön.
     */
    public updateVariant(exerciseVariant: Enj.API.ExerciseVariant) {
        return this.updateCache(cachedExercises => {
            // Päivitä liikevariantti sille kuuluvan liikeen varianttilistaan
            const exerciseVariantListRef = this.findItemById(exerciseVariant.exerciseId, cachedExercises).variants;
            Object.assign(exerciseVariantListRef.find(ev => ev.id === exerciseVariant.id), exerciseVariant);
            return {updateCount: 1};
        });
    }
    /**
    * Handlaa DELETE /api/exercise/variant/:id REST-pyynnön.
    */
    public deleteVariant(exerciseVariantId: AAGUID) {
        return this.deleteHasManyItem(exerciseVariantId, 'variants');
    }
}

export default OfflineHandlers;
