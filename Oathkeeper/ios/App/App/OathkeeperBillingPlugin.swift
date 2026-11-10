import Capacitor
import StoreKit

// Native StoreKit 2 plumbing. This is a closed, allowlisted catalog.
// Checkout stays disabled in the web layer until product registration and
// testing are complete. Never grant access for unverified transactions.
@objc(OathkeeperBillingPlugin)
public class OathkeeperBillingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OathkeeperBillingPlugin"
    public let jsName = "OathkeeperBilling"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getEntitlements", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise)
    ]

    private let allowed: Set<String> = [
        "oathkeeper.dice.dragonfire", "oathkeeper.dice.frostborne",
        "oathkeeper.dice.elvenleaf", "oathkeeper.dice.celestial",
        "oathkeeper.dice.abyssal", "oathkeeper.dice.gold_forged",
        "oathkeeper.dice.necrotic", "oathkeeper.dice.astral",
        "oathkeeper.dice.oceanic", "oathkeeper.dice.sunfire",
        "oathkeeper.background.moonlit_citadel",
        "oathkeeper.background.ancient_ruins",
        "oathkeeper.background.enchanted_forest",
        "oathkeeper.background.dragons_crag",
        "oathkeeper.background.shadow_marsh",
        "oathkeeper.background.celestial_plains",
        "oathkeeper.background.crystal_caverns",
        "oathkeeper.background.elder_grove",
        "oathkeeper.background.mystic_lake",
        "oathkeeper.background.eternal_keep"
    ]

    private func verifiedIDs() async -> [String] {
        var ids = Set<String>()
        for await result in StoreKit.Transaction.currentEntitlements {
            guard case .verified(let transaction) = result,
                  allowed.contains(transaction.productID),
                  transaction.revocationDate == nil else { continue }
            ids.insert(transaction.productID)
        }
        return ids.sorted()
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        Task {
            do {
                let requested = Set(call.getArray("ids", String.self) ?? []).intersection(allowed)
                let products = try await StoreKit.Product.products(for: Array(requested))
                let result = products.map { product -> [String: Any] in
                    [
                        "id": product.id,
                        "name": product.displayName,
                        "displayPrice": product.displayPrice,
                        "type": "non_consumable"
                    ]
                }
                call.resolve(["ready": !products.isEmpty, "products": result])
            } catch {
                call.reject("Could not read App Store products: \(error.localizedDescription)")
            }
        }
    }

    @objc func getEntitlements(_ call: CAPPluginCall) {
        Task {
            let ids = await verifiedIDs()
            call.resolve(["verified": true, "ready": true, "productIds": ids])
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                try await StoreKit.AppStore.sync()
                let ids = await verifiedIDs()
                call.resolve(["verified": true, "ready": true, "productIds": ids])
            } catch {
                call.reject("Could not restore purchases: \(error.localizedDescription)")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        // Intentional hard gate in native code as well as the web UI.
        // Do not offer a transaction before billing configuration,
        // fulfillment, refund and cross-device restoration are tested.
        call.reject("Checkout is not enabled yet.")
    }
}
