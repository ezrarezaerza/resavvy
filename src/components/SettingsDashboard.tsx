import React, { useState, useEffect } from 'react';
import { Settings, Info, Save, Database, Trash2, Download, Upload } from 'lucide-react';
import { useSettings, Theme } from '../hooks/useSettings';
import { ToggleSwitch } from './ToggleSwitch';
import { SegmentedControl } from './SegmentedControl';
import { getStorageEstimate, exportLibrary, clearAppCache, importLibrary } from '../utils/storageManager';
import { ConfirmModal } from './ConfirmModal';
import { toast } from 'sonner';

export function SettingsDashboard() {
  const { theme, setTheme, autoplay, setAutoplay, dataSaver, setDataSaver } = useSettings();
  const [storageData, setStorageData] = useState({ usage: 0, quota: 0, percentage: 0 });
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    getStorageEstimate().then(setStorageData);
  }, []);

  const handleClearCache = async () => {
    setIsConfirmingClear(false);
    await clearAppCache();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const token = localStorage.getItem('token');
    
    // Using toast.promise instead of just info
    const importPromise = new Promise(async (resolve, reject) => {
      try {
        if (!token) throw new Error('You must be logged in to import a library.');
        const result = await importLibrary(file, token);
        resolve(result);
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        reject(err);
      } finally {
        setIsImporting(false);
        if (e.target) e.target.value = '';
      }
    });

    toast.promise(importPromise, {
      loading: 'Importing library...',
      success: (data: any) => `Successfully restored ${data.added || 0} songs!`,
      error: (err: any) => `Failed to import: ${err.message}`
    });
  };

  return (
    <div className="w-full flex-1 flex flex-col pb-32 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Preferences & limits</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-6 px-6 md:px-8">
        <div className="max-w-3xl mx-auto space-y-12 pb-24">
          
          {/* Section 1: Appearance */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Appearance
            </h2>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">Theme</label>
                <SegmentedControl<Theme>
                  options={[
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' },
                    { label: 'System', value: 'system' }
                  ]}
                  active={theme}
                  onChange={setTheme}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Playback */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Playback Configuration
            </h2>
            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-white/5">
              
              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Autoplay Similar Tracks</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Continue playing recommended songs when your queue ends.
                  </p>
                </div>
                <ToggleSwitch isOn={autoplay} onToggle={setAutoplay} />
              </div>

              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Data Saver Mode</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Force 144p video playback to conserve bandwidth when possible.
                  </p>
                </div>
                <ToggleSwitch isOn={dataSaver} onToggle={setDataSaver} />
              </div>

            </div>
          </section>

          {/* Section 3: Data & Storage */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Data & Storage
            </h2>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
              
              <div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Storage limit</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {storageData.usage.toFixed(2)} MB of {storageData.quota > 1000 ? (storageData.quota/1000).toFixed(2) + ' GB' : storageData.quota.toFixed(2) + ' MB'} used
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${Math.min(storageData.percentage, 100)}%` }} 
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={exportLibrary}
                  className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-xl transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export Library Data (JSON)
                </button>

                <input type="file" accept=".json" id="import-upload" className="hidden" onChange={handleFileUpload} />
                <button
                  disabled={isImporting}
                  onClick={() => document.getElementById('import-upload')?.click()}
                  className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl transition-colors border border-indigo-200 dark:border-indigo-500/20 shadow-sm disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? 'Importing...' : 'Restore Library (JSON)'}
                </button>

                <button
                  onClick={() => setIsConfirmingClear(true)}
                  className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Local Cache
                </button>
              </div>

            </div>
          </section>

        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmingClear}
        onClose={() => setIsConfirmingClear(false)}
        onConfirm={handleClearCache}
        title="Clear Local Cache"
        description="Are you sure? This will delete all cached data and unregister service workers. You should export your library first if you have unsaved changes."
        confirmText="Clear Cache"
        isDestructive={true}
      />
    </div>
  );
}
