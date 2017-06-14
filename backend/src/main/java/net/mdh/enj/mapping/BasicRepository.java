package net.mdh.enj.mapping;

import net.mdh.enj.db.DataSourceFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import java.util.Objects;
import java.util.List;

/**
 * Luokka, joka sisältää yleisimmät CRUD-toiminnallisuudet (insert, selectAll jne).
 */
public abstract class BasicRepository<T extends DbEntity> {

    public final static String DEFAULT_ID = "id";
    protected final JdbcTemplate qTemplate;
    protected final SimpleJdbcInsert inserter;

    public BasicRepository(DataSourceFactory dataSourceFac, String tableName, String idColumn) {
        this.qTemplate = new JdbcTemplate(dataSourceFac.getDataSource());
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
     * Ajaa tietokantakyselyn {query}, mappaa sen palauttamat rivit mapperilla
     * {mapper}, ja palauttaa mapatut beanit (filtteröi null-arvot pois).
     *
     * @return Lista beaneja {T}.
     */
    protected List<T> selectAll(String query, RowMapper<T> mapper) {
        List<T> results = this.qTemplate.query(query, mapper);
        results.removeIf(Objects::isNull);
        return results;
    }
}
