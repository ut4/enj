package net.mdh.enj;

import javax.ws.rs.ext.Provider;
import javax.ws.rs.ext.ContextResolver;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;

@Provider
public class JsonMapperProvider implements ContextResolver<ObjectMapper> {

    private static final ObjectMapper INSTANCE;
    static {
        INSTANCE = new ObjectMapper();
        INSTANCE.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    @Override
    public ObjectMapper getContext(Class<?> type) {
        return getInstance();
    }

    public static ObjectMapper getInstance() {
        return INSTANCE;
    }
}