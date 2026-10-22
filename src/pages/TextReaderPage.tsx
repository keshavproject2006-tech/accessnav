import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Volume2,
  VolumeX,
  BookOpen,
  Sparkles,
  Clock,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { TextSimplifyResult } from '../types';
import { saveHistoryItem } from '../lib/firebase';
import { postApi } from '../lib/api.ts';

export const TextReaderPage: React.FC = () => {
  const { user, speak, stopSpeaking, isSpeaking, triggerHaptic, announce } = useAccessibility();

  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [inputText, setInputText] = useState('');
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [readingLevel, setReadingLevel] = useState<'simple' | 'medium' | 'detailed'>('simple');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TextSimplifyResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    return () => stopSpeaking();
  }, [stopSpeaking]);

  const sampleTexts = [
    {
      title: 'Medical Discharge Note',
      text: 'Patient exhibits signs consistent with post-operative cephalalgia following laparoscopic cholecystectomy. Administer acetaminophen 500mg per os every six hours pro re nata. Ambulation is indicated as tolerated, with avoidance of strenuous valsalva maneuvers.',
    },
    {
      title: 'Transit Policy Document',
      text: 'Pursuant to federal Title II regulations, municipal transit authorities must furnish comparable paratransit accommodations within three-quarters of a mile of designated fixed bus corridors during analogous operational schedules.',
    },
    {
      title: 'Lease Agreement Clause',
      text: 'The Lessee covenants to indemnify and hold harmless the Lessor from and against any and all liabilities, encumbrances, or demands arising out of any breach of covenant or negligent omission within the demised premises.',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerHaptic('click');
    const reader = new FileReader();
    reader.onload = () => {
      setDocumentImage(reader.result as string);
      setInputMode('image');
      announce('Document image loaded. Ready to simplify.', 'polite');
    };
    reader.readAsDataURL(file);
  };

  const handleSimplify = async () => {
    triggerHaptic('click');
    if (!inputText && !documentImage) {
      setError('Please paste text or upload an image of a document.');
      return;
    }

    setLoading(true);
    setError(null);
    announce(`Simplifying text to ${readingLevel} reading level...`, 'polite');

    try {
      const data = await postApi<TextSimplifyResult>('/api/gemini/text-simplifier', {
        text: inputMode === 'text' ? inputText : undefined,
        image: inputMode === 'image' ? documentImage : undefined,
        readingLevel,
        language: 'en',
      });

      setResult(data);
      triggerHaptic('success');
      announce('Text simplified successfully. Ready to read aloud.', 'polite');

      if (user) {
        saveHistoryItem(user.uid, {
          type: 'text_simplification',
          title: data.title || 'Simplified Text',
          content: data.simplifiedText,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred while simplifying text.');
      announce('Simplification failed. Please try again.', 'assertive');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.simplifiedText) return;
    triggerHaptic('click');
    navigator.clipboard.writeText(result.simplifiedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    announce('Simplified text copied to clipboard', 'polite');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-cyan-600 dark:text-yellow-400" />
            <span>Text Simplifier & Reader</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1">
            Converts dense, confusing medical, legal, or official text into clear everyday language with read-aloud support.
          </p>
        </div>

        {result && (
          <button
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              } else {
                speak(result.simplifiedText);
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

      {/* Input Mode Selector */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('click');
              setInputMode('text');
            }}
            className={`touch-target px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 ${
              inputMode === 'text'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Text</span>
          </button>

          <label
            className={`touch-target px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer ${
              inputMode === 'image'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
        </div>

        {/* Text Input Area */}
        {inputMode === 'text' ? (
          <div>
            <label
              htmlFor="source-text"
              className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Enter or paste text to simplify:
            </label>
            <textarea
              id="source-text"
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste medical discharge instructions, legal contracts, government forms, or textbook chapters here..."
              className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white rounded-2xl text-neutral-900 dark:text-white font-medium text-sm focus:outline-none transition-colors"
            />
            {/* Quick Sample Text Buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[11px] font-bold text-neutral-500">Try sample:</span>
              {sampleTexts.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    triggerHaptic('click');
                    setInputText(sample.text);
                  }}
                  className="px-2.5 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 font-semibold border border-neutral-300 dark:border-neutral-700"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {documentImage ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-neutral-300 dark:border-neutral-700 max-h-80 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <img
                  src={documentImage}
                  alt="Uploaded document preview"
                  className="max-h-80 object-contain"
                />
                <button
                  type="button"
                  onClick={() => setDocumentImage(null)}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-black/80 text-white rounded-lg text-xs font-bold"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl text-center">
                <Upload className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Select a photo of mail, pamphlet, or book
                </p>
                <p className="text-xs text-neutral-500 mt-1">PNG, JPG, or PDF snapshot</p>
              </div>
            )}
          </div>
        )}

        {/* Reading Level Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
            Target Reading Level:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'simple',
                label: 'Simple (Grade 4)',
                desc: 'Short sentences, plain vocabulary, zero jargon',
              },
              {
                id: 'medium',
                label: 'Medium (Conversational)',
                desc: 'Balanced clarity, natural everyday conversational tone',
              },
              {
                id: 'detailed',
                label: 'Detailed Breakdown',
                desc: 'Complete summary with structural points preserved',
              },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  triggerHaptic('click');
                  setReadingLevel(lvl.id as any);
                }}
                className={`touch-target p-3.5 rounded-xl border-2 text-left transition-all ${
                  readingLevel === lvl.id
                    ? 'border-black dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-black shadow'
                    : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm">{lvl.label}</div>
                <div
                  className={`text-[11px] mt-1 ${
                    readingLevel === lvl.id
                      ? 'text-neutral-300 dark:text-neutral-700'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {lvl.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-500 rounded-xl text-red-800 dark:text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSimplify}
          disabled={loading}
          className="touch-target w-full py-4 px-6 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-xl transition-all disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5 text-yellow-300 dark:text-yellow-600" />
          <span>{loading ? 'Simplifying Text...' : 'Simplify & Explain'}</span>
        </button>
      </div>

      {/* Result Section */}
      {result && (
        <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-300">
                {readingLevel.toUpperCase()} LEVEL
              </span>
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white mt-1">
                {result.title || 'Simplified Explanation'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="touch-target px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-xl text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 border border-neutral-300 dark:border-neutral-700"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => speak(result.simplifiedText)}
                className="touch-target px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Volume2 className="w-4 h-4" />
                <span>Read Aloud</span>
              </button>
            </div>
          </div>

          {/* Key Bullet Summary */}
          {result.bulletSummary && result.bulletSummary.length > 0 && (
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl border border-neutral-300 dark:border-neutral-700">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                Main Takeaways
              </h3>
              <ul className="space-y-2">
                {result.bulletSummary.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm font-semibold text-neutral-900 dark:text-white">
                    <CheckCircle className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Simplified Text Body */}
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Plain Text Reading
            </h3>
            <p className="text-base sm:text-lg text-neutral-900 dark:text-white leading-relaxed font-normal whitespace-pre-line p-4 bg-neutral-50/50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              {result.simplifiedText}
            </p>
          </div>

          {/* Jargon Buster */}
          {result.jargonExplained && result.jargonExplained.length > 0 && (
            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Jargon Buster (Difficult Words Explained)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {result.jargonExplained.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl"
                  >
                    <div className="font-bold text-xs text-amber-900 dark:text-amber-200">
                      "{item.word}"
                    </div>
                    <div className="text-xs text-neutral-700 dark:text-neutral-300 mt-1">
                      {item.meaning}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
