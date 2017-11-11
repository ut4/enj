package net.mdh.enj.sync;

import org.glassfish.jersey.server.model.Resource;
import org.glassfish.jersey.server.model.ResourceMethod;
import org.glassfish.jersey.server.monitoring.RequestEvent;
import org.glassfish.jersey.server.monitoring.ApplicationEvent;
import org.glassfish.jersey.server.monitoring.RequestEventListener;
import org.glassfish.jersey.server.monitoring.ApplicationEventListener;
import javax.inject.Inject;
import java.util.HashMap;

/**
 * Luo jokaisesta applikaation @Syncable-annotaatiolla annotoidusta REST-reitistä
 * SyncRoute-beanin, ja lisää ne SyncRouteRegister-singletoniin. Triggeröityy vain
 * kerran, ennen applikaation käynnistymistä.
 */
public class SyncRouteCollector implements ApplicationEventListener {

    private final SyncRouteRegister routeRegister;

    @Inject
    public SyncRouteCollector(SyncRouteRegister routeRegister) {
        this.routeRegister = routeRegister;
    }

    @Override
    public void onEvent(ApplicationEvent event) {
        if (event.getType() != ApplicationEvent.Type.INITIALIZATION_APP_FINISHED) {
            return;
        }
        // Luokat, joissa @Path-annotaatio
        for (Resource resourceClass: event.getResourceModel().getResources()) {
            // Luokan metodit, joilla ei omaa @Path-annotaatiota
            this.collectSyncableRoutes(resourceClass, "");
            // Luokan metodit, joilla oma @Path-annotaatio
            for (Resource childResource : resourceClass.getChildResources()) {
                this.collectSyncableRoutes(childResource, resourceClass.getPath());
            }
        }
    }

    private void collectSyncableRoutes(Resource resource, String parentPath) {
        HashMap<ResourceMethod, Syncable> methods = this.getSyncableResourceMethods(resource);
        for (ResourceMethod syncableMethod: methods.keySet()) {
            SyncRoute syncRoute = new SyncRoute();
            syncRoute.setUrl(parentPath + resource.getPath());
            syncRoute.setMethod(syncableMethod.getHttpMethod());
            syncRoute.setPattern(parentPath + resource.getPathPattern().getRegex());
            String[] dependent = methods.get(syncableMethod).dependent();
            if (dependent.length == 2) {// [0] = url, [1] = foreignKey
                syncRoute.setDependent(dependent[0], dependent[1]);
            }
            this.routeRegister.add(syncRoute);
        }
    }

    private HashMap<ResourceMethod, Syncable> getSyncableResourceMethods(Resource childResource) {
        HashMap<ResourceMethod, Syncable> out = new HashMap<>();
        for (ResourceMethod method : childResource.getResourceMethods()) {
            Syncable annotation = method.getInvocable().getHandlingMethod().getAnnotation(Syncable.class);
            if (annotation != null) {
                out.put(method, annotation);
            }
        }
        return out;
    }

    @Override
    public RequestEventListener onRequest(RequestEvent requestEvent) {
        return null;
    }
}
