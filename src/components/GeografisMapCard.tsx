import { useState, useMemo, useEffect } from 'react';
import { Member } from '../types';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useAdvancedMarkerRef,
  useMap
} from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Compass, 
  Search, 
  Users, 
  Globe, 
  ExternalLink,
  ChevronRight,
  Info,
  Flame,
  Layers
} from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Fast, zero-request predefined coordinate cache for Indonesian family hubs and common cities
const PREDEFINED_COORDINATES: Record<string, { lat: number, lng: number }> = {
  'solo': { lat: -7.5755, lng: 110.8243 },
  'surakarta': { lat: -7.5755, lng: 110.8243 },
  'surakarta, jawa tengah': { lat: -7.5755, lng: 110.8243 },
  'griya joyo sutiko': { lat: -7.5684, lng: 110.8351 },
  'yogyakarta': { lat: -7.7956, lng: 110.3695 },
  'jogja': { lat: -7.7956, lng: 110.3695 },
  'jogjakarta': { lat: -7.7956, lng: 110.3695 },
  'sleman': { lat: -7.7214, lng: 110.3643 },
  'bantul': { lat: -7.8878, lng: 110.3275 },
  'klaten': { lat: -7.7025, lng: 110.6033 },
  'sukoharjo': { lat: -7.6823, lng: 110.8358 },
  'boyolali': { lat: -7.5353, lng: 110.5982 },
  'karanganyar': { lat: -7.5959, lng: 110.9515 },
  'sragen': { lat: -7.4276, lng: 111.0223 },
  'wonogiri': { lat: -7.8139, lng: 110.9252 },
  'jakarta': { lat: -6.2088, lng: 106.8456 },
  'jakarta selatan': { lat: -6.2615, lng: 106.8106 },
  'jakarta timur': { lat: -6.2250, lng: 106.9004 },
  'jakarta barat': { lat: -6.1683, lng: 106.7583 },
  'jakarta utara': { lat: -6.1214, lng: 106.8926 },
  'jakarta pusat': { lat: -6.1865, lng: 106.8341 },
  'bandung': { lat: -6.9175, lng: 107.6191 },
  'semarang': { lat: -6.9667, lng: 110.4167 },
  'surabaya': { lat: -7.2575, lng: 112.7521 },
  'malang': { lat: -7.9839, lng: 112.6210 },
  'purwokerto': { lat: -7.4244, lng: 109.2300 },
  'bogor': { lat: -6.5971, lng: 106.8060 },
  'tangerang': { lat: -6.1783, lng: 106.6319 },
  'bekasi': { lat: -6.2383, lng: 106.9756 },
  'depok': { lat: -6.4025, lng: 106.7942 },
  'salatiga': { lat: -7.3306, lng: 110.5083 },
  'kudus': { lat: -6.8078, lng: 110.8422 },
  'magelang': { lat: -7.4797, lng: 110.2182 },
  'cilacap': { lat: -7.7167, lng: 109.0167 },
  'cirebon': { lat: -6.7063, lng: 108.5570 },
  'palembang': { lat: -2.9761, lng: 104.7754 },
  'medan': { lat: 3.5952, lng: 98.6722 },
  'makassar': { lat: -5.1477, lng: 119.4327 },
  'denpasar': { lat: -8.6705, lng: 115.2126 },
  'bali': { lat: -8.4095, lng: 115.1889 },
};

interface GeografisMapCardProps {
  members: Member[];
  onSelectMember: (id: string) => void;
  isDarkMode: boolean;
}

export default function GeografisMapCard({ members, onSelectMember, isDarkMode }: GeografisMapCardProps) {
  const [geocodedCache, setGeocodedCache] = useState<Record<string, { lat: number, lng: number }>>({});
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState<string>('');

  const [mapMode, setMapMode] = useState<'pinned' | 'heatmap'>('pinned');

  // Normalize domisili helper
  const cleanDomisili = (val?: string): string => {
    if (!val) return '';
    return val.trim().replace(/\s+/g, ' ');
  };

  // Group members by unique cleaned domisili name
  const cityDistribution = useMemo(() => {
    const list: Record<string, { name: string, members: Member[], key: string }> = {};
    
    members.forEach(m => {
      const cityRaw = m.domisili?.trim();
      if (!cityRaw) return;
      const key = cityRaw.toLowerCase();
      
      if (!list[key]) {
        list[key] = {
          name: cityRaw,
          members: [],
          key: key
        };
      }
      list[key].members.push(m);
    });

    return Object.values(list).sort((a,b) => b.members.length - a.members.length);
  }, [members]);

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cityDistribution;
    const q = citySearch.toLowerCase();
    return cityDistribution.filter(c => c.name.toLowerCase().includes(q));
  }, [cityDistribution, citySearch]);

  // Hook up standard Google geocoder for any custom user input coordinates that are not predefined
  useEffect(() => {
    if (!hasValidKey || typeof window === 'undefined' || !(window as any).google || !(window as any).google.maps) return;
    
    const geocoder = new (window as any).google.maps.Geocoder();
    const uncodedCities = cityDistribution.filter(c => {
      return !PREDEFINED_COORDINATES[c.key] && !geocodedCache[c.key];
    });

    if (uncodedCities.length === 0) return;

    uncodedCities.forEach(city => {
      geocoder.geocode({ address: city.name }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          setGeocodedCache(prev => ({
            ...prev,
            [city.key]: { lat, lng }
          }));
        }
      });
    });
  }, [cityDistribution, geocodedCache]);

  // Merge predefined and geocoded coordinates to construct marker map distribution
  const mapData = useMemo(() => {
    return cityDistribution.map(city => {
      const coord = PREDEFINED_COORDINATES[city.key] || geocodedCache[city.key] || null;
      return {
        ...city,
        coord
      };
    }).filter(c => c.coord !== null) as { name: string, members: Member[], key: string, coord: { lat: number, lng: number } }[];
  }, [cityDistribution, geocodedCache]);

  // Default coordinate center (Solo - Central hubs of the family)
  const defaultCenter = { lat: -7.5755, lng: 110.8243 };

  if (!hasValidKey) {
    return (
      <div id="google-maps-setup-card" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs font-sans">
        <div className="flex flex-col lg:flex-row gap-6 items-stretch justify-between max-w-7xl mx-auto">
          
          {/* Left Column: API Setup Instructions */}
          <div className="space-y-3 text-left flex-1 min-w-0">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-tight flex items-center gap-1.5">
              <span>🗺️</span> Peta Sebaran Tempat Tinggal Anggota Keluarga
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl font-medium">
              Integrasikan Google Maps Platform dengan aman untuk memetakan alamat atau domisili seluruh keluarga Anda secara visual. Cukup sediakan kunci API di AI Studio Secrets untuk mengaktifkan pemetaan dinamis ini.
            </p>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-2 mt-2">
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest leading-none">Petunjuk Konfigurasi Kunci API:</p>
              <ol className="text-[11px] text-slate-500 dark:text-slate-400 list-decimal list-inside space-y-1.5 mt-1 font-semibold leading-relaxed">
                <li>Dapatkan Google Maps API Key secara gratis dari <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-extrabold underline inline-all">Google Cloud Console</a>.</li>
                <li>Buka panel <strong>Settings</strong> (⚙️ ikon roda gigi di sudut kanan atas menu AI Studio).</li>
                <li>Klik tombol <strong>Secrets</strong>, ketik nama variabel <code>GOOGLE_MAPS_PLATFORM_KEY</code>, lalu simpan kunci Anda sebagai nilainya.</li>
                <li>Portal keluarga Anda akan langsung membangun ulang secara otomatis dan mengaktifkan peta interaktif ini secara real-time!</li>
              </ol>
            </div>
          </div>

          {/* Right Column: Custom Offline Simulated Heatmap Preview */}
          <div className="w-full lg:w-[420px] bg-slate-50 dark:bg-slate-950/60 p-5 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-4 font-sans shrink-0">
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Flame size={13} className="text-orange-500 animate-pulse" />
                <span>Simulasi Peta Kepadatan Keluarga</span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Distribusi konsentrasi domisili silsilah keluarga besar (Versi Offline)</p>
            </div>

            {/* Simulated Map Visual Card */}
            <div className="relative h-44 bg-blue-50/25 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800/80 rounded-xl overflow-hidden flex items-center justify-center font-sans">
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40 animate-pulse duration-3000" />
              
              {/* Graphic Connector line for Java Island mockup */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                <path d="M 50,110 Q 130,70 210,110 T 370,110" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
              </svg>

              {/* Glowing gradient circles (mocking the Heatmap density hubs) */}
              
              {/* Hub 1: Jakarta (Moderate) */}
              <div className="absolute top-[85px] left-[45px] flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-cyan-400/20 flex items-center justify-center animate-pulse duration-2000">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/80 flex items-center justify-center border border-white/50 shadow-md">
                    <span className="text-[7px] text-white font-black">2</span>
                  </div>
                </div>
                <span className="text-[8px] font-extrabold text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono">Jakarta</span>
              </div>

              {/* Hub 2: Bandung (Low) */}
              <div className="absolute top-[110px] left-[105px] flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center animate-pulse duration-700">
                  <div className="w-3 h-3 rounded-full bg-blue-500/80 flex items-center justify-center border border-white/50 shadow-md">
                    <span className="text-[6px] text-white font-black">1</span>
                  </div>
                </div>
                <span className="text-[8px] font-extrabold text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono">Bandung</span>
              </div>

              {/* Hub 3: Semarang (Moderate) */}
              <div className="absolute top-[65px] left-[200px] flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center animate-pulse duration-1000">
                  <div className="w-5 h-5 rounded-full bg-amber-500/80 flex items-center justify-center border border-white/50 shadow-md">
                    <span className="text-[8px] text-white font-black">4</span>
                  </div>
                </div>
                <span className="text-[8px] font-extrabold text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono">Semarang</span>
              </div>

              {/* Hub 4: Solo (High - Central Hub) */}
              <div className="absolute top-[105px] left-[270px] flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-400/25 flex items-center justify-center animate-ping duration-3000">
                  <div className="w-16 h-16 rounded-full bg-red-400/15 flex items-center justify-center animate-pulse duration-1000">
                    <div className="w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center border-2 border-white/80 shadow-lg">
                      <span className="text-[9px] text-white font-black">5</span>
                    </div>
                  </div>
                </div>
                <span className="text-[8px] font-black text-red-600 dark:text-red-400 mt-1 uppercase tracking-wider font-mono">Solo (Hub)</span>
              </div>

            </div>

            {/* Color Gradation Legend for Offline Mock */}
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-md bg-gradient-to-r from-blue-400 via-yellow-400 to-red-500" />
              <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-500 font-mono font-bold">
                <span>Rendah (1 Jiwa)</span>
                <span>Sedang (2-3 Jiwa)</span>
                <span>Hub Utama (4-5+ Jiwa)</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-normal bg-blue-50/20 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-100/10 dark:border-slate-800/60">
              💡 <strong>Statistik Offline:</strong> Kota <strong>Solo</strong> memiliki konsentrasi silsilah terpadat saat ini dengan sumbangan terbanyak anggota keluarga aktif.
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly" libraries={['visualization']}>
      <div id="google-maps-geo-card" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden font-sans flex flex-col">
        
        {/* Header Section */}
        <div className="p-5 border-b border-slate-50 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight uppercase flex items-center gap-1.5">
              <Compass size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Peta Sebaran Geografis Keluarga</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Sebaran lokasi tempat tinggal tercatat dari profil seluruh anggota</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Selector Segmented Controller */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMapMode('pinned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  mapMode === 'pinned'
                    ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                📍 Lokasi (Pins)
              </button>
              <button
                type="button"
                onClick={() => setMapMode('heatmap')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  mapMode === 'heatmap'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                <Flame size={12} className="animate-pulse" />
                Mode Heatmap
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1.5 border border-emerald-100/50 dark:border-emerald-900/10 rounded-lg shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>TERKONEKSI GOOGLE MAPS SDK</span>
            </div>
          </div>
        </div>

        {/* Dashboard Map Content Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 h-[420px]">
          
          {/* Side panel List of Cities */}
          <div className="p-4 border-r border-slate-100 dark:border-slate-800/80 flex flex-col h-full bg-slate-50/30 dark:bg-slate-950/15">
            {/* Search filter for cities */}
            <div className="relative mb-3.5">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Cari Kota / Domisili..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* List entries scroll */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredCities.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs italic">
                  Kota tidak ditemukan
                </div>
              ) : (
                filteredCities.map(city => {
                  const isSelected = selectedCity === city.key;
                  return (
                    <button
                      key={city.key}
                      onClick={() => setSelectedCity(city.key)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 dark:bg-slate-950 text-slate-500'
                        }`}>
                          <MapPin size={13} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold truncate leading-tight">{city.name}</p>
                          <p className={`text-[10px] truncate mt-0.5 leading-none ${
                            isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {city.members.map(m => m.nama.split(' ')[0]).join(', ')}
                          </p>
                        </div>
                      </div>

                      <div className={`text-[10px] font-bold font-mono py-0.5 px-2 rounded-full border shrink-0 ${
                        isSelected 
                          ? 'bg-white/15 text-white border-transparent' 
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800'
                      }`}>
                        {city.members.length} Jiwa
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Map Column */}
          <div className="lg:col-span-2 h-full relative" id="family-tree-map-canvas-parent">
            <InteractiveMap 
              mapData={mapData}
              selectedCity={selectedCity}
              onSelectMember={onSelectMember}
              isDarkMode={isDarkMode}
              defaultCenter={defaultCenter}
              mapMode={mapMode}
            />

            {/* Float Heatmap Legend overlay */}
            {mapMode === 'heatmap' && (
              <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-lg text-[10px] space-y-1.5 max-w-[180px] z-10 transition-all font-sans">
                <p className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest text-[8px] font-mono leading-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Kepadatan Penduduk
                </p>
                <div className="h-2 w-full rounded-md bg-gradient-to-r from-cyan-400 via-blue-500 via-yellow-400 to-red-500" />
                <div className="flex justify-between text-[8px] text-slate-500 dark:text-slate-400 font-bold font-mono">
                  <span>Rendah</span>
                  <span>Sedang</span>
                  <span>Hub / Padat</span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </APIProvider>
  );
}

// Inner helper component that uses the vis.gl hooks safely inside Map provider
interface InteractiveMapProps {
  mapData: { name: string, members: Member[], key: string, coord: { lat: number, lng: number } }[];
  selectedCity: string | null;
  onSelectMember: (id: string) => void;
  isDarkMode: boolean;
  defaultCenter: { lat: number, lng: number };
  mapMode: 'pinned' | 'heatmap';
}

function InteractiveMap({ mapData, selectedCity, onSelectMember, isDarkMode, defaultCenter, mapMode }: InteractiveMapProps) {
  const map = useMap();
  const [activeMarkerData, setActiveMarkerData] = useState<typeof mapData[0] | null>(null);
  const [markerRef, marker] = useAdvancedMarkerRef();

  // Handle auto-focus and map panning when a city is selected in the sidebar
  useEffect(() => {
    if (!map || !selectedCity) return;
    const found = mapData.find(m => m.key === selectedCity);
    if (found?.coord) {
      map.panTo(found.coord);
      map.setZoom(11);
      setActiveMarkerData(found);
    }
  }, [map, selectedCity, mapData]);

  // Safe styling options for Dark or Standard maps
  const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#161b26" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#161b26" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#74808c" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#a5b4fc" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#94a3b8" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#111827" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#1f2937" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#111827" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#4b5563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0d111d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#4f5b66" }],
    },
  ];

  return (
    <div className="w-full h-full relative">
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={7}
        mapId={isDarkMode ? "DARK_GENEALOGY_MAP" : "LIGHT_GENEALOGY_MAP"}
        options={{
          styles: isDarkMode ? darkMapStyle : undefined,
          disableDefaultUI: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
          gestureHandling: 'cooperative'
        }}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Only show pins markers if we are in PINNED mode */}
        {mapMode === 'pinned' && mapData.map(city => {
          const isSelected = selectedCity === city.key;
          return (
            <AdvancedMarker 
              key={city.key} 
              position={city.coord}
              ref={city.key === activeMarkerData?.key ? markerRef : undefined}
              onClick={() => {
                setActiveMarkerData(city);
              }}
            >
              <div className="transform hover:scale-110 active:scale-95 transition-transform cursor-pointer">
                <Pin 
                  background={isSelected ? "#2563eb" : "#10b981"} 
                  borderColor={isSelected ? "#1e40af" : "#047857"}
                  glyphColor="#fff"
                  glyphText={String(city.members.length)}
                />
              </div>
            </AdvancedMarker>
          );
        })}

        {/* Render dynamic genuine Google Maps Heatmap Layer if set to heatmap mode */}
        {mapMode === 'heatmap' && (
          <HeatmapLayerHelper mapData={mapData} />
        )}

        {/* Dynamic Detail InfoWindow when a marker is clicked (only in pinned mode) */}
        {mapMode === 'pinned' && activeMarkerData && (
          <InfoWindow
            anchor={marker}
            onCloseClick={() => {
              setActiveMarkerData(null);
            }}
          >
            <div className="p-1 max-w-[260px] font-sans text-slate-800">
              <div className="border-b border-slate-100 pb-1.5 mb-2 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1 leading-none uppercase">
                    <MapPin size={11} className="text-emerald-500" />
                    <span>{activeMarkerData.name}</span>
                  </h4>
                  <p className="text-[9px] font-mono font-bold text-slate-400 leading-none mt-1">
                    {activeMarkerData.members.length} ANGGOTA KELUARGA
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {activeMarkerData.members.map(m => (
                  <div 
                    key={m.id}
                    onClick={() => onSelectMember(m.id)}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg border border-slate-50 hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-all"
                    title={`Klik untuk melihat profil ${m.nama}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img 
                        src={m.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                        alt={m.nama} 
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 bg-slate-50 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold text-slate-800 truncate leading-tight">{m.nama}</p>
                        <p className="text-[8px] font-mono font-bold text-slate-400 mt-0.5 uppercase">
                          GEN {m.generasi || 1} • {m.pekerjaan || 'Ibu Rumah Tangga'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={10} className="text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>

              <div className="text-[8px] italic text-slate-400 mt-2 text-center border-t border-slate-50 pt-1 leading-relaxed">
                * Klik anggota untuk melihat silsilah silsilah lengkap.
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}

// Helper component that binds a native google.maps.visualization.HeatmapLayer
function HeatmapLayerHelper({ mapData }: { mapData: { name: string, members: Member[], key: string, coord: { lat: number, lng: number } }[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const google = (window as any).google;
    if (!google || !google.maps || !google.maps.visualization) {
      console.warn("Visualisation library not loaded. Check script parameters.");
      return;
    }

    // Convert coordinates to standard Google LatLng points with density multiplier weight
    const points = mapData.map(city => {
      return {
        location: new google.maps.LatLng(city.coord.lat, city.coord.lng),
        weight: city.members.length * 2.5 // scale weight slightly for better glow strength
      };
    });

    const heatmap = new google.maps.visualization.HeatmapLayer({
      data: points,
      map: map,
      radius: 40, // Perfect visual blur radius over cities
      opacity: 0.85
    });

    return () => {
      heatmap.setMap(null);
    };
  }, [map, mapData]);

  return null;
}
