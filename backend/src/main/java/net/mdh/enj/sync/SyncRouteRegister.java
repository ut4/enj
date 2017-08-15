package net.mdh.enj.sync;

import java.util.HashSet;

/**
 * Sisältää kaikki applikaatiossa määritellyt @Syncable REST-reitit. Täytetään
 * net.mdh.enj.SyncRouteCollector:in toimesta applikaation käynnistymisen yhteydessä.
 */
public class SyncRouteRegister extends HashSet<SyncRoute> {
    /**
     * Palauttaa rekisteröidyn @Syncable-reitin, jolla nimi {routeName}, tai null,
     * jos sitä ei löytynyt.
     */
    public SyncRoute find(Route route) {
        for (SyncRoute registered: this) {
            String pattern = registered.getPattern();
            if (registered.getMethod().equals(route.getMethod()) && (
                    pattern == null && route.getUrl().equals(registered.getUrl()) ||
                    pattern != null && route.getUrl().matches(pattern)
                )) {
                return registered;
            }
        }
        return null;
    }
    /**
     * Palauttaa tiedon, onko nimellä {routeNameToLookFor} rekisteröity
     * \@Syncable-reittiä.
     */
    public boolean contains(Route routeToLookFor) {
        return this.find(routeToLookFor) != null;
    }
}
