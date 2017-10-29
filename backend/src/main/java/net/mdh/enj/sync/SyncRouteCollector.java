package net.mdh.enj.sync;

import org.glassfish.jersey.server.model.Resource;
import org.glassfish.jersey.server.model.ResourceMethod;
import org.glassfish.jersey.server.monitoring.RequestEvent;
import org.glassfish.jersey.server.monitoring.ApplicationEvent;
import org.glassfish.jersey.server.monitoring.RequestEventListener;
import org.glassfish.jersey.server.monitoring.ApplicationEventListener;
import java.util.ArrayList;
import java.util.Arrays;
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
            String urlNamespace = syncRoute.getUrlNamespace();
            if (urlNamespace.replace("/all", "").contains("/")) {
                String[] parts = urlNamespace.split("/");
                syncRoute.setParent(String.join("/", Arrays.copyOf(parts, parts.length - 1)));
                syncRoute.setForeignKey(this.makeForeignKeyFromUrlSegments(parts));

            }
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

    private String makeForeignKeyFromUrlSegments(String[] urlSegments) {
        StringBuilder out = new StringBuilder(urlSegments[0]);
        for (int i = 1; i < urlSegments.length - 1; i++) {
            out.append(urlSegments[i].substring(0, 1).toUpperCase()).append(urlSegments[i].substring(1));
        }
        return out.toString() + "Id";
    }

    @Override
    public RequestEventListener onRequest(RequestEvent requestEvent) {
        return null;
    }
}
