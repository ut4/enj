package net.mdh.enj.mapping;

import org.junit.Test;
import org.junit.Assert;
import org.junit.Before;
import org.mockito.Mockito;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.validation.UUIDValidator;
import net.mdh.enj.resources.RollbackingDBUnitTest;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.UUID;
import java.util.List;

public class BasicRepositoryTest extends RollbackingDBUnitTest {

    private SimpleExerciseRepository testRepo;

    @Before
    public void beforeEach() {
        this.testRepo = new SimpleExerciseRepository(rollbackingDSFactory);
    }

    /**
     * Testaa, että insert() lisää beanin tietokantaan, asettaa sen primääriavaimen
     * arvoksi uuden UUID:n, ja lopuksi palauttaa insertoitujen rivien lukumäärän.
     */
    @Test
    public void insertInsertoiBeaninJaPalauttaaInsertoitujenRivienLukumäärän() {
        //
        SimpleExerciseEntity data = new SimpleExerciseEntity();
        data.setName("foo");
        //
        int insertCount = this.testRepo.insert(data);
        //
        Assert.assertEquals("Pitäisi palauttaa insertoitujen rivien lukumäärän", 1, insertCount);
        Assert.assertNotNull("Pitäisi luoda primääriavain", data.getId());
        Assert.assertTrue("Pitäisi luoda primääriavaineksi validi uuidv4",
            new UUIDValidator().isValid(data.getId(), null)
        );
    }

    /**
     * Testaa, että insert() lisää kaikki beanit tietokantaan, asettaa puuttuvat
     * primääriavaimet, ja lopuksi palauttaa insertoitujen rivien lukumäärän.
     */
    @Test
    public void insertInsertoiListanBeanejaJaPalauttaaInsertoitujenRivienLukumäärän() {
        //
        List<SimpleExerciseEntity> items = new ArrayList<>();
        SimpleExerciseEntity data = new SimpleExerciseEntity();
        String setUuid = UUID.randomUUID().toString();
        data.setId(setUuid);
        data.setName("foo");
        SimpleExerciseEntity data2 = new SimpleExerciseEntity();
        data2.setName("bar");
        items.add(data);
        items.add(data2);
        //
        int insertCount = this.testRepo.insert(items);
        //
        Assert.assertEquals("Pitäisi palauttaa insertoitujen rivien lukumäärän", 2, insertCount);
        Assert.assertEquals("Ei pitäisi asettaa primääriavainta, jos se on jo määritelty", setUuid, data.getId());
        Assert.assertNotNull("Pitäisi luoda primääriavain, jos se puuttuu", data2.getId());
        Assert.assertTrue("Pitäisi luoda primääriavaineksi validi uuidv4",
            new UUIDValidator().isValid(data.getId(), null)
        );
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
            "SELECT \"mockuuid\" as id, \"nam\" as `name`",
            new SimpleExerciseMapper()
        );
        Assert.assertNotNull(result);
        Assert.assertEquals("mockuuid", result.getId());
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

    @Test
    public void updateManyPäivittääKaikkiBeanitJaPalauttaaPäivitettyjenRivienLukumäärän() {
        //
        SimpleExerciseEntity data = new SimpleExerciseEntity();
        data.setName("foo");
        SimpleExerciseEntity data2 = new SimpleExerciseEntity();
        data2.setName("bar");
        Assert.assertEquals(2, this.testRepo.insert(data) + this.testRepo.insert(data2));
        // Päivitä kummankin beanin name
        String newName = "foo2";
        String newName2 = "bar2";
        data.setName(newName);
        data2.setName(newName2);
        List<SimpleExerciseEntity> updateList = new ArrayList<>();
        updateList.add(data);
        updateList.add(data2);
        int updateCount = this.testRepo.updateMany(updateList);
        // Päivittikö 2 riviä?
        Assert.assertEquals("Pitäisi päivittää kumpikin itemi", 2, updateCount);
        // Hae päivitetty data tietokannasta & assertoi että data päivittyi
        List<SimpleExerciseEntity> updated = this.testRepo.selectAll(
            "SELECT id, `name` FROM exercise WHERE id IN (:id1, :id2) ORDER BY `name` DESC",
            new MapSqlParameterSource().addValue("id1", data.getId()).addValue("id2", data2.getId()),
            new SimpleExerciseMapper()
        );
        Assert.assertEquals("Pitäisi päivittää data", newName, updated.get(0).getName());
        Assert.assertEquals("Pitäisi päivittää data", newName2, updated.get(1).getName());
    }

    @Test
    public void deletePoistaaDatanJaPalauttaaPoistettujenRivienLukumäärän() {
        // Insertoi
        SimpleExerciseEntity data = new SimpleExerciseEntity();
        data.setName("foo");
        Assert.assertEquals(1, this.testRepo.insert(data));
        // Poista
        int deleteCount = this.testRepo.delete(data.getId());
        // Poistuiko?
        Assert.assertEquals("Pitäisi poistaa 1 rivi", 1, deleteCount);
        SimpleExerciseEntity deleted = this.testRepo.selectOne(
            "SELECT id FROM exercise WHERE id = :id",
            new MapSqlParameterSource().addValue("id", data.getId()),
            new SimpleExerciseMapper()
        );
        Assert.assertNull("Pitäisi poistaa data", deleted);
    }

    /**
     * Riisuttu versio ExerciseRepositorystä; handlaa entiteettejä, jotka sisältää
     *  vain schemassa pakolliseksi määritellyn kentän "name".
     */
    private static class SimpleExerciseRepository extends BasicRepository<SimpleExerciseEntity> {
        SimpleExerciseRepository(DataSourceFactory dataSourceFac) {
            super(dataSourceFac, "exercise", BasicRepository.DEFAULT_ID);
        }
        int updateMany(List<SimpleExerciseEntity> items) {
            return super.updateMany("UPDATE exercise SET `name` = :name WHERE id = :id", items);
        }
    }
    private static class SimpleExerciseMapper implements RowMapper<SimpleExerciseEntity> {
        @Override
        public SimpleExerciseEntity mapRow(ResultSet resultSet, int i) throws SQLException {
            SimpleExerciseEntity simpleExercise = new SimpleExerciseEntity();
            simpleExercise.setId(resultSet.getString("id"));
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