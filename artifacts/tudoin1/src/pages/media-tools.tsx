import React, { useState, useRef } from 'react';
import { Shell } from '@/components/layout/Shell';
import { ToolLayout } from '@/components/shared/ToolLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// ── WAV encoder helper ──────────────────────────────────────────────────────
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const len = buffer.length * numCh * 2 + 44;
  const ab = new ArrayBuffer(len);
  const v = new DataView(ab);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, len - 8, true); ws(8, 'WAVE');
  ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, numCh, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * numCh * 2, true); v.setUint16(32, numCh * 2, true);
  v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, buffer.length * numCh * 2, true);
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i]));
      v.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}

function formatBytes(b: number) {
  if (b === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ── Image Compressor ────────────────────────────────────────────────────────
export function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [quality, setQuality] = useState(75);
  const [result, setResult] = useState('');
  const [compressedSize, setCompressedSize] = useState(0);

  const onFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult('');
  };

  const compress = () => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        setCompressedSize(blob.size);
        setResult(URL.createObjectURL(blob));
      }, 'image/jpeg', quality / 100);
    };
    img.src = preview;
  };

  const saving = file && compressedSize ? Math.round((1 - compressedSize / file.size) * 100) : 0;

  return (
    <Shell>
      <ToolLayout title="Image Compressor" description="Reduce image file size while keeping good quality." category="Media Tools" categoryPath="/#media">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <Label>Upload Image</Label>
            <input type="file" accept="image/*" className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
          </div>
          {preview && (
            <>
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Quality: {quality}%</Label>
                  <span className="text-sm text-muted-foreground">Original: {formatBytes(file!.size)}</span>
                </div>
                <input type="range" min="10" max="100" value={quality} onChange={e => setQuality(+e.target.value)} className="w-full" />
              </div>
              <Button onClick={compress} className="w-full">Compress Image</Button>
              {result && (
                <div className="p-4 border rounded-xl bg-green-50 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700 font-semibold">✓ Compressed — saved {saving}%</span>
                    <span className="text-muted-foreground">{formatBytes(compressedSize)}</span>
                  </div>
                  <img src={result} alt="Compressed" className="rounded-md w-full max-h-64 object-contain border bg-white" />
                  <a href={result} download="compressed.jpg">
                    <Button variant="outline" className="w-full">Download Compressed JPEG</Button>
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

// ── Image Converter ─────────────────────────────────────────────────────────
export function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [result, setResult] = useState('');
  const [ext, setExt] = useState('png');

  const convert = () => {
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      if (format === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.drawImage(img, 0, 0);
      const e = format === 'image/jpeg' ? 'jpg' : format.split('/')[1];
      setExt(e);
      canvas.toBlob((blob) => { if (blob) setResult(URL.createObjectURL(blob)); }, format, 0.95);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const formats = [
    { label: 'PNG', value: 'image/png' },
    { label: 'JPEG', value: 'image/jpeg' },
    { label: 'WebP', value: 'image/webp' },
  ] as const;

  return (
    <Shell>
      <ToolLayout title="Image Converter" description="Convert images between PNG, JPEG, and WebP formats." category="Media Tools" categoryPath="/#media">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <Label>Upload Image</Label>
            <input type="file" accept="image/*" className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer" onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setResult(''); } }} />
          </div>
          {file && (
            <>
              <div>
                <Label className="mb-3 block">Convert to</Label>
                <div className="flex gap-3">
                  {formats.map(f => (
                    <button key={f.value} onClick={() => setFormat(f.value)} className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${format === f.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={convert} className="w-full">Convert Image</Button>
              {result && (
                <div className="p-4 border rounded-xl space-y-3">
                  <img src={result} alt="Converted" className="rounded-md w-full max-h-64 object-contain border bg-white" />
                  <a href={result} download={`converted.${ext}`}>
                    <Button variant="outline" className="w-full">Download .{ext}</Button>
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

// ── Video Compressor ────────────────────────────────────────────────────────
export function VideoCompressor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState(50);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  const compress = () => {
    if (!file || !videoRef.current) return;
    const video = videoRef.current;
    const src = URL.createObjectURL(file);
    setOriginalSize(file.size);
    setStatus('Loading video…');
    setResult('');

    video.src = src;
    video.muted = true;
    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      const s = scale / 100;
      canvas.width = Math.round(video.videoWidth * s);
      canvas.height = Math.round(video.videoHeight * s);
      const ctx = canvas.getContext('2d')!;

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setCompressedSize(blob.size);
        setResult(URL.createObjectURL(blob));
        setStatus('');
        URL.revokeObjectURL(src);
      };

      const drawFrame = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        }
      };

      video.onended = () => recorder.stop();
      recorder.start(100);
      video.play();
      setStatus('Processing… please wait');
      drawFrame();
    };
  };

  const saving = originalSize && compressedSize ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

  return (
    <Shell>
      <ToolLayout title="Video Compressor" description="Reduce video size by downscaling resolution in your browser." category="Media Tools" categoryPath="/#media">
        <div className="max-w-2xl mx-auto space-y-6">
          <video ref={videoRef} className="hidden" />
          <div>
            <Label>Upload Video</Label>
            <input type="file" accept="video/*" className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer" onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setResult(''); setStatus(''); } }} />
          </div>
          {file && (
            <>
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Resolution Scale: {scale}%</Label>
                  <span className="text-sm text-muted-foreground">Original: {formatBytes(file.size)}</span>
                </div>
                <input type="range" min="10" max="100" step="10" value={scale} onChange={e => setScale(+e.target.value)} className="w-full" />
                <p className="text-xs text-muted-foreground mt-1">Lower = smaller file, lower resolution</p>
              </div>
              <Button onClick={compress} className="w-full" disabled={!!status}>
                {status ? status : 'Compress Video'}
              </Button>
              {result && (
                <div className="p-4 border rounded-xl space-y-3">
                  <p className="text-green-700 font-semibold text-sm">✓ Done — saved {saving}% ({formatBytes(compressedSize)})</p>
                  <video src={result} controls className="w-full rounded-md" />
                  <a href={result} download="compressed.webm">
                    <Button variant="outline" className="w-full">Download .webm</Button>
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

// ── Video to MP3 (audio extractor → WAV) ───────────────────────────────────
export function VideoToMp3() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState('');

  const convert = async () => {
    if (!file) return;
    setStatus('Decoding audio…');
    setResult('');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setStatus('Encoding…');
      const wav = audioBufferToWav(audioBuffer);
      setResult(URL.createObjectURL(wav));
      setStatus('');
      await audioCtx.close();
    } catch {
      setStatus('Error: Could not extract audio. Try a different video file.');
    }
  };

  const baseName = file ? file.name.replace(/\.[^.]+$/, '') : 'audio';

  return (
    <Shell>
      <ToolLayout title="Video to Audio Converter" description="Extract the audio track from any video file (exports as WAV)." category="Media Tools" categoryPath="/#media">
        <div className="max-w-lg mx-auto space-y-6">
          <div>
            <Label>Upload Video</Label>
            <input type="file" accept="video/*" className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer" onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setResult(''); setStatus(''); } }} />
          </div>
          {file && (
            <Button onClick={convert} className="w-full" disabled={!!status && !status.startsWith('Error')}>
              {status && !status.startsWith('Error') ? status : 'Extract Audio'}
            </Button>
          )}
          {status.startsWith('Error') && <p className="text-red-500 text-sm">{status}</p>}
          {result && (
            <div className="p-4 border rounded-xl space-y-3">
              <p className="text-green-700 font-semibold text-sm">✓ Audio extracted successfully</p>
              <audio src={result} controls className="w-full" />
              <a href={result} download={`${baseName}.wav`}>
                <Button variant="outline" className="w-full">Download WAV</Button>
              </a>
            </div>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

// ── Audio Cutter ────────────────────────────────────────────────────────────
export function AudioCutter() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState('');

  const onFile = async (f: File) => {
    setFile(f);
    setResult('');
    setStatus('Loading…');
    try {
      const ab = await f.arrayBuffer();
      const ctx = new AudioContext();
      const buf = await ctx.decodeAudioData(ab);
      const d = Math.floor(buf.duration);
      setDuration(d);
      setStart(0);
      setEnd(d);
      setStatus('');
      await ctx.close();
    } catch {
      setStatus('Error reading audio file.');
    }
  };

  const cut = async () => {
    if (!file) return;
    setStatus('Cutting…');
    setResult('');
    try {
      const ab = await file.arrayBuffer();
      const ctx = new AudioContext();
      const buf = await ctx.decodeAudioData(ab);
      const sr = buf.sampleRate;
      const s0 = Math.floor(start * sr);
      const s1 = Math.floor(end * sr);
      const len = s1 - s0;
      const out = ctx.createBuffer(buf.numberOfChannels, len, sr);
      for (let c = 0; c < buf.numberOfChannels; c++) {
        out.copyToChannel(buf.getChannelData(c).slice(s0, s1), c);
      }
      const wav = audioBufferToWav(out);
      setResult(URL.createObjectURL(wav));
      setStatus('');
      await ctx.close();
    } catch {
      setStatus('Error processing audio.');
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Shell>
      <ToolLayout title="Audio Cutter" description="Trim any audio file to a precise start and end time." category="Media Tools" categoryPath="/#media">
        <div className="max-w-lg mx-auto space-y-6">
          <div>
            <Label>Upload Audio File</Label>
            <input type="file" accept="audio/*,video/*" className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
          </div>
          {duration > 0 && (
            <>
              <div className="p-4 bg-muted/30 rounded-xl space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total duration: {fmt(duration)}</span>
                  <span>Clip length: {fmt(end - start)}</span>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><Label>Start: {fmt(start)}</Label></div>
                  <input type="range" min={0} max={end - 1} value={start} onChange={e => setStart(+e.target.value)} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1"><Label>End: {fmt(end)}</Label></div>
                  <input type="range" min={start + 1} max={duration} value={end} onChange={e => setEnd(+e.target.value)} className="w-full" />
                </div>
              </div>
              <Button onClick={cut} className="w-full" disabled={status === 'Cutting…'}>
                {status === 'Cutting…' ? 'Cutting…' : 'Cut Audio'}
              </Button>
            </>
          )}
          {status && status !== 'Cutting…' && <p className="text-red-500 text-sm">{status}</p>}
          {result && (
            <div className="p-4 border rounded-xl space-y-3">
              <p className="text-green-700 font-semibold text-sm">✓ Audio cut successfully</p>
              <audio src={result} controls className="w-full" />
              <a href={result} download="cut-audio.wav">
                <Button variant="outline" className="w-full">Download WAV</Button>
              </a>
            </div>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}
