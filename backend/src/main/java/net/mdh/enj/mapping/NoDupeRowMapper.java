package net.mdh.enj.mapping;

import org.springframework.jdbc.core.RowMapper;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.HashMap;

/**
 * "Proxy"-mappaaja, joka palauttaa "oikean" mappausmetodin (this.doMapRow)
 * mappaaman beanin Spring Jdbc:lle vain, jos sitä ei ole vielä kerätty, ja
 * rivin pääavaimen arvo ei ole null/0. Muutoin palauttaa Spring Jdbc:lle arvon
 * null.
 */
public abstract class NoDupeRowMapper<T> implements RowMapper<T> {

    private final String primaryKeyColumn;
    private final HashMap<String, Object> ids;

    /**
     * @param primaryKeyColumn Pääavaincolumnin nimi, jonka avulla tiedetään mikä rivi on jo kerätty.
     */
    protected NoDupeRowMapper(String primaryKeyColumn) {
        this.primaryKeyColumn = primaryKeyColumn;
        this.ids = new HashMap<>();
    }

    /**
     * Palauttaa (doMapRow):in mappaaman beanin, tai arvon null, mikäli bean on
     * jo kerätty, tai kerättävän rivin pääavaimen arvo on null/0.
     */
    public T mapRow(ResultSet rs, int rowNum) throws SQLException {
        String id = rs.getString(this.primaryKeyColumn);
        if (id == null || this.isAlreadyCollected(id)) {
            return null;
        }
        T collected = this.doMapRow(rs, rowNum);
        this.setAsCollected(id);
        return collected;
    }

    /**
     * Itse mappausmetodi, jota kutsutaan kerran per pääavain.
     */
    protected abstract T doMapRow(ResultSet rs, int rowNum) throws SQLException;

    private boolean isAlreadyCollected(String id) {
        return this.ids.containsKey(id);
    }

    private void setAsCollected(String id) {
        this.ids.put(id, 'y');
    }
}
