export function createAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  return new Ctx();
}

export function createLevelsAnalyser(audioContext) {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  return analyser;
}

export function computeRms(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

export function computePeak(buffer) {
  let peak = 0;
  for (let i = 0; i < buffer.length; i++) peak = Math.max(peak, Math.abs(buffer[i]));
  return peak;
}

export function dbToLinear(db) {
  return Math.pow(10, db / 20);
}

export function createEnhancerChain(audioContext) {
  const highPass = audioContext.createBiquadFilter();
  highPass.type = 'highpass';
  highPass.frequency.value = 80; // remove low-frequency rumble

  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  const gain = audioContext.createGain();
  gain.gain.value = 1.0;

  const analyser = createLevelsAnalyser(audioContext);

  return { highPass, compressor, gain, analyser };
}

export function connectStream(audioContext, mediaStream, destination = audioContext.destination) {
  const source = audioContext.createMediaStreamSource(mediaStream);
  const chain = createEnhancerChain(audioContext);
  source.connect(chain.highPass);
  chain.highPass.connect(chain.compressor);
  chain.compressor.connect(chain.gain);
  chain.gain.connect(chain.analyser);
  chain.analyser.connect(destination);
  return { source, ...chain };
}

export function connectElement(audioContext, mediaElement, destination = audioContext.destination) {
  const source = audioContext.createMediaElementSource(mediaElement);
  const chain = createEnhancerChain(audioContext);
  source.connect(chain.highPass);
  chain.highPass.connect(chain.compressor);
  chain.compressor.connect(chain.gain);
  chain.gain.connect(chain.analyser);
  chain.analyser.connect(destination);
  return { source, ...chain };
}

export function normalizeToTargetPeak(audioContext, analyser, targetDb = -6) {
  const bufferLen = analyser.fftSize;
  const data = new Float32Array(bufferLen);
  analyser.getFloatTimeDomainData(data);
  const peak = computePeak(data);
  const targetLinear = dbToLinear(targetDb);
  if (peak > 0) {
    const neededGain = targetLinear / peak;
    return neededGain;
  }
  return 1.0;
}

export function createRecorder(stream, { mimeType = 'audio/webm;codecs=opus', audioBitsPerSecond = 128000 } = {}) {
  const options = { mimeType, audioBitsPerSecond };
  let recorder;
  try { recorder = new MediaRecorder(stream, options); }
  catch (_) { recorder = new MediaRecorder(stream); }
  return recorder;
}

