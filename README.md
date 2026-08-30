# Call Sound Board

A lightweight browser soundboard for playing sound effects during Zoom, Microsoft Teams, Google Meet, Discord, or other calls.

## What it does

- Load multiple local audio files into large sound pads.
- Play overlapping effects.
- Individual sound volume plus master volume.
- Stop all currently playing sounds instantly.
- Select a browser audio output device where supported.
- Includes generated demo tones so the interface can be tested without committing copyrighted audio files.

## Important: getting the sound into a call

A browser cannot create a system-wide virtual microphone by itself. To make both you **and the other people on the call** hear the soundboard, route its output into the conferencing app using a virtual audio device.

### Windows

1. Install a virtual audio cable such as VB-CABLE.
2. For the simplest sound-effects-only configuration, send the browser output to `CABLE Input` and select `CABLE Output` as the microphone in Zoom/Teams.
3. To use your real microphone at the same time, use a mixer such as VoiceMeeter to combine:
   - your physical microphone; and
   - the soundboard/browser audio.
4. Set the resulting VoiceMeeter/virtual output as the microphone in Zoom/Teams.
5. Keep monitoring enabled to your headphones/speakers so you hear the effects too.

### macOS

1. Install a loopback driver such as BlackHole.
2. Use Audio MIDI Setup to create an appropriate Multi-Output/Aggregate device, or use another audio mixer.
3. Route the browser into both your listening device and BlackHole.
4. Select the BlackHole/aggregate input in Zoom/Teams.
5. Combine your physical microphone with the soundboard if you need both simultaneously.

## Run locally

This is a static site. Open `index.html` directly, or serve the directory with any basic static web server.

For browser audio-output selection (`setSinkId`) and full device labels, Chromium-based browsers generally provide the best support. Some device APIs may require HTTPS or localhost.

## GitHub Pages

The repository is structured as a static site and can be deployed directly with GitHub Pages from the `main` branch/root directory.

## Privacy

Uploaded audio files remain local to the browser session. The app creates local object URLs and does not upload sound files to a server.
