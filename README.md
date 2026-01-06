# Liminal

Web midi sequencer. In development. Progress cached here. Not released. But click below to preview:-

https://op12no2.github.io/liminal/liminal.html

### Notes

Liminal communicates with DAWs using Web MIDI. Currently it uses the first output port it finds. If successful the MIDI indicator will be on (5 pin DIN icon). When it's off, you can click it to try again or refresh the page. You'll get an alert that you need to allow MIDI access.  

On macOS, the IAC (Inter-Application Communication) driver is built into the system as part of core MIDI. It's always available but you need to enable it in Audio MIDI Setup. It creates virtual MIDI buses that DAWs and Liminal can connect to. Note that Safari will not connect to MIDI, you need to use Chrome or Firefox for example.

On Windows, there's no equivalent built-in virtual MIDI driver, so you need third-party software like loopMIDI (easiest) or virtualMIDI to create virtual MIDI ports. In Bitwig you'll see loopMIDI as a controller.

https://www.tobias-erichsen.de/software.html - loopMIDI and virtualMIDI

Linux is more like macOS - it has ALSA (Advanced Linux Sound Architecture) built into the kernel, which includes virtual MIDI port capabilities. You can create virtual MIDI ports with snd-virmidi kernel module or use ALSA sequencer ports directly. Or use JACK (JACK Audio Connection Kit), which has excellent MIDI routing built in. JACK lets you create virtual MIDI connections between applications graphically, similar to how you'd patch hardware.

## References

- https://www.w3.org/TR/webmidi/
- https://www.w3.org/TR/webaudio-1.1/
- https://developer.mozilla.org/en-US/docs/Web/API/SVG_API
- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- https://midi.org


