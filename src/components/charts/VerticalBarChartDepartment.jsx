// // components/charts/VerticalBarChart.jsx
// import React, { useEffect, useState } from 'react';

// const VerticalBarChart = ({ data, labels, maxValue = 100 }) => {
//   const [animatedHeights, setAnimatedHeights] = useState(data.map(() => 0));
//   const [isInitial, setIsInitial] = useState(true);

//   useEffect(() => {
//     if (isInitial) {
//       setAnimatedHeights(data);
//       setIsInitial(false);
//     } else {
//       // Animate bars
//       const timeout = setTimeout(() => {
//         setAnimatedHeights(data);
//       }, 100);
//       return () => clearTimeout(timeout);
//     }
//   }, [data, labels, isInitial]);

//   if (!data || data.length === 0) {
//     return (
//       <div className="flex items-center justify-center h-full text-gray-500">
//         <div className="text-center">
//           <div className="mb-2 text-2xl">📈</div>
//           <p>No score data available</p>
//         </div>
//       </div>
//     );
//   }

//   const colors = [
//     'linear-gradient(180deg, #EF4444 0%, #F87171 100%)',
//     'linear-gradient(180deg, #F97316 0%, #FB923C 100%)',
//     'linear-gradient(180deg, #F59E0B 0%, #FBBF24 100%)',
//     'linear-gradient(180deg, #EAB308 0%, #FACC15 100%)',
//     'linear-gradient(180deg, #84CC16 0%, #A3E635 100%)'
//   ];
  
//   const barWidth = 100 / data.length;

//   return (
//     <div className="h-64 w-full px-4">
//       <div className="relative h-48 w-full">
//         {/* Grid lines */}
//         <div className="absolute top-0 left-0 right-0 h-px bg-gray-200"></div>
//         <div className="absolute top-1/4 left-0 right-0 h-px bg-gray-200"></div>
//         <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200"></div>
//         <div className="absolute top-3/4 left-0 right-0 h-px bg-gray-200"></div>
        
//         {/* Bars */}
//         <div className="flex items-end h-48 space-x-2">
//           {animatedHeights.map((value, index) => {
//             const heightPercentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
//             return (
//               <div 
//                 key={index}
//                 className="flex-1 flex flex-col items-center"
//                 style={{ width: `${barWidth}%` }}
//               >
//                 {/* Value above bar */}
//                 <div className="mb-1 text-xs font-semibold" style={{ color: '#EF4444' }}>
//                   {value.toFixed(0)}%
//                 </div>
                
//                 {/* Bar container */}
//                 <div className="relative w-full h-40">
//                   {/* Bar background */}
//                   <div className="absolute bottom-0 left-1/4 right-1/4 bg-gray-100 rounded-t-lg" style={{ height: '100%' }} />
                  
//                   {/* Animated bar */}
//                   <div 
//                     className="absolute bottom-0 left-1/4 right-1/4 rounded-t-lg transition-all duration-1000 ease-out"
//                     style={{ 
//                       height: `${heightPercentage}%`,
//                       background: colors[index % colors.length],
//                       minHeight: value > 0 ? '4px' : '0'
//                     }}
//                   >
//                     {/* Bar highlight */}
//                     <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-lg"></div>
//                   </div>
//                 </div>
                
//                 {/* Label */}
//                 <div className="mt-2 text-center">
//                   <div className="text-xs font-medium text-gray-700 truncate px-1" title={labels[index]}>
//                     {labels[index]?.split(' ')[0] || ''}
//                   </div>
//                   <div className="text-[10px] text-gray-500 mt-0.5">
//                     Score
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
      
//       {/* Y-axis labels */}
//       <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
//         <span>{maxValue}%</span>
//         <span>{(maxValue * 0.75).toFixed(0)}%</span>
//         <span>{(maxValue * 0.5).toFixed(0)}%</span>
//         <span>{(maxValue * 0.25).toFixed(0)}%</span>
//         <span>0%</span>
//       </div>
//     </div>
//   );
// };

// export default VerticalBarChart;

// components/charts/VerticalBarChartDepartment.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const VerticalBarChart = ({ data, labels, maxValue = 100 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-gray-500">
          <div className="mb-2 text-2xl">📈</div>
          <p>No score data available</p>
        </div>
      </div>
    );
  }

  const colors = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#FACC15', // Yellow
    '#8B5CF6', // Violet
    '#3B82F6', // Blue
    '#22C55E', // Green
    '#EC4899', // Pink
  ];

  const chartData = {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.label}: ${context.parsed.y.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: maxValue,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: '#64748B',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: '#64748B',
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  return (
    <div className="relative bg-white rounded-lg h-full">
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default VerticalBarChart;