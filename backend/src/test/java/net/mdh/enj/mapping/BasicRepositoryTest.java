package net.mdh.enj.mapping;

import org.junit.Test;
import org.junit.Assert;
import org.junit.Before;
import org.mockito.Mockito;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.workout.WorkoutRepository;
import net.mdh.enj.resources.RollbackingDBUnitTest;
import org.springframework.jdbc.core.RowMapper;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.List;

public class BasicRepositoryTest extends RollbackingDBUnitTest {

    private StrippedWorkoutRepo testRepo;

    @Before
    public void beforeEach() {
        this.testRepo = new StrippedWorkoutRepo(rollbackingDSFactory);
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
        data.setEnd(0);
        //
        int insertId = this.testRepo.insert(data);
        //
        Assert.assertTrue(insertId > 0);
        Assert.assertTrue(data.getId() > 0);
        Assert.assertEquals(insertId, data.getId());
    }

    /**
     * Testaa, että selectAll filtteröi paluutaulukosta null arvot pois.
     */
    @Test
    public void selectAllEiSisällytäNullRivejä() {
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
     * Testaa, että selectAll handlaa tilanteen, jossa tietokanta ei palauta
     * yhtään riviä.
     */
    @Test
    public void selectAllEiHeittäydyHankalaksiJosTietokantaEiPalautaMitään() throws SQLException {
        RowMapper<StrippedWorkoutEntity> mapperSpy = Mockito.spy(new StrippedRepoMapper());
        //
        List<StrippedWorkoutEntity> results = this.testRepo.selectAll(
            "SELECT id FROM `workout` WHERE id = -1",
            mapperSpy
        );
        // Assertoi, ettei yrittänyt mapannut mitään
        Assert.assertEquals(0, results.size());
        Mockito
            .verify(mapperSpy, Mockito.times(0))
            .mapRow(Mockito.any(ResultSet.class), Mockito.anyInt());
    }

    @Test
    public void selectOnePalauttaaYhdenBeanin() {
        //
        StrippedWorkoutEntity result = this.testRepo.selectOne(
            "SELECT 1 as id, 2 as `start`",
            new StrippedRepoMapper()
        );
        Assert.assertNotNull(result);
        Assert.assertEquals(1, result.getId());
        Assert.assertEquals(2, result.getStart());
    }

    /**
     * Testaa, että selectOnehandlaa tilanteen, jossa tietokanta ei palauta
     * yhtään riviä.
     */
    @Test
    public void selectOneEiHeittäydyHankalaksiJosTietokantaEiPalautaMitään() throws SQLException {
        RowMapper<StrippedWorkoutEntity> mapperSpy = Mockito.spy(new StrippedRepoMapper());
        //
        StrippedWorkoutEntity result = this.testRepo.selectOne(
            "SELECT id FROM `workout` WHERE id = -1",
            mapperSpy
        );
        Assert.assertNull(result);
        Mockito
            .verify(mapperSpy, Mockito.times(0))
            .mapRow(Mockito.any(ResultSet.class), Mockito.anyInt());
    }

    /**
     * Riisuttu versio WorkoutRepositorystä; handlaa entiteettejä, jotka sisältää
     *  vain schemassa pakollisksi määritellyn kentän "start" & "end".
     */
    private static class StrippedWorkoutRepo extends BasicRepository<StrippedWorkoutEntity> {
        public StrippedWorkoutRepo(DataSourceFactory dataSourceFac) {
            super(dataSourceFac, WorkoutRepository.TABLE_NAME, BasicRepository.DEFAULT_ID);
        }
    }
    private static class StrippedRepoMapper implements RowMapper<StrippedWorkoutEntity> {
        @Override
        public StrippedWorkoutEntity mapRow(ResultSet resultSet, int i) throws SQLException {
            StrippedWorkoutEntity strippedWorkoutEntity = new StrippedWorkoutEntity();
            strippedWorkoutEntity.setId(resultSet.getInt("id"));
            strippedWorkoutEntity.setStart(resultSet.getInt("start"));
            return strippedWorkoutEntity;
        }
    }
    private static class StrippedWorkoutEntity extends DbEntity {
        private long start;
        private long end;
        public long getStart() {
            return this.start;
        }
        public void setStart(long start) {
            this.start = start;
        }
        public long getEnd() {
            return this.end;
        }
        public void setEnd(long end) {
            this.end = end;
        }
    }
}