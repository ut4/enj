package net.mdh.enj.mapping;

import net.mdh.enj.db.DataSourceFactory;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.jdbc.core.RowMapper;
import java.util.Objects;
import java.util.List;

/**
 * Luokka, joka sisältää yleisimmät CRUD-toiminnallisuudet (insert, selectAll jne).
 */
public abstract class BasicRepository<T extends DbEntity> {

    public final static String DEFAULT_ID = "id";
    protected final NamedParameterJdbcTemplate qTemplate;
    protected final SimpleJdbcInsert inserter;

    public BasicRepository(DataSourceFactory dataSourceFac, String tableName, String idColumn) {
        this.qTemplate = new NamedParameterJdbcTemplate(dataSourceFac.getDataSource());
        this.inserter = new SimpleJdbcInsert(dataSourceFac.getDataSource())
            .withTableName(tableName)
            .usingGeneratedKeyColumns(idColumn);
    }

    public BasicRepository(DataSourceFactory dataSourceFac, String tableName) {
        this(dataSourceFac, tableName, DEFAULT_ID);
    }

    /**
     * Lisää beanin {data} tietokantaan. HUOM - olettaa, että {data} on jo validoitu!
     *
     * @param data T
     * @return Lisätyn rivin id
     */
    public int insert(T data) {
        SqlParameterSource parameters = new BeanPropertySqlParameterSource(data);
        Number newId = this.inserter.executeAndReturnKey(parameters);
        data.setId(newId.intValue());
        return data.getId();
    }

    /**
     * Ajaa tietokantakyselyn {query} käyttäen BeanPropertySqlParameterSource
     * {params}ia kyselyyn määriteltyjen :placeholderien arvojen täyttämiseen,
     * mappaa kyselyn palauttamat rivit mapperilla {mapper}, ja lopuksi
     * palauttaa mapatut beanit (filtteröi null-arvot pois).
     *
     * @return Lista beaneja {T}.
     */
    protected List<T> selectAll(String query, SqlParameterSource params, RowMapper<T> mapper) {
        List<T> results = this.qTemplate.query(query, params, mapper);
        results.removeIf(Objects::isNull);
        return results;
    }

    /**
     * Ajaa tietokantakyselyn {query}, mappaa sen palauttamat rivit mapperilla
     * {mapper}, ja palauttaa mapatut beanit (filtteröi null-arvot pois).
     *
     * @return Lista beaneja {T}.
     */
    protected List<T> selectAll(String query, RowMapper<T> mapper) {
        return this.selectAll(query, null, mapper);
    }
}
