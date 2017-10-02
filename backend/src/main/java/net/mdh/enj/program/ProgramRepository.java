package net.mdh.enj.program;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import org.springframework.jdbc.core.RowMapper;
import javax.inject.Inject;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.List;

public class ProgramRepository extends BasicRepository<Program> {

    private final static String TABLE_NAME = "program";

    @Inject
    public ProgramRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }

    List<Program> selectAll(SelectFilters filters) {
        return super.selectAll(filters, new ProgramMapper());
    }

    Program selectOne(SelectFilters filters) {
        return super.selectOne(filters, new ProgramMapper());
    }

    private static final class ProgramMapper implements RowMapper<Program> {
        @Override
        public Program mapRow(ResultSet rs, int rowNum) throws SQLException {
            Program program = new Program();
            program.setId(rs.getString("programId"));
            program.setName(rs.getString("programName"));
            program.setStart(rs.getLong("programStart"));
            program.setEnd(rs.getLong("programEnd"));
            program.setDescription(rs.getString("programDescription"));
            program.setUserId(rs.getString("programUserId"));
            return program;
        }
    }
}
