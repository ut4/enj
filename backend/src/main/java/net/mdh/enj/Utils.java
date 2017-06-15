package net.mdh.enj;

import java.util.stream.Collectors;
import java.util.List;

public class Utils {
    public static String stringifyAll(List<?> list) {
        return list != null && !list.isEmpty()
            ? list.stream().map(Object::toString).collect(Collectors.joining(", "))
            : null;
    }
}
