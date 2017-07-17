package net.mdh.enj.mapping;

import org.junit.Test;
import org.junit.Assert;
import org.junit.Before;
import org.mockito.Mockito;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.RollbackingDBUnitTest;
import org.springframework.jdbc.core.RowMapper;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.List;

public class BasicRepositoryTest extends RollbackingDBUnitTest {

    private SimpleExerciseRepository testRepo;

    @Before
    public void beforeEach() {
        this.testRepo = new SimpleExerciseRepository(rollbackingDSFactory);
    }

    /**
     * Testaa, että insert() lisää beanin tietokantaan, asettaa sen primääriavaimen
     * arvoksi tietokannan generoiman id:n, ja lopuksi palauttaa generoidun id:n.
     */
    @Test
    public void insertInsertoiBeaninJaPalauttaaGeneroidunIdn() {
        //
        SimpleExerciseEntity data = new SimpleExerciseEntity();
        data.setName("foo");
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
        final SimpleExerciseEntity someBean = new SimpleExerciseEntity();
        //
        List<SimpleExerciseEntity> results = this.testRepo.selectAll(
            "SELECT null as id UNION ALL " +
            "SELECT " + someId + " as id UNION ALL " +
            "SELECT null as id",
            (rs, i) -> rs.getInt("id") == someId ? someBean : null
        );
        // Assertoi, että excluudasi null-mappaukset
        Assert.assertEquals(1, results.size());
        Assert.assertEquals(someBean, results.get(0));
    }

    /**
     * Testaa, että selectAll handlaa tilanteen, jossa tietokanta ei palauta
     * yhtään riviä.
     */
    @Test
    public void selectAllEiHeittäydyHankalaksiJosTietokantaEiPalautaMitään() throws SQLException {
        RowMapper<SimpleExerciseEntity> mapperSpy = Mockito.spy(new SimpleExerciseMapper());
        //
        List<SimpleExerciseEntity> results = this.testRepo.selectAll(
            "SELECT id FROM `exercise` WHERE id = -1",
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
        SimpleExerciseEntity result = this.testRepo.selectOne(
            "SELECT 1 as id, \"nam\" as `name`",
            new SimpleExerciseMapper()
        );
        Assert.assertNotNull(result);
        Assert.assertEquals(1, result.getId());
        Assert.assertEquals("nam", result.getName());
    }

    /**
     * Testaa, että selectOnehandlaa tilanteen, jossa tietokanta ei palauta
     * yhtään riviä.
     */
    @Test
    public void selectOneEiHeittäydyHankalaksiJosTietokantaEiPalautaMitään() throws SQLException {
        RowMapper<SimpleExerciseEntity> mapperSpy = Mockito.spy(new SimpleExerciseMapper());
        //
        SimpleExerciseEntity result = this.testRepo.selectOne(
            "SELECT id FROM `exercise` WHERE id = -1",
            mapperSpy
        );
        Assert.assertNull(result);
        Mockito
            .verify(mapperSpy, Mockito.times(0))
            .mapRow(Mockito.any(ResultSet.class), Mockito.anyInt());
    }

    /**
     * Riisuttu versio ExerciseRepositorystä; handlaa entiteettejä, jotka sisältää
     *  vain schemassa pakolliseksi määritellyn kentän "name".
     */
    private static class SimpleExerciseRepository extends BasicRepository<SimpleExerciseEntity> {
        SimpleExerciseRepository(DataSourceFactory dataSourceFac) {
            super(dataSourceFac, "exercise", BasicRepository.DEFAULT_ID);
        }
    }
    private static class SimpleExerciseMapper implements RowMapper<SimpleExerciseEntity> {
        @Override
        public SimpleExerciseEntity mapRow(ResultSet resultSet, int i) throws SQLException {
            SimpleExerciseEntity simpleExercise = new SimpleExerciseEntity();
            simpleExercise.setId(resultSet.getInt("id"));
            simpleExercise.setName(resultSet.getString("name"));
            return simpleExercise;
        }
    }
    private static class SimpleExerciseEntity extends DbEntity {
        private String name;
        public String getName() {
            return name;
        }
        public void setName(String name) {
            this.name = name;
        }
    }
}