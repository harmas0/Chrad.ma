import { useState } from 'react';
import { Settings, Globe, Bell, Shield, Database, Palette, Save, Check, Info } from 'lucide-react';

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    platformName: 'Chrad',
    supportEmail: 'support@chrad.ma',
    maxBidPrice: 5000,
    minBidPrice: 10,
    platformFeePercent: 10,
    requireKYCForRunners: true,
    allowGuestBrowsing: false,
    maxPhotosPerTask: 5,
    maxDisputeEvidencePhotos: 3,
    maintenanceMode: false,
    enablePushNotifications: true,
    enableEmailNotifications: true,
    autoApproveKYC: false,
    kycExpiryDays: 365,
    defaultCurrency: 'MAD',
    defaultCity: 'Casablanca',
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // In production, this would persist to a settings table in Supabase
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sections = [
    {
      title: 'General',
      icon: Globe,
      fields: [
        { key: 'platformName', label: 'Platform Name', type: 'text' },
        { key: 'supportEmail', label: 'Support Email', type: 'text' },
        { key: 'defaultCurrency', label: 'Default Currency', type: 'text' },
        { key: 'defaultCity', label: 'Default City', type: 'text' },
      ],
    },
    {
      title: 'Pricing & Fees',
      icon: Settings,
      fields: [
        { key: 'minBidPrice', label: 'Minimum Bid Price (MAD)', type: 'number' },
        { key: 'maxBidPrice', label: 'Maximum Bid Price (MAD)', type: 'number' },
        { key: 'platformFeePercent', label: 'Platform Fee (%)', type: 'number' },
      ],
    },
    {
      title: 'Security & KYC',
      icon: Shield,
      fields: [
        { key: 'requireKYCForRunners', label: 'Require KYC for Runners', type: 'toggle' },
        { key: 'autoApproveKYC', label: 'Auto-Approve KYC (dev only)', type: 'toggle' },
        { key: 'kycExpiryDays', label: 'KYC Validity (days)', type: 'number' },
      ],
    },
    {
      title: 'Content Limits',
      icon: Database,
      fields: [
        { key: 'maxPhotosPerTask', label: 'Max Photos per Task', type: 'number' },
        { key: 'maxDisputeEvidencePhotos', label: 'Max Dispute Evidence Photos', type: 'number' },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      fields: [
        { key: 'enablePushNotifications', label: 'Push Notifications', type: 'toggle' },
        { key: 'enableEmailNotifications', label: 'Email Notifications', type: 'toggle' },
      ],
    },
    {
      title: 'Maintenance',
      icon: Settings,
      fields: [
        { key: 'maintenanceMode', label: 'Maintenance Mode', type: 'toggle', danger: true },
        { key: 'allowGuestBrowsing', label: 'Allow Guest Browsing', type: 'toggle' },
      ],
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Platform Settings</h1>
          <p className="text-[14px] text-charcoal-light font-medium">Configure platform behavior and policies</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all
            ${saved
              ? 'bg-accent/10 border border-accent/30 text-accent'
              : 'bg-accent text-dark hover:bg-accent-hover shadow-[0_4px_15px_rgba(0,255,135,0.3)]'
            }`}
        >
          {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      {/* Info notice */}
      <div className="bg-info/5 border border-info/20 rounded-xl p-4 mb-8 flex items-start gap-3">
        <Info size={18} className="text-info shrink-0 mt-0.5" />
        <p className="text-[13px] text-charcoal-light">
          Settings are stored locally for this MVP. In production, these would be persisted in a <code className="text-info font-mono text-[12px]">platform_settings</code> table in Supabase.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {sections.map((section, si) => (
          <div key={si} className="glass-panel rounded-2xl border border-border-light overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <section.icon size={16} />
              </div>
              <h2 className="text-[16px] font-bold text-white">{section.title}</h2>
            </div>

            {/* Fields */}
            <div className="divide-y divide-border">
              {section.fields.map((field) => (
                <div key={field.key} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.01] transition-colors">
                  <label className="text-[14px] font-medium text-charcoal flex-1" htmlFor={`setting-${field.key}`}>
                    {field.label}
                  </label>

                  {field.type === 'toggle' ? (
                    <button
                      id={`setting-${field.key}`}
                      onClick={() => updateSetting(field.key, !settings[field.key])}
                      className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                        settings[field.key]
                          ? field.danger ? 'bg-danger' : 'bg-accent'
                          : 'bg-muted-light'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        settings[field.key] ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`} />
                    </button>
                  ) : field.type === 'number' ? (
                    <input
                      id={`setting-${field.key}`}
                      type="number"
                      value={settings[field.key]}
                      onChange={(e) => updateSetting(field.key, Number(e.target.value))}
                      className="input-field w-32 px-3 py-2 rounded-xl text-[14px] font-medium text-right"
                    />
                  ) : (
                    <input
                      id={`setting-${field.key}`}
                      type="text"
                      value={settings[field.key]}
                      onChange={(e) => updateSetting(field.key, e.target.value)}
                      className="input-field w-48 px-3 py-2 rounded-xl text-[14px] font-medium"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
