package net.mdh.enj.workout;

import org.junit.Test;
import org.junit.Before;
import org.junit.Assert;

public class SearchFiltersTest {
    private SearchFilters searchFilters;
    @Before
    public void beforeEach() {
        this.searchFilters = new SearchFilters();
    }
    @Test
    public void hasRulesPalauttaaTrueJosVähintäänYksiArvoOnAsetettu() {
        Assert.assertEquals(false, this.searchFilters.hasRules());
        this.searchFilters.setStartFrom((long) 1);
        Assert.assertEquals(true, this.searchFilters.hasRules());
        this.searchFilters.setStartTo((long) 1);
        Assert.assertEquals(true, this.searchFilters.hasRules());
        this.searchFilters.setStartFrom(null);
        Assert.assertEquals(true, this.searchFilters.hasRules());
        this.searchFilters.setStartTo(null);
        Assert.assertEquals(false, this.searchFilters.hasRules());
    }
    @Test
    public void toSqlLisääAsetetutKentätKyselyyn() {
        Assert.assertEquals("", this.searchFilters.toSql());
        this.searchFilters.setStartFrom((long) 1);
        String startFromPart = "`start` >= :startFrom";
        Assert.assertEquals(startFromPart, this.searchFilters.toSql());
        this.searchFilters.setStartTo((long) 2);
        Assert.assertEquals(startFromPart + " AND `start` <= :startTo", this.searchFilters.toSql());
        this.searchFilters.setStartFrom(null);
        Assert.assertEquals("`start` <= :startTo", this.searchFilters.toSql());
    }
}
