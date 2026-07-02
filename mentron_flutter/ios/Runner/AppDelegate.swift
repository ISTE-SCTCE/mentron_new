import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {

  // Secure text field used as the iOS screenshot/recording blocker.
  // UITextField with isSecureTextEntry = true causes the system to blank the
  // layer when a screen recording or external mirroring is detected.
  private var secureTextField: UITextField?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)

    // ── Content Protection MethodChannel ──────────────────────────────────────
    // Standard Flutter MethodChannel wiring per:
    // https://docs.flutter.dev/platform-integration/platform-channels
    if let controller = window?.rootViewController as? FlutterViewController {
      let contentProtectionChannel = FlutterMethodChannel(
        name: "com.mentron.app/content_protection",
        binaryMessenger: controller.binaryMessenger
      )

      contentProtectionChannel.setMethodCallHandler { [weak self] call, result in
        switch call.method {
        case "enableProtection":
          self?.enableScreenProtection()
          result(nil)
        case "disableProtection":
          self?.disableScreenProtection()
          result(nil)
        case "isCapturing":
          result(UIScreen.main.isCaptured)
        default:
          result(FlutterMethodNotImplemented)
        }
      }
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // ── iOS Secure Overlay Technique ─────────────────────────────────────────
  // A UITextField with isSecureTextEntry=true placed behind the Flutter view.
  // iOS automatically blanks this layer when screen capture is detected,
  // which blanks the parent view as well when the field fills the window.

  private func enableScreenProtection() {
    guard secureTextField == nil,
          let windowScene = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene }).first,
          let window = windowScene.windows.first else { return }

    let field = UITextField()
    field.isSecureTextEntry = true
    field.translatesAutoresizingMaskIntoConstraints = false
    // Insert behind all other views
    window.insertSubview(field, at: 0)
    NSLayoutConstraint.activate([
      field.topAnchor.constraint(equalTo: window.topAnchor),
      field.bottomAnchor.constraint(equalTo: window.bottomAnchor),
      field.leadingAnchor.constraint(equalTo: window.leadingAnchor),
      field.trailingAnchor.constraint(equalTo: window.trailingAnchor),
    ])
    // Make the Flutter layer a subview of the secure field's layer
    if let rootView = window.subviews.first(where: { !($0 is UITextField) }),
       let secureLayer = field.layer.sublayers?.first {
      secureLayer.addSublayer(rootView.layer)
    }
    secureTextField = field
  }

  private func disableScreenProtection() {
    guard let field = secureTextField else { return }
    // Move the Flutter layer back to the window before removing the field
    if let windowScene = UIApplication.shared.connectedScenes
        .compactMap({ $0 as? UIWindowScene }).first,
       let window = windowScene.windows.first,
       let rootView = window.subviews.first(where: { !($0 is UITextField) }) {
      window.layer.addSublayer(rootView.layer)
    }
    field.removeFromSuperview()
    secureTextField = nil
  }
}
