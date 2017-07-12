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
    public SyncRoute find(String routeName) {
        for (SyncRoute registered: this) {
            if (registered.getName().toString().equals(routeName)) {
                return registered;
            }
        }
        return null;
    }
    /**
     * Palauttaa tiedon, onko nimellä {routeNameToLookFor} rekisteröity
     * \@Syncable-reittiä.
     */
    public boolean contains(String routeNameToLookFor) {
        return this.find(routeNameToLookFor) != null;
    }
}
