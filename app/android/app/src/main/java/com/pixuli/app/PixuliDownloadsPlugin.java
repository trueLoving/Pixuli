package com.pixuli.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * 把文件写入系统「下载」目录。
 * Android 10 起公共 Documents 目录不可直接写，Filesystem.writeFile 会失败。
 */
@CapacitorPlugin(
    name = "PixuliDownloads",
    permissions = {
        @Permission(
            strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE },
            alias = "storage"
        )
    }
)
public class PixuliDownloadsPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String name = call.getString("name");
        String data = call.getString("data");
        if (name == null || name.trim().isEmpty() || data == null || data.isEmpty()) {
            call.reject("missing file");
            return;
        }
        if (needsLegacyStoragePermission() && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermissionCallback");
            return;
        }
        getBridge().execute(() -> writeDownload(call, name.trim(), data, call.getString("mimeType", "application/octet-stream")));
    }

    @PermissionCallback
    private void storagePermissionCallback(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) {
            save(call);
            return;
        }
        call.reject("storage permission denied");
    }

    private boolean needsLegacyStoragePermission() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.Q;
    }

    private void writeDownload(PluginCall call, String name, String data, String mimeType) {
        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                saveWithMediaStore(name, mimeType, bytes);
            } else {
                saveWithPublicDownloads(name, bytes);
            }
            call.resolve();
        } catch (Exception error) {
            String message = error.getMessage();
            call.reject(message != null && !message.isEmpty() ? message : "save failed", error);
        }
    }

    private void saveWithMediaStore(String name, String mimeType, byte[] bytes) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);
        android.net.Uri item = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (item == null) {
            throw new IllegalStateException("could not create download");
        }
        try (OutputStream out = resolver.openOutputStream(item)) {
            if (out == null) {
                throw new IllegalStateException("could not open download");
            }
            out.write(bytes);
        } catch (Exception error) {
            resolver.delete(item, null, null);
            throw error;
        }
        values.clear();
        values.put(MediaStore.MediaColumns.IS_PENDING, 0);
        resolver.update(item, values, null, null);
    }

    private void saveWithPublicDownloads(String name, byte[] bytes) throws Exception {
        File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IllegalStateException("could not create download");
        }
        File file = new File(dir, name);
        try (FileOutputStream out = new FileOutputStream(file)) {
            out.write(bytes);
        }
    }
}
