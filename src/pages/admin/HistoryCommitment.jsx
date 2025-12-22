import React, { useState, useEffect } from "react";
import { Calendar, Filter, Users, Target, Trash2 } from "lucide-react";

// Google Apps Script Web App URL
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxsivpBFRp-nkwL2tlmVRUNyW3U554AzguV3OQrYIjDBCh_G5cOG47_NWMHWOamOQY4/exec";
const SPREADSHEET_ID = "1t_-LmxTDhiibPo2HaBZIQJvXOBz_vQ_zsv2f8MhhdGM";
const SHEET_NAME = "Data";

const AdminHistoryCommitment = () => {
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedTarget, setSelectedTarget] = useState("all");
  const [historyData, setHistoryData] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Google Sheets
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${WEB_APP_URL}?action=getUsers&sheetName=${SHEET_NAME}&spreadsheetId=${SPREADSHEET_ID}`
        );
        const data = await response.json();
        
        if (data.status === "success" && data.users) {
          // Transform Google Sheets data to match our component structure
          const transformedHistory = data.users
            .filter(user => user['Person Name'] && user['Target']) // Filter out empty rows
            .map((user, index) => {
              // Handle potential missing image - using placeholder if not available
              let personImage = "";
              if (user['Link With Name']) {
                // Try to extract image URL from "Link With Name" column
                const linkParts = user['Link With Name'].toString().split(',');
                if (linkParts.length > 1) {
                  personImage = linkParts[0]?.trim();
                }
              }
              
              // If no image found, use a placeholder based on name
              if (!personImage) {
                personImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(user['Person Name'] || 'User')}&background=random`;
              }
              
              // Extract commitment data from relevant columns
              const target = parseInt(user['Target']) || 0;
              const commitment = parseInt(user['Next week Commintment ']) || 0; // Using Column O
              const plannedWorkNotDone = parseInt(user['Planned % Work Not Done']) || 0; // Using Column T
              const plannedWorkNotDoneOnTime = parseInt(user['Planned % Work Not Done On Time']) || 0; // Using Column U
              const startDate = user['Start Date'] || '';
              const endDate = user['End Date'] || '';
              
              return {
                id: `record-${index + 1}`,
                employeeId: user['Employee ID'] || `emp-${String(index + 1).padStart(3, '0')}`,
                name: user['Person Name'] || 'Unknown',
                department: user['Department'] || 'N/A',
                target: target,
                commitment: Math.min(commitment, 100), // Ensure commitment doesn't exceed 100%
                nextWeekPlannedWorkNotDone: Math.min(plannedWorkNotDone, 100),
                nextWeekPlannedWorkNotDoneOnTime: Math.min(plannedWorkNotDoneOnTime, 100),
                dateStart: user['Total Achievement'] || "",
                dateEnd: user['Week Pending Task'] || "",
                submittedAt: new Date().toISOString(), // Use current time as submitted time
                personImage: personImage,
                // Additional fields from sheet
                taskName: user['Task Name'] || '',
                fmsName: user['FMS Name'] || '',
                gmailId: user['Gmail ID'] || '',
                totalAchievement: parseInt(user['Total Achievement']) || 0,
                percentWorkDone: parseInt(user['% Work Done']) || 0,
                percentWorkDoneOnTime: parseInt(user['% Work Done On Time']) || 0,
                todayTask: parseInt(user['Today Task']) || 0
              };
            });
          
          setHistoryData(transformedHistory);
          
          // Create unique employees list
          const uniqueEmployees = Array.from(
            new Map(
              transformedHistory.map(record => [record.employeeId, {
                id: record.employeeId,
                name: record.name,
                department: record.department,
                image: record.personImage
              }])
            ).values()
          );
          
          setEmployees(uniqueEmployees);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Fallback: load from localStorage if API fails
        const saved = localStorage.getItem("commitmentHistory");
        if (saved) {
          const parsedData = JSON.parse(saved);
          setHistoryData(parsedData);
          // Extract employees from local storage data
          const localEmployees = Array.from(
            new Map(
              parsedData.map(record => [record.employeeId, {
                id: record.employeeId,
                name: record.name,
                department: record.department
              }])
            ).values()
          );
          setEmployees(localEmployees);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data whenever filters change
  useEffect(() => {
    applyFilters();
  }, [dateRange, selectedEmployee, selectedTarget, historyData]);

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    let filtered = [...historyData];

    // Date range filter - only apply if both dates are set
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.dateStart);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);

        return recordDate >= startDate && recordDate <= endDate;
      });
    }

    // Employee filter
    if (selectedEmployee !== "all") {
      filtered = filtered.filter(
        (record) => record.employeeId === selectedEmployee
      );
    }

    // Target range filter
    if (selectedTarget !== "all") {
      const targetValue = parseInt(selectedTarget);
      filtered = filtered.filter((record) => {
        return (
          record.target >= targetValue - 5 && record.target <= targetValue + 5
        );
      });
    }

    setFilteredHistory(filtered);
  };

  const handleClearFilters = () => {
    setDateRange({
      startDate: "",
      endDate: "",
    });
    setSelectedEmployee("all");
    setSelectedTarget("all");
  };

  const handleDeleteRecord = (index) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const updatedHistory = historyData.filter((_, i) => i !== index);
      setHistoryData(updatedHistory);
      // Also save to localStorage for persistence
      localStorage.setItem("commitmentHistory", JSON.stringify(updatedHistory));
    }
  };

  const calculateStats = () => {
    if (filteredHistory.length === 0) {
      return {
        totalRecords: 0,
        avgCommitment: 0,
        avgWorkNotDone: 0,
        avgWorkNotDoneOnTime: 0,
      };
    }

    return {
      totalRecords: filteredHistory.length,
      avgCommitment: Math.round(
        filteredHistory.reduce((acc, rec) => acc + rec.commitment, 0) /
          filteredHistory.length
      ),
      avgWorkNotDone: Math.round(
        filteredHistory.reduce(
          (acc, rec) => acc + rec.nextWeekPlannedWorkNotDone,
          0
        ) / filteredHistory.length
      ),
      avgWorkNotDoneOnTime: Math.round(
        filteredHistory.reduce(
          (acc, rec) => acc + rec.nextWeekPlannedWorkNotDoneOnTime,
          0
        ) / filteredHistory.length
      ),
    };
  };

  const stats = calculateStats();
  const getHistoryIndex = (filteredRecord) => {
    return historyData.findIndex(
      (rec) => rec.id === filteredRecord.id
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading commitment data from Google Sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 justify-between items-start sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-blue-600 lg:text-2xl">
            History Commitment
          </h1>
          {/* <p className="mt-1 text-sm text-gray-500">
            Showing {filteredHistory.length} records from Google Sheets
          </p> */}
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex gap-2 items-center mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
          <button
            onClick={handleClearFilters}
            className="px-3 py-1 ml-auto text-xs text-gray-700 bg-gray-200 rounded-md transition-colors hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>

        {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"> */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Employee Filter */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Employee
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="py-2 pr-8 pl-10 w-full text-sm bg-white rounded-md border border-gray-300 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Range Filter */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Target Range
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="py-2 pr-8 pl-10 w-full text-sm bg-white rounded-md border border-gray-300 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Targets</option>
                <option value="85">80-90%</option>
                <option value="90">85-95%</option>
                <option value="95">90-100%</option>
                <option value="100">95-100%</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Commitment History
          </h2>
          {/* <p className="mt-1 text-sm text-gray-500">
            Showing {filteredHistory.length} records for the selected period
          </p> */}
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Employee ID
                </th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Department
                </th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                   Total Target
                </th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
               Total Achievement
                </th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Week Pending Task
                </th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Planned % Work Not Done
                </th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Planned % Work Not Done On Time
                </th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Commitment
                </th>
                {/* <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Submitted
                </th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Action
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((record, idx) => {
                  const historyIndex = getHistoryIndex(record);
                  const submittedDate = new Date(record.submittedAt);
                  const formattedDate =
                    submittedDate.toLocaleDateString("en-IN");
                  const formattedTime = submittedDate.toLocaleTimeString(
                    "en-IN",
                    { hour: "2-digit", minute: "2-digit" }
                  );

                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.employeeId}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img 
                            src={record.personImage} 
                            alt={record.name}
                            className="w-8 h-8 rounded-full object-cover mr-3"
                          />
                          <div className="text-sm font-medium text-gray-900">
                            {record.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {record.department}
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {record.target}%
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {record.dateStart}%
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {record.dateEnd}%
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex gap-2 items-center">
                          <div className="w-12 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-blue-600 rounded-full"
                              style={{
                                width: `${Math.min(
                                  record.nextWeekPlannedWorkNotDone,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <span className="w-8 text-sm font-medium text-gray-900">
                            {record.nextWeekPlannedWorkNotDone}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex gap-2 items-center">
                          <div className="w-12 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-yellow-600 rounded-full"
                              style={{
                                width: `${Math.min(
                                  record.nextWeekPlannedWorkNotDoneOnTime,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <span className="w-8 text-sm font-medium text-gray-900">
                            {record.nextWeekPlannedWorkNotDoneOnTime}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            record.commitment >= 95
                              ? "bg-green-100 text-green-800"
                              : record.commitment >= 85
                              ? "bg-yellow-100 text-yellow-800"
                              : record.commitment >= 75
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {record.commitment}%
                        </span>
                      </td>
                      {/* <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          <div>{formattedDate}</div>
                          <div className="text-gray-500">{formattedTime}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteRecord(historyIndex)}
                          className="text-red-600 transition-colors hover:text-red-900"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td> */}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="11"
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    <div className="flex flex-col gap-2 items-center">
                      <Filter className="w-8 h-8 text-gray-400" />
                      <span>
                        No commitment records found for the selected period
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="divide-y divide-gray-200 lg:hidden">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((record, idx) => {
              const historyIndex = getHistoryIndex(record);
              const submittedDate = new Date(record.submittedAt);
              const formattedDate =
                submittedDate.toLocaleDateString("en-IN");
              const formattedTime = submittedDate.toLocaleTimeString(
                "en-IN",
                { hour: "2-digit", minute: "2-digit" }
              );

              return (
                <div key={record.id} className="p-4 bg-white transition-colors hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-1 gap-3 items-center min-w-0">
                      <img 
                        src={record.personImage} 
                        alt={record.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <div className="text-sm text-gray-600">
                          ID: {record.employeeId}
                        </div>
                        <div className="text-base font-semibold text-gray-900 truncate">{record.name}</div>
                        <div className="text-sm text-gray-500">{record.department}</div>
                      </div>
                    </div>
                    {/* <button
                      onClick={() => handleDeleteRecord(historyIndex)}
                      className="flex-shrink-0 text-red-600 transition-colors hover:text-red-900"
                      title="Delete record"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button> */}
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-medium text-gray-900">{record.target}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Week Start:</span>
                      <span className="text-gray-900">{record.dateStart || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Week End:</span>
                      <span className="text-gray-900">{record.dateEnd || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Planned Work Not Done:</span>
                      <div className="flex flex-1 gap-2 justify-end items-center">
                        <div className="flex-shrink-0 w-20 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-blue-600 rounded-full"
                            style={{
                              width: `${Math.min(
                                record.nextWeekPlannedWorkNotDone,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-medium text-gray-900 whitespace-nowrap">{record.nextWeekPlannedWorkNotDone}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Not Done On Time:</span>
                      <div className="flex flex-1 gap-2 justify-end items-center">
                        <div className="flex-shrink-0 w-20 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-yellow-600 rounded-full"
                            style={{
                              width: `${Math.min(
                                record.nextWeekPlannedWorkNotDoneOnTime,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-medium text-gray-900 whitespace-nowrap">{record.nextWeekPlannedWorkNotDoneOnTime}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Commitment:</span>
                      <span
                        className={`font-semibold px-2 py-1 rounded-full text-xs ${
                          record.commitment >= 95
                            ? "bg-green-100 text-green-800"
                            : record.commitment >= 85
                            ? "bg-yellow-100 text-yellow-800"
                            : record.commitment >= 75
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {record.commitment}%
                      </span>
                    </div>
                    {/* <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Submitted:</span>
                      <div className="text-xs text-right">
                        <div className="font-medium text-gray-900">{formattedDate}</div>
                        <div className="text-gray-500">{formattedTime}</div>
                      </div>
                    </div> */}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="flex flex-col gap-2 items-center">
                <Filter className="w-8 h-8 text-gray-400" />
                <span>
                  No commitment records found for the selected period
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHistoryCommitment;