package net.mdh.enj.workout;

import net.mdh.enj.mapping.SelectQueryFilters;
import javax.ws.rs.QueryParam;
import java.util.ArrayList;

/**
 * Bean /api/workout-reitin url-parametreille (/api/workout?startFrom={timestamp} jne.).
 */
public class SearchFilters implements SelectQueryFilters {

    @QueryParam("startFrom")
    private Long startFrom;
    @QueryParam("startTo")
    private Long startTo;

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
     * Palauttaa true, jos urlissa oli ainakin yksi arvo, muutoin palauttaa false.
     */
    public boolean hasRules() {
        return this.startFrom != null || this.startTo != null;
    }

    /**
     * Palauttaa tietokantakyselyn osaksi kelpaavan merkkijonon, esim.
     * "`start` >= :startFrom AND `start` <= :startTo".
     */
    public String toSql() {
        ArrayList<String> out = new ArrayList<>();
        if (this.startFrom != null) {
            out.add("workoutStart >= :startFrom");
        }
        if (this.startTo != null) {
            out.add("workoutStart <= :startTo");
        }
        return String.join(" AND ", out);
    }
}
