import RESTBackend  from 'src/common/RESTBackend';

// TODO
/*class Workout implements Enj.API.WorkoutRecord {
    
}*/

/**
 * Vastaa /api/workout-REST-pyynnöistä. 
 */
class WorkoutBackend extends RESTBackend<Enj.API.WorkoutRecord> {}

export default WorkoutBackend;
