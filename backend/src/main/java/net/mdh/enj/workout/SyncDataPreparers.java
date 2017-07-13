package net.mdh.enj.workout;

import net.mdh.enj.sync.SyncQueueItem;
import net.mdh.enj.sync.SyncQueueItemPreparer;
import java.util.List;

public class SyncDataPreparers {
    /**
     * Etsii synkattavan treeniliikedatan workoutId-viiteavaimen arvoksi oikean
     * arvon edellä synkatusta treenistä (insertId/syncResult). Muutoin workoutId
     * viiteavain jää virheellisesti viittaamaan frontendissä generoituun, eikä
     * MariaDB:n generoimaan id:hen.
     */
    public static class WorkoutExerciseInsertPreparer implements SyncQueueItemPreparer {
        public void prepareForSync(SyncQueueItem itemToPrepare, List<SyncQueueItem> alreadySyncedItems) throws Exception {
            //
            Integer workoutIdToLookFor = (Integer) itemToPrepare.getData().get("workoutId");
            //
            SyncQueueItem parentWorkoutSyncItem = alreadySyncedItems.stream().filter(si ->
                si.getRoute().getUrl().equals("workout") &&
                si.getRoute().getMethod().equals("POST") &&
                si.getData().get("id").equals(workoutIdToLookFor)
            ).findFirst().orElse(null);
            //
            if (parentWorkoutSyncItem == null) {
                throw new Exception(String.format("Synkattavalle treeniliikkeelle %d ei löytynyt synkattua treeniä %d",
                    (Integer) itemToPrepare.getData().get("id"), workoutIdToLookFor));
            }
            //
            itemToPrepare.getData().put("workoutId", parentWorkoutSyncItem.getSyncResult());
        }
    }
}
