import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Radio, Volume2, Settings2 } from 'lucide-react';
import { audioCaptureService, AudioDevice } from '../services/audioCapture';

interface AudioVisualizerProps {
  isListening: boolean;
  onToggleListening: () => void;
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isListening,
  onToggleListening,
  selectedDeviceId,
  onSelectDevice,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    audioCaptureService.getAudioInputDevices().then(setDevices);
  }, []);

  useEffect(() => {
    if (isListening) {
      audioCaptureService.start(selectedDeviceId, (level, freqData) => {
        setAudioLevel(level);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw modern frequency bars
        const barWidth = 4;
        const gap = 3;
        const barCount = Math.floor(width / (barWidth + gap));
        const step = Math.floor(freqData.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = freqData[i * step] || 0;
          const barHeight = Math.max(3, (val / 255) * height);
          const x = i * (barWidth + gap);
          const y = (height - barHeight) / 2;

          // Gradient color: Cyan to Indigo to Emerald
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, '#38bdf8');
          gradient.addColorStop(0.5, '#6366f1');
          gradient.addColorStop(1, '#10b981');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      });
    } else {
      audioCaptureService.stop();
      setAudioLevel(0);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      audioCaptureService.stop();
    };
  }, [isListening, selectedDeviceId]);

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Listening status button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleListening}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2.5 transition-all shadow-lg ${
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 animate-subtle-pulse'
              : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4 animate-bounce" />
              <span>Stop Listening</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Start Listening</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isListening ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] animate-ping' : 'bg-slate-600'
            }`}
          />
          <div className="text-xs">
            <p className="font-semibold text-white">
              {isListening ? 'Actively Listening' : 'Listening Inactive'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              {isListening ? `Input Level: ${audioLevel}%` : 'Press Ctrl+Space to toggle'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Waveform Canvas */}
      <div className="flex-1 w-full max-w-md h-10 px-2 flex items-center justify-center bg-slate-950/60 rounded-xl border border-white/5 overflow-hidden">
        {isListening ? (
          <canvas ref={canvasRef} width={380} height={36} className="w-full h-full" />
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Radio className="w-3.5 h-3.5" />
            <span>Audio waveform visualizer starts when listening</span>
          </div>
        )}
      </div>

      {/* Device Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs text-slate-300">
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedDeviceId}
            onChange={(e) => onSelectDevice(e.target.value)}
            className="bg-transparent text-slate-200 text-xs outline-none cursor-pointer max-w-[160px] truncate"
          >
            <option value="default" className="bg-slate-900">Default Microphone</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId} className="bg-slate-900">
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
