package net.mdh.enj.sync;

import org.junit.Test;
import org.junit.Assert;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
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
        Map<String, OperationTreeNode> tree = new OperationTreeFactory(testQueue, syncRouteRegister).makeTree();
        // Lisäsikö ensimmäisen treenin, ja sen kaikki operaatiot?
        OperationTreeNode expectedFirstNode = tree.get("uid1");
        Assert.assertNotNull("Pitäisi luoda OperationTreeNode workoutista \"uuid1\"", expectedFirstNode);
        Assert.assertEquals("Pitäisi lisätä workoutin \"uuid1\" POST-pyyntö", testQueue.get(0), expectedFirstNode.POST);
        Assert.assertEquals("Pitäisi lisätä workoutin \"uuid1\" PUT-pyynnöt", Arrays.asList(
            testQueue.get(1),
            testQueue.get(2)
        ), expectedFirstNode.PUT);
        Assert.assertEquals("Pitäisi lisätä workoutin \"uuid1\" DELETE-pyyntö", testQueue.get(3), expectedFirstNode.DELETE);
        // Lisäsikö toisen treenin?
        OperationTreeNode expectedSecondNode = tree.get("uid2");
        Assert.assertNotNull("Pitäisi luoda OperationTreeNode workoutista \"uuid1\"", expectedSecondNode);
        Assert.assertEquals("Pitäisi lisätä workoutin \"uuid1\" POST-pyyntö", testQueue.get(4), expectedSecondNode.POST);
        Assert.assertEquals("Ei pitäisi asettaa workoutin \"uuid2\"-resurssin nodeen PUT-pyyntöjä", 0, expectedSecondNode.PUT.size());
        Assert.assertNull("Ei pitäisi asettaa workoutin \"uuid2\"-resurssin nodeen DELETE-pyyntö", expectedSecondNode.DELETE);
    }
    @Test
    public void ryhmitteleeOperaatiotRekursiivisesti() throws IOException {
        List<SyncQueueItem> testQueue = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'program','method':'POST'},'data':{'id':'uid10','foo':2}}," +
            "{'id':2,'route':{'url':'program/workout','method':'POST'},'data':{'id':'uid20','programId':'uid10'}}," +
            "{'id':3,'route':{'url':'program/workout/exercise','method':'PUT'},'data':{'id':'uid30','programWorkoutId':'uid20'}}," +
            "{'id':4,'route':{'url':'program/uid10','method':'DELETE'},'data':null}" +
        "]");
        Map<String, OperationTreeNode> tree = new OperationTreeFactory(testQueue, syncRouteRegister).makeTree();
        // Lisäsikö ensimmäisen ohjelman?
        OperationTreeNode expectedFirstNode = tree.get("uid10");
        Assert.assertNotNull(expectedFirstNode);
        Assert.assertEquals(testQueue.get(0), expectedFirstNode.POST);
        Assert.assertEquals(0, expectedFirstNode.PUT.size());
        Assert.assertEquals(testQueue.get(3), expectedFirstNode.DELETE);
        Assert.assertEquals(1, expectedFirstNode.children.size());
        // Lisäsikö ohjelmatreenin ohjelman lapseksi?
        OperationTreeNode expectedFirstNodeChild = expectedFirstNode.children.get("uid20");
        Assert.assertNotNull(expectedFirstNodeChild);
        Assert.assertEquals(testQueue.get(1), expectedFirstNodeChild.POST);
        Assert.assertEquals(0, expectedFirstNodeChild.PUT.size());
        Assert.assertNull(expectedFirstNodeChild.DELETE);
        Assert.assertEquals(1, expectedFirstNodeChild.children.size());
        // Lisäsikö ohjelmatreeninliikkeen ohjelmatreenin lapseksi?
        OperationTreeNode expectedFirstNodeChildChild = expectedFirstNodeChild.children.get("uid30");
        Assert.assertNotNull(expectedFirstNodeChildChild);
        Assert.assertNull(expectedFirstNodeChildChild.POST);
        Assert.assertEquals(Collections.singletonList(testQueue.get(2)), expectedFirstNodeChildChild.PUT);
        Assert.assertNull(expectedFirstNodeChildChild.DELETE);
        Assert.assertEquals(0, expectedFirstNodeChildChild.children.size());
    }
    @Test
    public void lisääDeleteLapsetParentiin() throws IOException {
        List<SyncQueueItem> testQueue = this.jsonToSyncQueue("[" +
            "{'id':1,'route':{'url':'workout','method':'POST'},'data':{'id':'uid1','foo':1}}," +
            "{'id':2,'route':{'url':'workout/exercise','method':'POST'},'data':{'id':'uid10','workoutId':'uid1'}}," +
            "{'id':3,'route':{'url':'workout/exercise/uid10?workoutId=uid1','method':'DELETE'},'data':null}" +
        "]");
        Map<String, OperationTreeNode> tree = new OperationTreeFactory(testQueue, syncRouteRegister).makeTree();
        // Lisäsikö treenin?
        OperationTreeNode expectedFirstNode = tree.get("uid1");
        Assert.assertNotNull(expectedFirstNode);
        // Lisäsikö treeniliikkeen treenin lapseksi?
        OperationTreeNode expectedFirstNodeChild = expectedFirstNode.children.get("uid10");
        Assert.assertNotNull(expectedFirstNodeChild);
        Assert.assertEquals(testQueue.get(1), expectedFirstNodeChild.POST);
        Assert.assertEquals(0, expectedFirstNodeChild.PUT.size());
        Assert.assertEquals(testQueue.get(2), expectedFirstNodeChild.DELETE);
        Assert.assertEquals(0, expectedFirstNodeChild.children.size());
    }
}
