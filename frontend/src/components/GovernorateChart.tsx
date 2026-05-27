import React from 'react';

interface GovernorateData {
  governorate: string;
  count: number;
}

interface GovernorateChartProps {
  data: GovernorateData[];
}

const GovernorateChart: React.FC<GovernorateChartProps> = ({ data }) => {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacts by Governorate</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.governorate} className="flex items-center">
            <div className="w-32 text-sm text-gray-600 truncate">{item.governorate}</div>
            <div className="flex-1 mx-4">
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
            <div className="w-12 text-sm font-medium text-gray-900 text-right">{item.count}</div>
          </div>
        ))}
      </div>
      {data.every((d) => d.count === 0) && (
        <p className="text-center text-gray-500 mt-4">No contacts yet</p>
      )}
    </div>
  );
};

export default GovernorateChart;
