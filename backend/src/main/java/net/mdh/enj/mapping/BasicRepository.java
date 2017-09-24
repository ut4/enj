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
import java.util.ArrayList;
import java.util.Objects;
import java.util.List;
import java.util.UUID;

/**
 * Luokka, joka sisältää yleisimmät CRUD-toiminnallisuudet (insert, selectAll jne).
 */
public abstract class BasicRepository<T extends DbEntity> {

    private final DataSourceFactory dataSourceFactory;
    private final NamedParameterJdbcTemplate qTemplate;
    private final SimpleJdbcInsert inserter;
    private final String tableName;

    public BasicRepository(DataSourceFactory dataSourceFac, String tableName) {
        this.dataSourceFactory = dataSourceFac;
        this.qTemplate = new NamedParameterJdbcTemplate(dataSourceFac.getDataSource());
        this.inserter = new SimpleJdbcInsert(dataSourceFac.getDataSource()).withTableName(tableName);
        this.tableName = tableName;
    }

    public void runInTransaction(Runnable fn) {
        DataSourceTransactionManager transactionManager = new DataSourceTransactionManager(
            this.dataSourceFactory.getDataSource()
        );
        DefaultTransactionDefinition def = new DefaultTransactionDefinition();
        def.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);
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

    /**
     * Ajaa tietokantakyselyn {q} datalla {data}.
     *
     * @return {int} Päivitettyjen rivien lukumäärä
     */
    public int update(String q, T data) {
        return this.qTemplate.update(q, new BeanPropertySqlParameterSource(data));
    }

    /**
     * Ajaa tietokantakyselyn {q} jokaisesta batchin {data} itemistä.
     *
     * @return {int} Päivitettyjen rivien lukumäärä
     */
    public int updateMany(String q, List<T> data) {
        return IntStream.of(this.qTemplate.batchUpdate(q, SqlParameterSourceUtils.createBatch(data.toArray()))).sum();
    }

    /**
     * Poistaa rivin {this.tableName}-taulusta, jonka id = id.
     *
     * @return {int} Poistettujen rivien lukumäärä
     */
    public int delete(String id) {
        return this.qTemplate.update(
            String.format("DELETE FROM `%s` WHERE id = :id", this.tableName),
            new MapSqlParameterSource("id", id)
        );
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
