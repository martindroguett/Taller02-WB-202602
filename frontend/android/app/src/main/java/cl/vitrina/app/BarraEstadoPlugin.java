package cl.vitrina.app;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.LayerDrawable;
import android.view.Gravity;
import android.view.Window;
import androidx.core.view.WindowCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Pinta la barra de estado con el color que pida la pantalla; la de navegación (abajo) siempre
 * queda con el fondo de la app.
 * La web queda dentro de esas franjas, así que lo que se ve detrás es el fondo de la ventana.
 */
@CapacitorPlugin(name = "BarraEstado")
public class BarraEstadoPlugin extends Plugin {

    @PluginMethod
    public void colorear(PluginCall call) {
        String color = call.getString("color", "#F1F2F6");
        boolean iconosClaros = Boolean.TRUE.equals(call.getBoolean("iconosClaros", false));
        getActivity().runOnUiThread(() -> {
            try {
                Window w = getActivity().getWindow();
                int alto = 0;
                int id = getContext().getResources().getIdentifier("status_bar_height", "dimen", "android");
                if (id > 0) alto = getContext().getResources().getDimensionPixelSize(id);
                LayerDrawable fondo = new LayerDrawable(new android.graphics.drawable.Drawable[] {
                    new ColorDrawable(Color.parseColor("#F1F2F6")),
                    new ColorDrawable(Color.parseColor(color))
                });
                fondo.setLayerGravity(1, Gravity.TOP | Gravity.FILL_HORIZONTAL);
                fondo.setLayerHeight(1, alto);
                w.getDecorView().setBackground(fondo);
                var c = WindowCompat.getInsetsController(w, w.getDecorView());
                c.setAppearanceLightStatusBars(!iconosClaros);
                call.resolve(new JSObject());
            } catch (IllegalArgumentException e) {
                call.reject("Color no válido");
            }
        });
    }
}
