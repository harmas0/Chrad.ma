import { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  Sparkles, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Modal from '../../components/Modal';
import { fetchAllAds, createAd, toggleAdActive, deleteAd } from '../../data/adsApi';

export default function AdminAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [advertiser, setAdvertiser] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [placement, setPlacement] = useState('home_banner');
  const [badgeText, setBadgeText] = useState('SPONSORED');
  const [ctaText, setCtaText] = useState('View Offer');

  async function loadData() {
    setLoading(true);
    const data = await fetchAllAds();
    setAds(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title || !imageUrl) return;

    setSubmitting(true);
    const newAd = await createAd({
      title,
      advertiser,
      imageUrl,
      targetUrl,
      placement,
      badgeText,
      ctaText,
      isActive: true,
    });

    if (newAd) {
      alert('Custom Ad Campaign Created Successfully!');
      setShowCreateModal(false);
      setTitle('');
      setAdvertiser('');
      setImageUrl('');
      setTargetUrl('');
      loadData();
    } else {
      alert('Failed to create ad campaign.');
    }
    setSubmitting(false);
  };

  const handleToggleActive = async (adId, currentStatus) => {
    const res = await toggleAdActive(adId, !currentStatus);
    if (res) {
      loadData();
    }
  };

  const handleDelete = async (adId) => {
    if (!window.confirm('Are you sure you want to delete this ad campaign?')) return;
    const res = await deleteAd(adId);
    if (res) {
      loadData();
    }
  };

  // Analytics totals
  const totalImpressions = ads.reduce((sum, a) => sum + Number(a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + Number(a.clicks || 0), 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';
  const activeCount = ads.filter((a) => a.is_active).length;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-black text-white tracking-tight mb-1 flex items-center gap-2.5">
            <Megaphone size={28} className="text-accent" />
            Custom Ads & Monetization
          </h1>
          <p className="text-[14px] text-charcoal-light font-medium">
            Manage sponsored partner campaigns, placement slots, and track CTR performance
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 rounded-2xl bg-accent text-dark font-heading font-black text-[13px] uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,135,0.3)] hover:scale-105 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus size={18} strokeWidth={3} />
          Create New Campaign
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="glass-panel p-6 border border-white/10 rounded-2xl bg-dark/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold text-charcoal-light uppercase tracking-wider">Active Campaigns</span>
            <Sparkles size={18} className="text-accent" />
          </div>
          <div className="text-[26px] font-black text-white">{activeCount} / {ads.length}</div>
        </div>

        <div className="glass-panel p-6 border border-white/10 rounded-2xl bg-dark/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold text-charcoal-light uppercase tracking-wider">Total Impressions</span>
            <Eye size={18} className="text-info" />
          </div>
          <div className="text-[26px] font-black text-info">{totalImpressions.toLocaleString()} views</div>
        </div>

        <div className="glass-panel p-6 border border-white/10 rounded-2xl bg-dark/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold text-charcoal-light uppercase tracking-wider">Total Clicks</span>
            <MousePointer size={18} className="text-warning" />
          </div>
          <div className="text-[26px] font-black text-warning">{totalClicks.toLocaleString()} clicks</div>
        </div>

        <div className="glass-panel p-6 border border-white/10 rounded-2xl bg-dark/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold text-charcoal-light uppercase tracking-wider">Click Through Rate</span>
            <TrendingUp size={18} className="text-accent" />
          </div>
          <div className="text-[26px] font-black text-accent">{avgCTR}% CTR</div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="glass-panel rounded-2xl border border-border-light overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-heading font-black text-white text-[16px]">Active & Scheduled Ad Campaigns</h3>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-dark/60 border border-white/10 text-charcoal-light hover:text-white transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ad Banner</th>
                <th>Campaign & Advertiser</th>
                <th>Placement Slot</th>
                <th>Views (Impressions)</th>
                <th>Clicks</th>
                <th>CTR %</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((item) => {
                const ctr = item.impressions > 0 ? ((item.clicks / item.impressions) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={item.id}>
                    <td>
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-20 h-12 object-cover rounded-xl border border-white/10"
                      />
                    </td>
                    <td>
                      <div className="min-w-0 max-w-xs">
                        <p className="text-[13px] font-bold text-white leading-tight truncate">{item.title}</p>
                        <p className="text-[11px] text-charcoal-light font-medium">{item.advertiser || 'Sponsor'}</p>
                      </div>
                    </td>
                    <td>
                      <span className="text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-lg uppercase">
                        {item.placement}
                      </span>
                    </td>
                    <td>
                      <span className="text-[13px] font-mono text-white">{item.impressions || 0}</span>
                    </td>
                    <td>
                      <span className="text-[13px] font-mono text-warning font-bold">{item.clicks || 0}</span>
                    </td>
                    <td>
                      <span className="text-[13px] font-black text-accent">{ctr}%</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(item.id, item.is_active)}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        {item.is_active ? (
                          <>
                            <ToggleRight size={26} className="text-accent" />
                            <span className="text-[11px] font-bold text-accent">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={26} className="text-muted" />
                            <span className="text-[11px] font-bold text-muted">Paused</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                        title="Delete Campaign"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {ads.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-charcoal-light text-[14px]">
                    No custom ad campaigns created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW AD MODAL */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Ad Campaign">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-1">
              Campaign Headline / Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. McDonald's 20% Off Fast Delivery"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-dark/60 border border-white/10 rounded-2xl p-3.5 text-[14px] text-white focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-1">
              Advertiser / Sponsor Name
            </label>
            <input
              type="text"
              placeholder="e.g. Marjane Supermarket"
              value={advertiser}
              onChange={(e) => setAdvertiser(e.target.value)}
              className="w-full bg-dark/60 border border-white/10 rounded-2xl p-3.5 text-[14px] text-white focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-1">
              Banner Image URL *
            </label>
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-dark/60 border border-white/10 rounded-2xl p-3.5 text-[14px] text-white focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-1">
              Target URL / Destination Link
            </label>
            <input
              type="text"
              placeholder="e.g. https://marjane.ma or /post"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full bg-dark/60 border border-white/10 rounded-2xl p-3.5 text-[14px] text-white focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-charcoal-light uppercase tracking-wider mb-1">
                Placement Slot
              </label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                className="w-full bg-dark/60 border border-white/10 rounded-xl p-3 text-[12px] text-white focus:border-accent focus:outline-none"
              >
                <option value="home_banner" className="bg-dark text-white">Home Banner</option>
                <option value="feed_card" className="bg-dark text-white">Feed In-Card</option>
                <option value="task_detail" className="bg-dark text-white">Task Detail</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-charcoal-light uppercase tracking-wider mb-1">
                Badge Text
              </label>
              <input
                type="text"
                placeholder="SPONSORED"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full bg-dark/60 border border-white/10 rounded-xl p-3 text-[12px] text-white focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-charcoal-light uppercase tracking-wider mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                placeholder="Learn More"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="w-full bg-dark/60 border border-white/10 rounded-xl p-3 text-[12px] text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-accent text-dark font-heading font-black text-[14px] uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,135,0.3)] hover:scale-[1.01] transition-all disabled:opacity-50 mt-4"
          >
            {submitting ? 'Creating Campaign...' : 'Publish Ad Campaign'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
