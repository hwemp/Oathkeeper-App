import UIKit
import Capacitor

// Ten freely selectable alternate icons. AppIcon stays the primary icon.
@objc(OathkeeperIconPlugin)
public class OathkeeperIconPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OathkeeperIconPlugin"
    public let jsName = "OathkeeperIcon"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setIcon", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restoreDefault", returnType: CAPPluginReturnPromise)
    ]

    private let allowedIcons: Set<String> = [
        "AppIcon-01", "AppIcon-02", "AppIcon-04", "AppIcon-05",
        "AppIcon-06", "AppIcon-07", "AppIcon-08", "AppIcon-11",
        "AppIcon-12", "AppIcon-14"
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

    @objc func setIcon(_ call: CAPPluginCall) {
        guard let name = call.getString("iconName"), allowedIcons.contains(name) else {
            call.reject("This icon is not included in Oathkeeper.")
            return
        }
        changeIcon(to: name, call: call)
    }

    @objc func restoreDefault(_ call: CAPPluginCall) {
        changeIcon(to: nil, call: call)
    }

    private func changeIcon(to name: String?, call: CAPPluginCall) {
        DispatchQueue.main.async {
            let app = UIApplication.shared
            guard app.supportsAlternateIcons else {
                call.reject("This iOS installation does not support alternate app icons.")
                return
            }
            if app.alternateIconName == name {
                call.resolve([
                    "supported": true,
                    "currentIcon": name ?? "default",
                    "isOriginal": name == nil
                ])
                return
            }
            app.setAlternateIconName(name) { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve([
                        "supported": true,
                        "currentIcon": name ?? "default",
                        "isOriginal": name == nil
                    ])
                }
            }
        }
    }
}
