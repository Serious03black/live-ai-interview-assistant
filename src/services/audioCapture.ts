export interface AudioDevice {
  deviceId: string;
  label: string;
}

export class AudioCaptureService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  async getAudioInputDevices(): Promise<AudioDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
        }));
    } catch (err) {
      console.error('Failed to enumerate audio devices:', err);
      return [];
    }
  }

  async start(
    deviceId?: string,
    onAudioLevel?: (level: number, frequencyData: Uint8Array) => void
  ): Promise<MediaStream> {
    await this.stop();

    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId && deviceId !== 'default' ? { exact: deviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser);

    if (onAudioLevel) {
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(Math.round((average / 128) * 100), 100);

        onAudioLevel(normalized, dataArray);
        this.animationFrameId = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    }

    return this.stream;
  }

  async stop(): Promise<void> {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.analyser) {
      this.analyser = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  isCapturing(): boolean {
    return !!this.stream && this.stream.active;
  }
}

export const audioCaptureService = new AudioCaptureService();
