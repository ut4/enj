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
    public void hasRulesPalauttaaAinaTrue() {
        Assert.assertEquals(true, this.searchFilters.hasRules());
        this.searchFilters.setUserId("uuid1");
        Assert.assertEquals(true, this.searchFilters.hasRules());
    }
    @Test
    public void toSqlLisääAsetetutKentätKyselyyn() {
        String userIdPart = "workoutUserId = :userId";
        Assert.assertEquals(userIdPart, this.searchFilters.toSql());
        this.searchFilters.setStartFrom((long) 1);
        String startFromPart = " AND workoutStart >= :startFrom";
        Assert.assertEquals(userIdPart + startFromPart, this.searchFilters.toSql());
        this.searchFilters.setStartTo((long) 2);
        Assert.assertEquals(userIdPart + startFromPart + " AND workoutStart <= :startTo", this.searchFilters.toSql());
        this.searchFilters.setStartFrom(null);
        Assert.assertEquals(userIdPart + " AND workoutStart <= :startTo", this.searchFilters.toSql());
        //
        this.searchFilters.setLimit(1);
        Assert.assertEquals(userIdPart + " AND workoutStart < :startTo", this.searchFilters.toSql());
        this.searchFilters.setStartTo(null);
        this.searchFilters.setStartFrom((long) 2);
        Assert.assertEquals(userIdPart + " AND workoutStart > :startFrom", this.searchFilters.toSql());
    }
}
