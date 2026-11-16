// swift-tools-version: 5.9

import PackageDescription

// The package and product name must stay "SeqtrakMidi": the Capacitor CLI derives that name
// from the npm package name (seqtrak-midi) when it writes ios/App/CapApp-SPM/Package.swift.
let package = Package(
    name: "SeqtrakMidi",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "SeqtrakMidi",
            targets: ["SeqtrakMidiPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "SeqtrakMidiPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/SeqtrakMidiPlugin"
        )
    ]
)
