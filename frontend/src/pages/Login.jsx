import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useLang } from '../store/LangContext';
import api from '../services/api';

// Role options for the new login
const ROLES = [
  { value: 'village', label: 'Village Functionary' },
  { value: 'district', label: 'District Officer' },
  { value: 'state', label: 'State Officer' },
  { value: 'central', label: 'Central Government Officer' },
];

export default function Login() {
  const { updateUser } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [form, setForm] = useState({
    role: '',
    language: lang,
    state: '',
    district: '',
    village: '',
  });

  // Fetch states on mount
  useEffect(() => {
    api.get('/states')
      .then(res => setStates(res.data.states || []))
      .catch(() => setStates([]));
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    if (form.state) {
      api.get(`/districts?state=${form.state}`)
        .then(res => setDistricts(res.data.districts || []))
        .catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
    setForm(f => ({ ...f, district: '', village: '' }));
  }, [form.state]);

  // Fetch villages from MongoDB for login selection
  useEffect(() => {
    if (form.role === 'village') {
      // Fetch all villages from the database
      api.get('/villages')
        .then(res => setVillages(res.data.villages || res.data || []))
        .catch(() => setVillages([]));
      setForm(f => ({ ...f, village: '' }));
    } else if (form.district) {
      // Fetch villages for selected district
      api.get(`/villages?state=${form.state}&district=${form.district}`)
        .then(res => setVillages(res.data.villages || res.data || []))
        .catch(() => setVillages([]));
      setForm(f => ({ ...f, village: '' }));
    } else {
      setVillages([]);
      setForm(f => ({ ...f, village: '' }));
    }
  }, [form.role, form.district, form.state]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'role') {
      setForm(f => ({ ...f, state: '', district: '', village: '' }));
    }
    if (name === 'language') {
      setLang(value);
    }
  };

  // Handle login (no credentials, just set user context)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // For village functionaries, auto-populate district and state from selected village
    let finalState = form.state;
    let finalDistrict = form.district;
    
    if (form.role === 'village' && form.village) {
      const selectedVillageData = villages.find(v => v.name === form.village);
      if (selectedVillageData) {
        finalState = selectedVillageData.state;
        finalDistrict = selectedVillageData.district;
      }
    }
    
    // Compose user object for context
    const user = {
      role: form.role,
      language: form.language,
      state: finalState,
      district: finalDistrict,
      village: form.village,
      name: form.role ? ROLES.find(r => r.value === form.role)?.label : '',
    };
    updateUser(user);
    navigate('/dashboard');
  };

  // Region selection logic based on role
  const showState = [
    'district', 'state', 'central'
  ].includes(form.role);
  const showDistrict = ['district'].includes(form.role);
  const showVillage = form.role === 'village';

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: `url('/images.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      {/* Content */}
      <div className="relative max-w-md w-full space-y-8 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <span className="text-white font-bold text-2xl">🏛️</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Rural IQ
            </h2>
            <p className="text-sm text-gray-600">
              Select your role and region to proceed to the dashboard
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-200 hover:border-green-400"
                >
                  <option value="">Select Role</option>
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-200 hover:border-green-400"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="ml">മലയാളം (Malayalam)</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                  <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="or">ଓଡ଼ିଆ (Odia)</option>
                  <option value="as">অসমীয়া (Assamese)</option>
                </select>
              </div>
              {/* State */}
              {showState && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-200 hover:border-green-400"
                  >
                    <option value="">Select State</option>
                    {states.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* District */}
              {showDistrict && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <select
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-200 hover:border-green-400"
                  >
                    <option value="">Select District</option>
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Village */}
              {showVillage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                  <select
                    name="village"
                    value={form.village}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-200 hover:border-green-400"
                  >
                    <option value="">Select Village</option>
                    {villages.map(v => (
                      <option key={v.id || v} value={v.name || v}>{v.name || v}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                disabled={!form.role || (showState && !form.state) || (showDistrict && !form.district) || (showVillage && !form.village)}
              >
                <span className="flex items-center">
                  Continue to Dashboard
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>
          </form>
        </div>
        
        {/* Footer with rural theme */}
        <div className="text-center">
          <p className="text-white/90 text-sm backdrop-blur-sm bg-black/20 rounded-lg px-4 py-2 inline-block">
            Empowering Rural Development Through Technology 🌾
          </p>
        </div>
      </div>
    </div>
  );
}
