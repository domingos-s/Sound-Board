const grid = document.getElementById('sound-grid');
const upload = document.getElementById('audio-upload');
const masterVolume = document.getElementById('master-volume');
const stopAllButton = document.getElementById('stop-all');
const clearBoardButton = document.getElementById('clear-board');
const addDemoButton = document.getElementById('add-demo');
const template = document.getElementById('sound-card-template');

let sounds = [];
const activeAudio = new Set();
const DB_NAME = 'call-soundboard';
const STORE = 'sounds';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadSavedSounds() {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).getAll();
    const rows = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    sounds = rows.map(row => ({ ...row, url: URL.createObjectURL(row.blob) }));
    render();
  } catch (err) {
    console.warn('Could not restore saved sounds', err);
    render();
  }
}

async function saveSound(sound) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put({ id: sound.id, name: sound.name, volume: sound.volume ?? 1, blob: sound.blob });
}

async function deleteSound(id) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(id);
}

async function clearSavedSounds() {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).clear();
}

function render() {
  grid.innerHTML = '';
  if (!sounds.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Add audio files to build your board. Sounds are saved on this device.';
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
    volume.addEventListener('change', async e => {
      sound.volume = Number(e.target.value);
      try { await saveSound(sound); } catch (err) { console.warn(err); }
    });
    remove.addEventListener('click', async () => {
      URL.revokeObjectURL(sound.url);
      sounds.splice(index, 1);
      render();
      try { await deleteSound(sound.id); } catch (err) { console.warn(err); }
    });

    card.dataset.id = sound.id;
    grid.appendChild(node);
  });
}

async function playSound(sound) {
  const audio = new Audio(sound.url);
  audio.volume = Math.min(1, (sound.volume ?? 1) * Number(masterVolume.value));
  activeAudio.add(audio);
  const cleanup = () => activeAudio.delete(audio);
  audio.addEventListener('ended', cleanup, { once: true });
  audio.addEventListener('error', cleanup, { once: true });
  try {
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    await audio.play();
  } catch (err) {
    cleanup();
    console.error(err);
  }
}

function stopAll() {
  activeAudio.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeAudio.clear();
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
}

upload.addEventListener('change', async event => {
  const files = [...event.target.files];
  for (const file of files) {
    const sound = {
      id: crypto.randomUUID(),
      name: file.name.replace(/\.[^/.]+$/, ''),
      blob: file,
      url: URL.createObjectURL(file),
      volume: 1
    };
    sounds.push(sound);
    try { await saveSound(sound); } catch (err) { console.warn('Could not save sound', err); }
  }
  upload.value = '';
  render();
});

stopAllButton.addEventListener('click', stopAll);
clearBoardButton.addEventListener('click', async () => {
  stopAll();
  sounds.forEach(sound => URL.revokeObjectURL(sound.url));
  sounds = [];
  render();
  try { await clearSavedSounds(); } catch (err) { console.warn(err); }
});

addDemoButton.addEventListener('click', async () => {
  const demoNames = ['Applause-ish', 'Air Horn-ish', 'Drum Hit', 'Sad Trombone-ish'];
  for (let i = 0; i < demoNames.length; i++) {
    const blob = makeToneBlob(220 + i * 110, 0.32 + i * 0.08);
    const sound = { id: crypto.randomUUID(), name: demoNames[i], blob, url: URL.createObjectURL(blob), volume: 0.7 };
    sounds.push(sound);
    try { await saveSound(sound); } catch (err) { console.warn(err); }
  }
  render();
});

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

if ('mediaSession' in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({ title: 'Call Soundboard', artist: 'Sound Board' });
}

loadSavedSounds();
