package net.mdh.enj;

import net.mdh.enj.sync.Syncable;
import net.mdh.enj.sync.SyncRoute;
import net.mdh.enj.sync.SyncRouteRegister;
import org.glassfish.jersey.server.model.Resource;
import org.glassfish.jersey.server.model.ResourceMethod;
import org.glassfish.jersey.server.monitoring.RequestEvent;
import org.glassfish.jersey.server.monitoring.ApplicationEvent;
import org.glassfish.jersey.server.monitoring.RequestEventListener;
import org.glassfish.jersey.server.monitoring.ApplicationEventListener;
import java.util.ArrayList;
import javax.inject.Inject;

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
        for (ResourceMethod syncableMethod: this.getSyncableResourceMethods(resource)) {
            SyncRoute syncRoute = new SyncRoute();
            syncRoute.setUrl(parentPath + resource.getPath());
            syncRoute.setMethod(syncableMethod.getHttpMethod());
            syncRoute.setPattern(parentPath + resource.getPathPattern().getRegex());
            this.routeRegister.add(syncRoute);
        }
    }

    private ArrayList<ResourceMethod> getSyncableResourceMethods(Resource childResource) {
        ArrayList<ResourceMethod> out = new ArrayList<>();
        for (ResourceMethod method : childResource.getResourceMethods()) {
            if (method.getInvocable().getHandlingMethod().getAnnotation(Syncable.class) != null) {
                out.add(method);
            }
        }
        return out;
    }

    @Override
    public RequestEventListener onRequest(RequestEvent requestEvent) {
        return null;
    }
}
