import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Phone,
  MapPin,
  HeartPulse,
  Share2,
  Copy,
  Check,
  AlertOctagon,
  Volume2,
  VolumeX,
  Edit,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export const EmergencyPanelPage: React.FC = () => {
  const { preferences, updatePreferences, triggerHaptic, announce } = useAccessibility();

  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit fields
  const [name, setName] = useState(preferences.emergencyContactName || '');
  const [phone, setPhone] = useState(preferences.emergencyContactPhone || '');
  const [notes, setNotes] = useState(preferences.emergencyMedicalNotes || '');
  const [bloodType, setBloodType] = useState(preferences.emergencyBloodType || 'Unknown');
  const [allergies, setAllergies] = useState(preferences.emergencyAllergies || '');

  const audioContextRef = React.useRef<AudioContext | null>(null);
  const oscRef = React.useRef<OscillatorNode | null>(null);

  // Fetch GPS Location
  const fetchLocation = () => {
    setLocLoading(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      setLocLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setLocLoading(false);
        announce('Emergency location updated successfully.', 'polite');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocError('Location permission denied. Please enable GPS in device settings.');
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    fetchLocation();
    triggerHaptic('alert');
    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch {}
        oscRef.current = null;
      }
    };
  }, []);

  // Emergency Siren Beep Generator using Web Audio API
  const toggleAlarm = () => {
    triggerHaptic('alert');
    if (isAlarmPlaying) {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
        oscRef.current = null;
      }
      setIsAlarmPlaying(false);
      announce('Emergency alert sound stopped', 'polite');
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        // Modulate frequency to create alert siren
        osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        oscRef.current = osc;

        setIsAlarmPlaying(true);
        announce('Emergency alert sound playing loudly.', 'assertive');
      } catch (e) {
        console.warn('Audio alarm error:', e);
      }
    }
  };

  const emergencyMessage = `EMERGENCY ALERT: I need assistance. My name is ${
    preferences.emergencyContactName ? `in contact with ${preferences.emergencyContactName}` : 'a user with medical needs'
  }. Medical Notes: ${preferences.emergencyMedicalNotes || 'See card'}. My current GPS: ${
    location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : 'Location pending'
  }`;

  const copyEmergencyInfo = () => {
    triggerHaptic('click');
    navigator.clipboard.writeText(emergencyMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    announce('Emergency message and coordinates copied to clipboard', 'polite');
  };

  const handleShare = async () => {
    triggerHaptic('click');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AccessNav Emergency Alert',
          text: emergencyMessage,
        });
      } catch {}
    } else {
      copyEmergencyInfo();
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    await updatePreferences({
      emergencyContactName: name,
      emergencyContactPhone: phone,
      emergencyMedicalNotes: notes,
      emergencyBloodType: bloodType,
      emergencyAllergies: allergies,
    });
    setShowEditModal(false);
    announce('Emergency profile updated', 'polite');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-8 h-8" />
            <span>Emergency SOS Panel</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1">
            Show this screen to first responders, paramedics, police, or bystanders for urgent assistance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Siren Button */}
          <button
            onClick={toggleAlarm}
            className={`touch-target px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 border-2 transition-all shadow ${
              isAlarmPlaying
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black border-transparent'
            }`}
            aria-label={isAlarmPlaying ? 'Stop siren alarm' : 'Play loud emergency siren alarm'}
          >
            {isAlarmPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-red-400" />}
            <span>{isAlarmPlaying ? 'Stop Siren' : 'Sound Alarm'}</span>
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            className="touch-target px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 rounded-xl text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 border border-neutral-300 dark:border-neutral-700"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* GIANT HIGH-VISIBILITY EMERGENCY CARD */}
      <div className="bg-red-600 text-white rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 border-4 border-red-700">
        <div className="flex items-center justify-between border-b-2 border-red-500 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-red-600 flex items-center justify-center font-black text-2xl shadow">
              +
            </div>
            <div>
              <div className="text-xs uppercase font-extrabold tracking-widest text-red-200">
                Medical & Emergency Alert Card
              </div>
              <div className="text-xl sm:text-2xl font-black tracking-tight">
                CRITICAL INFORMATION
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 bg-red-700 rounded-full text-xs font-bold uppercase tracking-wider text-white border border-red-400">
            Show to Paramedics
          </span>
        </div>

        {/* Medical Notes Banner */}
        <div className="bg-white text-black p-5 sm:p-6 rounded-2xl shadow space-y-2">
          <span className="text-xs uppercase font-extrabold text-red-600 tracking-wider flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4" />
            Medical Conditions & Special Needs:
          </span>
          <p className="text-lg sm:text-2xl font-black leading-tight text-neutral-950">
            {preferences.emergencyMedicalNotes || 'No specific medical notes provided.'}
          </p>

          <div className="flex flex-wrap gap-4 pt-3 border-t border-neutral-200 text-xs font-bold text-neutral-700">
            <div>
              Blood Type: <span className="text-black font-extrabold">{preferences.emergencyBloodType || 'Unknown'}</span>
            </div>
            {preferences.emergencyAllergies && (
              <div>
                Allergies: <span className="text-red-600 font-extrabold">{preferences.emergencyAllergies}</span>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-red-700/80 p-5 rounded-2xl border border-red-400">
            <span className="text-xs uppercase font-extrabold text-red-200 block mb-1">
              Primary Emergency Contact (ICE)
            </span>
            <div className="text-lg sm:text-xl font-bold">
              {preferences.emergencyContactName || 'Not configured'}
            </div>
            <div className="text-base sm:text-lg font-mono font-bold mt-1 text-white">
              {preferences.emergencyContactPhone || 'No phone set'}
            </div>
          </div>

          {/* Quick Call Button */}
          {preferences.emergencyContactPhone ? (
            <a
              href={`tel:${preferences.emergencyContactPhone}`}
              className="touch-target bg-white text-red-700 hover:bg-neutral-100 p-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow transition-all active:scale-95"
            >
              <Phone className="w-6 h-6 text-red-600" />
              <span>Call {preferences.emergencyContactName || 'Contact'}</span>
            </a>
          ) : (
            <button
              onClick={() => setShowEditModal(true)}
              className="touch-target bg-red-800/80 hover:bg-red-800 text-white p-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-red-400"
            >
              <Edit className="w-4 h-4" />
              <span>Add Emergency Phone Number</span>
            </button>
          )}
        </div>

        {/* Live GPS Location Bar */}
        <div className="bg-red-800/60 p-4 rounded-2xl border border-red-400/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-yellow-300 shrink-0" />
            <div>
              <div className="text-xs uppercase font-extrabold text-red-200">
                Your Current GPS Coordinates
              </div>
              <div className="text-sm font-mono font-bold">
                {locLoading ? (
                  <span>Acquiring satellites...</span>
                ) : location ? (
                  <span>
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)} (±{location.accuracy}m)
                  </span>
                ) : (
                  <span>{locError || 'Location unavailable'}</span>
                )}
              </div>
            </div>
          </div>

          {location && (
            <a
              href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-white text-black font-bold text-xs rounded-xl flex items-center gap-1.5 self-start sm:self-auto hover:bg-neutral-100"
            >
              <span>Open Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Share / Copy Emergency Info Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={copyEmergencyInfo}
          className="touch-target w-full py-4 px-5 bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-2xl font-extrabold text-sm text-neutral-900 dark:text-white flex items-center justify-center gap-2.5 shadow-sm active:scale-95"
        >
          {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Emergency SOS Message'}</span>
        </button>

        <button
          onClick={handleShare}
          className="touch-target w-full py-4 px-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg active:scale-95"
        >
          <Share2 className="w-5 h-5" />
          <span>Send Location & Alert via SMS / Share</span>
        </button>
      </div>

      {/* Edit Emergency Contact Modal */}
      {showEditModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Emergency Information"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              Edit Emergency Information
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
              This info is saved locally and on your cloud profile for emergency access.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Contact Name & Relationship
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex (Spouse) or Dr. Smith"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Critical Medical Conditions / Assistive Device Info
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Electric wheelchair user. Type 1 Diabetic. Non-verbal when stressed. Uses ASL."
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                    Blood Type
                  </label>
                  <input
                    type="text"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    placeholder="e.g. O+, A-, B+"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                    Allergies
                  </label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Latex"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="touch-target flex-1 py-2.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="touch-target flex-1 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl shadow"
                >
                  Save Emergency Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
