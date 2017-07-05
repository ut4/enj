import RESTBackend  from 'src/common/RESTBackend';

class Exercise implements Enj.API.ExerciseRecord {
    public id;
    public name;
    public variants;
}

/**
 * Vastaa /api/exercise -REST-pyynnöistä.
 */
class ExerciseBackend extends RESTBackend<Enj.API.ExerciseRecord> {}

export default ExerciseBackend;
export { Exercise };
