import React from 'react';
import { Plus } from 'lucide-react';

const Campaigns: React.FC = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Campaigns</h2>
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          New Campaign
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <p className="text-gray-600">No campaigns yet. Create your first campaign to get started.</p>
      </div>
    </div>
  );
};

export default Campaigns;
