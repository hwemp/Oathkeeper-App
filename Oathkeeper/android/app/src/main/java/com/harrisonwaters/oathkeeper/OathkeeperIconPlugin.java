package com.harrisonwaters.oathkeeper;

import android.content.ComponentName;
import android.content.pm.PackageManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import java.util.LinkedHashMap;
import java.util.Map;

@CapacitorPlugin(name = "OathkeeperIcon")
public class OathkeeperIconPlugin extends Plugin {
    private static final String DEFAULT_ALIAS = "LauncherOriginal";
    private static final Map<String, String> ICONS = new LinkedHashMap<>();

    static {
        for (String number : new String[]{"01","02","04","05","06","07","08","11","12","14"}) {
            ICONS.put("AppIcon-" + number, "LauncherIcon" + number);
        }
    }

    private ComponentName component(String alias) {
        return new ComponentName(getContext().getPackageName(),
                getContext().getPackageName() + "." + alias);
    }

    private String currentIcon() {
        PackageManager manager = getContext().getPackageManager();
        for (Map.Entry<String, String> item : ICONS.entrySet()) {
            if (manager.getComponentEnabledSetting(component(item.getValue()))
                    == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) {
                return item.getKey();
            }
        }
        return "default";
    }

    private void switchIcon(String icon, PluginCall call) {
        if (!"default".equals(icon) && !ICONS.containsKey(icon)) {
            call.reject("This icon is not included in Oathkeeper.");
            return;
        }
        try {
            PackageManager manager = getContext().getPackageManager();
            String chosen = "default".equals(icon) ? DEFAULT_ALIAS : ICONS.get(icon);
            // Enable the new launcher FIRST so the app always remains launchable.
            manager.setComponentEnabledSetting(component(chosen),
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP);
            for (String alias : ICONS.values()) {
                if (!chosen.equals(alias)) {
                    manager.setComponentEnabledSetting(component(alias),
                            PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                            PackageManager.DONT_KILL_APP);
                }
            }
            if (!DEFAULT_ALIAS.equals(chosen)) {
                manager.setComponentEnabledSetting(component(DEFAULT_ALIAS),
                        PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                        PackageManager.DONT_KILL_APP);
            }
            JSObject response = new JSObject();
            response.put("supported", true);
            response.put("currentIcon", icon);
            response.put("isOriginal", "default".equals(icon));
            call.resolve(response);
        } catch (Exception e) {
            call.reject("Could not change launcher icon: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getState(PluginCall call) {
        String icon = currentIcon();
        JSObject response = new JSObject();
        response.put("supported", true);
        response.put("currentIcon", icon);
        response.put("isOriginal", "default".equals(icon));
        call.resolve(response);
    }

    @PluginMethod
    public void setIcon(PluginCall call) {
        String icon = call.getString("iconName");
        if (icon == null) {
            call.reject("Select an icon first.");
            return;
        }
        switchIcon(icon, call);
    }

    @PluginMethod
    public void restoreDefault(PluginCall call) {
        switchIcon("default", call);
    }
}
