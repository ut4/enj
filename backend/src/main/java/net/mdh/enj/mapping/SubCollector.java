package net.mdh.enj.mapping;

import org.springframework.jdbc.core.RowMapper;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

/**
 * Mahdollistaa tiedon keruun resultsetistä useaan kertaan (kelaa resultsetin
 * alkuun, traversoi sen läpi, ja lopuksi palauttaa kursorin).
 */
public class SubCollector<T> {
    private final RowMapper<T> rowMapper;
    private final String foreignKeyColumn;

    /**
     * @param rowMapper Millä mapperilla mapataan
     * @param foreignKeyColumn Columnin nimi, jonka arvoa matchataan {foreignOriginValue}:en collect-metodissa.
     */
    public SubCollector(RowMapper<T> rowMapper, String foreignKeyColumn) {
        this.rowMapper = rowMapper;
        this.foreignKeyColumn = foreignKeyColumn;
    }

    /**
     * Palauttaa mapatut {T}:t, jonka riveistä löytyi {this.foreignKeyColumn}
     * arvolla {foreignOriginValue}, eli jos:
     *
     * {this.foreignKeyColumn} = "afoo", ja
     * {foreignOriginValue} = 45, niin:
     *
     * {"foo": "sthng", "bar": 1, "afoo": 43} <- skippaa
     * {"foo": "sthng", "bar": 2, "afoo": 44} <- skippaa
     * {"foo": "sthng", "bar": 3, "afoo": 45} <- Mappaa & lisää listaan
     * {"foo": "sthng", "bar": 4, "afoo": 45} <- Mappaa & lisää listaan
     * {"foo": "sthng", "bar": 5, "afoo": 46} <- skippaa
     */
    public List<T> collect(ResultSet rs, int rowNum, int foreignOriginValue) throws SQLException {
        rs.absolute(0);
        List<T> out = new ArrayList<>();
        while (rs.next()) {
            if (rs.getInt(this.foreignKeyColumn) != foreignOriginValue) {
                continue;
            }
            T mapped = this.rowMapper.mapRow(rs, rs.getRow());
            if (mapped != null) {
                out.add(mapped);
            }
        }
        rs.absolute(rowNum);
        return out;
    }
}
