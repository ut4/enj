package net.mdh.enj.workout;

import javax.ws.rs.QueryParam;
import java.util.ArrayList;

/**
 * Bean /api/workout-reitin url-parametreille (/api/workout?startFrom={timestamp} jne.).
 */
public class SearchFilters {

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
     * Palauttaa false, jos urlissa ei ollut yhtään arvoa, muutoin true.
     */
    boolean hasRules() {
        return this.startFrom != null || this.startTo != null;
    }

    /**
     * Palauttaa tietokantakyselyn osaksi kelpaavan merkkijonon, esim.
     * "`start` >= :startFrom AND `start` <= :startTo".
     */
    String toSql() {
        ArrayList<String> out = new ArrayList<>();
        if (this.startFrom != null) {
            out.add("`start` >= :startFrom");
        }
        if (this.startTo != null) {
            out.add("`start` <= :startTo");
        }
        return String.join(" AND ", out);
    }
}
