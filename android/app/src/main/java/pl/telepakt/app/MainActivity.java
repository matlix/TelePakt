package pl.telepakt.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import pl.telepakt.app.overlay.TelePaktOverlayPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TelePaktOverlayPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
