package net.mdh.enj.auth;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import net.mdh.enj.db.IneffectualOperationException;
import org.springframework.jdbc.core.JdbcTemplate;
import javax.sql.DataSource;
import javax.inject.Inject;

public class AccountManager {

    private final DataSource ds;
    private final JdbcTemplate qTemplate;

    @Inject
    AccountManager(DataSourceFactory dataSourceFac) {
        this.ds = dataSourceFac.getDataSource();
        this.qTemplate = new JdbcTemplate(this.ds);
    }

    void destroy(String userId) {
        BasicRepository.runInTransaction(() -> {
            // 1. Poista ohjelmat - triggeri poistaa programWorkoutit & programWorkoutExerciset
            this.qTemplate.update("DELETE FROM program WHERE userId = ?", userId);
            // 2. Poista treenit - triggeri poistaa workoutExercise & workoutExerciseSetit & bestSetit
            this.qTemplate.update("DELETE FROM workout WHERE userId = ?", userId);
            // 3. Poista liikkeet - triggeri poistaa exerciseVariantit
            this.qTemplate.update("DELETE FROM exercise WHERE userId = ?", userId);
            // 4. Poista käyttäjä
            if (this.qTemplate.update("DELETE FROM `user` WHERE id = ?", userId) < 1) {
                throw new IneffectualOperationException("Käyttäjän poisto epäonnistui");
            }
        }, this.ds);
    }
}
