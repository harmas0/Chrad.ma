import { useState, useEffect } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { fetchPlatformSettings, updatePlatformSettings } from '@shared/data/settingsApi';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const data = await fetchPlatformSettings();
      setSettings(data || {});
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await updatePlatformSettings(settings);
    setSaving(false);
    setMessage('Settings saved successfully');
    setTimeout(() => setMessage(''), 3000);
  };

  const updateField = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Platform Settings</h1>
          <p className="text-[14px] text-charcoal-light font-medium">Configure platform behavior and policies</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-accent px-6 py-3 rounded-xl text-[14px] font-bold flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[14px] font-medium animate-fade-in">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl border border-border-light p-6">
          <h3 className="text-[16px] font-bold text-white mb-4 flex items-center gap-2">
            <Settings size={18} className="text-accent" />
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Platform Name</label>
              <input
                type="text"
                value={settings.platformName || 'Ghrad'}
                onChange={(e) => updateField('platformName', e.target.value)}
                className="input-field w-full px-4 py-3 rounded-xl text-[14px] font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail || ''}
                onChange={(e) => updateField('supportEmail', e.target.value)}
                className="input-field w-full px-4 py-3 rounded-xl text-[14px] font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Commission Rate (%)</label>
              <input
                type="number"
                value={settings.commissionRate || 10}
                onChange={(e) => updateField('commissionRate', parseFloat(e.target.value))}
                className="input-field w-full px-4 py-3 rounded-xl text-[14px] font-medium"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-border-light p-6">
          <h3 className="text-[16px] font-bold text-white mb-4 flex items-center gap-2">
            <Settings size={18} className="text-warning" />
            KYC & Verification
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-[14px] font-bold text-white">Auto-approve KYC</p>
                <p className="text-[12px] text-charcoal-light">Automatically approve KYC submissions</p>
              </div>
              <button
                onClick={() => updateField('autoApproveKYC', !settings.autoApproveKYC)}
                className={`w-12 h-6 rounded-full transition-colors ${settings.autoApproveKYC ? 'bg-accent' : 'bg-charcoal-light/30'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.autoApproveKYC ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-[14px] font-bold text-white">Require KYC for Runners</p>
                <p className="text-[12px] text-charcoal-light">Block runners without verified KYC</p>
              </div>
              <button
                onClick={() => updateField('requireKYCForRunners', !settings.requireKYCForRunners)}
                className={`w-12 h-6 rounded-full transition-colors ${settings.requireKYCForRunners ? 'bg-accent' : 'bg-charcoal-light/30'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.requireKYCForRunners ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            <div>
              <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">KYC Expiry (days)</label>
              <input
                type="number"
                value={settings.kycExpiryDays || 365}
                onChange={(e) => updateField('kycExpiryDays', parseInt(e.target.value))}
                className="input-field w-full px-4 py-3 rounded-xl text-[14px] font-medium"
                min="30"
              />
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-border-light p-6">
          <h3 className="text-[16px] font-bold text-white mb-4 flex items-center gap-2">
            <Settings size={18} className="text-info" />
            Task Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-[14px] font-bold text-white">Allow Task Cancellation</p>
                <p className="text-[12px] text-charcoal-light">Let clients cancel tasks after assignment</p>
              </div>
              <button
                onClick={() => updateField('allowTaskCancellation', !settings.allowTaskCancellation)}
                className={`w-12 h-6 rounded-full transition-colors ${settings.allowTaskCancellation ? 'bg-accent' : 'bg-charcoal-light/30'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.allowTaskCancellation ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            <div>
              <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Min Task Price (MAD)</label>
              <input
                type="number"
                value={settings.minTaskPrice || 20}
                onChange={(e) => updateField('minTaskPrice', parseFloat(e.target.value))}
                className="input-field w-full px-4 py-3 rounded-xl text-[14px] font-medium"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-border-light p-6">
          <h3 className="text-[16px] font-bold text-white mb-4 flex items-center gap-2">
            <Settings size={18} className="text-danger" />
            Maintenance Mode
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-[14px] font-bold text-white">Enable Maintenance Mode</p>
                <p className="text-[12px] text-charcoal-light">Block non-admin access to the platform</p>
              </div>
              <button
                onClick={() => updateField('maintenanceMode', !settings.maintenanceMode)}
                className={`w-12 h-6 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-danger' : 'bg-charcoal-light/30'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            <div>
              <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Maintenance Message</label>
              <textarea
                value={settings.maintenanceMessage || 'Platform is under maintenance. Please check back later.'}
                onChange={(e) => updateField('maintenanceMessage', e.target.value)}
                className="input-field w-full px-4 py-3.5 rounded-xl text-[14px] font-medium resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
