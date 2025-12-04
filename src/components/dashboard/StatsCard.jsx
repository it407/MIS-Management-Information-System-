

import React from 'react';
import { Activity } from 'lucide-react'; // default icon

const StatsCard = ({
  title,
  value = 'Loading...',
  icon: Icon = Activity,
  color = 'blue',
  trend,
}) => {
  const colorClasses = {
    blue: {
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
    },
    green: {
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconText: 'text-green-600',
    },
    red: {
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
    },
    yellow: {
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconText: 'text-yellow-600',
    },
    purple: {
      border: 'border-purple-200',
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-600',
    },
  };

  const currentColor = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`bg-white rounded-lg p-6 border ${currentColor.border} shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${currentColor.iconBg} mr-4`}>
          <Icon className={`w-6 h-6 ${currentColor.iconText}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h4 className="text-2xl font-semibold mt-1 text-gray-800">
            {value ?? '--'}
          </h4>
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center">
          <span
            className={`flex items-center text-sm ${
              trend.positive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </span>
          <span className="text-sm text-gray-500 ml-2">{trend.label}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
