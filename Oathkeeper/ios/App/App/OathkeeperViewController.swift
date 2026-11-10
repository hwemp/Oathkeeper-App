import Capacitor

// Registers Oathkeeper's local iOS icon bridge with the Capacitor web view.
class OathkeeperViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(OathkeeperIconPlugin())
    }
}
