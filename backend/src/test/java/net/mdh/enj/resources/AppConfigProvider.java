package net.mdh.enj.resources;

import net.mdh.enj.AppConfig;

public class AppConfigProvider {
    private static AppConfig appConfig;
    public static AppConfig getInstance() {
        if (appConfig == null) {
            appConfig = new AppConfig().selfload();
        }
        return appConfig;
    }
}
