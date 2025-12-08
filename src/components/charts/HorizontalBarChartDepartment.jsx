// // components/charts/HorizontalBarChart.jsx
// import React, { useEffect, useState } from 'react';

// const HorizontalBarChart = ({ data, labels, maxValue }) => {
//   const [animatedWidths, setAnimatedWidths] = useState(data.map(() => 0));
//   const [isInitial, setIsInitial] = useState(true);

//   useEffect(() => {
//     if (isInitial) {
//       setAnimatedWidths(data);
//       setIsInitial(false);
//     } else {
//       // Animate bars
//       const timeout = setTimeout(() => {
//         setAnimatedWidths(data);
//       }, 100);
//       return () => clearTimeout(timeout);
//     }
//   }, [data, labels, maxValue, isInitial]);

//   if (!data || data.length === 0) {
//     return (
//       <div className="flex items-center justify-center h-full text-gray-500">
//         <div className="text-center">
//           <div className="mb-2 text-2xl">📋</div>
//           <p>No pending tasks data available</p>
//         </div>
//       </div>
//     );
//   }

//   const colors = [
//     'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
//     'linear-gradient(90deg, #EC4899 0%, #F472B6 100%)',
//     'linear-gradient(90deg, #6366F1 0%, #818CF8 100%)',
//     'linear-gradient(90deg, #14B8A6 0%, #2DD4BF 100%)',
//     'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)'
//   ];

//   return (
//     <div className="h-80 w-full space-y-4">
//       {animatedWidths.map((value, index) => {
//         const widthPercentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        
//         return (
//           <div 
//             key={index}
//             className="space-y-2 p-3 rounded-lg transition-all duration-300 hover:bg-gray-50"
//           >
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-3">
//                 {/* Rank badge */}
//                 <div 
//                   className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
//                   style={{ background: colors[index % colors.length] }}
//                 >
//                   {index + 1}
//                 </div>
                
//                 {/* Name */}
//                 <div className="flex flex-col">
//                   <span className="text-sm font-semibold text-gray-800">
//                     {labels[index]}
//                   </span>
//                   <span className="text-xs text-gray-500">
//                     Employee #{index + 1}
//                   </span>
//                 </div>
//               </div>
              
//               {/* Value */}
//               <div className="flex flex-col items-end">
//                 <span className="text-lg font-bold text-gray-900">
//                   {value}
//                 </span>
//                 <span className="text-xs text-gray-500">
//                   tasks pending
//                 </span>
//               </div>
//             </div>
            
//             {/* Progress bar */}
//             <div className="relative">
//               {/* Background */}
//               <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
//                 {/* Animated fill */}
//                 <div 
//                   className="h-full rounded-full transition-all duration-1000 ease-out relative"
//                   style={{ 
//                     width: `${widthPercentage}%`,
//                     background: colors[index % colors.length]
//                   }}
//                 >
//                   {/* Shine effect */}
//                   <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/30 rounded-full"></div>
//                 </div>
//               </div>
              
//               {/* Percentage indicator */}
//               <div className="text-right mt-1">
//                 <span className="text-xs font-medium text-gray-600">
//                   {widthPercentage.toFixed(1)}% of maximum
//                 </span>
//               </div>
//             </div>
            
//             {/* Task details */}
//             <div className="flex justify-between text-xs text-gray-500">
//               <span>0 tasks</span>
//               <span className="font-medium">{value} tasks</span>
//               <span>{maxValue} tasks</span>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default HorizontalBarChart;












// components/charts/HorizontalBarChartDepartment.js
import React, { useState, useEffect } from 'react';

const HorizontalBarChart = ({ data, labels, maxValue }) => {
  const [animatedData, setAnimatedData] = useState(data.map(() => 0));

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-gray-500">
          <div className="mb-2 text-2xl">📋</div>
          <p>No pending tasks data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Scrollable container */}
      <div 
        className="overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100"
        style={{ maxHeight: '400px' }}
      >
        <table className="min-w-full divide-y divide-gray-200">
          {/* Sticky header */}
          <thead className="bg-blue-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider w-3/4">
                Pending
              </th>
            </tr>
          </thead>
          
          {/* Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {labels.map((label, index) => {
              const barColor = animatedData[index] > 75 
                ? 'bg-red-500' 
                : animatedData[index] > 50 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500';

              return (
                <tr key={index} className="hover:bg-gray-50">
                  {/* Name column */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {label}
                    </div>
                  </td>
                  
                  {/* Bar + Number column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3.5">
                        <div 
                          className={`${barColor} h-3.5 rounded-full transition-all duration-700`}
                          style={{ width: `${(animatedData[index] / maxValue) * 100}%` }}
                        />
                      </div>
                      
                      {/* Number */}
                      <span className="text-sm font-medium text-gray-700 min-w-[40px]">
                        {animatedData[index]}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with count */}
      <div className="mt-2 text-sm text-gray-500 text-right px-6 pb-2 bg-gray-50 border-t">
        Showing {labels.length} users
      </div>
    </div>
  );
};

export default HorizontalBarChart;