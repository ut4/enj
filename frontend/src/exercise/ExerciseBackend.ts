import RESTBackend  from 'src/common/RESTBackend';

/**
 * Vastaa /api/exercise -REST-pyynnöistä. 
 */
class ExerciseBackend extends RESTBackend<Enj.API.ExerciseRecord> {}

export default ExerciseBackend;
