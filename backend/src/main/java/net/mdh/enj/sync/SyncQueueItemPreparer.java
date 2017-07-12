package net.mdh.enj.sync;

import java.util.List;

/**
 * Rajapinta @Syncable(preparedBy = ${luokka}) preparedBy-luokille.
 */
public interface SyncQueueItemPreparer {
    /**
     * Metodi, jonka tarkoitus on valmistella synkattava itemi ennen synkkausta.
     * Käytetään esim. silloin, kun synkattava data on riippuvainen saman batchin
     * aiemmin synkatusta itemistä, ja tämän avulla puuttuva tieto voidaan täyttää
     * (alreadySyncedItems).
     */
    void prepareForSync(SyncQueueItem itemToPrepare, List<SyncQueueItem> alreadySyncedItems) throws Exception;
}
