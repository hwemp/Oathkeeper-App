package com.harrisonwaters.oathkeeper;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OathkeeperIconPlugin.class);
        registerPlugin(OathkeeperBillingPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
