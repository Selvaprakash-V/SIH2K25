import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function OnboardingModal({ isOpen, onComplete, initial }) {
  const [language, setLanguage] = useState(initial?.language || 'en');
  const [role, setRole] = useState(initial?.role || 'district');
  const [state, setState] = useState(initial?.state || '');
  const [district, setDistrict] = useState(initial?.district || '');
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/states').then(res => setStates(res.data.states || [])).catch(() => setStates([]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (state) {
      api.get(`/districts/${state}`).then(res => setDistricts(res.data.districts || [])).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
      setDistrict('');
    }
  }, [state]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!language || !role || !state || (role === 'district' && !district)) return;
    onComplete({ language, role, state, district: role === 'district' ? district : '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Welcome! Set up your preferences</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Choose language, role, and region to personalize your experience.</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preferred Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="bn">Bengali</option>
              <option value="mr">Marathi</option>
              <option value="ml">Malayalam</option>
              <option value="kn">Kannada</option>
              <option value="gu">Gujarati</option>
              <option value="pa">Punjabi</option>
              <option value="or">Odia</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
              <option value="admin">Admin</option>
              <option value="state">State</option>
              <option value="district">District</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
            <select value={state} onChange={e => setState(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
              <option value="">Select State</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {role === 'district' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">District</label>
              <select value={district} onChange={e => setDistrict(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                <option value="">Select District</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">Continue</button>
          </div>
        </form>
      </div>
    </div>
  );
}
