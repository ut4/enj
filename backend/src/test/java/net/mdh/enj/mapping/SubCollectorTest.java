package net.mdh.enj.mapping;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@RunWith(MockitoJUnitRunner.class)
public class SubCollectorTest {
    @Mock
    private RowMapper<SomeEntity> mockRowMapper;
    @Mock
    private ResultSet mockResultSet;
    private SubCollector<SomeEntity> subCollector;
    private final String TEST_FOREIGN_COL = "parent_id";
    @Before
    public void beforeEach() {
        this.subCollector = new SubCollector<>(this.mockRowMapper, this.TEST_FOREIGN_COL);
    }
    /**
     * Testaa, että collect() ei mappaa niitä rivejä, joiden getInt({foreignKeyColumn})in
     * arvo ei ole sama kuin {foreignOriginValue}-argumentin arvo.
     */
    @Test
    public void collectIgnorettaaRivitJoidenForeignKeytEiMatchaa() throws SQLException {
        int currentRsCursorPosition = 2;
        String foreignOriginValue = "uuid24";
        SomeEntity firstMappedEntity = new SomeEntity();
        SomeEntity secondMappedEntity = new SomeEntity();
        // Resultset, jossa kolme itemiä,
        Mockito.when(this.mockResultSet.next()).thenReturn(true).thenReturn(true).thenReturn(true).thenReturn(false);
        // joista ensimmäinen pitäisi skippautua, koska foreign key ei matchaa.
        Mockito.when(this.mockResultSet.getString(this.TEST_FOREIGN_COL)).thenReturn("uuid23").thenReturn("uuid24").thenReturn("uuid24");
        Mockito.when(this.mockResultSet.getRow())/*.thenReturn(0) pitäisi skippautua*/.thenReturn(1).thenReturn(2);
        // Mockito.when(this.mockRowMapper.mapRow(this.mockResultSet, 0)) pitäisi skippautua
        Mockito.when(this.mockRowMapper.mapRow(this.mockResultSet, 1)).thenReturn(firstMappedEntity);
        Mockito.when(this.mockRowMapper.mapRow(this.mockResultSet, 2)).thenReturn(secondMappedEntity);
        //
        List<SomeEntity> results = this.subCollector.collect(
            this.mockResultSet,
            currentRsCursorPosition,
            foreignOriginValue
        );
        InOrder rsMods = Mockito.inOrder(this.mockResultSet);
        InOrder mappings = Mockito.inOrder(this.mockRowMapper);
        // Pitäisi ensin siirtää kursorin alkuun,
        rsMods.verify(this.mockResultSet).absolute(0);
        // kerätä resultsetin 2. ja 3. itemi,
        mappings.verify(this.mockRowMapper).mapRow(this.mockResultSet, 1);
        mappings.verify(this.mockRowMapper).mapRow(this.mockResultSet, 2);
        // ja lopuksi palauttaa resultsetin kursori alkuperäiseen paikkaansa
        rsMods.verify(this.mockResultSet).absolute(currentRsCursorPosition);
        // Pitäisi palauttaa vain yhden, koska jälkimmäinen mapRow palautti null
        Assert.assertEquals(2, results.size());
        Assert.assertEquals(firstMappedEntity, results.get(0));
        Assert.assertEquals(secondMappedEntity, results.get(1));
    }
    /**
     * Testaa, että collect() ei lisää niitä mapattuja arvoja paluuarvotaulukkoon,
     * joiden arvo on yhtä kuin null.
     */
    @Test
    public void collectIgnorettaaNullArvot() throws SQLException {
        SomeEntity firstMappedEntity = null;
        SomeEntity secondMappedEntity = new SomeEntity();
        // Resultset, jossa kaksi itemiä,
        Mockito.when(this.mockResultSet.next()).thenReturn(true).thenReturn(true).thenReturn(false);
        // joista kaikki pitäisi matchata foreignOriginValue:en.
        Mockito.when(this.mockResultSet.getString(this.TEST_FOREIGN_COL)).thenReturn("uuid25").thenReturn("uuid25");
        Mockito.when(this.mockResultSet.getRow()).thenReturn(0).thenReturn(1);
        // Ensimmäinen palauttaa null
        Mockito.when(this.mockRowMapper.mapRow(this.mockResultSet, 0)).thenReturn(firstMappedEntity);
        Mockito.when(this.mockRowMapper.mapRow(this.mockResultSet, 1)).thenReturn(secondMappedEntity);
        //
        List<SomeEntity> results = this.subCollector.collect(this.mockResultSet, 0, "uuid25");
        Assert.assertEquals("Ei pitäisi kerätä null mappausta", 1, results.size());
        Assert.assertEquals(secondMappedEntity, results.get(0));
    }

    private static class SomeEntity {}
}
