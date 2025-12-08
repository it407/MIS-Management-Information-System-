
// components/charts/FilteredDataCharts.js
import React, { useState, useEffect } from "react";
import HalfCircleChart from "../charts/halfcircledepartment";
import VerticalBarChart from "../charts/VerticalBarChartDepartment";
import HorizontalBarChart from "../charts/HorizontalBarChartDepartment";

const FilteredDataCharts = ({ filters, tableData }) => {
    const [chartData, setChartData] = useState({
        topScorers: { data: [], labels: [] },
        lowestScorers: { data: [], labels: [] },
        pendingTasks: { data: [], labels: [] }
    });
    const [loading, setLoading] = useState(false);
    const [filteredCount, setFilteredCount] = useState(0);

    // Table data ko chart ke format mein convert karein
    const convertTableDataToChartFormat = (tableData) => {
        console.log("Converting table data to chart format:", tableData.length);

        if (!tableData || tableData.length === 0) {
            return [];
        }

        // Table data se chart data banayein
        const chartFormattedData = tableData.map((task, index) => {
            // Performance score calculate karein
            const target = task.target || 0;
            const totalAchievement = task.totalAchievement || 0;
            const performanceScore = target > 0 ? (totalAchievement / target) * 100 : 0;

            return {
                id: `emp-${index}`,
                department: task.department || "",
                fmsName: task.fmsName || "",
                personName: task.personName || "",
                target: target,
                totalAchievement: totalAchievement,
                workDone: task.workDone || 0,
                workDoneOnTime: task.workDoneOnTime || 0,
                pendingTasks: task.allPendingTillDate || 0,
                startDate: task.startDate || "",
                endDate: task.endDate || "",
                performanceScore: performanceScore
            };
        });

        console.log("Converted data:", chartFormattedData.length, "items");
        return chartFormattedData;
    };

    // Prepare charts data
    const prepareChartsData = (filteredData) => {
        console.log("📊 Preparing charts from:", filteredData.length, "items");

        // Debug: Check what data we're getting
        console.log("First 3 filtered items:", filteredData.slice(0, 3).map(f => ({
            personName: f.personName,
            fmsName: f.fmsName,
            performanceScore: f.performanceScore,
            pendingTasks: f.pendingTasks
        })));

        if (filteredData.length === 0) {
            console.log("No data for charts");
            setChartData({
                topScorers: { data: [], labels: [] },
                lowestScorers: { data: [], labels: [] },
                pendingTasks: { data: [], labels: [] }
            });
            return;
        }

        const dataForScoring = filteredData;
        const dataForPending = filteredData.filter(item => item.pendingTasks > 0);

        console.log("Data for scoring charts:", dataForScoring.length);
        console.log("Data for pending charts:", dataForPending.length);

        // Top 5 Scorers
        let topScorers = [];
        if (dataForScoring.length > 0) {
            topScorers = [...dataForScoring]
                .sort((a, b) => b.performanceScore - a.performanceScore)
                .slice(0, 5);
        }

        // Lowest 5 Scorers
        let lowestScorers = [];
        if (dataForScoring.length > 0) {
            lowestScorers = [...dataForScoring]
                .sort((a, b) => a.performanceScore - b.performanceScore)
                .slice(0, 5);
        }

        // Top 5 Pending Tasks
        let pendingTasks = [];
        if (dataForPending.length > 0) {
            pendingTasks = [...dataForPending]
                .sort((a, b) => b.pendingTasks - a.pendingTasks)
                .slice(0, 5);
        }

        console.log("✅ Top scorers prepared:", topScorers.length);
        console.log("Top scorer sample:", topScorers[0]?.personName, topScorers[0]?.performanceScore);
        console.log("✅ Lowest scorers prepared:", lowestScorers.length);
        console.log("✅ Pending tasks prepared:", pendingTasks.length);

        // FIX: Create NEW objects to force re-render
        const newChartData = {
            topScorers: {
                data: topScorers.map(emp => emp.performanceScore || 0),
                labels: topScorers.map(emp => emp.personName || "Unknown")
            },
            lowestScorers: {
                data: lowestScorers.map(emp => emp.performanceScore || 0),
                labels: lowestScorers.map(emp => emp.personName || "Unknown")
            },
            pendingTasks: {
                data: pendingTasks.map(emp => emp.pendingTasks),
                labels: pendingTasks.map(emp => emp.personName || "Unknown")
            }
        };

        console.log("📈 Setting new chart data:", newChartData);
        setChartData(newChartData);
    };

    // When tableData changes, update charts
    useEffect(() => {
        console.log("Table data changed in charts:", tableData?.length);

        if (tableData && tableData.length > 0) {
            // Convert table data to chart format
            const chartFormattedData = convertTableDataToChartFormat(tableData);

            // Apply filters to chart data (same as table filters)
            applyFiltersToChartData(chartFormattedData, filters);
        } else {
            // No data case
            setChartData({
                topScorers: { data: [], labels: [] },
                lowestScorers: { data: [], labels: [] },
                pendingTasks: { data: [], labels: [] }
            });
            setFilteredCount(0);
        }
    }, [tableData, filters]);

    // Apply filters to chart data
    // FilteredDataCharts.js - applyFiltersToChartData function ko REPLACE karo

    const applyFiltersToChartData = (data, currentFilters) => {
        console.log("Applying chart filters:", currentFilters);
        let filtered = [...data];

        // Debug: Pehle 5 items ke FMS names dekho
        console.log("First 5 items FMS names:", filtered.slice(0, 5).map(item => ({
            fmsName: item.fmsName,
            lowercase: item.fmsName?.toLowerCase()
        })));

        // Filter by FMS Name - FIXED VERSION
        if (currentFilters?.filterFMSName) {
            const fmsFilter = currentFilters.filterFMSName.toLowerCase().trim();
            console.log("FMS Filter value in charts:", fmsFilter);
            console.log("Filter is:", currentFilters.filterFMSName);

            filtered = filtered.filter(item => {
                if (!item.fmsName || item.fmsName.trim() === "") {
                    console.log("Skipping - no FMS name");
                    return false;
                }

                const itemFMS = item.fmsName.toLowerCase().trim();
                console.log(`Comparing: "${itemFMS}" with "${fmsFilter}"`);

                // Check for exact match
                const isMatch = itemFMS === fmsFilter;
                console.log("Is match?", isMatch);

                return isMatch;
            });

            console.log(`After FMS filter in charts:`, filtered.length);
            console.log("Filtered items sample:", filtered.slice(0, 3).map(f => f.fmsName));
        }

        // Filter by Name - FIXED
        if (currentFilters?.filterName && currentFilters.filterName.trim() !== "") {
            const nameFilter = currentFilters.filterName.toLowerCase().trim();
            console.log("Name Filter value in charts:", nameFilter);

            filtered = filtered.filter(item => {
                if (!item.personName) return false;
                return item.personName.toLowerCase().trim() === nameFilter;
            });
            console.log(`After Name filter in charts:`, filtered.length);
        }

        // Filter by Department - FIXED
        if (currentFilters?.filterDepartment && currentFilters.filterDepartment.trim() !== "") {
            const deptFilter = currentFilters.filterDepartment.trim();
            console.log("Dept Filter value in charts:", deptFilter);

            filtered = filtered.filter(item => {
                if (!item.department) return false;
                return item.department.trim() === deptFilter;
            });
            console.log(`After Dept filter in charts:`, filtered.length);
        }

        // Date filters (same as before)
        if (currentFilters?.startDate) {
            filtered = filtered.filter(item => {
                if (!item.startDate) return false;
                const taskStartDate = new Date(item.startDate);
                const selectedStartDate = new Date(currentFilters.startDate);
                taskStartDate.setHours(0, 0, 0, 0);
                selectedStartDate.setHours(0, 0, 0, 0);
                return taskStartDate >= selectedStartDate;
            });
            console.log(`After Start Date filter in charts:`, filtered.length);
        }

        if (currentFilters?.endDate) {
            filtered = filtered.filter(item => {
                if (!item.endDate) return false;
                const taskEndDate = new Date(item.endDate);
                const selectedEndDate = new Date(currentFilters.endDate);
                taskEndDate.setHours(0, 0, 0, 0);
                selectedEndDate.setHours(0, 0, 0, 0);
                return taskEndDate <= selectedEndDate;
            });
            console.log(`After End Date filter in charts:`, filtered.length);
        }

        console.log("Final chart data count:", filtered.length);

        // Agar filter apply hua hai lekin koi data nahi mila
        if (filtered.length === 0 && data.length > 0) {
            console.log("⚠️ WARNING: Filters applied but no data found!");
            console.log("Check if FMS names in data match filter value");
            console.log("Available FMS names:", [...new Set(data.map(d => d.fmsName).filter(f => f))]);
        }

        prepareChartsData(filtered);
    };

    if (loading) {
        return (
            <div className="space-y-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border p-4 sm:p-6">
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border p-4 sm:p-6">
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 mb-6">
            {/* Debug info - remove in production */}
            <div className="text-xs text-gray-500">
                Showing charts from {filteredCount} filtered records
                {tableData && <span> (Table has: {tableData.length} records)</span>}
            </div>

            {/* First Row: Top 5 Scorers and Lowest Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top 5 Scorers */}
                <div className="bg-white rounded-lg border p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">Top 5 Scorers</h2>
                    </div>
                    <div className="h-64">
                        {chartData.topScorers.data.length > 0 ? (
                            <HalfCircleChart
                                key={`top-${chartData.topScorers.data.join('-')}`} // Force re-render
                                data={chartData.topScorers.data}
                                labels={chartData.topScorers.labels}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <div className="mb-2 text-2xl">📊</div>
                                    <p>No score data available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lowest Scores */}
                <div className="bg-white rounded-lg border p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">Lowest Scores</h2>
                    </div>
                    <div className="h-64">
                        {chartData.lowestScorers.data.length > 0 ? (
                            <VerticalBarChart
                                key={`low-${chartData.lowestScorers.data.join('-')}`} // Force re-render
                                data={chartData.lowestScorers.data}
                                labels={chartData.lowestScorers.labels}
                                maxValue={100}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <div className="mb-2 text-2xl">📈</div>
                                    <p>No score data available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Second Row: Pending Tasks by User (Full Width) */}
            <div className="bg-white border border-gray-200 rounded-xl shadow p-5 space-y-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 5a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1zM2 17a1 1 0 011-1h6a1 1 0 110 2H3a1 1 0 01-1-1z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-700">Pending Tasks by User</h2>
                    </div>
                </div>

                <div className="h-80 overflow-hidden">
                    {chartData.pendingTasks.data.length > 0 ? (
                        <HorizontalBarChart
                            key={`pending-${chartData.pendingTasks.data.join('-')}`} // Force re-render
                            data={chartData.pendingTasks.data}
                            labels={chartData.pendingTasks.labels}
                            maxValue={Math.max(...chartData.pendingTasks.data, 1)}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                                <div className="mb-2 text-2xl">📋</div>
                                <p>No pending tasks data available</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-right text-xs text-gray-400">
                    Showing {chartData.pendingTasks.labels.length} users (Filtered: {filteredCount})
                </div>
            </div>
        </div>
    );
};

export default FilteredDataCharts;