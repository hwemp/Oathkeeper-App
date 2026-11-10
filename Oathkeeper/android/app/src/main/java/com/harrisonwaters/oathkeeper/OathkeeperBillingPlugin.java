package com.harrisonwaters.oathkeeper;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import org.json.JSONArray;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@CapacitorPlugin(name = "OathkeeperBilling")
public class OathkeeperBillingPlugin extends Plugin {
    // Stable one-time-product identifiers. No icons are paid.
    private static final List<String> PRODUCT_IDS = Collections.unmodifiableList(Arrays.asList(
        "oathkeeper.dice.dragonfire", "oathkeeper.dice.frostborne",
        "oathkeeper.dice.elvenleaf", "oathkeeper.dice.celestial",
        "oathkeeper.dice.abyssal", "oathkeeper.dice.gold-forged",
        "oathkeeper.dice.necrotic", "oathkeeper.dice.astral",
        "oathkeeper.dice.oceanic", "oathkeeper.dice.sunfire",
        "oathkeeper.background.moonlit-citadel",
        "oathkeeper.background.ancient-ruins",
        "oathkeeper.background.enchanted-forest",
        "oathkeeper.background.dragons-crag",
        "oathkeeper.background.shadow-marsh",
        "oathkeeper.background.celestial-plains",
        "oathkeeper.background.crystal-caverns",
        "oathkeeper.background.elder-grove",
        "oathkeeper.background.mystic-lake",
        "oathkeeper.background.eternal-keep"
    ));
    private BillingClient client;

    private BillingClient billing() {
        if (client == null) {
            client = BillingClient.newBuilder(getContext())
                .setListener((result, purchases) -> {
                    // Checkout is disabled until trusted server verification
                    // and Play acknowledgment are deployed. Never grant access here.
                })
                .enablePendingPurchases(PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts().build())
                .enableAutoServiceReconnection()
                .build();
        }
        return client;
    }

    private void whenConnected(PluginCall call, Runnable action) {
        BillingClient billingClient = billing();
        if (billingClient.isReady()) {
            action.run();
            return;
        }
        billingClient.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    action.run();
                } else {
                    call.reject("Google Play Billing is not connected.");
                }
            }
            @Override public void onBillingServiceDisconnected() {
                // Future requests reconnect automatically.
            }
        });
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        whenConnected(call, () -> {
            List<QueryProductDetailsParams.Product> requested = new ArrayList<>();
            for (String id : PRODUCT_IDS) {
                requested.add(QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(id)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build());
            }
            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(requested).build();
            billing().queryProductDetailsAsync(params, (result, detailResult) -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject("Could not read Google Play product prices.");
                    return;
                }
                JSONArray products = new JSONArray();
                for (ProductDetails detail : detailResult.getProductDetailsList()) {
                    if (!PRODUCT_IDS.contains(detail.getProductId())) continue;
                    JSObject item = new JSObject();
                    item.put("id", detail.getProductId());
                    item.put("name", detail.getName());
                    item.put("type", "non_consumable");
                    ProductDetails.OneTimePurchaseOfferDetails offer =
                        detail.getOneTimePurchaseOfferDetails();
                    if (offer != null) {
                        item.put("displayPrice", offer.getFormattedPrice());
                    }
                    products.put(item);
                }
                JSObject response = new JSObject();
                response.put("ready", products.length() > 0);
                response.put("products", products);
                call.resolve(response);
            });
        });
    }

    @PluginMethod
    public void getEntitlements(PluginCall call) {
        // A client-side purchase token without server verification is not
        // trusted proof of ownership. Fail closed until a backend exists.
        JSObject response = new JSObject();
        response.put("verified", false);
        response.put("ready", false);
        response.put("productIds", new JSONArray());
        call.resolve(response);
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        call.reject("Restore purchases requires verified Google Play entitlement service.");
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        // Never take money without a fulfillment/verification path.
        call.reject("Google Play checkout is disabled until secure purchase verification is configured.");
    }

    @Override protected void handleOnDestroy() {
        if (client != null) {
            client.endConnection();
            client = null;
        }
    }
}
