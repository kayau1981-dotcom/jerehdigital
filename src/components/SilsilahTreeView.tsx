import { useState, useMemo, useRef } from 'react';
import { Member } from '../types';
import { buildTreeLayout, TreeNode } from '../utils/treeLayout';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Map, 
  Grid,
  TrendingDown, 
  Heart,
  Smartphone,
  Info,
  Calendar,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  X,
  Target
} from 'lucide-react';

interface SilsilahTreeViewProps {
  members: Member[];
  onSelectMemberId?: string;
  onClearSelectedMember?: () => void;
  onAddLog: (tipe: 'tambah' | 'edit' | 'hapus' | 'sinkronisasi', deskripsi: string) => void;
}

export default function SilsilahTreeView({ 
  members,
  onSelectMemberId,
  onClearSelectedMember,
  onAddLog
}: SilsilahTreeViewProps) {
  
  const [zoom, setZoom] = useState<number>(0.85);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [focusRootId, setFocusRootId] = useState<string | null>(null);
  const [maxDepth, setMaxDepth] = useState<number>(3);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Auto-expand selected ID from parent if present
  useMemo(() => {
    if (onSelectMemberId) {
      const found = members.find(m => m.id === onSelectMemberId);
      if (found) {
        setSelectedMember(found);
      }
    }
  }, [onSelectMemberId, members]);

  // 2. Filter members based on Focus Root (filtering descendants only if activated)
  const filteredMembers = useMemo(() => {
    if (!focusRootId) return members;

    // BFS to find all descendants
    const descendants = new Set<string>();
    const queue = [focusRootId];
    
    // Also include spouse of root and parents
    const rootMem = members.find(m => m.id === focusRootId);
    if (rootMem) {
      descendants.add(focusRootId);
      if (rootMem.pasanganId) descendants.add(rootMem.pasanganId);
    }

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      members.forEach(m => {
        if (m.ayahId === currentId || m.ibuId === currentId) {
          if (!descendants.has(m.id)) {
            descendants.add(m.id);
            queue.push(m.id);
            if (m.pasanganId) descendants.add(m.pasanganId);
          }
        }
      });
    }

    const filtered = members.filter(m => descendants.has(m.id));
    return filtered.length > 0 ? filtered : members;
  }, [focusRootId, members]);

  // 3. Layout nodes and links calculation
  const { nodes, links, boundingBox } = useMemo(() => {
    const layout = buildTreeLayout(filteredMembers, viewMode);
    
    // Calculate SVG width/height limits
    if (layout.nodes.length === 0) {
      return { 
        nodes: [], 
        links: [], 
        boundingBox: { minX: -200, minY: -50, maxX: 200, maxY: 400, width: 400, height: 450 } 
      };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    layout.nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x);
      maxY = Math.max(maxY, n.y);
    });

    // Add buffers
    minX -= 250;
    minY -= 100;
    maxX += 250;
    maxY += 180;

    return {
      nodes: layout.nodes,
      links: layout.links,
      boundingBox: {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY
      }
    };
  }, [filteredMembers, viewMode]);

  // 4. Node click handler
  const handleNodeClick = (node: TreeNode) => {
    setSelectedMember(node.member);
  };

  // Curving connectors (high quality bezier)
  const getCurvePath = (fromX: number, fromY: number, toX: number, toY: number, type: 'parent-child' | 'marriage') => {
    if (type === 'marriage') {
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    }

    // parent-child links curves
    if (viewMode === 'vertical') {
      const midY = (fromY + toY) / 2;
      return `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY + 15}, ${toX} ${toY}`;
    } else {
      const midX = (fromX + toX) / 2;
      return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX + 15} ${toY}, ${toX} ${toY}`;
    }
  };

  // Node background highlighting
  const isHighlighted = (m: Member) => {
    if (!searchQuery) return false;
    return m.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (m.pekerjaan && m.pekerjaan.toLowerCase().includes(searchQuery.toLowerCase())) ||
           (m.domisili && m.domisili.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  // Close member detail summary
  const closeDetails = () => {
    setSelectedMember(null);
    if (onClearSelectedMember) onClearSelectedMember();
  };

  // Recenter / Reset ZOOM
  const resetView = () => {
    setZoom(0.85);
    setFocusRootId(null);
    setSearchQuery('');
  };

  // Get lifespan
  const getLifespan = (m: Member) => {
    if (!m.tanggalLahir) return '';
    const birthYear = m.tanggalLahir.split('-')[0];
    const deathYear = m.statusHidup === 'Wafat' && m.tanggalWafat ? m.tanggalWafat.split('-')[0] : 'Sekarang';
    return `(${birthYear} - ${deathYear})`;
  };

  // Extended Relationship lists helper for side details panel
  const detailsRelations = useMemo(() => {
    if (!selectedMember) return null;

    const currentId = selectedMember.id;
    const spouse = selectedMember.pasanganId ? members.find(m => m.id === selectedMember.pasanganId) : null;
    const father = selectedMember.ayahId ? members.find(m => m.id === selectedMember.ayahId) : null;
    const mother = selectedMember.ibuId ? members.find(m => m.id === selectedMember.ibuId) : null;

    // Children
    const children = members.filter(m => m.ayahId === currentId || m.ibuId === currentId);

    // Siblings
    const siblings = members.filter(m => {
      if (m.id === currentId) return false;
      const sharesFather = selectedMember.ayahId && m.ayahId === selectedMember.ayahId;
      const sharesMother = selectedMember.ibuId && m.ibuId === selectedMember.ibuId;
      return sharesFather || sharesMother;
    });

    return { spouse, father, mother, children, siblings };
  }, [selectedMember, members]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)] overflow-hidden gap-4">
      
      {/* Search and control sidebar (Desktop left, Mobile top) */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-100 shadow-xs relative">
        
        {/* Tree Control Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 rounded-t-2xl z-10">
          
          {/* Query Filter Search */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Cari nama, kota, profesi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Quick Settings controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* View direction switch */}
            <div className="flex items-center border border-slate-200 bg-white rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('vertical')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 leading-none ${
                  viewMode === 'vertical' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                title="Silsilah Vertikal (Atas ke Bawah)"
              >
                <Grid size={13} />
                <span className="hidden sm:inline">Vertikal</span>
              </button>
              <button
                onClick={() => setViewMode('horizontal')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 leading-none ${
                  viewMode === 'horizontal' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                title="Silsilah Horizontal (Kiri ke Kanan)"
              >
                <Map size={13} />
                <span className="hidden sm:inline">Horizontal</span>
              </button>
            </div>

            {/* Pivot focus indicator */}
            {focusRootId && (
              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1.5 rounded-lg text-[10px] font-bold">
                <Target size={12} className="text-amber-500" />
                <span>DESCENDANT FOCUS ACTIVE</span>
                <button 
                  onClick={() => setFocusRootId(null)}
                  className="ml-1 hover:text-amber-900 font-bold"
                >
                  [X]
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border border-slate-200 bg-white rounded-lg p-0.5">
              <button 
                onClick={() => setZoom(prev => Math.max(0.4, prev - 0.15))}
                className="p-1 px-1.5 text-slate-600 hover:bg-slate-50 rounded"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-500 w-12 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(prev => Math.min(2.0, prev + 0.15))}
                className="p-1 px-1.5 text-slate-600 hover:bg-slate-50 rounded"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button 
                onClick={resetView}
                className="p-1 text-slate-500 hover:bg-slate-50 rounded"
                title="Reset View"
              >
                <RotateCcw size={13} />
              </button>
            </div>

          </div>

        </div>

        {/* Informative instructions overlay on mobile */}
        <div className="absolute top-16 left-4 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] p-2 rounded-lg pointer-events-none flex items-center gap-1.5 shadow-md z-15 lg:hidden">
          <Smartphone size={12} className="text-blue-400" />
          <span>Seret layar untuk menggeser silsilah</span>
        </div>

        {/* Tree Render Canvas (Scrollable viewport) */}
        <div 
          ref={containerRef}
          className="flex-1 w-full overflow-auto bg-slate-50/70 p-6 select-none relative cursor-grab active:cursor-grabbing"
        >
          {nodes.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
              Tidak ada data silsilah untuk ditampilkan.
            </div>
          ) : (
            <div 
              style={{
                width: boundingBox.width,
                height: boundingBox.height,
                minWidth: '100%',
                minHeight: '100%',
                position: 'relative'
              }}
            >
              <svg
                width={boundingBox.width}
                height={boundingBox.height}
                viewBox={`${boundingBox.minX} ${boundingBox.minY} ${boundingBox.width} ${boundingBox.height}`}
                className="absolute inset-0 transition-transform origin-center"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: '50% 50%'
                }}
              >
                {/* SVG Definitions for arrows and markers */}
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                  </marker>
                </defs>

                {/* Draw Bridges & Connectors first */}
                <g id="connectors">
                  {links.map((link, idx) => {
                    const isSpouseMarriage = link.type === 'marriage';
                    return (
                      <path
                        key={`link-${idx}`}
                        d={getCurvePath(link.fromX, link.fromY, link.toX, link.toY, link.type)}
                        fill="none"
                        stroke={isSpouseMarriage ? '#fb7185' : '#cbd5e1'}
                        strokeWidth={isSpouseMarriage ? 2 : 2.5}
                        strokeDasharray={isSpouseMarriage ? '5,5' : 'none'}
                        markerEnd={!isSpouseMarriage ? 'url(#arrow)' : undefined}
                      />
                    );
                  })}
                </g>

                {/* Draw Marriage Rings symbols in the exact marriage bridge centers */}
                <g id="marriage-elements">
                  {links.filter(l => l.type === 'marriage').map((link, idx) => {
                    const midX = (link.fromX + link.toX) / 2;
                    const midY = (link.fromY + link.toY) / 2;
                    return (
                      <g key={`marriage-badge-${idx}`} transform={`translate(${midX}, ${midY})`}>
                        <circle r="7" fill="#ffe4e6" stroke="#fb7185" strokeWidth="1.5" />
                        <path 
                          d="M -3 0 K M 0 0" 
                          stroke="#fb7185" 
                          strokeWidth="1.5" 
                          className="fill-none" 
                        />
                        <Heart size={8} className="text-rose-500 -translate-x-1 -translate-y-1 fill-rose-500" />
                      </g>
                    );
                  })}
                </g>

                {/* Draw Node Families */}
                <g id="family-nodes">
                  {nodes.map((node) => {
                    const m = node.member;
                    const isTargeted = selectedMember?.id === m.id;
                    const isMatch = isHighlighted(m);
                    
                    // Style attributes
                    const cardWidth = node.width;
                    const cardHeight = node.height;
                    const xOffset = node.x - cardWidth / 2;
                    const yOffset = node.y - cardHeight / 2;

                    const isMale = m.gender === 'L';
                    const hoverBorderColor = isMale ? 'rgba(56, 189, 248, 0.6)' : 'rgba(244, 63, 94, 0.6)';
                    const genderColorHex = isMale ? '#3b82f6' : '#ec4899';

                    return (
                      <g 
                        key={`node-${m.id}`}
                        transform={`translate(${xOffset}, ${yOffset})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNodeClick(node);
                        }}
                        className="cursor-pointer"
                      >
                        {/* Shadow Effect */}
                        <rect
                          width={cardWidth}
                          height={cardHeight}
                          rx="12"
                          ry="12"
                          fill="rgba(15, 23, 42, 0.04)"
                          transform="translate(0, 3)"
                        />

                        {/* Node Card Container */}
                        <rect
                          width={cardWidth}
                          height={cardHeight}
                          rx="12"
                          ry="12"
                          fill="#ffffff"
                          stroke={isTargeted ? genderColorHex : isMatch ? '#f59e0b' : '#e2e8f0'}
                          strokeWidth={isTargeted ? 3 : isMatch ? 3.5 : 1}
                          className="transition-all"
                        />

                        {/* Top Gender Stripe */}
                        <path 
                          d={`M 0 6 A 6 6 0 0 1 6 0 L ${cardWidth - 6} 0 A 6 6 0 0 1 ${cardWidth} 6 L ${cardWidth} 7 L 0 7 Z`} 
                          fill={genderColorHex} 
                        />

                        {/* Member Avatar */}
                        <clipPath id={`clip-${m.id}`}>
                          <rect x="14" y="16" width="48" height="48" rx="24" ry="24" />
                        </clipPath>
                        <image
                          href={m.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          x="14"
                          y="16"
                          width="48"
                          height="48"
                          clipPath={`url(#clip-${m.id})`}
                          preserveAspectRatio="xMidYMid slice"
                          referrerPolicy="no-referrer"
                        />
                        {/* Avatar outline border */}
                        <circle
                          cx="38"
                          cy="40"
                          r="24"
                          fill="none"
                          stroke={m.statusHidup === 'Wafat' ? '#94a3b8' : genderColorHex}
                          strokeWidth="1.5"
                        />

                        {/* Member Details */}
                        {/* Name */}
                        <text
                          x="74"
                          y="32"
                          fill="#1e293b"
                          fontSize="11"
                          fontWeight="700"
                          fontFamily="Inter, sans-serif"
                        >
                          {m.nama.length > 17 ? m.nama.substr(0, 15) + '..' : m.nama}
                        </text>

                        {/* Lifespan years / Status */}
                        <text
                          x="74"
                          y="46"
                          fill="#64748b"
                          fontSize="9"
                          fontWeight="500"
                          fontFamily="monospace"
                        >
                          {getLifespan(m)}
                        </text>

                        {/* City / Domisili */}
                        <text
                          x="74"
                          y="58"
                          fill="#94a3b8"
                          fontSize="9.5"
                          fontFamily="sans-serif"
                          fontWeight="500"
                        >
                          📍 {m.domisili || 'Solo'}
                        </text>

                        {/* Gen Badge */}
                        <rect
                          x={cardWidth - 36}
                          y={cardHeight - 20}
                          width="26"
                          height="12"
                          rx="3"
                          fill="#f1f5f9"
                        />
                        <text
                          x={cardWidth - 23}
                          y={cardHeight - 11}
                          fill="#64748b"
                          fontSize="8"
                          fontWeight="700"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          G{m.generasi || 1}
                        </text>

                        {/* Wafat indicator overlay sign */}
                        {m.statusHidup === 'Wafat' && (
                          <g transform={`translate(${14 + 36}, ${16})`}>
                            <circle r="6" fill="#64748b" />
                            <text y="2" fill="#ffffff" fontSize="7.5" fontWeight="bold" textAnchor="middle">†</text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          )}
        </div>

      </div>

      {/* Slide-out details drawer (Desktop right panel, Mobile overlay) */}
      {selectedMember && detailsRelations && (
        <div className="w-full lg:w-[350px] shrink-0 bg-white border border-slate-100 rounded-2xl shadow-lg flex flex-col justify-between max-h-full overflow-y-auto">
          <div>
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Info size={12} className="text-blue-500" />
                Informasi Detail
              </span>
              <button 
                onClick={closeDetails}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Profile Hero Card */}
            <div className="p-5 text-center border-b border-slate-50 relative">
              {/* Highlight background banner */}
              <div className={`absolute top-0 inset-x-0 h-16 ${
                selectedMember.gender === 'L' ? 'bg-sky-50' : 'bg-pink-50'
              }`} />
              
              <div className="relative mt-2">
                <img 
                  src={selectedMember.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                  alt={selectedMember.nama} 
                  referrerPolicy="no-referrer"
                  className={`w-20 h-20 rounded-full object-cover mx-auto border-4 ${
                    selectedMember.statusHidup === 'Wafat' ? 'border-slate-300 filter grayscale' : 'border-white'
                  } shadow-md`}
                />
                
                {selectedMember.statusHidup === 'Wafat' && (
                  <span className="absolute bottom-0 right-1/2 translate-x-10 bg-slate-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-mono">
                    WAFAT (Alm)
                  </span>
                )}
              </div>

              <h3 className="font-bold text-slate-800 text-base mt-3 tracking-tight">{selectedMember.nama}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Generasi {selectedMember.generasi} • {selectedMember.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
              
              <div className="flex gap-2 justify-center mt-3">
                <button
                  onClick={() => {
                    setFocusRootId(selectedMember.id);
                    onAddLog('sinkronisasi', `Mengubah fokus pohon silsilah ke keturunan: ${selectedMember.nama}`);
                  }}
                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md text-[10px] font-bold flex items-center gap-1 tracking-wide border border-blue-100 transition-all"
                  title="Tampilkan hanya keturunan langsung dari anggota ini"
                >
                  <Target size={11} />
                  Keturunan
                </button>
                {focusRootId && (
                  <button
                    onClick={() => setFocusRootId(null)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold"
                  >
                    Atur Ulang
                  </button>
                )}
              </div>
            </div>

            {/* Profile details parameters */}
            <div className="p-4 space-y-4 text-xs">
              
              {/* Lifespan & Place info */}
              <div className="space-y-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  <span>
                    <strong>TTL:</strong> {selectedMember.tempatLahir || 'Solo'}, {selectedMember.tanggalLahir || '-'}
                  </span>
                </div>
                {selectedMember.statusHidup === 'Wafat' && selectedMember.tanggalWafat && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileCheck size={14} className="text-slate-400" />
                    <span>
                      <strong>Wafat:</strong> {selectedMember.tanggalWafat}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <Briefcase size={14} className="text-slate-400" />
                  <span>
                    <strong>Profesi:</strong> {selectedMember.pekerjaan || 'Ibu Rumah Tangga'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={14} className="text-slate-400" />
                  <span>
                    <strong>Domisili:</strong> {selectedMember.domisili || 'Solo, Jawa Tengah'}
                  </span>
                </div>
              </div>

              {/* Contact info if living */}
              {selectedMember.statusHidup === 'Hidup' && (selectedMember.telepon || selectedMember.email) && (
                <div className="space-y-2 pb-3 border-b border-slate-100 bg-slate-50/50 p-2 rounded-lg">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Kontak Person</span>
                  {selectedMember.telepon && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={13} className="text-slate-400" />
                      <a href={`tel:${selectedMember.telepon}`} className="hover:underline hover:text-blue-600">{selectedMember.telepon}</a>
                    </div>
                  )}
                  {selectedMember.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={13} className="text-slate-400" />
                      <a href={`mailto:${selectedMember.email}`} className="hover:underline hover:text-blue-600 truncate">{selectedMember.email}</a>
                    </div>
                  )}
                </div>
              )}

              {/* Connections/Relations mapping tree list */}
              <div className="space-y-3">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Hubungan Keluarga</span>
                
                {/* Parents */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Ayah Kandung</span>
                    {detailsRelations.father ? (
                      <button 
                        onClick={() => setSelectedMember(detailsRelations.father)}
                        className="font-semibold text-blue-600 hover:underline text-left mt-0.5 line-clamp-1"
                      >
                        ♂️ {detailsRelations.father.nama}
                      </button>
                    ) : (
                      <span className="text-slate-400 italic mt-0.5 block">Tidak Terdata</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-mono">Ibu Kandung</span>
                    {detailsRelations.mother ? (
                      <button 
                        onClick={() => setSelectedMember(detailsRelations.mother)}
                        className="font-semibold text-pink-600 hover:underline text-left mt-0.5 line-clamp-1"
                      >
                        ♀️ {detailsRelations.mother.nama}
                      </button>
                    ) : (
                      <span className="text-slate-400 italic mt-0.5 block">Tidak Terdata</span>
                    )}
                  </div>
                </div>

                {/* Spouse */}
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Pasangan (Suami/Istri)</span>
                  {detailsRelations.spouse ? (
                    <button 
                      onClick={() => setSelectedMember(detailsRelations.spouse)}
                      className="font-bold text-slate-700 hover:underline text-left mt-0.5 flex items-center gap-1"
                    >
                      💍 {detailsRelations.spouse.nama}
                    </button>
                  ) : (
                    <span className="text-slate-400 italic mt-0.5 block">Belom Terdata / Lajang</span>
                  )}
                </div>

                {/* Children */}
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Keturunan / Anak ({detailsRelations.children.length})</span>
                  {detailsRelations.children.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detailsRelations.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => setSelectedMember(child)}
                          className={`px-2 py-1 rounded text-[10px] font-medium leading-none transition-all ${
                            child.gender === 'L' ? 'bg-sky-50 hover:bg-sky-100 text-sky-700' : 'bg-pink-50 hover:bg-pink-100 text-pink-700'
                          }`}
                        >
                          {child.nama}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic mt-0.5 block">Tidak Ada / Belum Terdata</span>
                  )}
                </div>

                {/* Siblings */}
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Saudara Kandung ({detailsRelations.siblings.length})</span>
                  {detailsRelations.siblings.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detailsRelations.siblings.map(sib => (
                        <button
                          key={sib.id}
                          onClick={() => setSelectedMember(sib)}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded text-[10px] font-medium text-slate-600 transition-all"
                        >
                          {sib.nama}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic mt-0.5 block">Anak Tunggal / Tidak Ada</span>
                  )}
                </div>

              </div>

              {/* Bio/Catatan Catatan */}
              {selectedMember.catatan && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Catatan Tambahan</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg italic leading-relaxed text-[11px] break-words">
                    "{selectedMember.catatan}"
                  </p>
                </div>
              )}

            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
            <button
              onClick={() => {
                // We'll dispatch a focused view trigger to search input
                setSearchQuery(selectedMember.nama);
                onAddLog('edit', `Mencari koneksi visual untuk ${selectedMember.nama}`);
              }}
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1"
            >
              <Search size={12} />
              Temukan di Pohon
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
