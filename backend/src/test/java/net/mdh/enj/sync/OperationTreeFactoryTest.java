package net.mdh.enj.sync;

import org.junit.Test;
import org.junit.Assert;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class OperationTreeFactoryTest extends QueueOptimizingTestCase {
    @Test
    public void ryhmitteleeSamallaIdlläVarustetutOperaatiotYhteenOperationTreeNodeen() throws IOException {
        List<SyncQueueItem> testQueue = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','start':1}}," +
            "{'id':2,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':2}}," +
            "{'id':3,'route':{'url':'workout','method':'PUT'},'data':{'id':'uid1','start':5}}," +
            "{'id':4,'route':{'url':'workout/uid1','method':'DELETE'},'data':null}," +
            "{'id':5,'route':{'url':'workout','method':'POST'},'data':{'id':'uid2','start':3}}" +
        "]");
        Map<String, OperationTreeNode> tree = OperationTreeFactory.makeTree(testQueue, syncRouteRegister);
        // Lisäsikö ensimmäisen treenin, ja sen kaikki operaatiot?
        OperationTreeNode expectedFirstNode = tree.get("uid1");
        Assert.assertNotNull("Pitäisi luoda OperationTreeNode workoutista \"uuid1\"", expectedFirstNode);
        Assert.assertEquals("Pitäisi lisätä workoutin \"uuid1\" POST-pyyntö", expectedFirstNode.POST, testQueue.get(0));
        Assert.assertEquals("Pitäisi lisätä workoutin \"uuid1\" PUT-pyynnöt", expectedFirstNode.PUT, Arrays.asList(
            testQueue.get(1),
            testQueue.get(2)
        ));
        Assert.assertEquals("Pitäisi lisätä workoutin \"uuid1\" DELETE-pyyntö", expectedFirstNode.DELETE, testQueue.get(3));
        // Lisäsikö toisen treenin?
        OperationTreeNode expectedSecondNode = tree.get("uid2");
        Assert.assertNotNull("Pitäisi luoda OperationTreeNode workoutista \"uuid1\"", expectedSecondNode);
        Assert.assertEquals("Pitäisi lisätä workoutin \"uuid1\" POST-pyyntö", expectedSecondNode.POST, testQueue.get(4));
        Assert.assertEquals("Ei pitäisi asettaa workoutin \"uuid2\"-resurssin nodeen PUT-pyyntöjä", 0, expectedSecondNode.PUT.size());
        Assert.assertNull("Ei pitäisi asettaa workoutin \"uuid2\"-resurssin nodeen DELETE-pyyntö", expectedSecondNode.DELETE);
    }
}
