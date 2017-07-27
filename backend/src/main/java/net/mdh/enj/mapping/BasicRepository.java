package net.mdh.enj.mapping;

import net.mdh.enj.db.DataSourceFactory;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.jdbc.core.RowMapper;
import java.util.Objects;
import java.util.List;
import java.util.UUID;

/**
 * Luokka, joka sisältää yleisimmät CRUD-toiminnallisuudet (insert, selectAll jne).
 */
public abstract class BasicRepository<T extends DbEntity> {

    public final static String DEFAULT_ID = "id";
    protected final NamedParameterJdbcTemplate qTemplate;
    protected final SimpleJdbcInsert inserter;

    public BasicRepository(DataSourceFactory dataSourceFac, String tableName, String idColumn) {
        this.qTemplate = new NamedParameterJdbcTemplate(dataSourceFac.getDataSource());
        this.inserter = new SimpleJdbcInsert(dataSourceFac.getDataSource()).withTableName(tableName);
    }

    public BasicRepository(DataSourceFactory dataSourceFac, String tableName) {
        this(dataSourceFac, tableName, DEFAULT_ID);
    }

    /**
     * Lisää beanin {data} tietokantaan. HUOM - olettaa, että {data} on jo validoitu!
     *
     * @param data T
     * @return Lisättyjen rivien lukumäärä
     */
    public int insert(T data) {
        if (data.getId() == null) {
            data.setId(UUID.randomUUID().toString());
        }
        return this.inserter.execute(new BeanPropertySqlParameterSource(data));
    }

    /**
     * Ajaa tietokantakyselyn {query} käyttäen BeanPropertySqlParameterSource
     * {params}ia kyselyyn määriteltyjen :placeholderien arvojen täyttämiseen,
     * mappaa kyselyn palauttamat rivit mapperilla {mapper}, ja lopuksi
     * palauttaa mapatut beanit (filtteröi null-arvot pois).
     *
     * @return Lista beaneja {T} | tyhjä lista.
     */
    public List<T> selectAll(String query, SqlParameterSource params, RowMapper<T> mapper) {
        List<T> results = this.qTemplate.query(query, params, mapper);
        results.removeIf(Objects::isNull);
        return results;
    }

    /**
     * Ajaa tietokantakyselyn {query}, mappaa sen palauttamat rivit mapperilla
     * {mapper}, ja palauttaa mapatut beanit (filtteröi null-arvot pois).
     *
     * @return Lista beaneja {T} | tyhjä lista.
     */
    protected List<T> selectAll(String query, RowMapper<T> mapper) {
        return this.selectAll(query, null, mapper);
    }

    /**
     * Kutsuu this.selectAll, ja palauttaa sen paluuarvotaulukosta ensimmäisen
     * arvon :D
     *
     * @return bean {T} | null.
     */
    public T selectOne(String query, SqlParameterSource params, RowMapper<T> mapper) {
        List<T> items = this.selectAll(query, params, mapper);
        return items.size() > 0 ? items.get(0) : null;
    }

    /**
     * Kutsuu this.selectAll, ja palauttaa sen paluuarvotaulukosta ensimmäisen
     * arvon :D
     *
     * @return bean {T} | null.
     */
    public T selectOne(String query, RowMapper<T> mapper) {
        return this.selectOne(query, null, mapper);
    }
}
