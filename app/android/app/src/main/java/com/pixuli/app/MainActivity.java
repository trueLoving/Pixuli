package com.pixuli.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PixuliDownloadsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
