import React, { useState, useEffect } from 'react';
import { WaterBody, CitizenComplaint, WaterBodyStatusColor, UserRoleType } from '../types/nirikshan';
import { 
  MapPin, 
  Layers, 
  Droplet, 
  AlertTriangle, 
  Activity, 
  Compass, 
  Filter, 
  Search,
  Eye,
  Info,
  Maximize2
} from 'lucide-react';

interface InteractiveAndhraMapProps {
  waterBodies: WaterBody[];
  complaints: CitizenComplaint[];
  currentRole: UserRoleType;
  districtFilter?: 'all' | 'Vizianagaram' | 'Parvathipuram Manyam';
  onSelectWaterBody?: (wb: WaterBody) => void;
  onSelectComplaint?: (c: CitizenComplaint) => void;
  onLodgeComplaint?: () => void;
}

export const InteractiveAndhraMap: React.FC<InteractiveAndhraMapProps> = ({
  waterBodies,
  complaints,
  currentRole,
  districtFilter = 'all',
  onSelectWaterBody,
  onSelectComplaint,
  onLodgeComplaint,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<'all' | 'Vizianagaram' | 'Parvathipuram Manyam'>(
    currentRole === 'nodal_vizianagaram'
      ? 'Vizianagaram'
      : currentRole === 'nodal_parvathipuram'
      ? 'Parvathipuram Manyam'
      : districtFilter
  );

  const [statusFilter, setStatusFilter] = useState<'all' | WaterBodyStatusColor>('all');
  const [showComplaints, setShowComplaints] = useState(true);
  const [activeWaterBody, setActiveWaterBody] = useState<WaterBody | null>(waterBodies[0] || null);
  const [activeComplaint, setActiveComplaint] = useState<CitizenComplaint | null>(null);

  // 1. Data store karne ke liye ek 'Jhola' (state) banao
  const [liveReservoirData, setLiveReservoirData] = useState<any>(null);

  // 2. Component load hote hi Vercel se data mangwao (Antenna)
  useEffect(() => {
    async function getLiveData() {
      try {
        const res = await fetch('/api/wris'); // Apne Vercel API ko pukaara
        const realData = await res.json();
        
        setLiveReservoirData(realData); // Data aate hi jhole me daal diya
        console.log("Live Water Data aa gaya:", realData); // Browser console me check karne ke liye
      } catch (err) {
        console.error("Data laane me error:", err);
      }
    }
    
    getLiveData();
  }, []); // Yeh empty array [] ka matlab hai "sirf ek baar mangwao jab map pehli baar khule"


  // Filter water bodies based on role restriction
  const effectiveDistrict = 
    currentRole === 'nodal_vizianagaram'
      ? 'Vizianagaram'
      : currentRole === 'nodal_parvathipuram'
      ? 'Parvathipuram Manyam'
      : selectedDistrict;

  const filteredWaterBodies = waterBodies.filter((wb) => {
    const matchesDistrict = effectiveDistrict === 'all' || wb.district === effectiveDistrict;
    const matchesStatus = statusFilter === 'all' || wb.statusColor === statusFilter;
    return matchesDistrict && matchesStatus;
  });

  const filteredComplaints = complaints.filter((c) => {
    return effectiveDistrict === 'all' || c.district === effectiveDistrict;
  });

  // Calculate coordinates projection on interactive SVG canvas
  // Bounds for Vizianagaram & Parvathipuram Manyam:
  // Lat: 18.00 to 18.95 | Lng: 83.05 to 83.75
  const minLat = 18.00;
  const maxLat = 18.95;
  const minLng = 83.05;
  const maxLng = 83.75;

  const projectCoords = (lat: number, lng: number) => {
    // Map to SVG coordinates (width 800, height 520)
    const x = ((lng - minLng) / (maxLng - minLng)) * 700 + 50;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 420 + 50;
    return { x: Math.max(40, Math.min(760, x)), y: Math.max(40, Math.min(480, y)) };
  };

  const getColorClasses = (color: WaterBodyStatusColor) => {
    switch (color) {
      case 'green':
        return {
          fill: '#10b981',
          stroke: '#047857',
          pulse: 'rgba(16, 185, 129, 0.45)',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          label: 'Bahut Achha (Pristine)',
        };
      case 'blue':
        return {
          fill: '#0284c7',
          stroke: '#0369a1',
          pulse: 'rgba(2, 132, 199, 0.45)',
          badge: 'bg-sky-100 text-sky-800 border-sky-300',
          label: 'Normal (Acceptable)',
        };
      case 'yellow':
        return {
          fill: '#f59e0b',
          stroke: '#b45309',
          pulse: 'rgba(245, 158, 11, 0.45)',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          label: 'Middle Problem (Moderate)',
        };
      case 'red':
        return {
          fill: '#ef4444',
          stroke: '#b91c1c',
          pulse: 'rgba(239, 68, 68, 0.45)',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          label: 'Danger Zone (Critical)',
        };
      case 'grey':
        return {
          fill: '#64748b',
          stroke: '#334155',
          pulse: 'rgba(100, 116, 139, 0.25)',
          badge: 'bg-slate-200 text-slate-800 border-slate-300',
          label: 'Existence Se Mit Gaya (Extinct)',
        };
      default:
        return {
          fill: '#0284c7',
          stroke: '#0369a1',
          pulse: 'rgba(2, 132, 199, 0.45)',
          badge: 'bg-sky-100 text-sky-800 border-sky-300',
          label: 'Normal',
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      {/* Top Map Control Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-[#0047ab] text-white">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Andhra Pradesh Geospatial Water Grid</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#0047ab] font-bold">
                {currentRole === 'nodal_vizianagaram'
                  ? 'VIZIANAGARAM JURISDICTION'
                  : currentRole === 'nodal_parvathipuram'
                  ? 'PARVATHIPURAM MANYAM JURISDICTION'
                  : 'STATE SURVEILLANCE NODE'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Live hydrological telemetry, water status color gradients & citizen hazard alert pins
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* District selector (only accessible if admin or citizen) */}
          {(currentRole === 'admin' || currentRole === 'user') && (
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setSelectedDistrict('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedDistrict === 'all' ? 'bg-[#0047ab] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All AP (State)
              </button>
              <button
                onClick={() => setSelectedDistrict('Vizianagaram')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedDistrict === 'Vizianagaram' ? 'bg-[#0047ab] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vizianagaram
              </button>
              <button
                onClick={() => setSelectedDistrict('Parvathipuram Manyam')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedDistrict === 'Parvathipuram Manyam' ? 'bg-[#0047ab] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Parvathipuram Manyam
              </button>
            </div>
          )}

          {/* Color Status Filter */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs">
            <span className="text-[10px] text-slate-400 font-semibold mr-1.5">Color:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Statuses (5 Colors)</option>
              <option value="green">🟢 Green: Bahut Achha (Pristine)</option>
              <option value="blue">🔵 Blue: Normal (Acceptable)</option>
              <option value="yellow">🟡 Yellow: Middle Problem</option>
              <option value="red">🔴 Red: Danger Zone</option>
              <option value="grey">⚪ Grey: Existence Se Mit Gaya</option>
            </select>
          </div>

          {/* Complaints Overlay Toggle */}
          <button
            onClick={() => setShowComplaints(!showComplaints)}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1 ${
              showComplaints
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Complaints ({filteredComplaints.length})</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="relative w-full h-[460px] sm:h-[500px] bg-gradient-to-b from-slate-900 via-[#0a192f] to-[#0f172a] overflow-hidden select-none">
        {/* Animated Water Ripple Keyframe Style */}
        <style>{`
          @keyframes waterRipple {
            0% { r: 8px; opacity: 0.9; stroke-width: 2px; }
            50% { r: 24px; opacity: 0.4; stroke-width: 1.5px; }
            100% { r: 38px; opacity: 0; stroke-width: 0.5px; }
          }
          .ripple-circle {
            animation: waterRipple 2.4s ease-out infinite;
            transform-origin: center;
          }
          .ripple-circle-delayed {
            animation: waterRipple 2.4s ease-out infinite;
            animation-delay: 1.2s;
            transform-origin: center;
          }
        `}</style>

        {/* SVG Canvas Map */}
        <svg viewBox="0 0 800 520" className="w-full h-full">
          {/* Subtle Grid Lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" />
            </pattern>
            {/* Water Wave Gradient */}
            <linearGradient id="bayOfBengalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          <rect width="800" height="520" fill="url(#grid)" />

          {/* Regional Territory Polygons */}
          {/* Parvathipuram Manyam District Shape (North Region) */}
          <path
            d="M 120,40 L 460,40 L 680,120 L 740,240 L 520,290 L 320,240 L 160,190 Z"
            fill={effectiveDistrict === 'Vizianagaram' ? 'rgba(30, 41, 59, 0.3)' : 'rgba(14, 116, 144, 0.15)'}
            stroke={effectiveDistrict === 'Parvathipuram Manyam' ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)'}
            strokeWidth={effectiveDistrict === 'Parvathipuram Manyam' ? '2.5' : '1.2'}
            strokeDasharray={effectiveDistrict === 'Parvathipuram Manyam' ? 'none' : '4 2'}
          />

          {/* Vizianagaram District Shape (South Region) */}
          <path
            d="M 160,190 L 320,240 L 520,290 L 740,240 L 760,400 L 600,480 L 340,490 L 180,440 L 120,310 Z"
            fill={effectiveDistrict === 'Parvathipuram Manyam' ? 'rgba(30, 41, 59, 0.3)' : 'rgba(2, 132, 199, 0.18)'}
            stroke={effectiveDistrict === 'Vizianagaram' ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)'}
            strokeWidth={effectiveDistrict === 'Vizianagaram' ? '2.5' : '1.2'}
            strokeDasharray={effectiveDistrict === 'Vizianagaram' ? 'none' : '4 2'}
          />

          {/* Bay of Bengal Coastline Indication on Right Margin */}
          <path
            d="M 740,240 Q 770,330 760,400 L 790,440 L 800,240 Z"
            fill="url(#bayOfBengalGrad)"
            stroke="#0ea5e9"
            strokeWidth="1"
          />
          <text x="745" y="360" fill="rgba(186, 230, 253, 0.6)" fontSize="9" fontWeight="bold" transform="rotate(75, 745, 360)">
            BAY OF BENGAL COAST
          </text>

          {/* River Basin Vectors */}
          {/* Nagavali River Flowing South-East */}
          <path
            d="M 320,50 Q 420,130 510,190 T 640,290"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeOpacity="0.8"
            strokeLinecap="round"
          />
          <text x="440" y="145" fill="#7dd3fc" fontSize="9" fontWeight="bold" letterSpacing="1">
            NAGAVALI RIVER (నాగావళి)
          </text>

          {/* Champavathi River Flowing across Vizianagaram */}
          <path
            d="M 280,260 Q 420,330 560,360 T 730,390"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.8"
            strokeOpacity="0.75"
            strokeLinecap="round"
          />
          <text x="390" y="325" fill="#7dd3fc" fontSize="9" fontWeight="bold" letterSpacing="1">
            CHAMPAVATHI RIVER (చంపావతి)
          </text>

          {/* District Labels */}
          <text x="210" y="90" fill="rgba(255, 255, 255, 0.85)" fontSize="13" fontWeight="bold" letterSpacing="1.5">
            PARVATHIPURAM MANYAM DISTRICT
          </text>
          <text x="210" y="108" fill="rgba(186, 230, 253, 0.6)" fontSize="10">
            Eastern Ghats Forest & Tribal Water Catchments (పార్వతీపురం మన్యం)
          </text>

          <text x="220" y="440" fill="rgba(255, 255, 255, 0.85)" fontSize="13" fontWeight="bold" letterSpacing="1.5">
            VIZIANAGARAM DISTRICT
          </text>
          <text x="220" y="456" fill="rgba(186, 230, 253, 0.6)" fontSize="10">
            Irrigation Tanks & Coastal Plain Watersheds (విజయనగరం జిల్లా)
          </text>

          {/* Water Bodies Pins with Exact 5 Colors and Ripples */}
          {filteredWaterBodies.map((wb) => {
            const { x, y } = projectCoords(wb.coordinates.lat, wb.coordinates.lng);
            const style = getColorClasses(wb.statusColor);
            const isSelected = activeWaterBody?.id === wb.id;

            return (
              <g
                key={wb.id}
                className="cursor-pointer group"
                onClick={() => {
                  setActiveWaterBody(wb);
                  setActiveComplaint(null);
                  if (onSelectWaterBody) onSelectWaterBody(wb);
                }}
              >
                {/* Outer animated ripple rings */}
                {wb.statusColor !== 'grey' && (
                  <>
                    <circle
                      cx={x}
                      cy={y}
                      className="ripple-circle"
                      stroke={style.fill}
                      fill="none"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      className="ripple-circle-delayed"
                      stroke={style.fill}
                      fill="none"
                    />
                  </>
                )}

                {/* Base Marker Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 11 : 9}
                  fill={style.fill}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 3 : 2}
                  filter="drop-shadow(0 2px 5px rgba(0,0,0,0.5))"
                />

                {/* Center Icon Indicator */}
                <circle
                  cx={x}
                  cy={y}
                  r={3.5}
                  fill="#ffffff"
                />

                {/* Pin Label on Hover or Selection */}
                <g transform={`translate(${x + 12}, ${y - 8})`}>
                  <rect
                    rx="4"
                    width={wb.name.split('-')[0].length * 6.5 + 24}
                    height="18"
                    fill="rgba(15, 23, 42, 0.9)"
                    stroke={style.fill}
                    strokeWidth="1"
                  />
                  <text
                    x="6"
                    y="12"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="bold"
                  >
                    {wb.name.split('-')[0]}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Citizen Complaints Overlay Pins */}
          {showComplaints &&
            filteredComplaints.map((c) => {
              const { x, y } = projectCoords(c.coordinates.lat, c.coordinates.lng);
              const isSelected = activeComplaint?.id === c.id;

              return (
                <g
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setActiveComplaint(c);
                    setActiveWaterBody(null);
                    if (onSelectComplaint) onSelectComplaint(c);
                  }}
                >
                  <circle
                    cx={x + 16}
                    cy={y + 16}
                    r={8}
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="2"
                    filter="drop-shadow(0 2px 4px rgba(239, 68, 68, 0.8))"
                  />
                  <text
                    x={x + 13.5}
                    y={y + 20}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    !
                  </text>
                </g>
              );
            })}
        </svg>

        {/* Legend Overlay at Bottom Right */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-white/10 text-white text-[11px] shadow-lg max-w-[280px]">
          <span className="font-bold text-[10px] tracking-wider text-sky-300 uppercase block mb-1.5">
            5 COLOR WATER CODES (जल स्थिति संकेत)
          </span>
          <div className="space-y-1 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0"></span>
              <span><strong>Green:</strong> Bahut Achha (Pristine / High Flow)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] shrink-0"></span>
              <span><strong>Blue:</strong> Normal (Acceptable Quality)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0"></span>
              <span><strong>Yellow:</strong> Middle Problem (Moderate Stress)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shrink-0 animate-pulse"></span>
              <span><strong>Red:</strong> Danger Zone (Severe Contamination)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#64748b] shrink-0"></span>
              <span><strong>Grey:</strong> Existence Se Mit Gaya (Extinct Bed)</span>
            </div>
          </div>
        </div>

        {/* Quick Lodge Complaint Floating Button on Map (Mobile friendly) */}
        {onLodgeComplaint && (
          <div className="absolute top-3 left-3">
            <button
              onClick={onLodgeComplaint}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 border border-rose-400"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Lodge Water Complaint</span>
            </button>
          </div>
        )}
      </div>

      {/* Selected Entity Drawer / Bottom Detail Card */}
      {activeWaterBody && (
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <img
              src={activeWaterBody.imageUrl}
              alt={activeWaterBody.name}
              className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 hidden sm:block"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getColorClasses(activeWaterBody.statusColor).badge}`}>
                  {getColorClasses(activeWaterBody.statusColor).label}
                </span>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {activeWaterBody.district} • {activeWaterBody.mandal}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  GPS: {activeWaterBody.coordinates.lat}°N, {activeWaterBody.coordinates.lng}°E
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 leading-snug">
                {activeWaterBody.name}
              </h4>
              {activeWaterBody.teluguName && (
                <p className="text-xs text-[#0047ab] font-semibold">{activeWaterBody.teluguName}</p>
              )}
              <p className="text-xs text-slate-600 max-w-2xl font-sans leading-relaxed">
                {activeWaterBody.description}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 w-full md:w-auto text-center shrink-0">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block">WATER LEVEL</span>
              <span className="text-sm font-bold text-slate-800">{activeWaterBody.waterLevelPercent}%</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block">TDS READING</span>
              <span className="text-sm font-bold text-slate-800">{activeWaterBody.tdsPpm} ppm</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block">WASTE LEVEL</span>
              <span className="text-sm font-bold text-slate-800">{activeWaterBody.wasteLevel}</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Complaint Card Drawer */}
      {activeComplaint && (
        <div className="p-4 sm:p-5 bg-rose-50 border-t border-rose-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded">
                COMPLAINT {activeComplaint.id}
              </span>
              <span className="text-[11px] font-semibold text-rose-800">
                {activeComplaint.district} ({activeComplaint.mandal})
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Reported by: {activeComplaint.citizenName} ({activeComplaint.citizenAge}y, {activeComplaint.citizenGender}) • {activeComplaint.citizenPhone}
            </h4>
            <p className="text-xs text-rose-950 font-medium">
              "{activeComplaint.shortDescription}"
            </p>
            <div className="text-[11px] text-slate-600 flex items-center gap-2">
              <span>Status: <strong className="text-rose-700">{activeComplaint.status.replace(/_/g, ' ')}</strong></span>
              <span>•</span>
              <span>Assigned: {activeComplaint.assignedNodalOfficer}</span>
            </div>
          </div>

          <button
            onClick={() => setActiveComplaint(null)}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shrink-0"
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  );
};
