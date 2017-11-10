package net.mdh.enj.mapping;

import net.mdh.enj.db.DataSourceFactory;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.transaction.support.DefaultTransactionDefinition;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.core.namedparam.SqlParameterSourceUtils;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.transaction.TransactionStatus;
import org.springframework.jdbc.core.RowMapper;
import java.util.stream.IntStream;
import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.Objects;
import java.util.List;
import java.util.UUID;

/**
 * Luokka, joka sisältää yleisimmät CRUD-toiminnallisuudet (insert, selectAll jne).
 */
public abstract class BasicRepository<T extends DbEntity> {

    private final NamedParameterJdbcTemplate qTemplate;
    private final DataSourceFactory dataSourceFactory;
    private final SimpleJdbcInsert inserter;
    private final String tableName;
    private String viewName;

    public BasicRepository(DataSourceFactory dataSourceFac, String tableName) {
        this.dataSourceFactory = dataSourceFac;
        this.qTemplate = new NamedParameterJdbcTemplate(dataSourceFac.getDataSource());
        this.inserter = new SimpleJdbcInsert(dataSourceFac.getDataSource()).withTableName(tableName);
        this.tableName = tableName;
    }
    public BasicRepository(DataSourceFactory dataSourceFac, String tableName, String viewName) {
        this(dataSourceFac, tableName);
        this.viewName = viewName;
    }

    public void runInTransaction(Runnable fn) {
        runInTransaction(fn, this.dataSourceFactory.getDataSource());
    }
    public static void runInTransaction(Runnable fn, DataSource ds) {
        DataSourceTransactionManager transactionManager = new DataSourceTransactionManager(ds);
        DefaultTransactionDefinition def = new DefaultTransactionDefinition();
        def.setPropagationBehavior(TransactionDefinition.PROPAGATION_NESTED);
        TransactionStatus status = transactionManager.getTransaction(def);
        try {
            fn.run();
        } catch (Throwable e) {
            transactionManager.rollback(status);
            throw e;
        }
        transactionManager.commit(status);
    }

    /**
     * Insertoi beanin {data} tietokantaan.
     */
    public int insert(T data) {
        this.ensureId(data);
        return this.inserter.execute(new BeanPropertySqlParameterSource(data));
    }

    /**
     * Insertoi beanit {items} tietokantaan.
     */
    public int insert(List<T> items) {
        return IntStream.of(this.inserter.executeBatch(this.createInsertBatch(items))).sum();
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
    public List<T> selectAll(String query, RowMapper<T> mapper) {
        return this.selectAll(query, null, mapper);
    }

    protected List<T> selectAll(SelectQueryFilters filters, RowMapper<T> mapper) {
        return this.selectAll(
            this.newSelectQ(filters),
            filters.hasRules() ? new BeanPropertySqlParameterSource(filters) : null,
            mapper
        );
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

    protected T selectOne(SelectQueryFilters filters, RowMapper<T> mapper) {
        return this.selectOne(
            this.newSelectQ(filters),
            filters.hasRules() ? new BeanPropertySqlParameterSource(filters) : null,
            mapper
        );
    }

    /**
     * Ajaa tietokantakyselyn {q} datalla {data}.
     *
     * @return {int} Päivitettyjen rivien lukumäärä
     */
    public int update(String q, T data) {
        return this.qTemplate.update(q, new BeanPropertySqlParameterSource(data));
    }

    public int update(T bean, String where) {
        return this.update(this.newUpdateQ(bean, where), bean);
    }

    /**
     * Ajaa tietokantakyselyn {q} jokaisesta batchin {data} itemistä.
     *
     * @return {int} Päivitettyjen rivien lukumäärä
     */
    public int updateMany(String q, List<T> data) {
        return IntStream.of(this.qTemplate.batchUpdate(q, SqlParameterSourceUtils.createBatch(data.toArray()))).sum();
    }

    public int updateMany(List<T> data, String where) {
        return this.updateMany(this.newUpdateQ(data.get(0), where), data);
    }

    /**
     * Poistaa rivin {this.tableName}-taulusta, jonka id = id.
     *
     * @return {int} Poistettujen rivien lukumäärä
     */
    public int delete(String id) {
        return this.qTemplate.update(
            this.newDeleteQ("id = :id"),
            new MapSqlParameterSource("id", id)
        );
    }

    public int delete(T data, String where) {
        return this.qTemplate.update(
            this.newDeleteQ(where),
            new BeanPropertySqlParameterSource(data)
        );
    }

    /**
     * SELECT * FROM {this.viewName || this.tableName}View{filters.toSql()}
     */
    protected String newSelectQ(SelectQueryFilters filters) {
        return String.format(
            "SELECT * FROM %sView%s",
            this.viewName == null ? this.tableName : this.viewName,
            filters.hasRules() ? " WHERE " + filters.toSql() : ""
        );
    }

    /**
     * UPDATE {this.tableName} SET {data.toUpdateFields()} WHERE {where}
     */
    private String newUpdateQ(T bean, String where) {
        return String.format("UPDATE `%s` SET %s WHERE %s",
            this.tableName,
            bean.toUpdateFields(),
            where
        );
    }

    /**
     * DELETE FROM {this.tableName} WHERE {where}
     */
    private String newDeleteQ(String where) {
        return String.format("DELETE FROM `%s` WHERE %s", this.tableName, where);
    }

    private void ensureId(T data) {
        if (data.getId() == null) {
            data.setId(UUID.randomUUID().toString());
        }
    }

    private BeanPropertySqlParameterSource[] createInsertBatch(List<T> itemsToInsert) {
        List<BeanPropertySqlParameterSource> out = new ArrayList<>();
        for (T data: itemsToInsert) {
            this.ensureId(data);
            out.add(new BeanPropertySqlParameterSource(data));
        }
        return out.toArray(new BeanPropertySqlParameterSource[0]);
    }
}
