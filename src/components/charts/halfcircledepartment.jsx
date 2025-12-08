// // components/charts/HalfCircleChart.jsx
// import React, { useEffect, useState } from 'react';

// const HalfCircleChart = ({ data, labels }) => {
//   const [animatedData, setAnimatedData] = useState(data.map(() => 0));
//   const [isInitial, setIsInitial] = useState(true);

//   useEffect(() => {
//     if (isInitial) {
//       setAnimatedData(data);
//       setIsInitial(false);
//     } else {
//       // Animate to new values
//       const timeout = setTimeout(() => {
//         setAnimatedData(data);
//       }, 100);
//       return () => clearTimeout(timeout);
//     }
//   }, [data, labels, isInitial]);

//   if (!data || data.length === 0) {
//     return (
//       <div className="flex items-center justify-center h-full text-gray-500">
//         <div className="text-center">
//           <div className="mb-2 text-2xl">📊</div>
//           <p>No score data available</p>
//         </div>
//       </div>
//     );
//   }

//   const maxValue = Math.max(...data, 1);
//   const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];
  
//   return (
//     <div className="relative h-64 w-full">
//       {/* Half circle visualization */}
//       <div className="absolute inset-0 flex items-center justify-center">
//         <div className="relative w-64 h-32">
//           {/* Background half circle */}
//           <svg className="w-full h-full" viewBox="0 0 200 100">
//             <path
//               d="M 20,100 A 80,80 0 0,1 180,100"
//               fill="none"
//               stroke="#E5E7EB"
//               strokeWidth="12"
//               strokeLinecap="round"
//             />
            
//             {/* Data arcs */}
//             {animatedData.map((value, index) => {
//               if (value <= 0) return null;
              
//               const percentage = (value / maxValue) * 100;
//               const angle = (percentage / 100) * 180;
//               const radius = 80;
//               const centerX = 100;
//               const centerY = 100;
              
//               const startAngle = 180;
//               const endAngle = 180 - angle;
              
//               const x1 = centerX + radius * Math.cos(startAngle * Math.PI / 180);
//               const y1 = centerY + radius * Math.sin(startAngle * Math.PI / 180);
//               const x2 = centerX + radius * Math.cos(endAngle * Math.PI / 180);
//               const y2 = centerY + radius * Math.sin(endAngle * Math.PI / 180);
              
//               const largeArcFlag = angle > 180 ? 1 : 0;
              
//               return (
//                 <path
//                   key={index}
//                   d={`M ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag},0 ${x2},${y2}`}
//                   fill="none"
//                   stroke={colors[index % colors.length]}
//                   strokeWidth="12"
//                   strokeLinecap="round"
//                   className="transition-all duration-1000 ease-out"
//                 />
//               );
//             })}
//           </svg>
//         </div>
//       </div>
      
//       {/* Labels and values */}
//       <div className="absolute bottom-0 left-0 right-0">
//         <div className="grid grid-cols-5 gap-1">
//           {labels.map((label, index) => (
//             <div 
//               key={index} 
//               className="text-center p-1 rounded-lg transition-all duration-300 hover:bg-gray-50"
//             >
//               <div className="text-xs font-semibold text-gray-700 truncate" title={label}>
//                 {label.split(' ')[0]}
//               </div>
//               <div 
//                 className="text-sm font-bold mt-1 transition-all duration-1000"
//                 style={{ color: colors[index % colors.length] }}
//               >
//                 {animatedData[index]?.toFixed(0)}%
//               </div>
//               <div className="h-1 w-10 mx-auto bg-gray-100 rounded-full mt-1 overflow-hidden">
//                 <div 
//                   className="h-full rounded-full transition-all duration-1000"
//                   style={{ 
//                     width: `${(animatedData[index] / maxValue) * 100}%`,
//                     backgroundColor: colors[index % colors.length]
//                   }}
//                 />
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
      
//       {/* Center value */}
//       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/3 text-center">
//         <div className="text-3xl font-bold text-gray-800 transition-all duration-1000">
//           {Math.max(...animatedData).toFixed(0)}%
//         </div>
//         <div className="text-xs text-gray-500 mt-1">Top Score</div>
//       </div>
//     </div>
//   );
// };

// export default HalfCircleChart;








// components/charts/halfcircledepartment.js
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const HalfCircleChart = ({ data, labels }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-gray-500">
          <div className="mb-2 text-2xl">📊</div>
          <p>No score data available</p>
        </div>
      </div>
    );
  }

  const colors = ['#4DA9A6', '#418FBC', '#8C6EC6', '#CC855C', '#CC6B7C'];

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
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    circumference: 180,
    rotation: -90,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Arial, sans-serif',
            size: 12,
          },
          color: '#333',
          generateLabels: (chart) => {
            const chartData = chart.data;
            if (chartData.labels.length && chartData.datasets.length) {
              return chartData.labels.map((label, i) => ({
                text: `${label} (${chartData.datasets[0].data[i].toFixed(1)}%)`,
                fillStyle: chartData.datasets[0].backgroundColor[i],
                hidden: false,
                lineWidth: 0,
                strokeStyle: 'rgba(0,0,0,0)',
                pointStyle: 'circle',
              }));
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value.toFixed(1)}%`;
          },
        },
      },
    },
  };

  return (
    <div className="relative w-full h-full">
      <div className="h-64">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default HalfCircleChart;