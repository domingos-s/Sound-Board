const grid = document.getElementById('sound-grid');
const upload = document.getElementById('audio-upload');
const masterVolume = document.getElementById('master-volume');
const outputDevice = document.getElementById('output-device');
const stopAllButton = document.getElementById('stop-all');
const clearBoardButton = document.getElementById('clear-board');
const addDemoButton = document.getElementById('add-demo');
const template = document.getElementById('sound-card-template');

let sounds = [];
const activeAudio = new Set();

function render() {
  grid.innerHTML = '';
  if (!sounds.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Add audio files to build your board.';
    grid.appendChild(empty);
    return;
  }

  sounds.forEach((sound, index) => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.sound-card');
    const play = node.querySelector('.play-button');
    const name = node.querySelector('.sound-name');
    const volume = node.querySelector('.volume');
    const remove = node.querySelector('.remove-button');

    name.textContent = sound.name;
    volume.value = sound.volume ?? 1;

    play.addEventListener('click', () => playSound(sound));
    volume.addEventListener('input', e => sound.volume = Number(e.target.value));
    remove.addEventListener('click', () => {
      URL.revokeObjectURL(sound.url);
      sounds.splice(index, 1);
      render();
    });

    card.dataset.id = sound.id;
    grid.appendChild(node);
  });
}

async function playSound(sound) {
  const audio = new Audio(sound.url);
  audio.volume = Math.min(1, (sound.volume ?? 1) * Number(masterVolume.value));

  const sinkId = outputDevice.value;
  if (sinkId && typeof audio.setSinkId === 'function') {
    try { await audio.setSinkId(sinkId); } catch (err) { console.warn('Output device selection failed', err); }
  }

  activeAudio.add(audio);
  const cleanup = () => activeAudio.delete(audio);
  audio.addEventListener('ended', cleanup, { once: true });
  audio.addEventListener('error', cleanup, { once: true });
  try { await audio.play(); } catch (err) { cleanup(); console.error(err); }
}

function stopAll() {
  activeAudio.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeAudio.clear();
}

upload.addEventListener('change', event => {
  const files = [...event.target.files];
  for (const file of files) {
    sounds.push({
      id: crypto.randomUUID(),
      name: file.name.replace(/\.[^/.]+$/, ''),
      url: URL.createObjectURL(file),
      volume: 1
    });
  }
  upload.value = '';
  render();
});

stopAllButton.addEventListener('click', stopAll);
clearBoardButton.addEventListener('click', () => {
  stopAll();
  sounds.forEach(sound => URL.revokeObjectURL(sound.url));
  sounds = [];
  render();
});

addDemoButton.addEventListener('click', () => {
  const demoNames = ['Applause', 'Air Horn', 'Drum Hit', 'Sad Trombone'];
  demoNames.forEach((name, i) => {
    const blob = makeToneBlob(220 + i * 110, 0.32 + i * 0.08);
    sounds.push({ id: crypto.randomUUID(), name, url: URL.createObjectURL(blob), volume: 0.7 });
  });
  render();
});

async function loadOutputs() {
  outputDevice.innerHTML = '<option value="">Default output</option>';
  if (!navigator.mediaDevices?.enumerateDevices) return;
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (_) {
    // Device labels may be hidden without permission; default output still works.
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    devices.filter(d => d.kind === 'audiooutput').forEach((device, i) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Audio output ${i + 1}`;
      outputDevice.appendChild(option);
    });
  } catch (err) {
    console.warn('Could not enumerate audio devices', err);
  }
}

function makeToneBlob(frequency, duration) {
  const sampleRate = 44100;
  const samples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  const writeString = (offset, string) => [...string].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) {
    const fade = 1 - i / samples;
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * fade * 0.45;
    view.setInt16(44 + i * 2, sample * 32767, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

loadOutputs();
render();
