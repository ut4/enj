package net.mdh.enj.sync;

import java.lang.annotation.Target;
import java.lang.annotation.Retention;
import java.lang.annotation.ElementType;
import java.lang.annotation.RetentionPolicy;

/**
 * Määritellään synkattaviin REST-reitteihin.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Syncable {
    /**
     * Reitin nimi/id, pakollinen.
     */
    SyncRouteName routeName();
    /**
     * Luokka, jonka prepareForSync-metodi triggeröidään SyncControllerin toimesta
     * ennen varsinaista synkkausta. Ei pakollinen.
     */
    Class<? extends SyncQueueItemPreparer> preparedBy() default SyncQueueItemPreparer.class;
}
