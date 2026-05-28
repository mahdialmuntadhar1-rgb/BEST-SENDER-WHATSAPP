import React, { useState, useEffect } from 'react';
import { Plus, Upload, Search, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import GovernorateChart from '../components/GovernorateChart';
import ImportModal from '../components/ImportModal';
import { Contact, Governorate, GovernorateCount, PaginationMeta } from '../types';
import api from '../services/api';

const GOVERNORATES: Governorate[] = [
  'Baghdad', 'Basra', 'Erbil', 'Duhok', 'Zakho', 'Sulaymaniyah',
  'Najaf', 'Karbala', 'Mosul', 'Kirkuk', 'Anbar', 'Diyala', 'Wasit',
  'Maysan', 'Dhi Qar', 'Babil', 'Qadisiyah', 'Muthanna', 'Salah ad Din', 'Halabja',
];

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [governorateCounts, setGovernorateCounts] = useState<GovernorateCount[]>([]);
  const [selectedGovernorates, setSelectedGovernorates] = useState<Governorate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (searchQuery) params.append('search', searchQuery);
      selectedGovernorates.forEach((gov) => params.append('governorate', gov));

      const response = await api.get(`/contacts?${params.toString()}`);
      setContacts(response.data.contacts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGovernorateCounts = async () => {
    try {
      const response = await api.get('/contacts/governorates/counts');
      setGovernorateCounts(response.data.counts);
    } catch (error) {
      console.error('Failed to fetch governorate counts:', error);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [pagination.page, selectedGovernorates, searchQuery]);

  useEffect(() => {
    fetchGovernorateCounts();
  }, []);

  const handleToggleGovernorate = (governorate: Governorate) => {
    setSelectedGovernorates((prev) =>
      prev.includes(governorate)
        ? prev.filter((g) => g !== governorate)
        : [...prev, governorate]
    );
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSelectAllGovernorates = () => {
    setSelectedGovernorates(GOVERNORATES);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearGovernorates = () => {
    setSelectedGovernorates([]);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSelectContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSelectAllContacts = () => {
    setSelectedContacts(contacts.map((c) => c.id!));
  };

  const handleClearSelection = () => {
    setSelectedContacts([]);
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      fetchContacts();
      fetchGovernorateCounts();
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedContacts.length} contacts?`)) return;
    try {
      await api.delete('/contacts/bulk', { data: { ids: selectedContacts } });
      setSelectedContacts([]);
      fetchContacts();
      fetchGovernorateCounts();
    } catch (error) {
      console.error('Failed to delete contacts:', error);
    }
  };

  const handleImportComplete = () => {
    fetchContacts();
    fetchGovernorateCounts();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-5 w-5 mr-2" />
            Import CSV
          </button>
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
            <Plus className="h-5 w-5 mr-2" />
            Add Contact
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="mb-4">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleSelectAllGovernorates}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleClearGovernorates}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {GOVERNORATES.map((gov) => (
                  <label key={gov} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={selectedGovernorates.includes(gov)}
                      onChange={() => handleToggleGovernorate(gov)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                    />
                    <span className="ml-2 truncate">{gov}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <GovernorateChart data={governorateCounts} />
        </div>
      </div>

      {selectedContacts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 flex items-center justify-between">
          <span className="text-blue-700">{selectedContacts.length} contacts selected</span>
          <div className="flex gap-2">
            <button
              onClick={handleClearSelection}
              className="px-3 py-1 text-sm text-blue-700 hover:text-blue-900"
            >
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === contacts.length && contacts.length > 0}
                    onChange={contacts.length > 0 ? handleSelectAllContacts : handleClearSelection}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Governorate</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Language</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No contacts found
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id!)}
                        onChange={() => handleSelectContact(contact.id!)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{contact.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{contact.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{contact.governorate || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{contact.language || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-gray-400 hover:text-gray-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id!)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} contacts
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
      </div>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

export default Contacts;
