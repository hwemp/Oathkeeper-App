import UIKit
import Capacitor

// Native iOS bridge for alternate app icons.
// The original AppIcon remains the primary app icon and is never modified.
// Paid icon application is intentionally not exposed until signed icon assets,
// App Store entitlements, and server-side ownership checks are implemented.
@objc(OathkeeperIconPlugin)
public class OathkeeperIconPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OathkeeperIconPlugin"
    public let jsName = "OathkeeperIcon"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restoreDefault", returnType: CAPPluginReturnPromise)
    ]

    @objc func getState(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let app = UIApplication.shared
            call.resolve([
                "supported": app.supportsAlternateIcons,
                "currentIcon": app.alternateIconName ?? "default",
                "isOriginal": app.alternateIconName == nil
            ])
        }
    }

    @objc func restoreDefault(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let app = UIApplication.shared
            guard app.alternateIconName != nil else {
                call.resolve(["currentIcon": "default", "isOriginal": true])
                return
            }
            guard app.supportsAlternateIcons else {
                call.reject("This iOS installation does not support alternate app icons.")
                return
            }
            app.setAlternateIconName(nil) { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve(["currentIcon": "default", "isOriginal": true])
                }
            }
        }
    }
}
