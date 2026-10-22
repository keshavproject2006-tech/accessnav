import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Volume2,
  VolumeX,
  AlertTriangle,
  Footprints,
  Users,
  Compass,
  FileText,
  Info,
  Maximize2,
  CheckCircle,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { SceneResult } from '../types';
import { saveHistoryItem } from '../lib/firebase';
import { postApi } from '../lib/api.ts';

export const SceneDescriberPage: React.FC = () => {
  const { user, speak, stopSpeaking, isSpeaking, triggerHaptic, announce } = useAccessibility();

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLevel, setDetailLevel] = useState<'standard' | 'detailed'>('standard');
  const [result, setResult] = useState<SceneResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'hazards' | 'pathway' | 'signs' | 'detail'>('summary');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start Camera
  const startCamera = async () => {
    setError(null);
    triggerHaptic('click');
    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch (backErr) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      announce('Camera stream active. Point your camera forward and press Capture Scene.', 'polite');
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setError('Camera access was denied or not found. You can upload an image file instead.');
      announce('Camera access failed. Please select an image file to upload.', 'assertive');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    // Start camera on mount if permissions allow
    startCamera();
    return () => {
      stopCamera();
      stopSpeaking();
    };
  }, []);

  // Take Snapshot from video
  const captureSnapshot = () => {
    triggerHaptic('click');
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    analyzeImage(dataUrl, 'standard');
  };

  // Upload image from file picker
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerHaptic('click');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      analyzeImage(dataUrl, 'standard');
    };
    reader.readAsDataURL(file);
  };

  // Analyze with Gemini
  const analyzeImage = async (imageData: string, level: 'standard' | 'detailed') => {
    setLoading(true);
    setError(null);
    setDetailLevel(level);
    announce(
      level === 'detailed'
        ? 'Generating exhaustive scene breakdown with Gemini...'
        : 'Analyzing surroundings and checking for immediate hazards...',
      'polite'
    );

    try {
      const data = await postApi<SceneResult>('/api/gemini/scene-describer', {
        image: imageData,
        detailLevel: level,
        language: 'en',
      });

      setResult(data);
      triggerHaptic('success');

      // Auto-announce spoken summary
      if (data.spokenAnnouncement) {
        speak(data.spokenAnnouncement);
        announce(data.spokenAnnouncement, 'assertive');
      }

      // Save to user history
      if (user) {
        saveHistoryItem(user.uid, {
          type: 'scene_description',
          title: data.summary.slice(0, 50) + '...',
          content: data.fullDetailedDescription || data.summary,
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not analyze scene. Check connection and try again.');
      triggerHaptic('warning');
      announce('Analysis failed. Please try again.', 'assertive');
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    triggerHaptic('click');
    setResult(null);
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Camera className="w-7 h-7 text-blue-600 dark:text-yellow-400" />
            <span>Scene Describer</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1">
            Real-time visual navigation assistant. Identifies obstacles, elevation changes, paths, and signs.
          </p>
        </div>

        {/* Read Aloud Controller */}
        {result && (
          <button
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              } else {
                speak(result.spokenAnnouncement || result.summary);
              }
            }}
            className={`touch-target px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 border-2 transition-all shadow ${
              isSpeaking
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : 'bg-black dark:bg-white text-white dark:text-black border-transparent'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeaking ? 'Stop Reading' : 'Read Aloud'}</span>
          </button>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-red-50 dark:bg-red-950/60 border-2 border-red-600 rounded-2xl text-red-800 dark:text-red-200 text-sm flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Notice:</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Viewport: Live Camera Feed or Frozen Captured Image */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-neutral-900 rounded-3xl overflow-hidden border-2 border-neutral-900 dark:border-neutral-200 shadow-xl flex items-center justify-center">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured scene for accessibility analysis"
            className="w-full h-full object-cover"
          />
        ) : cameraActive ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6 text-neutral-400">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">Camera is not streaming</p>
            <button
              onClick={startCamera}
              className="mt-3 px-4 py-2 bg-white text-black font-bold text-xs rounded-xl"
            >
              Start Camera
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
            <RefreshCw className="w-10 h-10 animate-spin text-yellow-400 mb-3" />
            <p className="font-bold text-base">Gemini Vision is scanning surroundings...</p>
            <p className="text-xs text-neutral-300 mt-1 max-w-xs">
              Detecting physical trip hazards, pathways, people, and signage.
            </p>
          </div>
        )}
      </div>

      {/* Control Buttons Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {cameraActive && (
          <button
            onClick={captureSnapshot}
            disabled={loading}
            className="touch-target px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-extrabold text-base rounded-2xl flex items-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            aria-label="Capture and describe current view"
          >
            <Camera className="w-6 h-6" />
            <span>Describe Scene</span>
          </button>
        )}

        {capturedImage && (
          <button
            onClick={handleRetake}
            className="touch-target px-5 py-3.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-sm rounded-2xl flex items-center gap-2 border border-neutral-300 dark:border-neutral-700 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Scan Another Scene</span>
          </button>
        )}

        {/* Native Mobile Shutter Button */}
        <label className="touch-target px-5 py-3.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-sm rounded-2xl flex items-center gap-2 border border-neutral-300 dark:border-neutral-700 cursor-pointer shadow-sm">
          <Camera className="w-4 h-4 text-blue-600" />
          <span>Phone Camera</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="sr-only"
            aria-label="Take photo with mobile camera"
          />
        </label>

        {/* File Upload Option */}
        <label className="touch-target px-5 py-3.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-sm rounded-2xl flex items-center gap-2 border border-neutral-300 dark:border-neutral-700 cursor-pointer shadow-sm">
          <Upload className="w-4 h-4" />
          <span>Upload Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="sr-only"
            aria-label="Upload photo from device"
          />
        </label>
      </div>

      {/* Results Breakdown Section */}
      {result && (
        <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          {/* Spoken Quick Summary Card */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-600 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                Spoken Audio Summary
              </span>
              <button
                onClick={() => speak(result.spokenAnnouncement || result.summary)}
                className="text-xs font-bold text-blue-700 dark:text-yellow-400 underline hover:opacity-80"
              >
                Replay Audio
              </button>
            </div>
            <p className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-relaxed">
              "{result.spokenAnnouncement || result.summary}"
            </p>
          </div>

          {/* Navigation Breakdown Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            {[
              { id: 'summary', label: 'Overview', icon: Compass },
              { id: 'hazards', label: 'Hazards & Obstacles', icon: AlertTriangle, count: result.immediateHazards?.length },
              { id: 'pathway', label: 'Walkway & Ramps', icon: Footprints },
              { id: 'signs', label: 'Signs & Text', icon: FileText, count: result.signsAndLabels?.length },
              { id: 'detail', label: 'Full Sensory Detail', icon: Maximize2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic('click');
                    setActiveTab(tab.id as any);
                  }}
                  className={`touch-target px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-extrabold">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="pt-2">
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs uppercase font-extrabold text-neutral-500 dark:text-neutral-400 tracking-wider mb-1">
                    Direct Visual Summary
                  </h3>
                  <p className="text-base text-neutral-900 dark:text-white leading-relaxed font-medium">
                    {result.summary}
                  </p>
                </div>

                {result.keyObjects && result.keyObjects.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase font-bold text-neutral-500 dark:text-neutral-400 mb-2">
                      Key Landmarks & Objects
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.keyObjects.map((obj, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
                        >
                          {obj}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'hazards' && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Immediate Physical Hazards
                </h3>
                {result.immediateHazards && result.immediateHazards.length > 0 ? (
                  <ul className="space-y-2">
                    {result.immediateHazards.map((hazard, i) => (
                      <li
                        key={i}
                        className="p-3 bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-xl text-red-900 dark:text-red-200 font-bold text-sm flex items-start gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                          !
                        </span>
                        <span>{hazard}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 bg-green-50 dark:bg-green-950/40 border-2 border-green-600 rounded-xl text-green-800 dark:text-green-200 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>No immediate trip hazards or drops detected in this frame.</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pathway' && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Footprints className="w-4 h-4 text-blue-600" />
                  Pathway & Walking Surface
                </h3>
                <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-300 dark:border-neutral-700">
                  {result.pathwayDescription || 'Proceed cautiously.'}
                </p>
                {result.peopleAndActivity && (
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-300 dark:border-neutral-700">
                    <span className="text-xs uppercase font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
                      People in Area
                    </span>
                    <p className="text-sm text-neutral-800 dark:text-neutral-200">
                      {result.peopleAndActivity}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'signs' && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Signage & Directional Text
                </h3>
                {result.signsAndLabels && result.signsAndLabels.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {result.signsAndLabels.map((sign, i) => (
                      <div
                        key={i}
                        className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 rounded-xl text-xs font-semibold text-purple-900 dark:text-purple-200"
                      >
                        {sign}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                    No clear signs or placards visible in this frame.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'detail' && (
              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-300 dark:border-neutral-700">
                  <h3 className="text-xs uppercase font-extrabold text-neutral-500 dark:text-neutral-400 tracking-wider mb-2">
                    Sensory & Spatial Analysis
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-line">
                    {result.fullDetailedDescription || result.summary}
                  </p>
                </div>

                {detailLevel === 'standard' && capturedImage && (
                  <button
                    onClick={() => analyzeImage(capturedImage, 'detailed')}
                    disabled={loading}
                    className="touch-target w-full py-3 px-4 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 border border-neutral-400 dark:border-neutral-600"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Request Exhaustive Deep Detail</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
