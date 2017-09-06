import RESTBackend  from 'src/common/RESTBackend';

class Exercise implements Enj.API.ExerciseRecord {
    public id;
    public name;
    public variants;
    public userId;
}

/**
 * Vastaa /api/exercise -REST-pyynnöistä.
 */
class ExerciseBackend extends RESTBackend<Enj.API.ExerciseRecord> {
    public exerciseVariantBackend: ExerciseVariantBackend;
    public constructor(http, urlNamespace) {
        super(http, urlNamespace);
        this.exerciseVariantBackend = new ExerciseVariantBackend(http, 'exercise/variant');
    }
    /**
     * Sama kuin ExerciseVariantBackend.insert.
     */
    public insertVariant(exerciseVariant: Enj.API.ExerciseVariantRecord) {
        return this.exerciseVariantBackend.insert(exerciseVariant);
    }
}

/**
 * Vastaa /api/exercise/variant -REST-pyynnöistä.
 */
class ExerciseVariantBackend extends RESTBackend<Enj.API.ExerciseVariantRecord> {}

export default ExerciseBackend;
export { Exercise };
