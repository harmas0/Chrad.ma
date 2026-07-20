import { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, Eye, Award, CheckSquare, Square, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../data/adminApi';

export default function AdminCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editId, setEditId] = useState(null);
  const [id, setId] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [icon, setIcon] = useState('📦');
  const [description, setDescription] = useState('');
  const [commissionRate, setCommissionRate] = useState(10);
  const [isFeatured, setIsFeatured] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const list = await fetchCategories();
    setCategories(list);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (cat) => {
    setEditId(cat.id);
    setId(cat.id);
    setNameEn(cat.name_en || '');
    setNameFr(cat.name_fr || '');
    setNameAr(cat.name_ar || '');
    setIcon(cat.icon || '📦');
    setDescription(cat.description || '');
    setCommissionRate(cat.commission_rate || 10);
    setIsFeatured(cat.is_featured || false);
  };

  const handleResetForm = () => {
    setEditId(null);
    setId('');
    setNameEn('');
    setNameFr('');
    setNameAr('');
    setIcon('📦');
    setDescription('');
    setCommissionRate(10);
    setIsFeatured(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id.trim() || !nameEn.trim()) return;
    setSaving(true);
    
    const catData = {
      id: id.toLowerCase().replace(/\s+/g, '-'),
      nameEn,
      nameFr,
      nameAr,
      icon,
      description,
      commissionRate,
      isFeatured,
    };

    let result;
    if (editId) {
      result = await updateCategory(catData, user.id);
    } else {
      result = await createCategory(catData, user.id);
    }

    if (result) {
      alert(editId ? 'Category updated.' : 'Category created.');
      handleResetForm();
      await loadData();
    } else {
      alert('Failed to save category config.');
    }
    setSaving(false);
  };

  const handleDelete = async (catId) => {
    if (['delivery', 'documents', 'shopping', 'custom'].includes(catId)) {
      alert('Default platform categories cannot be deleted as they are bound to task types.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this category? Active tasks under this category might experience errors.')) return;
    const success = await deleteCategory(catId, user.id);
    if (success) {
      await loadData();
    } else {
      alert('Failed to delete category.');
    }
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
        <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Categories Management</h1>
        <p className="text-[14px] text-charcoal-light font-medium">Manage chore types, commission rates, and featured triggers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-info/5 border border-info/20 rounded-xl p-4 flex gap-2.5 mb-2">
            <Info className="text-info shrink-0 mt-0.5" size={16} />
            <p className="text-[12px] text-charcoal-light leading-relaxed">
              Commission rates set per category are dynamically applied to the platform GMV calculation. Featured categories display on the client home page dashboard first.
            </p>
          </div>

          <div className="glass-panel rounded-2xl border border-border-light overflow-hidden">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Icon</th>
                    <th>ID / Name</th>
                    <th>Commission Rate</th>
                    <th>Home Featured</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td>
                        <span className="text-[22px]">{cat.icon || '📦'}</span>
                      </td>
                      <td>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-white leading-none mb-1">{cat.name_en}</p>
                          <p className="text-[10px] text-charcoal-light font-mono leading-none">{cat.id}</p>
                        </div>
                      </td>
                      <td>
                        <span className="text-[13px] font-bold text-accent">{cat.commission_rate || 10}% Fee</span>
                      </td>
                      <td>
                        {cat.is_featured ? (
                          <span className="badge badge-approved">Featured</span>
                        ) : (
                          <span className="badge badge-none">Hidden</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="w-8 h-8 rounded-lg bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-all"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="w-8 h-8 rounded-lg bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-danger transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create / Edit Form */}
        <div>
          <div className="glass-panel p-6 border border-border-light rounded-2xl sticky top-6">
            <h2 className="text-[16px] font-bold text-white mb-4 flex items-center gap-2">
              <Award size={16} className="text-accent" />
              {editId ? 'Edit Category Config' : 'Create Task Category'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">Category ID</label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={!!editId}
                  placeholder="e.g. food-run"
                  required
                  className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">English Label</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Food Delivery"
                  required
                  className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">French Label</label>
                  <input
                    type="text"
                    value={nameFr}
                    onChange={(e) => setNameFr(e.target.value)}
                    placeholder="e.g. Restauration"
                    className="input-field w-full px-3.5 py-3 rounded-xl text-[13px] font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">Arabic Label</label>
                  <input
                    type="text"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="e.g. توصيل طعام"
                    className="input-field w-full px-3.5 py-3 rounded-xl text-[13px] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">Emoji Icon</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="🍔"
                    className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-medium text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">Commission Rate (%)</label>
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    min={0}
                    max={50}
                    className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-medium text-right"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of this chore..."
                  rows={2}
                  className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-medium resize-none"
                />
              </div>

              {/* Featured toggle */}
              <div
                onClick={() => setIsFeatured(!isFeatured)}
                className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-border bg-dark hover:border-charcoal-light select-none"
              >
                {isFeatured ? (
                  <CheckSquare size={16} className="text-accent" />
                ) : (
                  <Square size={16} className="text-charcoal-light" />
                )}
                <span className="text-[13px] text-white font-medium">Feature on Dashboard Home</span>
              </div>

              <div className="flex gap-2">
                {editId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="flex-1 py-3 rounded-xl border border-border text-charcoal-light font-bold text-[13px]"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-accent py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
