package net.mdh.enj.mapping;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.RollbackingDBUnitTest;
import net.mdh.enj.workout.WorkoutRepository;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

public class BasicRepositoryTest extends RollbackingDBUnitTest {

    private StrippedWorkoutRepo testRepo;

    @Before
    public void beforeEach() {
        this.testRepo = new StrippedWorkoutRepo(this.rollbackingDSFactory);
    }

    /**
     * Testaa, että insert() lisää beanin tietokantaan, asettaa sen primääriavaimen
     * arvoksi tietokannan generoiman id:n, ja lopuksi palauttaa generoidun id:n.
     */
    @Test
    public void insertInsertoiBeaninJaPalauttaaGeneroidunIdn() {
        //
        StrippedWorkoutEntity data = new StrippedWorkoutEntity();
        data.setStart(System.currentTimeMillis() / 1000L);
        //
        int insertId = this.testRepo.insert(data);
        //
        Assert.assertTrue(insertId > 0);
        Assert.assertTrue(data.getId() > 0);
        Assert.assertEquals(insertId, data.getId());
    }

    /**
     * Riisuttu versio WorkoutRepositorystä; handlaa Workout-entiteettejä, jotka
     * sisältää vain schemassa pakollisksi määritellyn kentän "start".
     */
    private static class StrippedWorkoutRepo extends BasicRepository<StrippedWorkoutEntity> {
        public StrippedWorkoutRepo(DataSourceFactory dataSourceFac) {
            super(dataSourceFac, WorkoutRepository.TABLE_NAME, BasicRepository.DEFAULT_ID);
        }
    }
    private static class StrippedWorkoutEntity extends DbEntity {
        private long start;
        public long getStart() {
            return this.start;
        }
        public void setStart(long start) {
            this.start = start;
        }
    }
}