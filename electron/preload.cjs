const { contextBridge, ipcRenderer } = require('electron');

let stream = null;
let audioContext = null;
let analyser = null;
let sampleTimer = null;
let monitoring = false;
let monitorContext = { locationId: null, focusSessionId: null, samplingInterval: 10 };

function stopMedia() {
  if (sampleTimer) clearTimeout(sampleTimer);
  sampleTimer = null;
  if (analyser) analyser.disconnect();
  analyser = null;
  if (audioContext) audioContext.close().catch(() => undefined);
  audioContext = null;
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = null;
  monitoring = false;
}

async function requestPermission() {
  // This request opens the system's microphone prompt only after an explicit user action.
  const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  permissionStream.getTracks().forEach((track) => track.stop());
  return true;
}

async function startMonitoring(context) {
  if (monitoring) stopMedia();
  monitorContext = { ...monitorContext, ...context };
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { autoGainControl: false, echoCancellation: false, noiseSuppression: false },
    video: false,
  });
  audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  monitoring = true;

  const sample = async () => {
    if (!monitoring || !analyser) return;
    // This transient buffer is reduced to a number in this tick and is never retained or sent over IPC.
    const frame = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(frame);
    let sum = 0;
    for (const value of frame) {
      const normalized = (value - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / frame.length);
    const dbfs = rms > 0 ? 20 * Math.log10(rms) : -60;
    const noiseLevel = Math.max(0, Math.min(100, Math.round(((dbfs + 60) / 60) * 100)));
    const timestamp = Date.now();
    await ipcRenderer.invoke('monitor:sample', { timestamp, noiseLevel, ...monitorContext }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('[QuitMap] Failed to save noise sample', error);
    });
    ipcRenderer.send('monitor:level', { timestamp, noiseLevel });
    sampleTimer = setTimeout(sample, Math.max(5, Number(monitorContext.samplingInterval) || 10) * 1000);
  };
  await sample();
  return { monitoring: true };
}

contextBridge.exposeInMainWorld('quitmap', {
  monitor: {
    requestPermission,
    start: startMonitoring,
    stop: () => {
      stopMedia();
      return { monitoring: false };
    },
    updateContext: (context) => { monitorContext = { ...monitorContext, ...context }; },
    onLevel: (callback) => {
      const listener = (_event, level) => callback(level);
      ipcRenderer.on('monitor:level', listener);
      return () => ipcRenderer.removeListener('monitor:level', listener);
    },
  },
  data: {
    dashboard: () => ipcRenderer.invoke('data:dashboard'),
    focusMap: () => ipcRenderer.invoke('data:focus-map'),
    timeline: (range) => ipcRenderer.invoke('data:timeline', range),
    insights: () => ipcRenderer.invoke('data:insights'),
    weekly: () => ipcRenderer.invoke('data:weekly'),
    diagnostics: () => ipcRenderer.invoke('data:diagnostics'),
    locations: () => ipcRenderer.invoke('data:locations'),
    createLocation: (name) => ipcRenderer.invoke('locations:create', name),
    deleteAll: () => ipcRenderer.invoke('data:delete-all'),
    seedDemo: (days) => ipcRenderer.invoke('data:seed-demo', days),
  },
  focus: {
    start: (payload) => ipcRenderer.invoke('focus:start', payload),
    end: (id) => ipcRenderer.invoke('focus:end', id),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (patch) => ipcRenderer.invoke('settings:update', patch),
  },
});
