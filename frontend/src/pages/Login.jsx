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
      api.get(`/districts/${form.state}`)
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">RQ</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Select Role, Language & Region
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please choose your role and region to proceed.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Select Role</option>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
              <select
                name="language"
                value={form.language}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">District</label>
                <select
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Village</label>
                <select
                  name="village"
                  value={form.village}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              disabled={!form.role || (showState && !form.state) || (showDistrict && !form.district) || (showVillage && !form.village)}
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
