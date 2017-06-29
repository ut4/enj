package net.mdh.enj.mapping;

/**
 * Käytetään SELECT kyselyissä, esim.
 *
 * String.format("SELECT foo FROM bar%s%s",
 *     someFilter.hasRules() ? " WHERE " + someFilter.getSql() : ""
 *     anotherFilter.hasRules() ? " OR " + anotherFilter.getSql() : ""
 * )
 */
public interface SelectQueryFilters {
    /**
     * Palauttaa tiedon, onko instanssilla kyselyyn mitään annettavaa, eg. onko
     * beaniin asetettu arvoja.
     */
    boolean hasRules();

    /**
     * Palauttaa tietokantakyselyn osaksi kelpaavan merkkijonon, esim.
     * "foo >= :getterA OR bar = :getterB".
     */
    String toSql();
}
