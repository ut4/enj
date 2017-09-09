import RESTBackend  from 'src/common/RESTBackend';

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
    /**
     * Sama kuin ExerciseVariantBackend.get.
     */
    public getVariant(url?: string): Promise<Enj.API.ExerciseVariantRecord> {
        return this.exerciseVariantBackend.get(url);
    }
    /**
     * Sama kuin ExerciseVariantBackend.update.
     */
    public updateVariant(exerciseVariant: Enj.API.ExerciseVariantRecord, url?: string) {
        return this.exerciseVariantBackend.update(exerciseVariant, url);
    }
}

/**
 * Vastaa /api/exercise/variant -REST-pyynnöistä.
 */
class ExerciseVariantBackend extends RESTBackend<Enj.API.ExerciseVariantRecord> {}

export default ExerciseBackend;
