import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { getMessageLogs } from '../services/api';
import { PaginationMeta } from '../types';

interface MessageLog {
  id: number;
  campaign_id?: number;
  recipient: string;
  message: string;
  status: 'queued' | 'pending' | 'sending' | 'sent' | 'delivered' | 'failed';
  nabda_message_id?: string;
  error?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

const MessageLogs: React.FC = () => {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    campaign_id: '',
    status: '',
    recipient: '',
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (filters.campaign_id) params.campaign_id = filters.campaign_id;
      if (filters.status) params.status = filters.status;
      if (filters.recipient) params.recipient = filters.recipient;

      const res: any = await getMessageLogs(params);
      setLogs(Array.isArray(res) ? res : res.logs || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (e) {
      console.error('Failed to load message logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [pagination.page, filters]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      queued: 'bg-blue-100 text-blue-700',
      pending: 'bg-gray-100 text-gray-700',
      sending: 'bg-yellow-100 text-yellow-700',
      sent: 'bg-green-100 text-green-700',
      delivered: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
    };
    const icon: Record<string, any> = {
      queued: Clock,
      pending: Clock,
      sending: Clock,
      sent: CheckCircle,
      delivered: CheckCircle,
      failed: XCircle,
    };
    const Icon = icon[status] || AlertCircle;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${map[status] || 'bg-gray-100 text-gray-700'}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Message Logs</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign ID</label>
            <input
              type="text"
              value={filters.campaign_id}
              onChange={(e) => setFilters({ ...filters, campaign_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Filter by campaign ID"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="pending">Pending</option>
              <option value="sending">Sending</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
            <input
              type="text"
              value={filters.recipient}
              onChange={(e) => setFilters({ ...filters, recipient: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Filter by phone number"
            />
          </div>
          <button
            onClick={() => setFilters({ campaign_id: '', status: '', recipient: '' })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500">Sent</div>
          <div className="text-2xl font-bold text-green-600">{logs.filter(l => l.status === 'sent' || l.status === 'delivered').length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{logs.filter(l => l.status === 'queued' || l.status === 'pending' || l.status === 'sending').length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500">Failed</div>
          <div className="text-2xl font-bold text-red-600">{logs.filter(l => l.status === 'failed').length}</div>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No message logs found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{statusBadge(log.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.recipient}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.message}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.campaign_id || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.sent_at ? new Date(log.sent_at).toLocaleString() : '-'}</td>
                  <td className="px-6 py-4 text-sm text-red-600">{log.error || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: Math.min(pagination.pages, pagination.page + 1) })}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageLogs;
