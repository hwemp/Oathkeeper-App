package com.harrisonwaters.oathkeeper;

import static org.junit.Assert.*;
import android.content.ComponentName;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.nio.ByteBuffer;
import java.io.File;
import java.io.FileOutputStream;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.Set;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Tests compiled launcher aliases, not merely source paths or mockups. */
@RunWith(AndroidJUnit4.class)
public class LauncherIconParityTest {
    @Test
    public void allTenInstalledLauncherAliasesRenderUniqueNonemptyArtwork() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        PackageManager pm = context.getPackageManager();
        String pkg = context.getPackageName();
        String[] ids = {"01", "02", "04", "05", "06", "07", "08", "11", "12", "14"};
        Set<String> hashes = new HashSet<>();
        for (String id : ids) {
            ComponentName alias = new ComponentName(pkg, pkg + ".LauncherIcon" + id);
            ActivityInfo info = pm.getActivityInfo(alias, PackageManager.MATCH_DISABLED_COMPONENTS);
            assertNotNull("Missing launcher alias " + id, info);
            assertTrue("Alias has no launcher icon " + id, info.icon != 0);
            Drawable rendered = info.loadIcon(pm);
            assertNotNull("No icon drawable for " + id, rendered);
            Bitmap bitmap = Bitmap.createBitmap(256, 256, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            rendered.setBounds(0, 0, 256, 256);
            rendered.draw(canvas);
            File dest = new File(context.getExternalFilesDir(null), "rendered-launcher-" + id + ".png");
            try (FileOutputStream file = new FileOutputStream(dest)) {
                assertTrue(bitmap.compress(Bitmap.CompressFormat.PNG, 100, file));
            }
            int opaquePixels = 0;
            ByteBuffer buffer = ByteBuffer.allocate(256 * 256 * Integer.BYTES);
            for (int y = 0; y < 256; y++) {
                for (int x = 0; x < 256; x++) {
                    int pixel = bitmap.getPixel(x, y);
                    buffer.putInt(pixel);
                    if ((pixel >>> 24) > 128) opaquePixels++;
                }
            }
            assertTrue("Launcher image renders empty: " + id, opaquePixels > 15000);
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(buffer.array());
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b & 0xff));
            assertTrue("Two launcher aliases render identical icons: " + id, hashes.add(sb.toString()));
        }
        assertEquals(10, hashes.size());
    }
}
