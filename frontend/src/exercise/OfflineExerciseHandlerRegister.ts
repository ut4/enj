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
}

export default OfflineExerciseHandlerRegister;
