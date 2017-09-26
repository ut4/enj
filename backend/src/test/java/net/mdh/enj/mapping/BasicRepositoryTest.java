package net.mdh.enj.mapping;

import org.junit.Test;
import org.junit.Assert;
import org.junit.Before;
import org.mockito.Mockito;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.validation.UUIDValidator;
import net.mdh.enj.resources.RollbackingDBUnitTest;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.Arrays;
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

    @Test
    public void selectAllFiltersLisääFiltteritKyselyyn() {
        this.testRepo = Mockito.spy(this.testRepo);
        //
        TestFilters filters = new TestFilters();
        filters.setProp("foo");
        TestFilters emptyFilters = new TestFilters();
        emptyFilters.setProp(null);
        //
        this.testRepo.selectAll(filters, new ExerciseViewMapper());
        this.testRepo.selectAll(emptyFilters, new ExerciseViewMapper());
        //
        Mockito.verify(this.testRepo, Mockito.times(1)).selectAll(
            Mockito.eq("SELECT * FROM exerciseView WHERE exerciseId = :prop"),
            Mockito.any(BeanPropertySqlParameterSource.class),
            Mockito.any(ExerciseViewMapper.class)
        );
        Mockito.verify(this.testRepo, Mockito.times(1)).selectAll(
            Mockito.eq("SELECT * FROM exerciseView"),
            Mockito.eq(null),
            Mockito.any(ExerciseViewMapper.class)
        );
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

    @Test
    public void selectOneFiltersLisääFiltteritKyselyyn() {
        this.testRepo = Mockito.spy(this.testRepo);
        //
        TestFilters filters = new TestFilters();
        filters.setProp("foo");
        TestFilters emptyFilters = new TestFilters();
        emptyFilters.setProp(null);
        //
        this.testRepo.selectOne(filters, new ExerciseViewMapper());
        this.testRepo.selectOne(emptyFilters, new ExerciseViewMapper());
        //
        Mockito.verify(this.testRepo, Mockito.times(1)).selectOne(
            Mockito.eq("SELECT * FROM exerciseView WHERE exerciseId = :prop"),
            Mockito.any(BeanPropertySqlParameterSource.class),
            Mockito.any(ExerciseViewMapper.class)
        );
        Mockito.verify(this.testRepo, Mockito.times(1)).selectOne(
            Mockito.eq("SELECT * FROM exerciseView"),
            Mockito.eq(null),
            Mockito.any(ExerciseViewMapper.class)
        );
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
    public void updatePäivittääBeaninJaPalauttaaPäivitettyjenRivienLukumäärän() {
        //
        SimpleExerciseEntity data = new SimpleExerciseEntity();
        data.setName("foo");
        Assert.assertEquals(1, this.testRepo.insert(data));
        // Päivitä beanin tietoja
        String newName = "foo2";
        data.setName(newName);
        int updateCount = this.testRepo.update(data);
        // Päivittyikö?
        Assert.assertEquals("Pitäisi päivittää itemi", 1, updateCount);
        List<SimpleExerciseEntity> updated = this.testRepo.selectAll(
            "SELECT id, `name` FROM exercise WHERE id = :id",
            new MapSqlParameterSource().addValue("id", data.getId()),
            new SimpleExerciseMapper()
        );
        Assert.assertEquals("Pitäisi päivittää data", newName, updated.get(0).getName());
    }

    @Test
    public void updateLuoKyselynKäyttäenBeaninToUpdateFieldsMetodinArvoa() {
        this.testRepo = Mockito.spy(this.testRepo);
        //
        SimpleExerciseEntity data = new SimpleExerciseEntity();
        data.setName("foo");
        //
        String where = "name = 'fyy'";
        this.testRepo.update(data, where);
        //
        Mockito.verify(this.testRepo, Mockito.times(1)).update(
            String.format("UPDATE `exercise` SET %s WHERE %s", data.toUpdateFields(), where),
            data
        );
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
    public void updateManyLuoKyselynKäyttäenBeaninToUpdateFieldsMetodinArvoa() {
        this.testRepo = Mockito.spy(this.testRepo);
        //
        SimpleExerciseEntity data = new SimpleExerciseEntity();
        data.setName("foo");
        SimpleExerciseEntity data2 = new SimpleExerciseEntity();
        data.setName("bar");
        List<SimpleExerciseEntity> list = Arrays.asList(data, data2);
        //
        String where = "name = 'fyy'";
        this.testRepo.updateMany(list, where);
        //
        Mockito.verify(this.testRepo, Mockito.times(1)).updateMany(
            String.format("UPDATE `exercise` SET %s WHERE %s", data.toUpdateFields(), where),
            list
        );
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
        private static final String UPDATE_Q = "UPDATE exercise SET `name` = :name WHERE id = :id";
        SimpleExerciseRepository(DataSourceFactory dataSourceFac) {
            super(dataSourceFac, "exercise");
        }
        int update(SimpleExerciseEntity item) {
            return super.update(UPDATE_Q, item);
        }
        int updateMany(List<SimpleExerciseEntity> items) {
            return super.updateMany(UPDATE_Q, items);
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
    private static class ExerciseViewMapper implements RowMapper<SimpleExerciseEntity> {
        @Override
        public SimpleExerciseEntity mapRow(ResultSet resultSet, int i) throws SQLException {
            SimpleExerciseEntity simpleExercise = new SimpleExerciseEntity();
            simpleExercise.setId(resultSet.getString("exerciseId"));
            simpleExercise.setName(resultSet.getString("exerciseName"));
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
        @Override
        public String toUpdateFields() {
            return "name = :name";
        }
    }
    private static class TestFilters implements SelectQueryFilters {
        private String prop;
        public String getProp() { return this.prop; }
        public void setProp(String prop) { this.prop = prop; }
        @Override
        public boolean hasRules() {
            return this.prop != null;
        }
        @Override
        public String toSql() {
            return this.prop != null ? "exerciseId = :prop" : "";
        }
    }
}