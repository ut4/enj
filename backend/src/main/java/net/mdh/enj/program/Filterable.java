package net.mdh.enj.program;

public interface Filterable {
    void setFilters(QueryFilters filters);
    QueryFilters getFilters();
}
