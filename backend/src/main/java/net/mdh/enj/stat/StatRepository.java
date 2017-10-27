package net.mdh.enj.stat;

import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import net.mdh.enj.db.DataSourceFactory;
import javax.inject.Inject;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Suoltaa statistiikkaa tietokannasta.
 */
public class StatRepository {

    private final NamedParameterJdbcTemplate qTemplate;
    private final Map<String, String> progressFormulae;
    // https://en.wikipedia.org/wiki/One-repetition_maximum
    static final String FORMULA_OCONNER = "o'conner";
    static final String FORMULA_EPLEY = "epley";
    static final String FORMULA_WATHAN = "wathan";
    static final String FORMULA_TOTAL_LIFTED = "total-lifted";
    private static final String generalStatSelectQ = (
        "SELECT" +
            " COUNT(DISTINCT w.id)          AS totalWorkoutCount," +
            " SUM(DISTINCT `end` - `start`) AS totalWorkoutTime," +
            " AVG(DISTINCT `end` - `start`) AS averageWorkoutTime," +
            " MAX(`end` - `start`)          AS longestWorkoutTime," +
            " MIN(`end` - `start`)          AS shortestWorkoutTime," +
            " COUNT(wes.id)                 AS totalSetCount," +
            " SUM(wes.reps * wes.weight)    AS totalLifted," +
            " SUM(wes.reps)                 AS totalReps" +
        " FROM workout w" +
        " JOIN workoutExercise we ON (we.workoutId = w.id)" +
        " JOIN workoutExerciseSet wes ON (wes.workoutExerciseId = we.id)" +
        " WHERE w.`end` IS NOT NULL AND w.`end` > 0 AND w.userId = :userId"
    );

    @Inject
    public StatRepository(DataSourceFactory dataSourceFac) {
        this.qTemplate = new NamedParameterJdbcTemplate(dataSourceFac.getDataSource());
        progressFormulae = new HashMap<>();
        progressFormulae.put(FORMULA_OCONNER,      "weight * (reps / 40 + 1)");
        progressFormulae.put(FORMULA_EPLEY,        "weight * (reps / 30 + 1)");
        progressFormulae.put(FORMULA_WATHAN,       "100 * weight / (48.8 + 53.8 * EXP(-0.075 * reps))");
        progressFormulae.put(FORMULA_TOTAL_LIFTED, "weight * reps");
    }

    List<BestSetMapper.BestSet> selectBestSets(String userId) {
        return this.qTemplate.query(
            "SELECT * FROM bestSetView WHERE userId = :userId ORDER BY timesImproved DESC",
            new MapSqlParameterSource("userId", userId),
            new BestSetMapper()
        );
    }

    List<ProgressSetMapper.ProgressSet> selectProgress(ProgressSelectFilters filters) {
        return this.qTemplate.query(
            this.newProgressSelectQ(filters),
            new BeanPropertySqlParameterSource(filters),
            new ProgressSetMapper()
        );
    }

    GeneralStatsMapper.GeneralStats selectGeneralStats(String userId) {
        List<GeneralStatsMapper.GeneralStats> data = this.qTemplate.query(
            generalStatSelectQ,
            new MapSqlParameterSource("userId", userId),
            new GeneralStatsMapper()
        );
        return !data.isEmpty() ? data.get(0) : null;
    }

    private String newProgressSelectQ(ProgressSelectFilters filters) {
        String formula = this.progressFormulae.get(filters.getFormula());
        if (formula == null) {
            throw new IllegalArgumentException(filters.getFormula() + " ei ole validi formula." +
                " Tuetut arvot: " + String.join(", ", this.progressFormulae.keySet())
            );
        }
        return String.format(
            "SELECT *, (%s) AS calculatedResult FROM setProgressView WHERE %s" +
                " ORDER BY liftedAt %s LIMIT 10",
            formula,
            filters.toSql(),
            filters.getAfter() == null ? "DESC" : "ASC"
        );
    }
}
