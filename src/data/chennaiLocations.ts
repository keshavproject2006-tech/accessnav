export interface ChennaiLocation {
  id: string;
  name: string;
  tamilName: string;
  category: 'transit' | 'metro' | 'hospital' | 'public' | 'beach';
  lat: number;
  lng: number;
  address: string;
  accessibleFeatures: string[];
  wheelchairStatus: 'Fully Step-Free' | 'Ramp Available' | 'Elevators Active';
  audioCues: string;
  tamilAudioTip: string;
}

export const CHENNAI_LOCATIONS: ChennaiLocation[] = [
  {
    id: 'chennai-central-rail',
    name: 'Puratchi Thalaivar Dr. M.G.R Central Railway Station',
    tamilName: 'டாக்டர் எம்.ஜி.ஆர் சென்னை சென்ட்ரல் ரயில் நிலையம்',
    category: 'transit',
    lat: 13.0827,
    lng: 80.2755,
    address: 'Kannappar Thidal, Periyamet, Chennai, Tamil Nadu 600003',
    accessibleFeatures: [
      'Level ramp entrance at Gate 1 & Gate 4',
      'Tactile paving connecting main concourse to Platforms 1 & 2',
      'Battery-operated buggies for elderly & wheelchair passengers',
      'Braille tactile map near Chief Reservation Supervisor counter',
      'Dedicated accessible washroom next to waiting hall',
    ],
    wheelchairStatus: 'Fully Step-Free',
    audioCues: 'Announcements broadcast in Tamil, English, and Hindi. Listen for Platform 1 bell indicators.',
    tamilAudioTip: 'கேட் 1 வழியாக சாய்வுதளம் (Ramp) உள்ளது. நடைமேடை 1-க்கு தொடு உணர் வழிகாட்டு பாதை உள்ளது.',
  },
  {
    id: 'chennai-metro-central',
    name: 'Chennai Central Metro Interchange (CMRL)',
    tamilName: 'சென்னை சென்ட்ரல் மெட்ரோ நிலையம்',
    category: 'metro',
    lat: 13.0818,
    lng: 80.2741,
    address: 'Poonamallee High Road, Park Town, Chennai, Tamil Nadu 600003',
    accessibleFeatures: [
      '4 street-to-concourse elevators with tactile Braille buttons',
      'Wide automatic flap gates for motorized wheelchairs',
      'Continuous tactile yellow tiles from entrance to train platform doors',
      'Platform Screen Doors (PSD) preventing track falls',
      'Audio chimes in Tamil and English inside trains and stations',
    ],
    wheelchairStatus: 'Fully Step-Free',
    audioCues: 'Doors open on the left. Audio chimes precede all door movements.',
    tamilAudioTip: 'தெருவில் இருந்து தளம் வரை மின்தூக்கி (Lift) வசதி உள்ளது. தமிழ் அறிவிப்புகள் தொடர்ச்சியாக ஒலிக்கும்.',
  },
  {
    id: 'marina-beach-pathway',
    name: 'Marina Beach Accessible Ramp & Wooden Boardwalk',
    tamilName: 'மெரினா கடற்கரை மாற்றுத்திறனாளிகள் மரப்பாதை',
    category: 'beach',
    lat: 13.0500,
    lng: 80.2824,
    address: 'Opposite Vivekananda House / NKT Girls School, Kamarajar Salai, Marina Beach, Chennai',
    accessibleFeatures: [
      '380-meter permanent red-sand wooden walkway reaching directly to the sea',
      'Dedicated disabled parking bay on Kamarajar Promenade',
      'Trained GCC volunteers offering amphibious beach wheelchairs',
      'Handrails with tactile guidance indicators along the entire length',
    ],
    wheelchairStatus: 'Ramp Available',
    audioCues: 'Waves acoustic orientation. Clear pathway without sand resistance.',
    tamilAudioTip: 'கடல் அலை வரை சக்கர நாற்காலியில் செல்ல 380 மீட்டர் மரப்பாதை அமைக்கப்பட்டுள்ளது.',
  },
  {
    id: 'koyambedu-cmbt',
    name: 'Koyambedu CMBT & Metro Station',
    tamilName: 'கோயம்பேடு பேருந்து நிலையம் மற்றும் மெட்ரோ',
    category: 'transit',
    lat: 13.0700,
    lng: 80.1945,
    address: 'Jawaharlal Nehru Road, Koyambedu, Chennai, Tamil Nadu 600107',
    accessibleFeatures: [
      'Ramped overhead corridor connecting metro station directly to bus terminal',
      'Lifts located at Entrance A and Platform 2',
      'Special passenger assistance counter for persons with disabilities',
      'Step-free low-floor MTC bus boarding bays at Bay 1 & 2',
    ],
    wheelchairStatus: 'Elevators Active',
    audioCues: 'PA system announces incoming buses in Tamil with bay numbers.',
    tamilAudioTip: 'மெட்ரோவிலிருந்து பேருந்து நிலையத்திற்கு இணைக்கும் நடைமேடையில் மின்தூக்கி உள்ளது.',
  },
  {
    id: 'chennai-airport-maa',
    name: 'Chennai International Airport (MAA) Terminals',
    tamilName: 'சென்னை சர்வதேச விமான நிலையம்',
    category: 'transit',
    lat: 12.9941,
    lng: 80.1709,
    address: 'GST Road, Meenambakkam, Chennai, Tamil Nadu 600027',
    accessibleFeatures: [
      'Designated accessible drop-off lane at Departures Ramp with low curb cuts',
      'Special PRM (Persons with Reduced Mobility) check-in counters with lower desk',
      'Ambulift facility for boarding remote apron aircraft',
      'Accessible family restrooms with emergency pull cords in all gate piers',
    ],
    wheelchairStatus: 'Fully Step-Free',
    audioCues: 'Automated boarding announcements; flight information display screens with high contrast.',
    tamilAudioTip: 'விமான நிலைய புறப்பாடு வாயிலில் சக்கர நாற்காலி உதவி கவுண்டர் உள்ளது.',
  },
  {
    id: 'rgggh-hospital',
    name: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    tamilName: 'ராஜீவ் காந்தி அரசு பொது மருத்துவமனை (சென்னை)',
    category: 'hospital',
    lat: 13.0805,
    lng: 80.2778,
    address: 'EVR Periyar Salai, Park Town, Chennai, Tamil Nadu 600003',
    accessibleFeatures: [
      'Direct ramped ambulance casualty and triage bay',
      'Step-free stretcher-compliant elevators in Tower 1 & Tower 2',
      'Wheelchairs provided free of cost at the main reception entrance',
      'Help desk for Chief Minister Comprehensive Health Insurance scheme with staff guides',
    ],
    wheelchairStatus: 'Ramp Available',
    audioCues: 'Public address system for department tokens.',
    tamilAudioTip: 'அவசர சிகிச்சை பிரிவுக்கு நேரடி சாய்வுதளம் மற்றும் சக்கர நாற்காலி உதவி உண்டு.',
  },
  {
    id: 'express-avenue-mall',
    name: 'Express Avenue Mall (Royapettah)',
    tamilName: 'எக்ஸ்பிரஸ் அவென்யூ மால்கள் (ராயப்பேட்டை)',
    category: 'public',
    lat: 13.0588,
    lng: 80.2642,
    address: 'Club House Road, Express Estate, Royapettah, Chennai, Tamil Nadu 600002',
    accessibleFeatures: [
      'Basement designated disabled parking bays with wide clearance next to lifts',
      'Glass observation elevators with Braille controls and voice prompts',
      'Wide double-door accessible restrooms on every floor',
      'Zero-threshold entry from Gate 1 and Gate 2',
    ],
    wheelchairStatus: 'Fully Step-Free',
    audioCues: 'Quiet rest zones on 3rd floor away from food court echoes.',
    tamilAudioTip: 'அனைத்து தளங்களுக்கும் விசாலமான மின்தூக்கி மற்றும் சக்கர நாற்காலி கழிப்பறைகள் உள்ளன.',
  },
  {
    id: 'tnagar-pedestrian-plaza',
    name: 'T. Nagar Pedestrian Plaza (Pondy Bazaar)',
    tamilName: 'தி.நகர் நடைபாதை வளாகம் (பாண்டி பஜார்)',
    category: 'public',
    lat: 13.0405,
    lng: 80.2337,
    address: 'Pondy Bazaar, T. Nagar, Chennai, Tamil Nadu 600017',
    accessibleFeatures: [
      'Level pedestrian promenade with bollards specifically spaced 1.2m for wheelchairs',
      'Dropped curb cuts at all road crossings',
      'Tactile guiding pavers along entire shopping stretch',
      'Benches every 50 meters for resting',
    ],
    wheelchairStatus: 'Ramp Available',
    audioCues: 'Audible pelican crossing signals at Boag Road junction.',
    tamilAudioTip: 'பாண்டி பஜாரில் சக்கர நாற்காலிகள் எளிதாக செல்ல தடையற்ற சமதள நடைபாதை உள்ளது.',
  },
];
