import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

interface AudioMonitorContext {
  locationId?: string | null;
  focusSessionId?: string | null;
  samplingInterval: number;
}

export function useAudioMonitor() {
  const [monitoring, setMonitoring] = useState(false);
  const [liveLevel, setLiveLevel] = useState<number | null>(null);
  const [permissionState, setPermissionState] = useState<'idle' | 'prompting' | 'granted' | 'denied'>('idle');

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sampleTimerRef = useRef<number | null>(null);
  const contextRef = useRef<AudioMonitorContext>({ samplingInterval: 10 });
  const isRunningRef = useRef(false);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sampleTimerRef.current) {
      clearInterval(sampleTimerRef.current);
      sampleTimerRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setMonitoring(false);
  }, []);

  const calculateRMS = useCallback((): number => {
    if (!analyserRef.current) return 0;
    const buffer = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteTimeDomainData(buffer);

    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const norm = (buffer[i] - 128) / 128;
      sum += norm * norm;
    }
    const rms = Math.sqrt(sum / buffer.length);
    if (!Number.isFinite(rms) || rms <= 0) return 0;

    const dbfs = 20 * Math.log10(rms);
    const normalized = Math.round(Math.max(0, Math.min(100, ((dbfs + 60) / 60) * 100)));
    return normalized;
  }, []);

  const start = useCallback(async (ctx?: Partial<AudioMonitorContext>) => {
    stop();

    if (ctx) {
      contextRef.current = { ...contextRef.current, ...ctx };
    }

    try {
      setPermissionState('prompting');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { autoGainControl: false, echoCancellation: false, noiseSuppression: false },
        video: false,
      });

      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      isRunningRef.current = true;
      setMonitoring(true);
      setPermissionState('granted');

      // 1. Continuous smooth visualization loop (runs at 60 FPS)
      const renderLoop = () => {
        if (!isRunningRef.current) return;
        const currentLevel = calculateRMS();
        setLiveLevel(currentLevel);
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      };
      animationFrameRef.current = requestAnimationFrame(renderLoop);

      // 2. Periodic HTTP persistence telemetry (every N seconds)
      const sendSample = async () => {
        if (!isRunningRef.current) return;
        const level = calculateRMS();
        try {
          await api.noise.sample({
            noise_level: level,
            location_id: contextRef.current.locationId,
            focus_session_id: contextRef.current.focusSessionId,
          });
        } catch {
          // Non-blocking telemetry drop
        }
      };

      // Initial sample
      void sendSample();
      const intervalMs = Math.max(5, contextRef.current.samplingInterval || 10) * 1000;
      sampleTimerRef.current = window.setInterval(sendSample, intervalMs);

      return true;
    } catch (err) {
      setPermissionState('denied');
      stop();
      throw err;
    }
  }, [calculateRMS, stop]);

  const updateContext = useCallback((patch: Partial<AudioMonitorContext>) => {
    contextRef.current = { ...contextRef.current, ...patch };
    if (patch.samplingInterval && isRunningRef.current) {
      // Re-arm interval with new rate
      if (sampleTimerRef.current) clearInterval(sampleTimerRef.current);
      const intervalMs = Math.max(5, patch.samplingInterval) * 1000;
      sampleTimerRef.current = window.setInterval(() => {
        if (!isRunningRef.current) return;
        const level = calculateRMS();
        void api.noise.sample({
          noise_level: level,
          location_id: contextRef.current.locationId,
          focus_session_id: contextRef.current.focusSessionId,
        });
      }, intervalMs);
    }
  }, [calculateRMS]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    monitoring,
    liveLevel,
    permissionState,
    start,
    stop,
    updateContext,
  };
}
