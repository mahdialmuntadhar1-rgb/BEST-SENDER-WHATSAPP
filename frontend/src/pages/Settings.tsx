import React, { useState, useEffect } from 'react';
import { setStoredCredentials, getStoredCredentials, getNabdaStatus } from '../services/api';
import { CheckCircle, AlertCircle } from 'lucide-react';

export const getStoredDelay = () => parseInt(localStorage.getItem('nabda_delay_ms') || '1500');
export const setStoredDelay = (ms: number) => localStorage.setItem('nabda_delay_ms', String(ms));
export const getStoredBatchSize = () => parseInt(localStorage.getItem('nabda_batch_size') || '50');
export const setStoredBatchSize = (n: number) => localStorage.setItem('nabda_batch_size', String(n));

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [delayMs, setDelayMs] = useState(1500);
  const [batchSize, setBatchSize] = useState(50);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    const creds = getStoredCredentials();
    setApiKey(creds.apiKey);
    setInstanceId(creds.instanceId);
    setDelayMs(getStoredDelay());
    setBatchSize(getStoredBatchSize());
  }, []);

  const handleSave = () => {
    setStoredCredentials(apiKey, instanceId);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await getNabdaStatus(apiKey, instanceId);
      setTestResult({ success: true, message: 'Connection successful! Instance is active.' });
    } catch (err: any) {
      setTestResult({ success: false, message: err.response?.data?.error || 'Connection failed. Check your credentials.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = () => {
    setStoredDelay(delayMs);
    setStoredBatchSize(batchSize);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      {/* Sending Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sending Settings</h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Delay Between Messages</label>
              <span className="text-sm font-semibold text-primary-600">{delayMs}ms ({(delayMs/1000).toFixed(1)}s)</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={delayMs}
              onChange={(e) => setDelayMs(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>500ms (fast)</span>
              <span>5000ms (slow/safe)</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Higher delay reduces the risk of being blocked by WhatsApp.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Batch Size</label>
            <div className="flex gap-2">
              {[20, 50, 100, 0].map((v) => (
                <button
                  key={v}
                  onClick={() => setBatchSize(v)}
                  className={`px-4 py-2 rounded-md text-sm border transition-colors ${
                    batchSize === v
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {v === 0 ? 'All' : v}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Campaign auto-pauses after each batch. Use "All" to send everything at once.</p>
          </div>
          {settingsSaved && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />Sending settings saved!
            </div>
          )}
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Save Sending Settings
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nabda API Configuration</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter your Nabda OTP credentials to send WhatsApp messages. Find these in your Nabda dashboard.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
            <input
              type="text"
              value="https://api.nabdaotp.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instance ID</label>
            <input
              type="text"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="4b56a3b6-72e3-4ee5-94ec-c1758bef8b98"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_5487e268..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {saved && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Credentials saved successfully!
            </div>
          )}

          {testResult && (
            <div className={`flex items-center text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.success ? <CheckCircle className="h-4 w-4 mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
              {testResult.message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Save Credentials
            </button>
            <button
              onClick={handleTest}
              disabled={testing || !apiKey || !instanceId}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
