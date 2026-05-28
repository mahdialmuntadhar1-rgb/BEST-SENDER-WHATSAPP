import React, { useState, useEffect } from 'react';
import { Plus, Send, Play, Trash2, X, AlertCircle, CheckCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCampaigns, createCampaign, sendCampaign, processCampaign, deleteCampaign, pauseCampaign, getStoredCredentials, sendTestMessage, getContacts } from '../services/api';
import { PaginationMeta } from '../types';

interface Campaign {
  id: number;
  name: string;
  message: string;
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
  const [error, setError] = useState('');
  const [testLimit, setTestLimit] = useState(5); // Send to first N contacts for testing
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

  const handleSend = async (id: number, limitContacts = false) => {
    const creds = getStoredCredentials();
    if (!creds.apiKey || !creds.instanceId) {
      alert('Please set your Nabda credentials in Settings first');
      return;
    }

    const confirmMsg = limitContacts
      ? `Send to first ${testLimit} contacts only?`
      : 'Are you sure you want to send this campaign to all contacts?';

    if (!confirm(confirmMsg)) return;

    setSendingId(id);
    try {
      // Step 1: Queue messages (API only, instant, crash-safe)
      let contactIds: string[] | undefined;
      if (limitContacts) {
        // Fetch first N contacts and pass their IDs
        const contactsRes = await getContacts({ page: 1, limit: testLimit });
        contactIds = contactsRes.contacts.filter(c => c.id).map(c => c.id!.toString());
      }

      const queueRes = await sendCampaign(id.toString(), creds.apiKey, creds.instanceId, false, contactIds);
      alert(`Queued ${queueRes.queued_count} messages. Starting send...`);
      loadCampaigns();

      // Step 2: Process queued messages (worker layer)
      let hasMore = true;
      let totalSent = 0;
      let totalFailed = 0;
      while (hasMore) {
        const processRes = await processCampaign(id.toString(), creds.apiKey, creds.instanceId, 1500, limitContacts ? testLimit : 100);
        totalSent += processRes.sent || 0;
        totalFailed += processRes.failed || 0;
        hasMore = processRes.has_more;
        if (hasMore) {
          loadCampaigns(); // Refresh UI to show progress
        }
      }

      alert(`Campaign complete! ${totalSent} sent, ${totalFailed} failed`);
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
      let hasMore = true;
      let totalSent = 0;
      let totalFailed = 0;
      while (hasMore) {
        const processRes = await processCampaign(id.toString(), creds.apiKey, creds.instanceId, 1500, 100);
        totalSent += processRes.sent || 0;
        totalFailed += processRes.failed || 0;
        hasMore = processRes.has_more;
        if (hasMore) loadCampaigns();
      }
      alert(`Resumed! ${totalSent} sent, ${totalFailed} failed`);
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Test limit:</label>
            <input
              type="number"
              min="1"
              max="50"
              value={testLimit}
              onChange={(e) => setTestLimit(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
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
                    onClick={() => handleSend(c.id, true)}
                    disabled={sendingId === c.id || c.status === 'queued' || c.status === 'sending'}
                    className="flex items-center px-3 py-2 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors text-sm disabled:opacity-50"
                    title={`Send to first ${testLimit} contacts`}
                  >
                    {sendingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="ml-1">Send {testLimit}</span>
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
                    onClick={() => handleSend(c.id)}
                    disabled={sendingId === c.id || c.status === 'queued' || c.status === 'sending'}
                    className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm disabled:opacity-50"
                    title="Send campaign"
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
