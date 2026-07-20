import { useState, useEffect } from 'react';
import { Bell, ShieldAlert, Trash2, Calendar, Megaphone, Users, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement } from '../../data/adminApi';
import { fetchPlatformSettings, updatePlatformSettings } from '../../data/settingsApi';

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Announcement form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetSegment, setTargetSegment] = useState('all');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Maintenance form
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  async function loadData() {
    setLoading(true);
    const [annList, platformSettings] = await Promise.all([
      fetchAnnouncements(),
      fetchPlatformSettings()
    ]);
    setAnnouncements(annList);
    if (platformSettings) {
      setSettings(platformSettings);
      setMaintenanceMode(platformSettings.maintenanceMode);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSubmitting(true);
    const success = await createAnnouncement({
      title,
      message,
      targetSegment,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    }, user.id);
    
    if (success) {
      alert('Announcement successfully broadcasted.');
      setTitle('');
      setMessage('');
      setTargetSegment('all');
      setExpiresAt('');
      await loadData();
    } else {
      alert('Failed to broadcast announcement.');
    }
    setSubmitting(false);
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement? It will immediately stop showing to users.')) return;
    const success = await deleteAnnouncement(id, user.id);
    if (success) {
      await loadData();
    } else {
      alert('Failed to delete announcement.');
    }
  };

  const handleToggleMaintenance = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const updated = {
      ...settings,
      maintenanceMode: !maintenanceMode,
    };
    const success = await updatePlatformSettings(updated, user.id);
    if (success) {
      setMaintenanceMode(!maintenanceMode);
      setSettings(updated);
      alert(`Platform Maintenance Mode set to: ${!maintenanceMode ? 'ENABLED' : 'DISABLED'}`);
    } else {
      alert('Failed to update maintenance settings.');
    }
    setSavingSettings(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Announcements & Maintenance</h1>
        <p className="text-[14px] text-charcoal-light font-medium">Broadcast alerts and toggle system access windows</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Announcement */}
        <div className="space-y-6">
          <div className="glass-panel p-6 border border-border-light rounded-2xl">
            <h2 className="text-[16px] font-bold text-white mb-4 flex items-center gap-2">
              <Megaphone size={16} className="text-accent" />
              New Banner Broadcast
            </h2>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">Alert Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scheduled Service Outage"
                  required
                  className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">Message Body</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Details of the announcement..."
                  required
                  rows={4}
                  className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">Target Segment</label>
                  <select
                    value={targetSegment}
                    onChange={(e) => setTargetSegment(e.target.value)}
                    className="input-field w-full px-3 py-3 rounded-xl text-[13px] font-medium bg-dark"
                  >
                    <option value="all">All Users</option>
                    <option value="runners">Runners Only</option>
                    <option value="clients">Clients Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">Expiry Date</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="input-field w-full px-3 py-2.5 rounded-xl text-[13px] font-medium bg-dark"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-accent py-3.5 rounded-xl text-[13px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Plus size={16} /> Broadcast Banner
              </button>
            </form>
          </div>

          {/* Maintenance Settings */}
          <div className="glass-panel p-6 border border-border-light rounded-2xl">
            <h2 className="text-[16px] font-bold text-white mb-3 flex items-center gap-2">
              <ShieldAlert size={16} className="text-danger" />
              Platform Lock (Maintenance)
            </h2>
            <p className="text-[12px] text-charcoal-light mb-4">
              Activating maintenance lock prevents clients and runners from initiating or editing tasks, placing bids, or writing messages. Admins retain full dashboard access.
            </p>

            <button
              onClick={handleToggleMaintenance}
              disabled={savingSettings}
              className={`w-full py-4 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all border
                ${maintenanceMode
                  ? 'bg-danger border-danger text-white shadow-[0_4px_15px_rgba(239,68,68,0.3)]'
                  : 'bg-dark border-border text-charcoal-light hover:border-danger hover:text-danger'}`}
            >
              {maintenanceMode ? '🔒 Maintenance Mode Enabled' : '🔓 Go Offline (Maintenance Lock)'}
            </button>
          </div>
        </div>

        {/* Right Column: Active Announcements List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-[18px] font-black text-white flex items-center gap-2 mb-2">
            <Bell size={18} className="text-charcoal-light" />
            Active Announcements Banners
          </h2>

          {announcements.length === 0 ? (
            <div className="glass-panel p-12 text-center text-charcoal-light border border-dashed border-border-light rounded-2xl py-20">
              No announcements are currently active.
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="glass-panel p-6 border border-border-light rounded-2xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/5 border border-accent/15 flex items-center justify-center text-accent shrink-0">
                    <Megaphone size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[15px] font-bold text-white truncate">{ann.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-admin uppercase text-[9px] font-bold flex items-center gap-1">
                          <Users size={10} /> {ann.target_segment}
                        </span>
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="w-8 h-8 rounded-lg bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-danger transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[13px] text-charcoal-light leading-relaxed mb-3">{ann.message}</p>
                    <div className="flex items-center gap-4 text-[10px] text-charcoal-light font-medium">
                      <span>Broadcasted: {new Date(ann.created_at).toLocaleDateString()}</span>
                      {ann.expires_at && (
                        <span className="flex items-center gap-1 text-warning">
                          <Calendar size={10} /> Expires: {new Date(ann.expires_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
