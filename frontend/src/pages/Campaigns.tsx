import React, { useState, useEffect } from 'react';
import { Plus, Send, Play, Trash2, X, AlertCircle, CheckCircle, Loader2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { getCampaigns, createCampaign, sendCampaign, processCampaign, deleteCampaign, pauseCampaign, resumeCampaign, getStoredCredentials, sendTestMessage, getContacts } from '../services/api';
import { PaginationMeta } from '../types';
import { getStoredDelay, getStoredBatchSize } from './Settings';

const IRAQI_GOVERNORATES = [
  'Baghdad', 'Basra', 'Erbil', 'Duhok', 'Sulaymaniyah', 'Najaf', 'Karbala',
  'Mosul', 'Kirkuk', 'Anbar', 'Diyala', 'Wasit', 'Maysan', 'Dhi Qar',
  'Babil', 'Qadisiyah', 'Muthanna', 'Salah ad Din', 'Halabja', 'Zakho',
];

interface Campaign {
  id: number;
  name: string;
  message: string;
  message_ar?: string;
  message_ku?: string;
  message_en?: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  pending_count: number;
  created_at: string;
}

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [showSingleTestModal, setShowSingleTestModal] = useState(false);
  const [singleTestPhone, setSingleTestPhone] = useState('+9647734150748');
  const [singleTestResult, setSingleTestResult] = useState<any>(null);
  const [singleTestingCampaignId, setSingleTestingCampaignId] = useState<number | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', message: '', message_ar: '', message_ku: '', message_en: '' });
  const [selectedGovs, setSelectedGovs] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [testLimit, setTestLimit] = useState(5); // Send to first N contacts for testing
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<any>(null);
  const [previewTab, setPreviewTab] = useState<'default' | 'arabic' | 'kurdish' | 'english'>('arabic');
  const [pendingSendId, setPendingSendId] = useState<number | null>(null);
  const [pendingSendLimit, setPendingSendLimit] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res: any = await getCampaigns({ page: pagination.page, limit: pagination.limit });
      setCampaigns(Array.isArray(res) ? res : res.campaigns || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (e) {
      console.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [pagination.page]);

  const handleCreate = async () => {
    if (!form.name || !form.message) {
      setError('Name and message are required');
      return;
    }
    setError('');
    try {
      await createCampaign({
        name: form.name,
        message: form.message,
        message_ar: form.message_ar || undefined,
        message_ku: form.message_ku || undefined,
        message_en: form.message_en || undefined,
        recipients: [],
      } as any);
      setForm({ name: '', message: '', message_ar: '', message_ku: '', message_en: '' });
      setShowModal(false);
      loadCampaigns();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to create campaign');
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await sendCampaign(id.toString(), undefined, undefined, true);
      setTestResult(res);
      setShowTestModal(true);
    } catch (e: any) {
      setTestResult({ error: e.response?.data?.error || 'Test failed' });
      setShowTestModal(true);
    } finally {
      setTestingId(null);
    }
  };

  const openPreview = (id: number, limitContacts: boolean) => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;
    const creds = getStoredCredentials();
    if (!creds.apiKey || !creds.instanceId) {
      alert('Please set your Nabda credentials in Settings first');
      return;
    }
    setPreviewCampaign(campaign);
    setPreviewTab(campaign.message_ar ? 'arabic' : campaign.message_ku ? 'kurdish' : 'default');
    setPendingSendId(id);
    setPendingSendLimit(limitContacts);
    setShowPreviewModal(true);
  };

  const handleSend = async (id: number, limitContacts = false) => {
    const creds = getStoredCredentials();
    if (!creds.apiKey || !creds.instanceId) {
      alert('Please set your Nabda credentials in Settings first');
      return;
    }

    const confirmMsg = limitContacts
      ? `Send to first ${testLimit} contacts only?`
      : selectedGovs.length > 0
        ? `Send to contacts in: ${selectedGovs.join(', ')}?`
        : 'Send to ALL contacts?';

    if (!confirm(confirmMsg)) return;

    setSendingId(id);
    setShowPreviewModal(false);
    try {
      // Step 1: Queue messages (API only, instant, crash-safe)
      let contactIds: string[] | undefined;
      if (limitContacts) {
        const contactsRes = await getContacts({ page: 1, limit: testLimit });
        contactIds = contactsRes.contacts.filter(c => c.id).map(c => c.id!.toString());
      } else if (selectedGovs.length > 0) {
        // Fetch contacts filtered by governorate
        const all = await getContacts({ page: 1, limit: 10000 });
        contactIds = all.contacts
          .filter(c => c.id && c.governorate && selectedGovs.some(g => g.toLowerCase() === c.governorate!.toLowerCase()))
          .map(c => c.id!.toString());
        if (contactIds.length === 0) {
          alert('No contacts found in selected governorates.');
          setSendingId(null);
          return;
        }
      }

      const batchSize = getStoredBatchSize();
      const delayMs = getStoredDelay();

      const queueRes = await sendCampaign(id.toString(), creds.apiKey, creds.instanceId, false, contactIds);
      alert(`Queued ${queueRes.queued_count} messages. Starting send...`);
      loadCampaigns();

      // Step 2: Process one batch then stop (auto-pause after batch)
      const processRes = await processCampaign(id.toString(), creds.apiKey, creds.instanceId, delayMs, batchSize === 0 ? 9999 : batchSize);
      const totalSent = processRes.sent || 0;
      const totalFailed = processRes.failed || 0;
      const hasMore = processRes.has_more;

      if (hasMore && batchSize > 0) {
        await pauseCampaign(id.toString());
        alert(`Batch done! ${totalSent} sent, ${totalFailed} failed.\nCampaign paused after batch of ${batchSize}. Click Resume to continue.`);
      } else {
        alert(`Campaign complete! ${totalSent} sent, ${totalFailed} failed`);
      }
      loadCampaigns();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to send campaign');
    } finally {
      setSendingId(null);
    }
  };

  const handlePause = async (id: number) => {
    try {
      await pauseCampaign(id.toString());
      alert('Campaign paused');
      loadCampaigns();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to pause campaign');
    }
  };

  const handleResume = async (id: number) => {
    const creds = getStoredCredentials();
    if (!creds.apiKey || !creds.instanceId) {
      alert('Please set your Nabda credentials in Settings first');
      return;
    }
    setSendingId(id);
    try {
      const batchSize = getStoredBatchSize();
      const delayMs = getStoredDelay();
      // First un-pause the campaign so it can process
      await resumeCampaign(id.toString()).catch(() => {});
      const processRes = await processCampaign(id.toString(), creds.apiKey, creds.instanceId, delayMs, batchSize === 0 ? 9999 : batchSize);
      const totalSent = processRes.sent || 0;
      const totalFailed = processRes.failed || 0;
      const hasMore = processRes.has_more;
      if (hasMore && batchSize > 0) {
        await pauseCampaign(id.toString());
        alert(`Batch done! ${totalSent} sent, ${totalFailed} failed.\nPaused again. Click Resume for next batch.`);
      } else {
        alert(`Resumed! ${totalSent} sent, ${totalFailed} failed`);
      }
      loadCampaigns();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to resume campaign');
    } finally {
      setSendingId(null);
    }
  };

  const handleSingleTest = async (id: number) => {
    const creds = getStoredCredentials();
    if (!creds.apiKey || !creds.instanceId) {
      alert('Please set your Nabda credentials in Settings first');
      return;
    }
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;

    setSingleTestingCampaignId(id);
    setSingleTestResult(null);
    try {
      const res = await sendTestMessage(singleTestPhone, campaign.message, creds.apiKey, creds.instanceId);
      setSingleTestResult(res);
    } catch (e: any) {
      setSingleTestResult({ error: e.response?.data?.error || e.message || 'Test failed' });
    } finally {
      setSingleTestingCampaignId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await deleteCampaign(id.toString());
      loadCampaigns();
    } catch (e) {
      alert('Failed to delete');
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      queued: 'bg-blue-100 text-blue-700',
      sending: 'bg-yellow-100 text-yellow-700',
      paused: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Campaigns</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Test limit:</label>
            <input
              type="number"
              min="1"
              max="500"
              value={testLimit}
              onChange={(e) => setTestLimit(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Governorate:</label>
            <select
              multiple
              value={selectedGovs}
              onChange={(e) => setSelectedGovs(Array.from(e.target.selectedOptions, o => o.value))}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm h-8 min-w-[130px]"
              title="Hold Ctrl/Cmd to select multiple"
            >
              {IRAQI_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {selectedGovs.length > 0 && (
              <button onClick={() => setSelectedGovs([])} className="text-xs text-gray-400 hover:text-gray-600">✕ Clear</button>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Campaign
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
          <p className="text-gray-600 mb-4">No campaigns yet. Create your first campaign to get started.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${statusBadge(c.status)}`}>{c.status}</span>
                  </div>
                  <p className="text-gray-600 mt-1 text-sm line-clamp-2">{c.message}</p>
                  <div className="flex gap-4 mt-3 text-sm text-gray-500">
                    <span>Recipients: {c.total_recipients}</span>
                    <span className="text-green-600">Sent: {c.sent_count}</span>
                    <span className="text-red-600">Failed: {c.failed_count}</span>
                    <span className="text-yellow-600">Pending: {c.pending_count}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleTest(c.id)}
                    disabled={testingId === c.id}
                    className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
                    title="Test (dry run)"
                  >
                    {testingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    <span className="ml-1">Test</span>
                  </button>
                  <button
                    onClick={() => { setShowSingleTestModal(true); setSingleTestResult(null); setSelectedCampaignId(c.id); }}
                    disabled={singleTestingCampaignId === c.id}
                    className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm disabled:opacity-50"
                    title="Send test to 1 contact"
                  >
                    {singleTestingCampaignId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="ml-1">Send 1 Test</span>
                  </button>
                  <button
                    onClick={() => openPreview(c.id, true)}
                    disabled={sendingId === c.id || c.status === 'queued' || c.status === 'sending'}
                    className="flex items-center px-3 py-2 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors text-sm disabled:opacity-50"
                    title={`Preview & send to first ${testLimit} contacts`}
                  >
                    {sendingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    <span className="ml-1">Preview & Send {testLimit}</span>
                  </button>
                  {(c.status === 'queued' || c.status === 'sending') && (
                    <>
                      <button
                        onClick={() => handlePause(c.id)}
                        className="flex items-center px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors text-sm"
                        title="Pause sending"
                      >
                        <Play className="h-4 w-4 rotate-90" />
                        <span className="ml-1">Pause</span>
                      </button>
                      <button
                        onClick={() => handleResume(c.id)}
                        disabled={sendingId === c.id}
                        className="flex items-center px-3 py-2 bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 transition-colors text-sm disabled:opacity-50"
                        title="Resume sending"
                      >
                        {sendingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        <span className="ml-1">Resume</span>
                      </button>
                    </>
                  )}
                  {c.status === 'paused' && (
                    <button
                      onClick={() => handleResume(c.id)}
                      disabled={sendingId === c.id}
                      className="flex items-center px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors text-sm disabled:opacity-50"
                      title="Resume sending"
                    >
                      {sendingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      <span className="ml-1">Resume</span>
                    </button>
                  )}
                  <button
                    onClick={() => openPreview(c.id, false)}
                    disabled={sendingId === c.id || c.status === 'queued' || c.status === 'sending'}
                    className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm disabled:opacity-50"
                    title="Preview & send campaign"
                  >
                    {sendingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="ml-1">Send</span>
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="flex items-center px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm"
                    title="Delete campaign"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-4 px-4 py-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} campaigns
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Campaign</h3>
              <button onClick={() => { setShowModal(false); setError(''); }}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            {error && (
              <div className="flex items-center text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">
                <AlertCircle className="h-4 w-4 mr-2" />{error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Summer Sale 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (Default)</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Hello {{name}}, check out our new offers!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (Arabic) - Optional</label>
                <textarea
                  value={form.message_ar}
                  onChange={(e) => setForm({ ...form, message_ar: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="مرحبا {{name}}، تحقق من عروضنا الجديدة!"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (Kurdish) - Optional</label>
                <textarea
                  value={form.message_ku}
                  onChange={(e) => setForm({ ...form, message_ku: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="سڵاو {{name}}، پێشکەشکردنەکانمان ببینە!"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (English) - Optional</label>
                <textarea
                  value={form.message_en}
                  onChange={(e) => setForm({ ...form, message_en: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Hello {{name}}, check out our new offers!"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setError(''); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {showPreviewModal && previewCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Preview: {previewCampaign.name}</h3>
              <button onClick={() => setShowPreviewModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>

            {/* Language tabs */}
            <div className="flex gap-1 mb-3 border-b border-gray-200">
              {['arabic', 'kurdish', 'english', 'default'].map((tab) => {
                const hasMsg = tab === 'arabic' ? previewCampaign.message_ar
                  : tab === 'kurdish' ? previewCampaign.message_ku
                  : tab === 'english' ? previewCampaign.message_en
                  : previewCampaign.message;
                if (!hasMsg && tab !== 'default') return null;
                return (
                  <button
                    key={tab}
                    onClick={() => setPreviewTab(tab as any)}
                    className={`px-4 py-2 text-sm capitalize border-b-2 transition-colors ${
                      previewTab === tab
                        ? 'border-primary-600 text-primary-700 font-medium'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'default' ? '🌐 Default' : tab === 'arabic' ? '🇮🇶 Arabic' : tab === 'kurdish' ? '🏔️ Kurdish' : '🇬🇧 English'}
                  </button>
                );
              })}
            </div>

            {/* Message preview */}
            <div className={`bg-gray-50 rounded-lg p-4 mb-4 min-h-[100px] text-sm whitespace-pre-wrap ${
              previewTab === 'arabic' || previewTab === 'kurdish' ? 'text-right font-arabic' : ''
            }`} dir={previewTab === 'arabic' || previewTab === 'kurdish' ? 'rtl' : 'ltr'}>
              {previewTab === 'arabic' ? previewCampaign.message_ar
                : previewTab === 'kurdish' ? previewCampaign.message_ku
                : previewTab === 'english' ? previewCampaign.message_en
                : previewCampaign.message}
            </div>

            <div className="text-xs text-gray-500 mb-4 bg-blue-50 rounded p-2">
              <strong>ℹ️ Sending config:</strong> Batch size: {getStoredBatchSize() === 0 ? 'All' : getStoredBatchSize()} | Delay: {getStoredDelay()}ms
              {selectedGovs.length > 0 && <> | Governorates: {selectedGovs.join(', ')}</>}
              {pendingSendLimit && <> | Limited to first {testLimit} contacts</>}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Cancel</button>
              <button
                onClick={() => handleSend(pendingSendId!, pendingSendLimit)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Result Modal */}
      {showTestModal && testResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Test Result</h3>
              <button onClick={() => setShowTestModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            {testResult.error ? (
              <div className="text-red-600 flex items-center"><AlertCircle className="h-5 w-5 mr-2" />{testResult.error}</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center text-green-600"><CheckCircle className="h-5 w-5 mr-2" />Test passed - campaign is ready to send</div>
                <p className="text-gray-700">Would send to: <strong>{testResult.wouldSendTo}</strong> contacts</p>
                {testResult.sampleContacts && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Sample contacts:</p>
                    <div className="bg-gray-50 rounded p-3 space-y-1">
                      {testResult.sampleContacts.map((contact: any, i: number) => (
                        <div key={i} className="text-sm text-gray-700">{contact.name} - {contact.phone}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowTestModal(false)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Single Test Message Modal */}
      {showSingleTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Test Message</h3>
              <button onClick={() => { setShowSingleTestModal(false); setSingleTestResult(null); }}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Phone Number</label>
                <input
                  value={singleTestPhone}
                  onChange={(e) => setSingleTestPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+9647734150748"
                />
                <p className="text-xs text-gray-500 mt-1">Enter a WhatsApp number to test this campaign message.</p>
              </div>

              {singleTestResult && (
                <div className={`p-3 rounded-md text-sm ${singleTestResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {singleTestResult.error ? (
                    <div className="flex items-center"><AlertCircle className="h-4 w-4 mr-2" />{singleTestResult.error}</div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center"><CheckCircle className="h-4 w-4 mr-2" />Message sent successfully!</div>
                      <p className="text-xs">Message ID: {singleTestResult.message_id}</p>
                      <p className="text-xs">To: {singleTestResult.phone}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowSingleTestModal(false); setSingleTestResult(null); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Close</button>
              <button
                onClick={() => handleSingleTest(selectedCampaignId || campaigns[0]?.id || 0)}
                disabled={!singleTestPhone || singleTestingCampaignId !== null}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {singleTestingCampaignId !== null ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
                Send Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
