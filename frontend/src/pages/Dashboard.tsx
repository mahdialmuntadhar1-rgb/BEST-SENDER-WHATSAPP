import React, { useEffect, useState } from 'react';
import { healthCheck, getNabdaBalance, getStoredCredentials } from '../services/api';
import { Activity, MessageSquare, Users, DollarSign } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');
  const [balance, setBalance] = useState<{ balance: number; currency: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const health = await healthCheck();
        setHealthStatus(health.status);
      } catch (error) {
        setHealthStatus('Error');
      }

      try {
        const creds = getStoredCredentials();
        if (creds.apiKey && creds.instanceId) {
          const bal = await getNabdaBalance(creds.apiKey, creds.instanceId);
          setBalance(bal);
        }
      } catch (error) {
        console.error('Failed to load balance:', error);
      }
    };

    loadData();
  }, []);

  const stats = [
    { name: 'System Status', value: healthStatus, icon: Activity, color: 'bg-green-500' },
    { name: 'Balance', value: balance ? `${balance.balance} ${balance.currency}` : 'Loading...', icon: DollarSign, color: 'bg-blue-500' },
    { name: 'Total Contacts', value: '0', icon: Users, color: 'bg-purple-500' },
    { name: 'Active Campaigns', value: '0', icon: MessageSquare, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
            <MessageSquare className="h-5 w-5 mr-2" />
            Create Campaign
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Users className="h-5 w-5 mr-2" />
            Add Contact
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <MessageSquare className="h-5 w-5 mr-2" />
            Send Test Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
