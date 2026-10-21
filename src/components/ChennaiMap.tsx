import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Volume2,
  VolumeX,
  Accessibility,
  CheckCircle2,
  Train,
  Hospital,
  Compass,
  Search,
  ExternalLink,
} from 'lucide-react';
import { CHENNAI_LOCATIONS, ChennaiLocation } from '../data/chennaiLocations';
import { useAccessibility } from '../context/AccessibilityContext';

interface ChennaiMapProps {
  onSelectDestination?: (destinationName: string) => void;
}

export const ChennaiMap: React.FC<ChennaiMapProps> = ({ onSelectDestination }) => {
  const { speak, stopSpeaking, isSpeaking, triggerHaptic, announce, preferences } =
    useAccessibility();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});

  const [selectedLoc, setSelectedLoc] = useState<ChennaiLocation>(CHENNAI_LOCATIONS[0]);
  const [filter, setFilter] = useState<'all' | 'transit' | 'metro' | 'beach' | 'hospital' | 'public'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Clean custom icon helper
  const createCustomIcon = (category: string, isSelected: boolean) => {
    let color = '#2563eb';
    let label = '📍';
    if (category === 'metro') {
      color = '#0284c7';
      label = '🚇';
    } else if (category === 'beach') {
      color = '#0d9488';
      label = '🏖️';
    } else if (category === 'hospital') {
      color = '#dc2626';
      label = '🏥';
    } else if (category === 'transit') {
      color = '#ea580c';
      label = '🚆';
    }

    return L.divIcon({
      className: 'custom-chennai-marker',
      html: `
        <div style="
          background-color: ${isSelected ? '#000000' : color};
          color: #ffffff;
          width: ${isSelected ? '36px' : '30px'};
          height: ${isSelected ? '36px' : '30px'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isSelected ? '16px' : '13px'};
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 2px solid #ffffff;
          transition: all 0.2s ease;
        ">
          ${label}
        </div>
      `,
      iconSize: isSelected ? [36, 36] : [30, 30],
      iconAnchor: isSelected ? [18, 18] : [15, 15],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Chennai Central
    const map = L.map(mapContainerRef.current, {
      center: [13.0827, 80.2755],
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add high quality OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors | Chennai Accessibility Grid',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when filter changes or on mount
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const filtered = CHENNAI_LOCATIONS.filter((loc) => {
      const matchesFilter = filter === 'all' || loc.category === filter;
      const matchesSearch =
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.tamilName.includes(searchQuery) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    filtered.forEach((loc) => {
      const isSelected = selectedLoc.id === loc.id;
      const icon = createCustomIcon(loc.category, isSelected);
      const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map);

      marker.on('click', () => {
        triggerHaptic('click');
        setSelectedLoc(loc);
        map.flyTo([loc.lat, loc.lng], 14, { duration: 1.0 });
      });

      markersRef.current[loc.id] = marker;
    });
  }, [filter, searchQuery, selectedLoc]);

  const handleSelectLocation = (loc: ChennaiLocation) => {
    triggerHaptic('click');
    setSelectedLoc(loc);
    mapInstanceRef.current?.flyTo([loc.lat, loc.lng], 14, { duration: 0.8 });
    announce(`Selected ${loc.name}. ${loc.wheelchairStatus}.`, 'polite');
  };

  const playVoiceInfo = (loc: ChennaiLocation) => {
    triggerHaptic('click');
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    const isTamil = preferences.language === 'ta';
    const textToSpeak = isTamil
      ? `${loc.tamilName}. ${loc.tamilAudioTip}. வசதிகள்: ${loc.accessibleFeatures.join(', ')}`
      : `${loc.name}. ${loc.wheelchairStatus}. ${loc.audioCues}. Key accessibility features: ${loc.accessibleFeatures.join('. ')}`;

    speak(textToSpeak);
  };

  const filteredLocations = CHENNAI_LOCATIONS.filter((loc) => {
    const matchesFilter = filter === 'all' || loc.category === filter;
    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.tamilName.includes(searchQuery) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Chennai places (e.g. Central, Marina, CMBT, Airport)..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-medium focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Chennai' },
            { id: 'transit', label: 'Railway & Bus' },
            { id: 'metro', label: 'CMRL Metro' },
            { id: 'beach', label: 'Marina Ramp' },
            { id: 'hospital', label: 'Hospitals' },
            { id: 'public', label: 'Malls & Plazas' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic('click');
                setFilter(cat.id as any);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                filter === cat.id
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map View & Quick Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leaflet Map Container */}
        <div className="lg:col-span-2 relative h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border-2 border-neutral-900 dark:border-neutral-200 shadow-sm z-0">
          <div ref={mapContainerRef} className="w-full h-full" />
          <div className="absolute top-2 right-2 bg-white/95 dark:bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-lg border text-[11px] font-bold text-neutral-800 dark:text-neutral-200 shadow z-[1000]">
            Chennai, Tamil Nadu
          </div>
        </div>

        {/* Selected Location Card */}
        <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                {selectedLoc.wheelchairStatus}
              </span>
              <button
                onClick={() => playVoiceInfo(selectedLoc)}
                className={`touch-target px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                  isSpeaking
                    ? 'bg-red-600 text-white border-red-700 animate-pulse'
                    : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700'
                }`}
                aria-label="Hear accessible details for this location"
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-blue-600" />}
                <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
              </button>
            </div>

            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white leading-tight">
              {selectedLoc.name}
            </h3>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
              {selectedLoc.tamilName}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
              {selectedLoc.address}
            </p>

            {/* Accessibility Checklist */}
            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Verified Access Features:
              </div>
              <ul className="space-y-1 text-xs text-neutral-800 dark:text-neutral-200">
                {selectedLoc.accessibleFeatures.slice(0, 3).map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action: Use in Navigation Helper */}
          <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
            {onSelectDestination && (
              <button
                onClick={() => {
                  triggerHaptic('click');
                  onSelectDestination(selectedLoc.name);
                }}
                className="touch-target flex-1 py-2.5 px-3 bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate to this Spot</span>
              </button>
            )}

            <a
              href={`https://maps.google.com/?q=${selectedLoc.lat},${selectedLoc.lng}`}
              target="_blank"
              rel="noreferrer"
              className="touch-target px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 rounded-xl text-neutral-700 dark:text-neutral-300 text-xs font-bold flex items-center justify-center border border-neutral-300 dark:border-neutral-700"
              title="Open in Google Maps"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Chennai Landmarks Quick Select Grid */}
      <div>
        <div className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-2">
          Key Accessible Chennai Hubs ({filteredLocations.length})
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {filteredLocations.map((loc) => {
            const isSelected = loc.id === selectedLoc.id;
            return (
              <button
                key={loc.id}
                onClick={() => handleSelectLocation(loc)}
                className={`touch-target p-2.5 text-left rounded-xl border text-xs transition-all ${
                  isSelected
                    ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-bold shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white'
                }`}
              >
                <div className="font-bold truncate">{loc.name}</div>
                <div
                  className={`text-[11px] truncate ${
                    isSelected ? 'opacity-80' : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {loc.tamilName}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
