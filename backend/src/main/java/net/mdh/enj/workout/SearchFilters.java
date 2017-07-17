package net.mdh.enj.workout;

import net.mdh.enj.mapping.SelectQueryFilters;
import javax.ws.rs.QueryParam;
import java.util.ArrayList;

/**
 * Bean /api/workout-reitin url-parametreille (/api/workout?startFrom={timestamp} jne.).
 */
public class SearchFilters implements SelectQueryFilters {

    private int userId;
    @QueryParam("startFrom")
    private Long startFrom;
    @QueryParam("startTo")
    private Long startTo;

    public int getUserId() {
        return this.userId;
    }
    public void setUserId(int userId) {
        this.userId = userId;
    }

    public Long getStartFrom() {
        return this.startFrom;
    }
    public void setStartFrom(Long startFrom) {
        this.startFrom = startFrom;
    }

    public Long getStartTo() {
        return this.startTo;
    }
    public void setStartTo(Long startTo) {
        this.startTo = startTo;
    }

    /**
     * Palauttaa aina true, koska userId on pakollinen arvo kaikissa treenien
     * SELECT-kyselyissä.
     */
    public boolean hasRules() {
        return true;
    }

    /**
     * Palauttaa tietokantakyselyn osaksi kelpaavan merkkijonon, esim.
     * "`start` >= :startFrom AND `start` <= :startTo".
     */
    public String toSql() {
        ArrayList<String> out = new ArrayList<>();
        out.add("workoutUserId = :userId");
        if (this.startFrom != null) {
            out.add("workoutStart >= :startFrom");
        }
        if (this.startTo != null) {
            out.add("workoutStart <= :startTo");
        }
        return String.join(" AND ", out);
    }
}
