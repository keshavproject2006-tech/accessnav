import React, { useState, useRef, useEffect } from 'react';
import {
  ScanLine,
  Camera,
  Upload,
  Volume2,
  VolumeX,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  FileText,
  Smartphone,
  Pill,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { SignResult } from '../types';
import { saveHistoryItem } from '../lib/firebase';
import { postApi } from '../lib/api.ts';

export const SignReaderPage: React.FC = () => {
  const { user, speak, stopSpeaking, isSpeaking, triggerHaptic, announce } = useAccessibility();

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SignResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera and speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // When cameraActive changes to true and stream is ready, attach to video
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Video play error:', err);
      });
    }
  }, [cameraActive]);

  const startCamera = async () => {
    setError(null);
    setIsStartingCamera(true);
    triggerHaptic('click');

    // Stop previous stream if active
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser. Please use the "Take Photo with Phone Camera" option.');
      }

      let stream: MediaStream | null = null;

      // Try back camera first
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (backErr) {
        console.warn('Back camera failed, trying default camera:', backErr);
        // Fallback to any available video stream
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (!stream) {
        throw new Error('Could not initialize camera stream.');
      }

      streamRef.current = stream;
      setCameraActive(true);
      announce('Camera opened. Position medicine label or sign in the frame and press Capture.', 'polite');
    } catch (err: any) {
      console.warn('Camera error:', err);
      let msg = 'Could not open camera stream. Please allow camera permissions or use the Take Photo button.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Tap "Take Photo with Phone Camera" or allow camera in browser settings.';
      }
      setError(msg);
      setCameraActive(false);
      announce(msg, 'assertive');
    } finally {
      setIsStartingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    triggerHaptic('click');
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    analyzeSign(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerHaptic('click');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      analyzeSign(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Sample Medicine & Sign Labels for instant testing
  const sampleLabels = [
    {
      title: 'Paracetamol 500mg Tablet (Medicine Bottle)',
      icon: Pill,
      dataUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f8fafc"/><rect x="40" y="40" width="520" height="320" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="4"/><rect x="40" y="40" width="520" height="70" fill="%23dc2626"/><text x="60" y="85" fill="%23ffffff" font-family="sans-serif" font-size="28" font-weight="bold">PARACETAMOL TABLETS IP 500mg</text><text x="60" y="150" fill="%230f172a" font-family="sans-serif" font-size="20" font-weight="bold">DOSAGE: 1 to 2 tablets every 4 to 6 hours as required.</text><text x="60" y="190" fill="%23dc2626" font-family="sans-serif" font-size="18" font-weight="bold">WARNING: Taking more than 4000mg in 24 hours may cause severe liver damage.</text><text x="60" y="230" fill="%23475569" font-family="sans-serif" font-size="18">EXPIRY DATE: 12/2028 | BATCH NO: PAC8942</text><text x="60" y="270" fill="%23475569" font-family="sans-serif" font-size="18">STORAGE: Store below 25°C away from direct sunlight and children.</text><text x="60" y="310" fill="%231e293b" font-family="sans-serif" font-size="16" font-style="italic">Manufactured in Guindy, Chennai, Tamil Nadu, India</text></svg>',
    },
    {
      title: 'Chennai Metro Elevator Priority Sign',
      icon: ScanLine,
      dataUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230284c7"/><rect x="30" y="30" width="540" height="340" rx="16" fill="%23ffffff"/><text x="60" y="90" fill="%230369a1" font-family="sans-serif" font-size="32" font-weight="bold">CHENNAI METRO RAIL (CMRL)</text><text x="60" y="140" fill="%231e293b" font-family="sans-serif" font-size="24" font-weight="bold">ELEVATOR TO CONCOURSE & PLATFORMS</text><text x="60" y="180" fill="%23059669" font-family="sans-serif" font-size="22" font-weight="bold">PRIORITY: Wheelchair users, elderly & pregnant passengers</text><text x="60" y="230" fill="%23dc2626" font-family="sans-serif" font-size="20">DO NOT LEAN AGAINST ELEVATOR DOORS</text><text x="60" y="280" fill="%23334155" font-family="sans-serif" font-size="20">Press Emergency Yellow Bell for Station Controller</text><text x="60" y="325" fill="%230284c7" font-family="sans-serif" font-size="18">அவசர அழைப்பு: 1800 425 1515</text></svg>',
    },
  ];

  const analyzeSign = async (imageData: string) => {
    setLoading(true);
    setError(null);
    announce('Gemini is reading text and analyzing safety instructions...', 'polite');

    try {
      const data = await postApi<SignResult>('/api/gemini/sign-reader', {
        image: imageData,
        question: question.trim() || undefined,
        language: 'en',
      });

      setResult(data);
      triggerHaptic('success');

      if (data.audioReadout) {
        speak(data.audioReadout);
      }

      if (user) {
        saveHistoryItem(user.uid, {
          type: 'sign_reading',
          title: data.title || 'Read Sign/Label',
          content: data.plainExplanation || data.primaryText,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Error reading label.');
      announce('Failed to read sign. Try holding closer with good lighting.', 'assertive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <ScanLine className="w-7 h-7 text-purple-600 dark:text-yellow-400" />
            <span>Sign & Medicine Label Reader</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
            Hold prescription bottles, medicine dosages, food allergens, or street signs in front of your camera.
          </p>
        </div>

        {result && (
          <button
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              } else {
                speak(result.audioReadout || result.plainExplanation);
              }
            }}
            className={`touch-target px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 border transition-all shadow ${
              isSpeaking
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : 'bg-black dark:bg-white text-white dark:text-black border-transparent'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
          </button>
        )}
      </div>

      {/* Camera Viewport Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Sign or medicine label captured for analysis"
              className="w-full h-full object-contain bg-neutral-900"
            />
          ) : cameraActive ? (
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-6 text-neutral-400 max-w-sm">
              <ScanLine className="w-12 h-12 mx-auto mb-3 opacity-50 text-purple-400" />
              <p className="text-sm font-bold text-white">Camera is Ready</p>
              <p className="text-xs text-neutral-400 mt-1">
                Tap "Open Live Camera" below, or use the "Take Photo" button to open your phone's native camera directly.
              </p>
              <button
                type="button"
                onClick={startCamera}
                disabled={isStartingCamera}
                className="mt-4 touch-target px-5 py-2.5 bg-white text-black font-extrabold text-xs rounded-xl shadow hover:bg-neutral-100 active:scale-95"
              >
                {isStartingCamera ? 'Opening Camera...' : 'Open Live Camera'}
              </button>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center z-10">
              <RefreshCw className="w-10 h-10 animate-spin text-purple-400 mb-3" />
              <p className="font-bold text-base">Reading label & dosage with Gemini...</p>
              <p className="text-xs text-neutral-300 mt-1">
                Checking for warnings, expiry dates, and usage instructions.
              </p>
            </div>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-500 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Camera Action Buttons (Mobile-first) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {cameraActive ? (
            <button
              onClick={capturePhoto}
              disabled={loading}
              className="touch-target py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Label</span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              disabled={isStartingCamera}
              className="touch-target py-3 px-4 bg-black dark:bg-white text-white dark:text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow"
            >
              <Camera className="w-4 h-4" />
              <span>{isStartingCamera ? 'Opening...' : 'Open Live Camera'}</span>
            </button>
          )}

          {/* Native Mobile Shutter Button: Works 100% reliably on iOS and Android */}
          <label className="touch-target py-3 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 cursor-pointer shadow-sm">
            <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Phone Camera (Direct)</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>

          {/* Upload photo from gallery */}
          <label className="touch-target py-3 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 cursor-pointer shadow-sm">
            <Upload className="w-4 h-4 text-neutral-500" />
            <span>Choose from Gallery</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
        </div>

        {/* Optional Question Input */}
        <div className="pt-2">
          <label
            htmlFor="sign-question-input"
            className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1"
          >
            Specific question (optional):
          </label>
          <input
            id="sign-question-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. 'What is the dosage?', 'Does this have penicillin?', 'What are the visiting hours?'"
            className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-medium focus:outline-none"
          />
        </div>

        {/* Quick Sample Labels Bar */}
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-neutral-500">Test with samples:</span>
          {sampleLabels.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                triggerHaptic('click');
                setCapturedImage(sample.dataUrl);
                stopCamera();
                analyzeSign(sample.dataUrl);
              }}
              className="px-2.5 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 font-semibold border border-neutral-300 dark:border-neutral-700 flex items-center gap-1.5"
            >
              <Pill className="w-3 h-3 text-purple-600" />
              <span>{sample.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Result Card */}
      {result && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300">
                {result.category}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mt-1">
                {result.title}
              </h2>
            </div>

            <button
              onClick={() => speak(result.audioReadout || result.plainExplanation)}
              className="touch-target px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Hear Audio</span>
            </button>
          </div>

          {/* Warnings Box */}
          {result.importantWarnings && result.importantWarnings.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-xl space-y-1.5">
              <h3 className="text-xs uppercase font-extrabold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Critical Cautions & Warnings
              </h3>
              <ul className="space-y-1 text-xs sm:text-sm font-bold text-red-900 dark:text-red-200">
                {result.importantWarnings.map((warn, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Plain explanation */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-xs uppercase font-extrabold text-neutral-500 dark:text-neutral-400 mb-1.5">
              Plain Language Explanation
            </h3>
            <p className="text-sm sm:text-base text-neutral-900 dark:text-white leading-relaxed font-medium">
              {result.plainExplanation}
            </p>
          </div>

          {/* Raw text */}
          {result.primaryText && (
            <div>
              <h3 className="text-xs uppercase font-bold text-neutral-500 mb-1">
                Transcribed Text:
              </h3>
              <p className="text-xs font-mono p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-800 dark:text-neutral-300 whitespace-pre-line border border-neutral-300 dark:border-neutral-700">
                {result.primaryText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
