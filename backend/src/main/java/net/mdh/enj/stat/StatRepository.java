package net.mdh.enj.stat;

import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import net.mdh.enj.db.DataSourceFactory;
import javax.inject.Inject;
import java.util.List;
import java.util.Map;

/**
 * Suoltaa statistiikkaa tietokannasta.
 */
public class StatRepository {

    private final NamedParameterJdbcTemplate qTemplate;

    @Inject
    public StatRepository(DataSourceFactory dataSourceFac) {
        this.qTemplate = new NamedParameterJdbcTemplate(dataSourceFac.getDataSource());
    }

    List<BestSetMapper.BestSet> selectBestSets(String userId) {
        return this.qTemplate.query("SELECT * FROM bestSetView", (Map<String, ?>) null, new BestSetMapper());
    }
}
