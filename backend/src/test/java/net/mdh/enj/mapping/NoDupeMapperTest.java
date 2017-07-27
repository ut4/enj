package net.mdh.enj.mapping;

import org.junit.Test;
import org.junit.Assert;
import org.junit.Before;
import org.junit.runner.RunWith;
import org.mockito.junit.MockitoJUnitRunner;
import org.mockito.Mockito;
import org.mockito.Mock;
import java.sql.SQLException;
import java.sql.ResultSet;

@RunWith(MockitoJUnitRunner.class)
public class NoDupeMapperTest {
    @Mock
    private ResultSet mockResultSet;
    private TestMapper testNoDupeMapper;
    @Before
    public void beforeEach() {
        this.testNoDupeMapper = new TestMapper();
    }
    /**
     * Testaa, että mapRow() ei mappaa riviä (kutsu doMapRow:ia), jos kyseinen
     * rivi on jo kerätty, tai sinä ei ole dataa (rivin getString({primaryKeyColumn})
     * palauttaa arvon null).
     */
    @Test
    public void mapRowIgnorettaaRivitJotkaOnJoKerätty() throws SQLException {
        // Mockaa rivien primääriavain-arvot
        Mockito.when(this.mockResultSet.getString(TestMapper.TEST_ID_COL))
            .thenReturn("mockuuid1")
            .thenReturn("mockuuid1")
            .thenReturn("mockuuid2")
            .thenReturn(null)
            .thenReturn(null);
        // Simuloi muutama mappaus (normaalisti Spring Jdbc:n tekee tämän)
        TestEntity mapped1 = this.testNoDupeMapper.mapRow(this.mockResultSet, 0);
        TestEntity mapped2 = this.testNoDupeMapper.mapRow(this.mockResultSet, 1);
        TestEntity mapped3 = this.testNoDupeMapper.mapRow(this.mockResultSet, 2);
        TestEntity mapped4 = this.testNoDupeMapper.mapRow(this.mockResultSet, 3);
        TestEntity mapped5 = this.testNoDupeMapper.mapRow(this.mockResultSet, 4);
        TestEntity mapped6 = this.testNoDupeMapper.mapRow(this.mockResultSet, 5);
        // Assertoi
        Assert.assertNotNull("Pitäisi mapata ensimmäisen normaalisti", mapped1);
        Assert.assertNull("Pitäisi ignorettaa, koska id mockuuid1 jo kerätty", mapped2);
        Assert.assertNotNull("Pitäisi mapata normaalisti", mapped3);
        Assert.assertNull("Pitäisi ignorettaa, koska id null", mapped4);
        Assert.assertNull("Pitäisi ignorettaa, koska id null", mapped5);
        Assert.assertNull("Pitäisi ignorettaa, koska id mockuuid2 jo kerätty", mapped6);
    }

    public static class TestMapper extends NoDupeRowMapper<TestEntity> {
        private static final String TEST_ID_COL = "foo";
        protected TestMapper() {
            super(TEST_ID_COL);
        }
        @Override
        protected TestEntity doMapRow(ResultSet rs, int rowNum) throws SQLException {
            return new TestEntity();
        }
    }

    private static class TestEntity {}
}
