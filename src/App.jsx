import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Inbox, Settings, Menu, X,
  Eye, Activity, Clock, Download, Plus,
  Search, Edit, Trash2, MapPin, Home, Mail,
  UploadCloud, Calendar, ChevronDown, FileCheck, BarChart3, Filter,
  Phone, Send, RefreshCw, FileArchive, DownloadCloud, Check, AlertCircle
} from 'lucide-react';

const leafletStyle = document.createElement('style');
leafletStyle.textContent = `.leaflet-pane, .leaflet-top, .leaflet-bottom, .leaflet-control { z-index: 1 !important; }`;
document.head.appendChild(leafletStyle);

// ── Utilitaires ──────────────────────────────────────────────
const API = 'https://acces-immobilier.com/api_dashboard.php';

const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth()+1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const exportToCSV = (filename, rows) => {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => {
    let c = r[k] == null ? '' : r[k].toString().replace(/"/g, '""');
    return c.search(/("|,|\n)/g) >= 0 ? `"${c}"` : c;
  }).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
  a.download = filename;
  a.click();
};

const apiPost = (action, data) =>
  fetch(`${API}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());

// ── Toast notification ───────────────────────────────────────
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium animate-pulse ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
    {type === 'success' ? <Check size={16}/> : <AlertCircle size={16}/>}
    {message}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14}/></button>
  </div>
);

// ── Modal ────────────────────────────────────────────────────
const Modal = ({ isOpen, onClose, title, children, large }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[90vh] ${large ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"><X size={18}/></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// ── DateRangeSelector ────────────────────────────────────────
const DateRangeSelector = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const options = [
    { label: "Aujourd'hui", val: '1j' },
    { label: '7 derniers jours', val: '7j' },
    { label: 'Ce mois', val: '1m' },
    { label: 'Cette année', val: '1an' },
  ];
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 shadow-sm">
        <Calendar size={13}/>
        {options.find(o => o.val === value)?.label || '7 derniers jours'}
        <ChevronDown size={13}/>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-20">
          {options.map(o => (
            <button key={o.val} onClick={() => { onChange(o.val); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 ${value === o.val ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700'}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// DASHBOARD VIEW
// ══════════════════════════════════════════════════════════════

const MapVisiteurs = ({ data }) => {
  useEffect(() => {
    if (window._mapInstance) {
      window._mapInstance.remove();
      window._mapInstance = null;
    }

    const initMap = () => {
  const L = window.L;
  const container = document.getElementById('geo-map-inner');
  if (!L || !container) return;
  
  // ← Ajoute ces 3 lignes
  if (container._leaflet_id) {
    container._leaflet_id = null;
  }
  
  const map = L.map('geo-map-inner').setView([46.5, 2.5], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      const max = Math.max(...data.map(g => g.visites), 1);
      data.forEach(g => {
        if (!g.lat || !g.lng) return;
        const icon = L.divIcon({
  html: `<div style="background:#4f46e5;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

L.marker([parseFloat(g.lat), parseFloat(g.lng)], { icon })
  .addTo(map)
  .bindPopup(`<b>${g.ville}</b><br>${g.pays}<br>${g.visites} visite(s) · ${g.visiteurs_uniques} visiteur(s) unique(s)`);
      });
    };

    if (window.L) {
      setTimeout(initMap, 100);
    } else {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setTimeout(initMap, 300);
      document.head.appendChild(script);
    }

    return () => {
      if (window._mapInstance) {
        window._mapInstance.remove();
        window._mapInstance = null;
      }
    };
  }, [data]);

  return <div id="geo-map-inner" style={{ width: '100%', height: '100%' }}/>;
};

// ── Sélecteur de période avec plage personnalisée ────────────
const PeriodeSelector = ({ value, onChange, dateDebut, dateFin, onDateChange }) => {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const options = [
    { label: "En direct", val: 'live' },
    { label: "Aujourd'hui", val: '1j' },
    { label: '7 derniers jours', val: '7j' },
    { label: 'Ce mois', val: '1m' },
    { label: 'Cette année', val: '1an' },
    { label: 'Plage personnalisée', val: 'custom' },
  ];

  const currentLabel = value === 'custom'
    ? `${dateDebut} → ${dateFin}`
    : value === 'live'
    ? '🔴 En direct'
    : options.find(o => o.val === value)?.label || '7 derniers jours';

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 shadow-sm ${value === 'live' ? 'bg-red-50 border-red-300 text-red-700 font-semibold' : 'bg-white border-gray-200 text-gray-700'}`}>
        <Calendar size={13}/>
        {currentLabel}
        <ChevronDown size={13}/>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-30">
          {options.map(o => (
            <button key={o.val} onClick={() => {
              if (o.val === 'custom') { setShowCustom(true); setOpen(false); }
              else { onChange(o.val); setShowCustom(false); setOpen(false); }
            }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 flex items-center gap-2 ${value === o.val ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700'}`}>
              {o.val === 'live' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"/>}
              {o.label}
            </button>
          ))}
        </div>
      )}
      {showCustom && (
        <div className="absolute right-0 mt-1 w-72 bg-white border border-gray-200 shadow-xl rounded-xl p-4 z-30">
          <p className="text-xs font-bold text-gray-600 uppercase mb-3">Plage personnalisée</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date de début</label>
              <input type="date" value={dateDebut} onChange={e => onDateChange('debut', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"/>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date de fin</label>
              <input type="date" value={dateFin} onChange={e => onDateChange('fin', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"/>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCustom(false)} className="flex-1 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annuler</button>
              <button onClick={() => { onChange('custom'); setShowCustom(false); }}
                className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 font-medium">Appliquer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GeoSection = ({ API }) => {
  const [geoData, setGeoData] = useState([]);
  const [showAll, setShowAll] = useState(false);
    const [modalGeo, setModalGeo] = useState(false);
  const [periode, setPeriode] = useState('7j');
  const [dateDebut, setDateDebut] = useState(() => new Date(Date.now() - 7*864e5).toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [liveCount, setLiveCount] = useState({ visiteurs: 0, pages_vues: 0 });
  const [isLive, setIsLive] = useState(false);
  const [sessionsActives, setSessionsActives] = useState({ total: 0, visiteurs: [] });

  const charger = () => {
  if (periode === 'live') {
    setGeoData([]); // Vider avant de charger
    fetch(`${API}?action=sessions_actives`)
      .then(r => r.json())
      .then(d => { setGeoData(d.visiteurs || []); setSessionsActives(d); });
  } else {
    let url = `${API}?action=geo_visiteurs&periode=${periode}`;
    if (periode === 'custom') url += `&debut=${dateDebut}&fin=${dateFin}`;
    fetch(url).then(r => r.json()).then(data => setGeoData(Array.isArray(data) ? data : [])).catch(() => {});
  }
};

  // Mode live — refresh toutes les 10 secondes
  useEffect(() => {
    if (periode === 'live') {
      setIsLive(true);
      const interval = setInterval(() => {
        fetch(`${API}?action=sessions_actives`).then(r => r.json()).then(d => { setGeoData(d.visiteurs || []); setSessionsActives(d); });
        fetch(`${API}?action=trafic`).then(r => r.json()).then(d => setLiveCount({ visiteurs: d.visiteurs || 0, pages_vues: d.pages_vues || 0 }));
        fetch(`${API}?action=sessions_actives`).then(r => r.json()).then(setSessionsActives);
      }, 10000);
      charger();
      return () => { clearInterval(interval); setIsLive(false); };
    } else {
      setIsLive(false);
      charger();
    }
  }, [periode, dateDebut, dateFin]);

  const total_visites = geoData.reduce((s, g) => s + parseInt(g.visites), 0);
  const total_uniques = geoData.reduce((s, g) => s + parseInt(g.visiteurs_uniques), 0);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-gray-800">🌍 Localisation des visiteurs</h3>
          {isLive && (
  <div className="flex items-center gap-3 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"/>
    <span className="text-sm font-bold text-red-600">
      {sessionsActives.total} visiteur(s) actuellement sur le site
    </span>
  </div>
        )}
        </div>
        <PeriodeSelector
          value={periode} onChange={setPeriode}
          dateDebut={dateDebut} dateFin={dateFin}
          onDateChange={(type, val) => { if(type==='debut') setDateDebut(val); else setDateFin(val); }}
        />
      </div>

      {/* KPIs live */}
      {isLive && (
        <div className="px-5 pt-4 grid grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
            <p className="text-xs text-red-500 uppercase font-semibold">Visiteurs aujourd'hui</p>
            <p className="text-3xl font-black text-red-700 mt-1">{liveCount.visiteurs}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
            <p className="text-xs text-orange-500 uppercase font-semibold">Pages vues aujourd'hui</p>
            <p className="text-3xl font-black text-orange-700 mt-1">{liveCount.pages_vues}</p>
          </div>
        </div>
      )}

      <div className="p-5">
        {geoData.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="font-medium">Aucune donnée géographique</p>
            <p className="text-sm mt-1">Les données apparaîtront quand des visiteurs accèderont au site</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Carte */}
            <div style={{ height: '350px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <MapVisiteurs data={geoData}/>
            </div>

            {/* Tableau */}
            <div className="flex flex-col gap-4">
              {/* Totaux */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-indigo-500 uppercase font-semibold">Total visites</p>
                  <p className="text-2xl font-black text-indigo-700 mt-1">{total_visites}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-500 uppercase font-semibold">Visiteurs uniques</p>
                  <p className="text-2xl font-black text-blue-700 mt-1">{total_uniques}</p>
                </div>
              </div>

              {/* Liste villes */}
              <div className="overflow-auto flex-1 rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <th className="p-3 text-left">Ville</th>
                    <th className="p-3 text-left">Pays</th>
                    <th className="p-3 text-center">Visites</th>
                    <th className="p-3 text-center">Uniques</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {geoData.slice(0, 6).map((g, i) => (
                      <tr key={i} className="hover:bg-indigo-50/20">
                        <td className="p-3 font-semibold text-gray-800 flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-mono w-5">#{i+1}</span>
                          {g.ville || '—'}
                        </td>
                        <td className="p-3 text-gray-500 text-xs">{g.pays}</td>
                        <td className="p-3 text-center font-bold text-indigo-600">{isLive ? '🟢' : g.visites}</td>
                        <td className="p-3 text-center text-gray-600">{isLive ? g.page || '—' : g.visiteurs_uniques}</td>
                      </tr>
                    ))}
                  </tbody>
                  {geoData.length > 6 && (
                    <tfoot>
                      <tr>
                        <td colSpan="4" className="p-3 text-center">
                          <button onClick={() => setModalGeo(true)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                            ▼ Voir tout ({geoData.length} villes)
                          </button>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      <Modal isOpen={modalGeo} onClose={() => setModalGeo(false)} title={`Toutes les villes (${geoData.length})`} large>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase">
            <th className="p-3 text-left">#</th>
            <th className="p-3 text-left">Ville</th>
            <th className="p-3 text-left">Pays</th>
            <th className="p-3 text-center">Visites</th>
            <th className="p-3 text-center">Uniques</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {geoData.map((g, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-3 text-gray-400 font-mono text-xs">#{i+1}</td>
                <td className="p-3 font-semibold text-gray-800">{g.ville || '—'}</td>
                <td className="p-3 text-gray-500 text-xs">{g.pays}</td>
                <td className="p-3 text-center font-bold text-indigo-600">{g.visites}</td>
                <td className="p-3 text-center text-gray-600">{g.visiteurs_uniques}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </div>
  );
};

const DateRangeSelectorPlus = ({ value, onChange, dateDebut, dateFin, onDateChange }) => {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const options = [
    { label: "Aujourd'hui", val: '1j' },
    { label: '7 derniers jours', val: '7j' },
    { label: 'Ce mois', val: '1m' },
    { label: 'Cette année', val: '1an' },
    { label: 'Plage personnalisée', val: 'custom' },
  ];
  const currentLabel = value === 'custom' ? `${dateDebut} → ${dateFin}` : options.find(o => o.val === value)?.label || '7 derniers jours';
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 shadow-sm">
        <Calendar size={13}/>{currentLabel}<ChevronDown size={13}/>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-30">
          {options.map(o => (
            <button key={o.val} onClick={() => {
              if (o.val === 'custom') { setShowCustom(true); setOpen(false); }
              else { onChange(o.val); setShowCustom(false); setOpen(false); }
            }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 ${value === o.val ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700'}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
      {showCustom && (
        <div className="absolute right-0 mt-1 w-72 bg-white border border-gray-200 shadow-xl rounded-xl p-4 z-30">
          <div className="space-y-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Date de début</label>
              <input type="date" value={dateDebut} onChange={e => onDateChange('debut', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"/></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Date de fin</label>
              <input type="date" value={dateFin} onChange={e => onDateChange('fin', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"/></div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCustom(false)} className="flex-1 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annuler</button>
              <button onClick={() => { onChange('custom'); setShowCustom(false); }} className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 font-medium">Appliquer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardView = ({ setActiveTab }) => {
  const [apiStatus, setApiStatus] = useState('ok');
  const [annonces, setAnnonces] = useState([]);
  const [topAnnonces, setTopAnnonces] = useState([]);
  const [nbVentes, setNbVentes] = useState(0);
  const [nbLocations, setNbLocations] = useState(0);
  const [activites, setActivites] = useState([]);
  const [trafic, setTrafic] = useState({ visiteurs: 0, pages_vues: 0, graphique: [] });
  const [traficPeriode, setTraficPeriode] = useState('7j');
  const [traficDebut, setTraficDebut] = useState(() => new Date(Date.now() - 7*864e5).toISOString().split('T')[0]);
  const [traficFin, setTraficFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [topPeriode, setTopPeriode] = useState('7j');
  const [modalClassement, setModalClassement] = useState(false);
  const [geoVisiteurs, setGeoVisiteurs] = useState([]);

  const maxViews = Math.max(...topAnnonces.map(l => l.views), 1);

  const chargerTout = () => {
    fetch('https://acces-immobilier.com/api_relais.php')
      .then(r => r.json())
      .then(data => {
  const listings = data.data || data;
  if (!Array.isArray(listings)) return;
  setAnnonces(listings);
setNbVentes(listings.filter(b => b.find(f => f.std_name === 'category' && f.value == 0)).length);
setNbLocations(listings.filter(b => b.find(f => f.std_name === 'category' && f.value == 1)).length);

fetch(`${API}?action=top_annonces&periode=${topPeriode}`)
  .then(r => r.json())
  .then(topBDD => {
    if (!Array.isArray(topBDD)) return;
    const top = listings.map(b => {
      const get = n => { const f = b.find(x => x.std_name === n); return f ? f.value : ''; };
      const ref = get('reference') || get('id');
      const vueBDD = topBDD.find(t => t.ref_bien === ref);
      return {
        id: ref,
        title: get('title') || 'Bien immobilier',
        city: get('city') || '',
        price: new Intl.NumberFormat('fr-FR').format(get('price')) + ' €',
        views: vueBDD ? parseInt(vueBDD.vues) : 0
      };
    }).sort((a, b) => b.views - a.views);
    setTopAnnonces(top);

fetch(`${API}?action=geo_visiteurs&periode=${topPeriode}`)
  .then(r => r.json())
  .then(setGeoVisiteurs);

  });
  })
  .catch(() => setApiStatus('error'));

fetch(`${API}?action=activites`).then(r => r.json()).then(d => setActivites(Array.isArray(d) ? d : []));
};
useEffect(() => {
  let url = `${API}?action=trafic&periode=${traficPeriode}`;
  if (traficPeriode === 'custom') url += `&debut=${traficDebut}&fin=${traficFin}`;
  fetch(url)
    .then(r => r.json())
    .then(d => setTrafic(d && d.visiteurs !== undefined ? d : { visiteurs: 0, pages_vues: 0, graphique: [] }));
}, [traficPeriode, traficDebut, traficFin]);
useEffect(() => { 
  chargerTout();
  const interval = setInterval(() => {
    try { chargerTout(); } catch(e) { console.error('Erreur refresh:', e); }
  }, 30000);
  return () => clearInterval(interval);
}, []);
useEffect(() => {
    fetch(`${API}?action=top_annonces&periode=${topPeriode}`)
      .then(r => r.json())
      .then(topBDD => {
        setTopAnnonces(prev => prev.map(a => {
          const vueBDD = topBDD.find(t => t.ref_bien === a.id);
          return { ...a, views: vueBDD ? parseInt(vueBDD.vues) : 0 };
        }).sort((a, b) => b.views - a.views));
      });
  }, [topPeriode]);

  const handleTestAPI = () => {
    setApiStatus('testing');
    chargerTout();
    setTimeout(() => setApiStatus('ok'), 2000);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Vue d'ensemble</h2>
        <button onClick={chargerTout} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <RefreshCw size={14}/> Actualiser
        </button>
      </div>

      {/* KPIs Trafic */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-transparent">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-600"/> Trafic du site</h3>
<DateRangeSelectorPlus value={traficPeriode} onChange={setTraficPeriode}
  dateDebut={traficDebut} dateFin={traficFin}
  onDateChange={(type, val) => { if(type==='debut') setTraficDebut(val); else setTraficFin(val); }}
/>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
            <div><p className="text-xs text-gray-500 uppercase tracking-wide">Visiteurs uniques</p><p className="text-3xl font-black text-gray-900 mt-1">{trafic.visiteurs}</p></div>
            <div><p className="text-xs text-gray-500 uppercase tracking-wide">Pages vues</p><p className="text-3xl font-black text-gray-900 mt-1">{trafic.pages_vues}</p></div>
            <div><p className="text-xs text-gray-500 uppercase tracking-wide">Annonces vues</p><p className="text-3xl font-black text-gray-900 mt-1">{topAnnonces.reduce((a, b) => a + (b.views || 0), 0)}</p></div>
            <div><p className="text-xs text-gray-500 uppercase tracking-wide">Activités</p><p className="text-3xl font-black text-gray-900 mt-1">{activites.length}</p></div>
          </div>
          <div className="h-40 w-full flex items-end gap-2 border-b border-gray-100 pb-2">
            {trafic.graphique && trafic.graphique.length > 0 ? (() => {
             const max = Math.max(...trafic.graphique.map(g => g.visiteurs), 1);
return trafic.graphique.map((g, i) => {
  const h = Math.max(8, Math.round(((g.visiteurs || 0) / max) * 140));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="w-full bg-gradient-to-t from-indigo-500 to-blue-400 rounded-t-sm" style={{ height: `${h}px`, minHeight: '8px' }}>
<span className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">{g.visiteurs} visiteurs</span>
                    </div>
                    <span className="text-[9px] text-gray-400">
  {traficPeriode === '1j' ? g.jour : g.jour?.slice(5)}
</span>
                  </div>
                );
              });
            })() : (
              <div className="w-full flex items-center justify-center text-gray-400 text-sm">
                Visitez le site pour générer des statistiques
              </div>
            )}
          </div>
        </div>
      </div>

<GeoSection API={API}/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Annonces */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Home size={18} className="text-blue-600"/> Top annonces vues</h3>
            <DateRangeSelector value={topPeriode} onChange={setTopPeriode}/>
          </div>
          <div className="p-5 flex-1 space-y-4">
            {topAnnonces.slice(0, 10).map((list, idx) => (
              <div key={list.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-800 truncate pr-4">{idx+1}. {list.title} <span className="text-gray-400 font-normal text-xs">({list.id})</span></span>
                  <span className="font-bold text-indigo-600 flex items-center gap-1 flex-shrink-0"><Eye size={13}/> {list.views}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full" style={{ width: `${(list.views / maxViews) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {topAnnonces.filter(a => a.views > 0).length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Visitez des fiches bien pour voir les stats</p>
            )}
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-center">
            <button onClick={() => setModalClassement(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Voir tout le classement</button>
          </div>
        </div>

        {/* API + Activités */}
        <div className="space-y-5 flex flex-col">
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Settings size={18} className="text-gray-600"/> Monitoring API Adaptimmo</h3>
              <button onClick={handleTestAPI} disabled={apiStatus === 'testing'} className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg" title="Actualiser">
                <RefreshCw size={16} className={apiStatus === 'testing' ? 'animate-spin' : ''}/>
              </button>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg border mb-3 ${apiStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
              <span className="relative flex h-3 w-3">
                {apiStatus === 'ok' && <><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></>}
                {apiStatus === 'testing' && <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 animate-pulse"></span>}
                {apiStatus === 'error' && <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>}
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">{apiStatus === 'ok' ? 'Synchronisation Active' : apiStatus === 'testing' ? 'Test en cours...' : 'Erreur de connexion'}</p>
                <p className="text-xs text-gray-500">Dernier sync : {formatDateTime(new Date().toISOString())}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-center"><p className="text-2xl font-black text-blue-700">{annonces.length}</p><p className="text-xs text-blue-600/80">Annonces</p></div>
              <div className="flex-1 bg-green-50/50 p-3 rounded-lg border border-green-100 text-center"><p className="text-2xl font-black text-green-700">{nbVentes}</p><p className="text-xs text-green-600/80">Ventes</p></div>
              <div className="flex-1 bg-orange-50/50 p-3 rounded-lg border border-orange-100 text-center"><p className="text-2xl font-black text-orange-700">{nbLocations}</p><p className="text-xs text-orange-600/80">Locations</p></div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-100"><h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Clock size={18} className="text-indigo-600"/> Dernières activités</h3></div>
            <div className="p-4 flex-1">
              {activites.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Aucune activité récente</p>
              ) : (
                <div className="space-y-3">
                  {activites.map((act, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5"><Activity size={13}/></div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">{act.type} <span className="font-normal text-gray-500">– {act.user}</span></p>
                        <p className="text-xs text-gray-500 truncate">{act.details}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{formatDateTime(act.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
              <button onClick={() => setActiveTab('forms')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Voir tous les formulaires</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal classement */}
      <Modal isOpen={modalClassement} onClose={() => setModalClassement(false)} title="Classement complet des annonces">
        <div className="mb-3"><DateRangeSelector value={topPeriode} onChange={setTopPeriode}/></div>
        <table className="w-full text-left border-collapse text-sm">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase">
            <th className="p-3">#</th><th className="p-3">Référence</th><th className="p-3">Bien</th><th className="p-3 text-right">Vues</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {topAnnonces.map((list, i) => (
              <tr key={list.id} className="hover:bg-gray-50">
                <td className="p-3 font-bold text-gray-400">{i+1}</td>
                <td className="p-3 font-mono text-xs text-gray-500">{list.id}</td>
                <td className="p-3"><p className="font-semibold text-gray-800">{list.title}</p><p className="text-xs text-gray-400">{list.city} — {list.price}</p></td>
                <td className="p-3 text-right font-bold text-indigo-600">{list.views}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// CLIENTS VIEW
// ══════════════════════════════════════════════════════════════
const ClientsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('Tous');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAdd, setModalAdd] = useState(false);
  const [formAdd, setFormAdd] = useState({ nom: '', email: '', telephone: '' });
  const [toast, setToast] = useState(null);
  const [modalDetail, setModalDetail] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const charger = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}?action=contacts`).then(r => r.json()).then(d => Array.isArray(d) ? d : []),
fetch(`${API}?action=rappels`).then(r => r.json()).then(d => Array.isArray(d) ? d : []),
fetch(`${API}?action=estimations`).then(r => r.json()).then(d => Array.isArray(d) ? d : []),
fetch(`${API}?action=alertes`).then(r => r.json()).then(d => Array.isArray(d) ? d : []),
    ]).then(([contacts, rappels, estimations, alertes]) => {
      const all = [
        ...contacts.map(c => ({ id: 'c'+c.id, _id: c.id, _table: 'contacts', name: (c.prenom+' '+c.nom).trim(), email: c.email, phone: c.telephone||'—', origin: 'Contact', date: c.created_at })),
        ...rappels.map(c => ({ id: 'r'+c.id, _id: c.id, _table: 'rappels', name: (c.prenom+' '+c.nom).trim(), email: c.email, phone: c.telephone||'—', origin: 'Rappel', date: c.created_at })),
        ...estimations.map(c => ({ id: 'e'+c.id, _id: c.id, _table: 'estimations', name: (c.prenom+' '+c.nom).trim(), email: c.email, phone: c.telephone||'—', origin: 'Estimation', date: c.created_at })),
        ...alertes.map(c => ({ id: 'al'+c.id, _id: c.id, _table: 'alertes_email', name: c.nom, email: c.email, phone: '—', origin: 'Alerte Email', date: c.created_at })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
      setClients(all);
      setLoading(false);
    });
  };

  useEffect(() => { charger(); }, []);

  const supprimer = async (client) => {
    if (!confirm(`Supprimer ${client.name} ?`)) return;
    const res = await apiPost('delete_contact', { id: client._id, table: client._table });
    if (res.success) { showToast('Contact supprimé'); charger(); }
    else showToast('Erreur lors de la suppression', 'error');
  };

  const ajouter = async (e) => {
    e.preventDefault();
    const res = await apiPost('add_contact', formAdd);
    if (res.success) { showToast('Contact ajouté !'); setModalAdd(false); setFormAdd({ nom: '', email: '', telephone: '' }); charger(); }
    else showToast(res.message || 'Erreur', 'error');
  };

  const origins = ['Tous', 'Contact', 'Rappel', 'Estimation', 'Alerte Email'];
  const filtered = clients.filter(c =>
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterOrigin === 'Tous' || c.origin === filterOrigin)
  );

  const badgeColor = { Contact: 'bg-blue-100 text-blue-700', Rappel: 'bg-orange-100 text-orange-700', Estimation: 'bg-green-100 text-green-700', 'Alerte Email': 'bg-purple-100 text-purple-700' };

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users size={22} className="text-indigo-600"/> Fichier Clients</h2>
          <p className="text-sm text-gray-500">{filtered.length} contact{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV('clients.csv', filtered)} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <Download size={15}/> CSV
          </button>
          <button onClick={() => setModalAdd(true)} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus size={15}/> Ajouter
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
          <input type="text" placeholder="Rechercher…" className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400"/>
          <select className="border border-gray-200 rounded-lg py-2 px-3 text-sm outline-none focus:border-indigo-500" value={filterOrigin} onChange={e => setFilterOrigin(e.target.value)}>
            {origins.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
              <th className="p-4">Contact</th><th className="p-4">Téléphone</th><th className="p-4">Origine</th><th className="p-4">Date</th><th className="p-4 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400">Chargement…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400">Aucun résultat</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-indigo-50/20 group">
                  <td className="p-4">
                    <p className="font-semibold text-gray-800">{c.name}</p>
                    <a href={`mailto:${c.email}`} className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><Mail size={11}/>{c.email}</a>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{c.phone}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeColor[c.origin] || 'bg-gray-100 text-gray-600'}`}>{c.origin}</span></td>
                  <td className="p-4 text-xs text-gray-500 font-mono">{formatDateTime(c.date)}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <a href={`mailto:${c.email}`} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Envoyer un email"><Mail size={15}/></a>
                      <button onClick={() => supprimer(c)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer"><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalAdd} onClose={() => setModalAdd(false)} title="Ajouter un contact">
        <form onSubmit={ajouter} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label><input required type="text" className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" value={formAdd.nom} onChange={e => setFormAdd({...formAdd, nom: e.target.value})}/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input required type="email" className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" value={formAdd.email} onChange={e => setFormAdd({...formAdd, email: e.target.value})}/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label><input type="tel" className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" value={formAdd.telephone} onChange={e => setFormAdd({...formAdd, telephone: e.target.value})}/></div>
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalAdd(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// FORMS VIEW
// ══════════════════════════════════════════════════════════════
const FormsView = () => {
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [rappels, setRappels] = useState([]);
  const [estimations, setEstimations] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [toast, setToast] = useState(null);
  const [modalDetail, setModalDetail] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const charger = () => {
    fetch(`${API}?action=contacts`).then(r => r.json()).then(d => setContacts(Array.isArray(d) ? d : []));
    fetch(`${API}?action=rappels`).then(r => r.json()).then(d => setRappels(Array.isArray(d) ? d : []));
    fetch(`${API}?action=estimations`).then(r => r.json()).then(d => setEstimations(Array.isArray(d) ? d : []));
    fetch(`${API}?action=alertes`).then(r => r.json()).then(d => setAlertes(Array.isArray(d) ? d : []));
  };

  useEffect(() => { charger(); }, []);

  const supprimerContact = async (id, table) => {
    if (!confirm('Supprimer ce contact ?')) return;
    const res = await apiPost('delete_contact', { id, table });
    if (res.success) { showToast('Supprimé'); charger(); }
    else showToast('Erreur', 'error');
  };

  const updateEstimation = async (id, statut, notes) => {
    const res = await apiPost('update_estimation', { id, statut, notes });
    if (res.success) showToast('Mis à jour !');
    else showToast('Erreur', 'error');
  };

  const toggleAlerte = async (id, actif) => {
    const res = await apiPost('toggle_alerte', { id, actif: actif ? 1 : 0 });
    if (res.success) { showToast(actif ? 'Alerte activée' : 'Alerte mise en pause'); charger(); }
    else showToast('Erreur', 'error');
  };

  const tabs = [
    { id: 'contacts', label: 'Contacts & Rappels', count: contacts.length + rappels.length },
    { id: 'estimations', label: 'Estimations', count: estimations.length },
    { id: 'alertes', label: 'Alertes Emails', count: alertes.length },
  ];

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}

      <Modal isOpen={!!modalDetail} onClose={() => setModalDetail(null)} title="Détail du message" large>
        {modalDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Nom</p>
                <p className="font-bold text-gray-800">{modalDetail.prenom} {modalDetail.nom}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email</p>
                <a href={`mailto:${modalDetail.email}`} className="font-bold text-indigo-600 hover:underline">{modalDetail.email}</a>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Téléphone</p>
                <a href={`tel:${modalDetail.telephone}`} className="font-bold text-gray-800">{modalDetail.telephone || '—'}</a>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Date</p>
                <p className="font-bold text-gray-800">{formatDateTime(modalDetail.created_at)}</p>
              </div>
              {modalDetail.ref_bien && (
                <div className="bg-indigo-50 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-indigo-500 uppercase font-semibold mb-1">Référence bien</p>
                  <p className="font-bold text-indigo-800">{modalDetail.ref_bien}</p>
                </div>
              )}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-xs text-yellow-600 uppercase font-semibold mb-2">Message complet</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{modalDetail.message || '—'}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <a href={`mailto:${modalDetail.email}?subject=Suite à votre demande`} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                <Mail size={15}/> Répondre par email
              </a>
              {modalDetail.telephone && (
                <a href={`tel:${modalDetail.telephone}`} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                  <Phone size={15}/> Appeler
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Inbox size={22} className="text-indigo-600"/> Gestion des Formulaires</h2>
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {t.label} <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === t.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>{t.count}</span>
          </button>
        ))}
      </div>

  

      {/* CONTACTS */}
      {activeTab === 'contacts' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-3 bg-gray-50/50 border-b border-gray-100 flex justify-between">
            <span className="text-sm text-gray-500">{contacts.length + rappels.length} message(s)</span>
            <button onClick={() => exportToCSV('contacts.csv', [...contacts, ...rappels])} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded text-xs font-medium"><Download size={13}/> CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead><tr className="bg-white text-gray-500 text-xs uppercase border-b border-gray-100">
                <th className="p-4">Type</th><th className="p-4">Contact</th><th className="p-4">Message</th><th className="p-4">Date</th><th className="p-4 text-right">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ...contacts.map(c => ({ ...c, _type: 'Contact', _table: 'contacts' })),
                  ...rappels.map(c => ({ ...c, _type: 'Rappel', _table: 'rappels' }))
                ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(c => (
                  <tr key={c._type+c.id} className="hover:bg-gray-50 group">
                    <td className="p-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded font-semibold ${c._type === 'Rappel' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{c._type}</span>
                      {c.ref_bien && <p className="text-xs text-gray-400 mt-1 font-mono">Réf: {c.ref_bien}</p>}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-800">{c.prenom} {c.nom}</p>
                      <p className="text-xs text-gray-500">{c.email}</p>
                      {c.telephone && <p className="text-xs text-gray-500">{c.telephone}</p>}
                    </td>
                    <td className="p-4 max-w-xs">
  <p className="text-sm text-gray-700 truncate">{c.message}</p>
  <button onClick={() => setModalDetail(c)} className="text-xs text-indigo-600 hover:underline mt-1">Voir tout →</button>
</td>
                    <td className="p-4 text-xs text-gray-500 font-mono">{formatDateTime(c.created_at)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <a href={`mailto:${c.email}?subject=Suite à votre demande`} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-medium flex items-center gap-1"><Send size={13}/> Répondre</a>
                        <button onClick={() => supprimerContact(c.id, c._table)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {contacts.length === 0 && rappels.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400">Aucun message reçu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ESTIMATIONS */}
      {activeTab === 'estimations' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-3 bg-gray-50/50 border-b border-gray-100 flex justify-between">
            <span className="text-sm text-gray-500">{estimations.length} estimation(s)</span>
            <button onClick={() => exportToCSV('estimations.csv', estimations)} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded text-xs font-medium"><Download size={13}/> CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead><tr className="bg-white text-gray-500 text-xs uppercase border-b border-gray-100">
                <th className="p-4">Client</th><th className="p-4">Bien</th><th className="p-4">Statut</th><th className="p-4">Notes</th><th className="p-4">Date</th><th className="p-4 text-right">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {estimations.map(est => (
                  <EstimationRow key={est.id} est={est} onUpdate={updateEstimation} onDelete={() => { supprimerContact(est.id, 'estimations'); charger(); }} showToast={showToast}/>
                ))}
                {estimations.length === 0 && (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-400">Aucune estimation reçue</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ALERTES */}
      {activeTab === 'alertes' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-3 bg-gray-50/50 border-b border-gray-100 flex justify-between">
            <span className="text-sm text-gray-500">{alertes.length} alerte(s)</span>
            <button onClick={() => exportToCSV('alertes.csv', alertes)} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded text-xs font-medium"><Download size={13}/> CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead><tr className="bg-white text-gray-500 text-xs uppercase border-b border-gray-100">
                <th className="p-4">Contact</th><th className="p-4">Critères</th><th className="p-4 text-center">Emails</th><th className="p-4">Statut</th><th className="p-4 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {alertes.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 group">
                    <td className="p-4">
                      <p className="font-semibold text-gray-800">{a.nom}</p>
                      <a href={`mailto:${a.email}`} className="text-xs text-indigo-600 hover:underline">{a.email}</a>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 block w-max">
                        {[a.type_transaction, a.type_bien, a.ville, a.budget_max ? `max ${parseInt(a.budget_max).toLocaleString('fr-FR')}€` : ''].filter(Boolean).join(' — ')}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center bg-gray-100 w-8 h-8 rounded-full font-bold text-gray-700 text-sm">{a.nb_emails_envoyes}</span>
                    </td>
                    <td className="p-4">
                      <label className="relative inline-flex items-center cursor-pointer gap-2">
                        <input type="checkbox" className="sr-only peer" defaultChecked={a.actif == 1} onChange={e => toggleAlerte(a.id, e.target.checked)}/>
                        <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                        <span className="text-xs text-gray-600">{a.actif == 1 ? 'Active' : 'En pause'}</span>
                      </label>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => supprimerContact(a.id, 'alertes_email')} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
                {alertes.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400">Aucune alerte</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Sous-composant estimation avec état local pour statut/notes
const EstimationRow = ({ est, onUpdate, onDelete, showToast }) => {
  const statutMap = { nouveau: 'Nouveau', en_cours: 'En cours', rdv_planifie: 'RDV planifié', traite: 'Traité', archive: 'Archivé' };
  const [statut, setStatut] = useState(est.statut || 'nouveau');
  const [notes, setNotes] = useState(est.notes_interne || '');
  const [saving, setSaving] = useState(false);
  

  const sauvegarder = async () => {
    setSaving(true);
    await onUpdate(est.id, statut, notes);
    setSaving(false);
  };

  const statutColor = { nouveau: 'bg-red-100 text-red-700', en_cours: 'bg-yellow-100 text-yellow-700', rdv_planifie: 'bg-blue-100 text-blue-700', traite: 'bg-green-100 text-green-700', archive: 'bg-gray-100 text-gray-600' };

  return (
    <tr className="hover:bg-gray-50 group">
      <td className="p-4">
        <p className="font-semibold text-gray-800">{est.prenom} {est.nom}</p>
        <a href={`mailto:${est.email}`} className="text-xs text-indigo-600 hover:underline">{est.email}</a>
        {est.telephone && <p className="text-xs text-gray-500">{est.telephone}</p>}
      </td>
      <td className="p-4">
        <p className="font-semibold text-gray-800 text-sm">{est.type_bien}</p>
        {est.surface_habitable > 0 && <p className="text-xs text-gray-500">{est.surface_habitable} m² · {est.nb_pieces} pièces</p>}
        {est.adresse && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={10}/>{est.adresse}</p>}
      </td>
      <td className="p-4">
        <select value={statut} onChange={e => setStatut(e.target.value)}
          className={`text-xs rounded px-2 py-1 font-semibold border-0 outline-none cursor-pointer ${statutColor[statut]}`}>
          {Object.entries(statutMap).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </td>
      <td className="p-4">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note interne…"
          className="text-xs border border-gray-200 rounded p-1.5 w-40 bg-yellow-50/50 resize-none h-10 outline-none focus:border-yellow-400"/>
        <button onClick={sauvegarder} disabled={saving}
          className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
          {saving ? 'Sauvegarde…' : <><Check size={11}/> Sauvegarder</>}
        </button>
      </td>
      <td className="p-4 text-xs text-gray-500 font-mono">{formatDateTime(est.created_at)}</td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-1">
          <a href={`mailto:${est.email}?subject=Votre estimation`} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Mail size={14}/></a>
          <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
        </div>
      </td>
    </tr>
  );
};

// ══════════════════════════════════════════════════════════════
// SETTINGS VIEW
// ══════════════════════════════════════════════════════════════
const SettingsView = () => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [photosEquipe, setPhotosEquipe] = useState([]);

  const chargerPhotos = () => {
    fetch(`${API}?action=photos_equipe`).then(r => r.json()).then(d => setPhotosEquipe(Array.isArray(d) ? d : []));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const chargerDocs = () => {
    fetch(`${API}?action=documents`).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setDocuments(data);
    });
  };

  useEffect(() => { chargerDocs(); chargerPhotos(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { showToast('PDF uniquement', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Fichier trop grand (max 5Mo)', 'error'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('pdf', file);
    try {
      const res = await fetch(`${API}?action=upload_bareme`, { method: 'POST', body: fd }).then(r => r.json());
      if (res.success) { showToast('Barème mis à jour !'); chargerDocs(); }
      else showToast(res.message || 'Erreur upload', 'error');
    } catch { showToast('Erreur réseau', 'error'); }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Settings size={22} className="text-indigo-600"/> Honoraires</h2>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><FileCheck size={18} className="text-indigo-600"/> Barème d'honoraires</h3>
          <p className="text-sm text-gray-500 mt-1">Uploadez le nouveau PDF — l'ancien sera archivé automatiquement.</p>
        </div>
        <div className="p-5">
          <label className={`border-2 border-dashed rounded-xl p-10 text-center block cursor-pointer transition-colors ${uploading ? 'border-indigo-300 bg-indigo-50' : 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50'}`}>
            <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading}/>
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-white rounded-full shadow-sm"><UploadCloud size={32} className="text-indigo-500"/></div>
              <p className="font-bold text-indigo-900">{uploading ? 'Upload en cours…' : 'Cliquez ou glissez votre PDF ici'}</p>
              <p className="text-sm text-indigo-600/70">PDF uniquement — max 5 Mo</p>
            </div>
          </label>

          <div className="mt-8">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest">Historique des barèmes</h4>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucun document uploadé</p>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase">
                    <tr><th className="p-4">Document</th><th className="p-4">Date d'upload</th><th className="p-4 text-right">Télécharger</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documents.map(doc => (
                      <tr key={doc.id} className={doc.actif == 1 ? 'bg-green-50/30' : 'hover:bg-gray-50'}>
                        <td className="p-4 flex items-center gap-3">
                          <FileArchive size={18} className={doc.actif == 1 ? 'text-green-600' : 'text-gray-400'}/>
                          <span className={doc.actif == 1 ? 'font-bold text-green-900' : 'font-medium text-gray-600'}>{doc.nom_original}</span>
                          {doc.actif == 1 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">En ligne</span>}
                        </td>
                        <td className="p-4 font-mono text-xs text-gray-500">{formatDateTime(doc.uploaded_at)}</td>
                        <td className="p-4 text-right">
                          <a href={`/remax/uploads/documents/${doc.nom_fichier}`} target="_blank" rel="noreferrer"
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg inline-flex">
                            <DownloadCloud size={16}/>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
{/* Photo équipe */}
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <div className="p-5 border-b border-gray-100 bg-gray-50/50">
    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
      <FileCheck size={18} className="text-indigo-600"/> Photo de l'équipe
    </h3>
    <p className="text-sm text-gray-500 mt-1">Remplace la photo principale de la page Agence.</p>
  </div>
  <div className="p-5">
    <img src={`https://acces-immobilier.com/assets/images/equipe54b0.jpg?${Date.now()}`} 
      alt="Équipe" className="w-full h-48 object-cover rounded-xl mb-4"/>
    <label className="border-2 border-dashed rounded-xl p-6 text-center block cursor-pointer transition-colors border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50">
      <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('photo', file);
        const res = await fetch(`${API}?action=upload_photo_equipe`, { method: 'POST', body: fd }).then(r => r.json());
        if (res.success) { showToast('Photo mise à jour !'); chargerPhotos(); }
        else showToast(res.message || 'Erreur', 'error');
        e.target.value = '';
      }}/>
      <p className="font-bold text-indigo-900">Cliquez pour changer la photo</p>
      <p className="text-sm text-indigo-600/70 mt-1">JPG/PNG/WEBP — max 5 Mo</p>
    </label>

    <div className="mt-8">
      <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest">Historique des photos</h4>
      {photosEquipe.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Aucune photo uploadée</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase">
              <tr><th className="p-4">Fichier</th><th className="p-4">Date d'upload</th><th className="p-4 text-center">Statut</th><th className="p-4 text-center">Télécharger</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {photosEquipe.map(p => (
                <tr key={p.id} className={p.actif == 1 ? 'bg-green-50/30' : 'hover:bg-gray-50'}>
                  <td className="p-4 font-medium text-gray-600">{p.nom_fichier}</td>
                  <td className="p-4 font-mono text-xs text-gray-500">{formatDateTime(p.uploaded_at)}</td>
                  <td className="p-4 text-center">
    {p.actif == 1 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">En ligne</span>}
</td>
<td className="p-4 text-center">
    <a href={`https://acces-immobilier.com/assets/images/${p.nom_fichier}`} download target="_blank"
        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg inline-flex">
        <DownloadCloud size={16}/>
    </a>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
</div>
</div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// BLOG VIEW
// ══════════════════════════════════════════════════════════════
const STYLE_PROMPT = `Tu es un rédacteur expert en immobilier pour l'agence RE/MAX Acces Immobilier située à Trèbes (11800), dans l'Aude.

SUJET DE L'ARTICLE : [À REMPLACER PAR VOTRE SUJET ICI]
Exemple : "Les étapes pour acheter un bien immobilier dans l'Aude"

STYLE ÉDITORIAL :
- Ton professionnel mais accessible, chaleureux et de proximité
- Phrases courtes et percutantes
- Vocabulaire immobilier précis mais compréhensible
- Toujours orienté vers le lecteur (utilise "vous")
- Termine toujours par un appel à l'action vers l'agence

STRUCTURE DE L'ARTICLE :
- Titre accrocheur avec le mot-clé principal
- Introduction (2-3 phrases qui posent le problème ou la question)
- 3 à 5 sections avec sous-titres (balises H2)
- Conclusion avec CTA : "Contactez RE/MAX Acces Immobilier au 04 68 78 53 20"

ZONE GÉOGRAPHIQUE : Trèbes, Carcassonne, Aude, Occitanie
MOTS-CLÉS À INTÉGRER NATURELLEMENT : immobilier Trèbes, agence immobilière Carcassonne, RE/MAX Aude

FORMAT DE SORTIE REQUIS — réponds avec exactement ces champs dans cet ordre :

🇫🇷 FRANÇAIS
---
TITRE FR : [titre accrocheur, max 70 caractères]
EXTRAIT FR : [résumé 1-2 phrases, max 160 caractères, donne envie de lire]
CONTENU FR : [contenu complet en HTML avec <h2>, <p>, <ul>, <li>, <strong> — pas de <html><head><body>]
META TITLE FR : [max 60 caractères, inclure mot-clé + ville]
META DESCRIPTION FR : [max 155 caractères, résumé incitatif pour Google]

🇬🇧 ENGLISH
---
TITRE EN : [translated title]
EXTRAIT EN : [translated excerpt, max 160 chars]
CONTENU EN : [full HTML content translated in English]
META TITLE EN : [max 60 chars]
META DESCRIPTION EN : [max 155 chars]

⚙️ PARAMÈTRES
---
SLUG : [url-en-minuscules-sans-accents-avec-tirets]
AUTEUR : RE/MAX Acces Immobilier
IMAGE SUGGESTION : [décris en anglais une image idéale pour illustrer cet article, pour recherche sur unsplash.com]

RÈGLES STRICTES :
- Le slug doit être en minuscules, sans accents, sans espaces (remplacés par des tirets)
- Meta title FR : maximum 60 caractères ABSOLUS
- Meta description FR : maximum 155 caractères ABSOLUS
- Meta title EN : maximum 60 caractères ABSOLUS
- Meta description EN : maximum 155 caractères ABSOLUS
- Le contenu HTML ne doit contenir que : <h2> <p> <ul> <li> <strong> <em> <a>
- Termine toujours le contenu FR et EN par : <p><strong>Contactez RE/MAX Acces Immobilier au 04 68 78 53 20</strong> ou visitez notre agence à Trèbes pour un accompagnement personnalisé.</p>`;

const slugify = (str) => str.toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const Tooltip = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs cursor-help font-bold hover:bg-indigo-100 hover:text-indigo-600"
      >?</span>
      {show && (
        <span className="absolute z-50 left-6 top-0 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 shadow-xl leading-relaxed">
          {text}
        </span>
      )}
    </span>
  );
};

const BlogView = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vue, setVue] = useState('liste'); // liste | editeur
  const [articleEnCours, setArticleEnCours] = useState(null);
  const [ongletLang, setOngletLang] = useState('fr');
  const [previsualisation, setPrevisualisation] = useState(false);
  const [toast, setToast] = useState(null);
  const [promptCopie, setPromptCopie] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statsArticles, setStatsArticles] = useState({});
  const [modalStats, setModalStats] = useState(null); // article sélectionné
  const [statsDetail, setStatsDetail] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const charger = () => {
    setLoading(true);
    fetch(`${API}?action=blog_articles`).then(r => r.json()).then(data => {
      setArticles(Array.isArray(data) ? data : []);
      setLoading(false);
data.forEach(a => {
  fetch(`${API}?action=blog_stats&id=${a.id}`)
    .then(r => r.json())
    .then(s => setStatsArticles(prev => ({ ...prev, [a.id]: s })));
});
    }).catch(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const nouvelArticle = () => {
    setArticleEnCours({
      id: 0, titre_fr: '', titre_en: '', slug: '',
      extrait_fr: '', extrait_en: '',
      contenu_fr: '', contenu_en: '',
      image_url: '', auteur: 'RE/MAX Acces Immobilier',
      statut: 'brouillon',
      meta_title_fr: '', meta_title_en: '',
      meta_description_fr: '', meta_description_en: ''
    });
    setVue('editeur');
    setOngletLang('fr');
    setPrevisualisation(false);
  };

  const editer = (article) => {
    setArticleEnCours({ ...article });
    setVue('editeur');
    setOngletLang('fr');
    setPrevisualisation(false);
};

  const sauvegarder = async (statut = null) => {
    if (!articleEnCours.titre_fr) { showToast('Le titre français est obligatoire', 'error'); return; }
    setSaving(true);
    const data = { ...articleEnCours };
    if (statut) data.statut = statut;
    if (!data.slug) data.slug = slugify(data.titre_fr);
    if (!data.meta_title_fr) data.meta_title_fr = data.titre_fr;

    const res = await apiPost('save_article', data);
    setSaving(false);
    if (res.success) {
      showToast(statut === 'publie' ? '🎉 Article publié !' : 'Article sauvegardé !');
      setArticleEnCours(prev => ({ ...prev, id: res.id, statut: statut || prev.statut }));
      charger();
    } else showToast('Erreur lors de la sauvegarde', 'error');
  };

  const toggleStatut = async (article) => {
    const nouveau = article.statut === 'publie' ? 'brouillon' : 'publie';
    const res = await apiPost('toggle_statut_article', { id: article.id, statut: nouveau });
    if (res.success) { showToast(nouveau === 'publie' ? 'Article publié !' : 'Article dépublié'); charger(); }
    else showToast('Erreur', 'error');
  };

  const supprimer = async (article) => {
    if (!confirm(`Supprimer "${article.titre_fr}" ?`)) return;
    const res = await apiPost('delete_article', { id: article.id });
    if (res.success) { showToast('Article supprimé'); charger(); }
    else showToast('Erreur', 'error');
  };

  const copierPrompt = () => {
    navigator.clipboard.writeText(STYLE_PROMPT);
    setPromptCopie(true);
    setTimeout(() => setPromptCopie(false), 2000);
  };

  const statutBadge = (s) => {
    if (s === 'publie')  return <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-green-100 text-green-700 border border-green-200 whitespace-nowrap inline-flex items-center gap-1">✅ Publié</span>;
    if (s === 'archive') return <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-gray-100 text-gray-500 border border-gray-200 whitespace-nowrap inline-flex items-center gap-1">📦 Archivé</span>;
    return <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 whitespace-nowrap inline-flex items-center gap-1">✏️ Brouillon</span>;
};

const voirStats = (article) => {
  setModalStats(article);
  fetch(`${API}?action=blog_stats_detail&id=${article.id}`)
    .then(r => r.json())
    .then(setStatsDetail);
};

  // ── VUE LISTE ─────────────────────────────────────────────
  // ── VUE LISTE ─────────────────────────────────────────────
  if (vue === 'liste') return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}

      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileCheck size={22} className="text-indigo-600"/> Conseils Immobiliers
          </h2>
          <p className="text-sm text-gray-500">{articles.length} article(s)</p>
        </div>
        <div className="flex gap-3">
          <button onClick={copierPrompt}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all ${promptCopie ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            {promptCopie ? <><Check size={15}/> Prompt copié !</> : <><FileCheck size={15}/> Copier le prompt IA</>}
          </button>
          <button onClick={nouvelArticle} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus size={15}/> Nouvel article
          </button>
        </div>
      </div>

      {/* Info prompt */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-2xl">🤖</span>
        <div>
          <p className="font-semibold text-indigo-800 text-sm">Prompt de style IA</p>
          <p className="text-xs text-indigo-600 mt-1">
  1️⃣ Cliquez sur "Copier le prompt IA"<br/>
  2️⃣ Collez-le dans ChatGPT, Claude ou Gemini<br/>
  3️⃣ Remplacez <strong>[À REMPLACER PAR VOTRE SUJET ICI]</strong> par votre sujet (ex: "conseils pour vendre sa maison à Carcassonne")<br/>
  4️⃣ Copiez-collez chaque champ de la réponse dans le formulaire de l'article
</p>
        </div>
      </div>

      {/* Liste articles */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
              <th className="p-4">Article</th>
              <th className="p-4">Auteur</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-center">Stats</th>
              <th className="p-4 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Chargement…</td></tr>
              ) : articles.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">
                  <p className="text-4xl mb-2">📝</p>
                  <p>Aucun article — créez votre premier conseil immobilier !</p>
                </td></tr>
              ) : articles.map(a => (
                <tr key={a.id} className="hover:bg-indigo-50/20 group">
                  <td className="p-4">
                    <p className="font-semibold text-gray-800">{a.titre_fr}</p>
                    {a.titre_en && <p className="text-xs text-gray-400 italic">{a.titre_en}</p>}
                    <p className="text-xs text-gray-400 font-mono mt-0.5">/{a.slug}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{a.auteur}</td>
                  <td className="p-4">{statutBadge(a.statut)}</td>
                  <td className="p-4 text-xs text-gray-500 font-mono">
  <p>Créé : {formatDateTime(a.created_at)}</p>
  {a.publie_at && <p className="text-green-600">Publié : {formatDateTime(a.publie_at)}</p>}
</td>
                  <td className="p-4 text-center">
                    <button onClick={() => voirStats(a)} className="flex flex-col items-center gap-1 text-xs hover:bg-indigo-50 p-2 rounded-lg w-full">
                      <span className="font-bold text-indigo-600">👁️ {statsArticles[a.id]?.vues || 0} vues</span>
                      <span className="text-gray-400">👤 {statsArticles[a.id]?.uniques || 0} uniques</span>
                      <span className="text-gray-400">⏱️ {statsArticles[a.id]?.duree_moy ? (statsArticles[a.id].duree_moy >= 60 ? Math.floor(statsArticles[a.id].duree_moy / 60) + 'min ' + Math.round(statsArticles[a.id].duree_moy % 60) + 's' : Math.round(statsArticles[a.id].duree_moy) + 's') : '—'}</span>
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => editer(a)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Modifier"><Edit size={15}/></button>
                      <button onClick={() => toggleStatut(a)}
                        className={`p-1.5 rounded-lg text-xs font-medium px-2 ${a.statut === 'publie' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                        {a.statut === 'publie' ? 'Dépublier' : 'Publier'}
                      </button>
                      <button onClick={() => supprimer(a)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Supprimer"><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal stats */}
      <Modal isOpen={!!modalStats} onClose={() => { setModalStats(null); setStatsDetail(null); }} title={`Stats — ${modalStats?.titre_fr}`}>
        {!statsDetail ? (
          <p className="text-center text-gray-400 py-8">Chargement...</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 rounded-xl p-3 text-center">
                <p className="text-xs text-indigo-500 uppercase font-semibold">Vues totales</p>
                <p className="text-2xl font-black text-indigo-700">{statsDetail.vues || 0}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xs text-blue-500 uppercase font-semibold">Visiteurs uniques</p>
                <p className="text-2xl font-black text-blue-700">{statsDetail.visiteurs_uniques || 0}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xs text-green-500 uppercase font-semibold">Durée moyenne</p>
                <p className="text-2xl font-black text-green-700">{statsDetail.duree_moy ? (statsDetail.duree_moy >= 60 ? Math.floor(statsDetail.duree_moy / 60) + 'min ' + Math.round(statsDetail.duree_moy % 60) + 's' : Math.round(statsDetail.duree_moy) + 's') : '—'}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-xs text-orange-500 uppercase font-semibold">FR / EN</p>
                <p className="text-2xl font-black text-orange-700">{statsDetail.vues_fr || 0} / {statsDetail.vues_en || 0}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2">🌍 Localisation des lecteurs</h4>
              {!statsDetail.geo || statsDetail.geo.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucune donnée géographique</p>
              ) : (
                <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
                  <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <th className="p-3 text-left">Ville</th>
                    <th className="p-3 text-left">Pays</th>
                    <th className="p-3 text-center">Visites</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {statsDetail.geo.map((g, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-800">{g.ville || '—'}</td>
                        <td className="p-3 text-gray-500 text-xs">{g.pays}</td>
                        <td className="p-3 text-center font-bold text-indigo-600">{g.visites}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );

 // ── VUE ÉDITEUR ───────────────────────────────────────────
  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}

      {/* Header éditeur */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { setVue('liste'); charger(); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
          <h2 className="text-xl font-bold text-gray-800">
            {articleEnCours.id ? 'Modifier l\'article' : 'Nouvel article'}
          </h2>
          {articleEnCours.id && statutBadge(articleEnCours.statut)}
        </div>
        <div className="flex gap-2">
          <button onClick={async () => {
  await sauvegarder(articleEnCours.statut || 'brouillon');
  window.open(`https://acces-immobilier.com/fr/blog-article.html?slug=${articleEnCours.slug || slugify(articleEnCours.titre_fr)}&preview=1`, '_blank');
}}
className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
  <Eye size={15}/> Prévisualiser
</button>
          <button onClick={() => sauvegarder('brouillon')} disabled={saving}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            {saving ? <RefreshCw size={14} className="animate-spin"/> : <Download size={14}/>} Brouillon
          </button>
          <button onClick={() => sauvegarder('publie')} disabled={saving}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <Send size={14}/> Publier
          </button>
        </div>
      </div>

      {previsualisation ? (
        /* PRÉVISUALISATION */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-5 py-3 flex gap-3 border-b border-gray-200">
            <button onClick={() => setOngletLang('fr')} className={`text-sm font-medium px-3 py-1 rounded ${ongletLang==='fr' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>🇫🇷 Français</button>
            <button onClick={() => setOngletLang('en')} className={`text-sm font-medium px-3 py-1 rounded ${ongletLang==='en' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>🇬🇧 English</button>
          </div>
          <div className="p-8 max-w-3xl mx-auto">
            {articleEnCours.image_url && <img src={articleEnCours.image_url} alt="" className="w-full h-64 object-cover rounded-xl mb-6"/>}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {ongletLang === 'fr' ? articleEnCours.titre_fr : articleEnCours.titre_en || articleEnCours.titre_fr}
            </h1>
            <p className="text-gray-500 text-sm mb-6">Par {articleEnCours.auteur} — {new Date().toLocaleDateString('fr-FR')}</p>
            <div className="prose max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: ongletLang === 'fr' ? articleEnCours.contenu_fr : (articleEnCours.contenu_en || articleEnCours.contenu_fr) }}/>
          </div>
        </div>
      ) : (
        /* ÉDITEUR */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-4">

            {/* Onglets langues */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button onClick={() => setOngletLang('fr')} className={`flex-1 py-3 text-sm font-medium ${ongletLang==='fr' ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700'}`}>🇫🇷 Français</button>
                <button onClick={() => setOngletLang('en')} className={`flex-1 py-3 text-sm font-medium ${ongletLang==='en' ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700'}`}>🇬🇧 English</button>
              </div>
              <div className="p-5 space-y-4">
                {ongletLang === 'fr' ? (<>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre français * <Tooltip text="Le titre principal de votre article. Soyez clair et accrocheur. Ex: '5 conseils pour vendre rapidement à Trèbes'"/></label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                      value={articleEnCours.titre_fr}
                      onChange={e => setArticleEnCours(prev => ({
                        ...prev,
                        titre_fr: e.target.value,
                        slug: prev.slug || slugify(e.target.value)
                      }))}
                      placeholder="Ex: 5 conseils pour vendre votre maison rapidement"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Extrait français <Tooltip text="Court résumé de 1-2 phrases affiché dans la liste des articles. Donnez envie de lire la suite !"/></label>
                    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none h-20"
                      value={articleEnCours.extrait_fr}
                      onChange={e => setArticleEnCours(prev => ({ ...prev, extrait_fr: e.target.value }))}
                      placeholder="Résumé court affiché dans la liste des articles..."/>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Contenu français (HTML) <Tooltip text="Le contenu complet en HTML. Utilisez le bouton 'Copier prompt IA' puis collez le résultat de ChatGPT/Claude ici."/></label>
                      <button onClick={copierPrompt} className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${promptCopie ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        {promptCopie ? '✅ Copié !' : '🤖 Copier prompt IA'}
                      </button>
                    </div>
                    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none font-mono h-64"
                      value={articleEnCours.contenu_fr}
                      onChange={e => setArticleEnCours(prev => ({ ...prev, contenu_fr: e.target.value }))}
                      placeholder="<h2>Mon titre</h2><p>Mon paragraphe...</p>"/>
                  </div>
                </>) : (<>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">English title</label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                      value={articleEnCours.titre_en}
                      onChange={e => setArticleEnCours(prev => ({ ...prev, titre_en: e.target.value }))}
                      placeholder="Ex: 5 tips to sell your house quickly"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">English excerpt</label>
                    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none h-20"
                      value={articleEnCours.extrait_en}
                      onChange={e => setArticleEnCours(prev => ({ ...prev, extrait_en: e.target.value }))}
                      placeholder="Short summary displayed in the article list..."/>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">English content (HTML)</label>
                      <span className="text-xs text-gray-400 italic">💡 Traduisez le contenu FR avec une IA</span>
                    </div>
                    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none font-mono h-64"
                      value={articleEnCours.contenu_en}
                      onChange={e => setArticleEnCours(prev => ({ ...prev, contenu_en: e.target.value }))}
                      placeholder="<h2>My title</h2><p>My paragraph...</p>"/>
                  </div>
                </>)}
              </div>
            </div>
          </div>

          {/* Sidebar paramètres */}
          <div className="space-y-4">

            {/* Image */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3">🖼️ Image de couverture <Tooltip text="URL d'une image en ligne. Allez sur unsplash.com, choisissez une photo, clic droit → Copier l'adresse de l'image."/></h4>
              {articleEnCours.image_url && (
                <img src={articleEnCours.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-3"/>
              )}
              <input type="url" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500"
                value={articleEnCours.image_url}
                onChange={e => setArticleEnCours(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://url-de-limage.jpg"/>
            </div>

            {/* Slug & Auteur */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h4 className="text-sm font-bold text-gray-700">⚙️ Paramètres</h4>
              <div>
                <label className="block text-xs text-gray-500 mb-1">URL (slug) <Tooltip text="L'adresse web de l'article, générée automatiquement. Ne pas modifier sauf si nécessaire. Ex: mes-conseils-vente"/></label>
                <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 font-mono"
                  value={articleEnCours.slug}
                  onChange={e => setArticleEnCours(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="mon-article-seo"/>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Auteur</label>
                <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  value={articleEnCours.auteur}
                  onChange={e => setArticleEnCours(prev => ({ ...prev, auteur: e.target.value }))}/>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h4 className="text-sm font-bold text-gray-700">🔍 SEO</h4>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Meta title FR <Tooltip text="Titre affiché dans Google. Entre 50 et 60 caractères. Incluez le mot-clé principal et la ville."/></label>
                <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  value={articleEnCours.meta_title_fr}
                  onChange={e => setArticleEnCours(prev => ({ ...prev, meta_title_fr: e.target.value }))}
                  placeholder="Titre SEO français"/>
                <p className="text-xs text-gray-400 mt-1">{(articleEnCours.meta_title_fr || '').length}/60 car.</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Meta description FR <Tooltip text="Texte affiché sous le titre dans Google. Maximum 155 caractères. Résumez l'article et incitez à cliquer."/></label>

                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 resize-none h-16"
                  value={articleEnCours.meta_description_fr}
                  onChange={e => setArticleEnCours(prev => ({ ...prev, meta_description_fr: e.target.value }))}
                  placeholder="Description SEO française (155 car. max)"/>
                <p className={`text-xs mt-1 ${(articleEnCours.meta_description_fr || '').length > 155 ? 'text-red-500' : 'text-gray-400'}`}>{(articleEnCours.meta_description_fr || '').length}/155 car.</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Meta title EN</label>
                <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  value={articleEnCours.meta_title_en}
                  onChange={e => setArticleEnCours(prev => ({ ...prev, meta_title_en: e.target.value }))}
                  placeholder="SEO title english"/>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Meta description EN</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 resize-none h-16"
                  value={articleEnCours.meta_description_en}
                  onChange={e => setArticleEnCours(prev => ({ ...prev, meta_description_en: e.target.value }))}
                  placeholder="SEO description english (155 chars max)"/>
              </div>
            </div>

            {/* Statut */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3">📢 Statut <Tooltip text="Brouillon = non visible sur le site. Publié = visible par tous. Archivé = retiré du site mais conservé."/></h4>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                value={articleEnCours.statut}
                onChange={e => setArticleEnCours(prev => ({ ...prev, statut: e.target.value }))}>
                <option value="brouillon">✏️ Brouillon</option>
                <option value="publie">✅ Publié</option>
                <option value="archive">📦 Archivé</option>
              </select>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

const LOGIN_USER = 'admin';
const LOGIN_PASSWORD = 'remax2024';

const LoginView = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === LOGIN_USER && pwd === LOGIN_PASSWORD) {
      localStorage.setItem('immo_auth', '1');
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-black text-2xl shadow-lg mx-auto mb-4">AI</div>
          <h1 className="text-2xl font-black text-gray-800">ImmoAdmin</h1>
          <p className="text-sm text-gray-500 mt-1">RE/MAX Acces Immobilier</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
            <input type="text" value={user} onChange={e => setUser(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500"
              placeholder="admin" autoFocus/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" value={pwd} onChange={e => setPwd(e.target.value)}
              className={`w-full border rounded-lg px-4 py-3 text-sm outline-none transition-colors ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-indigo-500'}`}
              placeholder="••••••••"/>
            {error && <p className="text-xs text-red-500 mt-1">Identifiants incorrects</p>}
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white rounded-lg py-3 text-sm font-bold hover:bg-indigo-700 transition-colors">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// APP PRINCIPALE
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('immo_auth') === '1');

  if (!isAuth) return <LoginView onLogin={() => setIsAuth(true)}/>;

  const menu = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'clients',   label: 'Fichier Clients',  icon: Users },
  { id: 'forms',     label: 'Formulaires',       icon: Inbox },
  { id: 'blog',      label: 'Blog',              icon: FileCheck },
  { id: 'settings',  label: 'Honoraires',        icon: Settings },
];

  const handleSetTab = (tab) => { setActiveTab(tab); localStorage.setItem('activeTab', tab); };
const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView setActiveTab={setActiveTab}/>;
      case 'clients':   return <ClientsView/>;
      case 'forms':     return <FormsView/>;
      case 'settings':  return <SettingsView/>;
      case 'blog':      return <BlogView/>;
      default:          return <DashboardView setActiveTab={setActiveTab}/>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-gradient-to-br from-slate-50 to-indigo-50/40 flex flex-col md:flex-row font-sans text-gray-900">

      {/* Mobile header */}
      <div className="md:hidden bg-white/90 backdrop-blur-xl border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <h1 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">ImmoAdmin.</h1>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Menu size={22}/></button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-60 bg-white/95 backdrop-blur-2xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col shadow-2xl md:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 hidden md:block border-b border-gray-100">
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">ImmoAdmin.</h1>
          <p className="text-xs text-gray-400 mt-0.5">RE/MAX Acces Immobilier</p>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {menu.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { handleSetTab(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium border border-transparent
                  ${active ? 'bg-gradient-to-r from-indigo-50 to-blue-50/50 text-indigo-700 border-indigo-100/50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Icon size={18} className={active ? 'text-indigo-600' : 'text-gray-400'}/>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100 m-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md">AI</div>
            <div>
              <p className="text-sm font-bold text-gray-800">Administrateur</p>
<button onClick={() => { localStorage.removeItem('immo_auth'); setIsAuth(false); }} 
  className="text-xs text-red-500 hover:text-red-700 mt-1">Déconnexion</button>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span> En ligne</p>
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setMobileOpen(false)}/>}

      <main className="flex-1 overflow-x-hidden overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 pb-20">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
