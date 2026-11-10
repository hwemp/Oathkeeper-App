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
        guard let id = call.getString("productId"), allowed.contains(id) else {
            call.reject("Unknown item.")
            return
        }
        Task {
            do {
                guard let product = try await StoreKit.Product.products(for: [id]).first else {
                    call.reject("This product is not available in App Store Connect.")
                    return
                }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    guard case .verified(let transaction) = verification,
                          allowed.contains(transaction.productID),
                          transaction.revocationDate == nil else {
                        call.reject("Could not verify purchase.")
                        return
                    }
                    await transaction.finish()
                    call.resolve([
                        "verified": true,
                        "ready": true,
                        "productIds": await verifiedIDs()
                    ])
                case .pending:
                    call.resolve(["verified": true, "ready": true, "pending": true,
                                  "productIds": await verifiedIDs()])
                case .userCancelled:
                    call.reject("Purchase cancelled.")
                @unknown default:
                    call.reject("Purchase status could not be confirmed.")
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }
}
