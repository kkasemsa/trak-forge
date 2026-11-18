# TRAK FORGE

An iPad companion for the Yamaha SEQTRAK. The long-term goal is a MIDI FORGE-style song starter
that writes whole songs into the SEQTRAK over SysEx. This is **phase 1: a read-only probe**. It
proves the iPad can talk to the machine, and it shows what the SEQTRAK cannot show itself:
preset names, tempo, key, pattern contents and scenes.

Not affiliated with or endorsed by Yamaha. SEQTRAK is a Yamaha trademark.

## What phase 1 does

- Connects to the SEQTRAK over USB-C through CoreMIDI.
- Reads the session: project, tempo, key, scale, sequencer state, battery, OS version.
- Reads all 11 tracks: engine type, loaded sound (resolved to its preset name), selected pattern,
  length, volume, mute.
- Reads the notes of a track's selected pattern, on request.
- Reads the scenes (which pattern each track plays, and mutes).
- Shows the raw SysEx traffic, and copies everything it read as a text report.

**Reading never writes.** The probe only sends Parameter Requests and one Identity Request; a test
(`the probe sends only read frames`) fails if it produces anything else.

## Phase 2: the write tests

The **Write tests** card is the only part of the app that changes the machine. Each test writes
into the pattern selected on the SEQTRAK for that track, in its current project:

- **KICK** (step record): a kick on steps 1, 5, 9 and 13. Changes only the steps that differ.
- **SYNTH 1** (piano roll): clears the pattern, then writes C1 on every beat and G1 on step 15 of
  each bar.

Both read the pattern first, read everything back after writing, and say whether the read-back
matches. "Put the old pattern back" restores what was there. They refuse to write while the
sequencer plays, or if the SEQTRAK does not answer every question about where the write would
land. All writing code is in `js/seqtrak/writer.js`.

## Status: what is and is not verified

| Part | State |
|---|---|
| Protocol code (framing, retries, decoding) | Tested against a simulator: `npm test`, 30 tests. Byte strings are checked against the worked examples in seqtrak-docs. |
| Screens | Checked in a desktop browser in demo mode. |
| Swift CoreMIDI plugin | Compiles: the `build` workflow on GitHub builds the app for the iOS Simulator. Runs on a real iPad since 0.1.2. |
| Reading, on an iPad with a SEQTRAK (OS 2.0, USB-C) | Works (2026-11-17): 135 requests, 135 replies. Drum sound names and the mute flag are not resolved yet. |
| Writing drum steps, on real hardware | Works (2026-11-18): read-back verified. |
| Writing synth notes, on real hardware | **Not tested yet.** |

## First test on hardware

1. Back up your projects with Yamaha's SEQTRAK app first. This build cannot change anything, but
   it is the habit to have before the write phases.
2. Connect the iPad to the SEQTRAK with a USB-C cable that carries data.
3. Open TRAK FORGE. The pill at the top should show the SEQTRAK's port name.
4. Press **Read everything**. Compare with the machine: project number, tempo, and the sounds on
   each track.
5. Press **Read notes** on KICK and on SYNTH 1 and compare with what you hear.
6. Press **Copy report** and keep the text. It is the evidence for any bug.

If something is off:

- **"The iPad sees no MIDI device"**: the cable is charge-only, or the SEQTRAK's USB role is set to
  "To Device" (it must be "To Host", the default).
- **A port is listed but nothing answers ("no reply" everywhere)**: the SEQTRAK may have USB SysEx
  transmit switched off. Yamaha's app can switch it on.
- **Some values say "no reply"**: single requests are lost about 1 time in 10 on this machine; the
  app retries four times. Read again.
- **SAMPLER shows no sound**: expected. The machine does not answer that request for the sampler.

## Build

One-time, on a Mac with Xcode:

```
npm run ios:setup -- YOURTEAMID
```

This checks your tools, installs packages, builds `www/`, and opens Xcode. Plug in the iPad, pick
it at the top of Xcode, and press Run. Day to day: `npm run app:sync` after any change, then build
in Xcode.

The team ID is kept in `ios/App/local.xcconfig`, which is not committed (this repository is
public). Xcode Cloud is therefore not set up yet: it would need the team ID committed in
`ios/App/app.xcconfig`.

Demo mode, no hardware and no Mac needed: `npm start`, then open http://localhost:8080. It runs
against a built-in simulator and says so on screen.

## Layout

| path | what |
|---|---|
| `js/seqtrak/sysex.js` | SysEx framing: build requests, parse replies |
| `js/seqtrak/link.js` | request/reply link: 2 ms pacing, retries, one request at a time |
| `js/seqtrak/probe.js` | the read-only probe: session, tracks, patterns, scenes |
| `js/seqtrak/sim.js` | simulated SEQTRAK for demo mode and tests |
| `js/seqtrak/catalog.js`, `js/data/presets.js` | the 2,032 preset names (generated) |
| `js/transport.js` | picks the native plugin on iPad, the simulator in a browser |
| `js/main.js` | the screen |
| `plugins/seqtrak-midi/` | local Capacitor plugin: CoreMIDI SysEx send and receive (Swift) |
| `scripts/` | `build-app.mjs` (www/ + version), Mac setup helpers, icon and preset generators |
| `ios/` | the Capacitor Xcode project (Swift Package Manager) |

## Roadmap

1. **Probe (this build).** Read-only.
2. **Writer core.** Step record for drum tracks, piano roll for synth tracks, read-back after
   every write, refusing to touch a project that is not empty.
3. **Song layer.** Map a FORGE starter onto the 11 tracks, 6 patterns per track and 16 scenes; set
   tempo, key and presets; build scenes; save.
4. **UI.** Starter picker, target project, dry-run preview, write.

## Credits

- Protocol knowledge: [jaeggerr/seqtrak-docs](https://github.com/jaeggerr/seqtrak-docs) (MIT).
  The preset list in `js/data/presets.js` is generated from its `data/presets.csv`.
- By Khantipol Kasemsant.
