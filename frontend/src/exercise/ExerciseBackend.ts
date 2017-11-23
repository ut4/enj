import RESTBackend  from 'src/common/RESTBackend';

/**
 * Vastaa /api/exercise -REST-pyynnöistä.
 */
class ExerciseBackend extends RESTBackend<Enj.API.Exercise> {
    public exerciseVariantBackend: ExerciseVariantBackend;
    public constructor(http, urlNamespace) {
        super(http, urlNamespace);
        this.exerciseVariantBackend = new ExerciseVariantBackend(http, 'exercise/variant');
    }
    public insertVariant(exerciseVariant: Enj.API.ExerciseVariant) {
        return this.exerciseVariantBackend.insert(exerciseVariant);
    }
    public getVariant(url?: string): Promise<Enj.API.ExerciseVariant> {
        return this.exerciseVariantBackend.get(url);
    }
    public updateVariant(exerciseVariant: Enj.API.ExerciseVariant, url?: string) {
        return this.exerciseVariantBackend.update(exerciseVariant, url);
    }
    public deleteVariant(exerciseVariant: Enj.API.ExerciseVariant) {
        return this.exerciseVariantBackend.delete(exerciseVariant, '?exerciseId=' + exerciseVariant.exerciseId);
    }
}

/**
 * Vastaa /api/exercise/variant -REST-pyynnöistä.
 */
class ExerciseVariantBackend extends RESTBackend<Enj.API.ExerciseVariant> {}

export default ExerciseBackend;
