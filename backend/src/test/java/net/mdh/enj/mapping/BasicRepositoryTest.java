package net.mdh.enj.mapping;

import org.junit.Test;
import org.junit.Assert;
import org.junit.Before;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.RollbackingDBUnitTest;
import net.mdh.enj.workout.WorkoutRepository;
import java.util.List;

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
     * Testaa, että insert() lisää beanin tietokantaan, asettaa sen primääriavaimen
     * arvoksi tietokannan generoiman id:n, ja lopuksi palauttaa generoidun id:n.
     */
    @Test
    public void selectAllEiSisälltyäNullRivejä() {
        final int someId = 21;
        final StrippedWorkoutEntity someBean = new StrippedWorkoutEntity();
        //
        List<StrippedWorkoutEntity> results = this.testRepo.selectAll(
            "SELECT null as id UNION ALL " +
            "SELECT " + someId + " as id UNION ALL " +
            "SELECT null as id",
            (rs, i) -> rs.getInt("id") == someId ? someBean : null
        );
        // Assertoi, että excluudasi null mappaukset
        Assert.assertEquals(1, results.size());
        Assert.assertEquals(someBean, results.get(0));
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