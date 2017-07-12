package net.mdh.enj.sync;

/**
 * Jokaiselle synkattavalle reitille luotava uniikki nimi. Eliminoi tarpeen määritellä
 * url & method-arvot jokaiseen SyncQueuItem:iin.
 */
public enum SyncRouteName {
    WORKOUT_INSERT("workout-insert"),
    WORKOUT_EXERCISE_ADD("workout-exercise-add");

    private final String routeName;

    SyncRouteName(final String routeName) {
        this.routeName = routeName;
    }

    @Override
    public String toString() {
        return routeName;
    }
}
