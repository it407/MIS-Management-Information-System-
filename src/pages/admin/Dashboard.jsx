
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Download, Calendar } from "lucide-react";
import {
  getTopScorers,
  getLowestScorers,
  getEmployeesByPendingTasks,
  getWeeklyCommitmentComparison,
} from "../../data/mockData";
import EmployeesTable from "../../components/tables/EmployeesTable";
import HalfCircleChart from "../../components/charts/HalfCircleChart";
import HorizontalBarChart from "../../components/charts/HorizontalBarChart";
import VerticalBarChart from "../../components/charts/VerticalBarChart";
import { generateDashboardPDF } from "../../utils/pdfGenerator";

const AdminDashboard = () => {
  // Data from mock APIs
  const topScorers = getTopScorers(5);
  const lowestScorers = getLowestScorers(5);
  const employeesByPending = getEmployeesByPendingTasks().slice(0, 5);
  const commitmentComparison = getWeeklyCommitmentComparison();
  const [isDownloading, setIsDownloading] = useState(false);
  // Chart data preparation
  const topScorersData = topScorers.map((emp) => emp.score);
  const topScorersLabels = topScorers.map((emp) => emp.name);
  const lowestScorersData = lowestScorers.map((emp) => emp.score);
  const lowestScorersLabels = lowestScorers.map((emp) => emp.name);
  const pendingTasksData = employeesByPending.map((emp) => emp.pendingTasks);
  const pendingTasksLabels = employeesByPending.map((emp) => emp.name);

  // State management
  const [plannedWorkData, setPlannedWorkData] = useState({ notDone: [], notDoneOnTime: [] });
  const [dashboardTasks, setDashboardTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardHeaders, setDashboardHeaders] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [commitments, setCommitments] = useState({});
  const [departmentChartUrl, setDepartmentChartUrl] = useState("");


  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmittingDates, setIsSubmittingDates] = useState(false);





  // Configuration constants
  const DISPLAY_COLUMNS = [
    "col13", "col2", "col3", "col4", "col5", "col6", "col7",
    "col8", "col9", "col10", "col11", "col12", "col15"
  ];
  const ALLOWED_COLUMNS = [
    "col13", "col2", "col3", "col4", "col5", "col6", "col7",
    "col8", "col9", "col10", "col11", "col12", "col14", "col15"
  ];
  const SPREADSHEET_ID = "1t_-LmxTDhiibPo2HaBZIQJvXOBz_vQ_zsv2f8MhhdGM";
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxsivpBFRp-nkwL2tlmVRUNyW3U554AzguV3OQrYIjDBCh_G5cOG47_NWMHWOamOQY4/exec";
  const DEPARTMENT_CHART_ID = "1932717403";

  // Generate the department chart URL
  useEffect(() => {
    const chartUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/pubchart?oid=${DEPARTMENT_CHART_ID}&format=image`;
    setDepartmentChartUrl(chartUrl);
  }, []);

  // Insert commitment into Google Sheet
  const insertCommitment = async (employeeName, commitmentValue) => {
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'insertCommitment',
          employeeName,
          commitmentValue,
          spreadsheetId: SPREADSHEET_ID,
          sheetName: "For Records",
          nameColumn: "C",
          commitmentColumn: "O"
        })
      });

      const result = await response.json();

      if (result.status === "success") {
        toast.success(`Commitment updated for ${employeeName}`);
        fetchDashboardData(); // Refresh data
        return true;
      } else {
        throw new Error(result.message || "Update failed");
      }
    } catch (error) {
      toast.error(`Failed to update commitment: ${error.message}`);
      return false;
    }
  };

  // Fetch dashboard data from Google Sheets
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=For Records`
      );
      const text = await response.text();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      const data = JSON.parse(text.substring(jsonStart, jsonEnd + 1));

      if (!data.table || !data.table.rows) {
        throw new Error("No table data found");
      }

      // Prepare column headers
      const PROGRESS_COLUMNS = ["col5", "col6", "col10", "col11"];
      const IMAGE_COLUMNS = ["col13"];
      const COMMITMENT_COLUMNS = ["col14"];
      const NAME_COLUMNS = ["col2"];

      const headers = data.table.cols.map((col, index) => {
        const columnId = `col${index}`;
        const sampleValue = data.table.rows?.[0]?.c?.[index]?.v ?? "";
        const isProgress = PROGRESS_COLUMNS.includes(columnId) ||
          (typeof sampleValue === "string" && sampleValue.includes("%"));
        const isImage = IMAGE_COLUMNS.includes(columnId);
        const isCommitment = COMMITMENT_COLUMNS.includes(columnId);
        const isName = NAME_COLUMNS.includes(columnId);

        return {
          id: columnId,
          label: col.label || `Column ${index + 1}`,
          isProgress,
          isImage,
          isCommitment,
          isName
        };
      });

      // Prepare row items
      const fmsItems = data.table.rows.map((row, i) => {
        const item = {
          _id: `${i}-${Math.random().toString(36).substr(2, 9)}`,
          _rowIndex: i + 1,
          selected: false
        };
        if (row.c) {
          row.c.forEach((cell, j) => {
            item[`col${j}`] = cell?.v ?? cell?.f ?? "";
          });
        }
        return item;
      });

      // Initialize commitments
      const initialCommitments = {};
      fmsItems.forEach(item => {
        const commitmentValue = item.col14;
        initialCommitments[item._id] = commitmentValue === true ||
          commitmentValue === "TRUE" ||
          commitmentValue === 1;
      });
      setCommitments(initialCommitments);

      // Prepare planned work data
      const notDoneData = [];
      const notDoneOnTimeData = [];

      data.table.rows.forEach(row => {
        notDoneData.push(row.c[10]?.v || 0);
        notDoneOnTimeData.push(row.c[11]?.v || 0);
      });

      setPlannedWorkData({
        notDone: notDoneData,
        notDoneOnTime: notDoneOnTimeData
      });

      // Update state
      setDashboardHeaders(headers);
      setDashboardTasks(fmsItems);
      toast.success(`Fetched ${fmsItems.length} dashboard tasks`);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      toast.error(`Failed to load dashboard data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (id, checked) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  // Handle commitment changes
  const handleCommitmentChange = async (id, checked) => {
    const employee = dashboardTasks.find(task => task._id === id);
    if (!employee) {
      toast.error("Employee not found");
      return;
    }

    const employeeName = employee.col3 || `Employee ${employee._rowIndex}`;

    // Optimistic update
    setCommitments(prev => ({
      ...prev,
      [id]: checked
    }));

    // Call API to insert new commitment
    const success = await insertCommitment(employeeName, checked);

    if (!success) {
      // Revert if failed
      setCommitments(prev => ({
        ...prev,
        [id]: !checked
      }));
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter dashboard based on search term
  const filteredDashboard = React.useMemo(() => {
    console.log("Search term:", searchTerm);
    console.log("Total items:", dashboardTasks.length);

    if (!searchTerm || searchTerm.trim() === "") {
      console.log("No search term, showing all items");
      return dashboardTasks;
    }

    const term = searchTerm.toLowerCase().trim();
    console.log("Searching for:", term);

    const result = dashboardTasks.filter((item) => {
      // Check each display column
      for (const colId of DISPLAY_COLUMNS) {
        const value = item[colId];

        if (value == null) continue;

        const stringValue = String(value).toLowerCase();

        // Special handling for col13 (image column)
        if (colId === "col13") {
          // If format is "image_url, Name"
          if (stringValue.includes(",")) {
            const namePart = stringValue.split(",")[1]?.trim();
            if (namePart && namePart.includes(term)) {
              console.log("Found in col13 name part:", namePart);
              return true;
            }
          }
        }

        // Normal search
        if (stringValue.includes(term)) {
          console.log(`Found in ${colId}:`, value);
          return true;
        }
      }

      return false;
    });

    console.log("Filtered result count:", result.length);
    return result;
  }, [dashboardTasks, searchTerm]);




  // const submitDates = async () => {
  //   if (!startDate || !endDate) {
  //     toast.error("Please select both start and end dates");
  //     return;
  //   }

  //   try {
  //     setIsSubmittingDates(true);

  //     // Format dates to YYYY-MM-DD
  //     const formatDate = (dateString) => {
  //       const date = new Date(dateString);
  //       const day = String(date.getDate()).padStart(2, '0');
  // const month = date.toLocaleString('en-US', { month: 'short' });
  // const year = date.getFullYear();
  //       return `${day}-${month}-${year}`;
  //     };

  //     const formattedStartDate = formatDate(startDate);
  //     const formattedEndDate = formatDate(endDate);

  //     console.log("Submitting dates:", { formattedStartDate, formattedEndDate });

  //     // Submit dates to "Report" sheet
  //     const response = await fetch(APPS_SCRIPT_URL, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded',
  //       },
  //       body: new URLSearchParams({
  //         action: 'submitDates',
  //         spreadsheetId: SPREADSHEET_ID,
  //         sheetName: "Report",
  //         startDate: formattedStartDate,
  //         endDate: formattedEndDate
  //       })
  //     });

  //     const result = await response.json();
  //     console.log("Date submission result:", result);

  //     if (result.status === "success" || result.success) {
  //       toast.success("Dates submitted successfully!");

  //       // Optional: Wait for 2 seconds before processing
  //       await new Promise(resolve => setTimeout(resolve, 2000));

  //       // Call processAllData function after successful date submission
  //       await callProcessAllData();
  //     } else {
  //       throw new Error(result.message || "Date submission failed");
  //     }
  //   } catch (error) {
  //     console.error("Date submission error:", error);
  //     toast.error(`Failed to submit dates: ${error.message}`);
  //   } finally {
  //     setIsSubmittingDates(false);
  //   }
  // };


  const submitDates = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    try {
      setIsSubmittingDates(true);

      // Format dates to YYYY-MM-DD
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleString('en-US', { month: 'short' });
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);

      console.log("Submitting dates:", { formattedStartDate, formattedEndDate });

      // Submit dates to "Report" sheet - यह अब automatically data भी process करेगा
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'submitDates',
          spreadsheetId: SPREADSHEET_ID,
          sheetName: "Report",
          startDate: formattedStartDate,
          endDate: formattedEndDate
        })
      });

      const result = await response.json();
      console.log("Date submission result:", result);

      if (result.status === "success" || result.status === "partial_success") {
        toast.success("Dates submitted and data processing completed!");

        setStartDate("");
        setEndDate("");


        // थोड़ा wait करें ताकि data process हो जाए
        await new Promise(resolve => setTimeout(resolve, 2000));

        // ✅ Refresh dashboard data after processing
        await fetchDashboardData();
      } else {
        throw new Error(result.message || "Date submission failed");
      }
    } catch (error) {
      console.error("Date submission error:", error);
      toast.error(`Failed to submit dates: ${error.message}`);
    } finally {
      setIsSubmittingDates(false);
    }
  };





  // Loading state
  if (isLoading) {
    return (
      <div className="h-40 sm:h-96 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-40 sm:h-96 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error: {error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="space-y-6" id="dashboard-content">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={async () => {
            setIsDownloading(true);
            try {
              await generateDashboardPDF(
                filteredDashboard,
                topScorersData,
                topScorersLabels,
                lowestScorersData,
                lowestScorersLabels,
                pendingTasksData,
                pendingTasksLabels,
                departmentChartUrl
              );
            } catch (error) {
              console.error("Error generating PDF:", error);
              toast.error("Failed to generate PDF report");
            } finally {
              setIsDownloading(false);
            }
          }}
          disabled={isDownloading}
          className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${isDownloading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
        >
          {isDownloading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </>
          )}
        </button>
      </div>

      {/* Employees table */}

      <div>
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              List of People {filteredDashboard.length > 0 ? `(${filteredDashboard.length})` : ''}
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-4">    
                  <div >
            <input
              type="text"
              placeholder="Search by name, department, task..."
              className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>


            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-500">Start Date</span>

                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-500">End Date</span>
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <button
                onClick={submitDates}
                disabled={isSubmittingDates || !startDate || !endDate}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${isSubmittingDates || !startDate || !endDate
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
                  }`}
              >
                {isSubmittingDates ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 mr-2 inline"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Submit Dates"
                )}
              </button>
            </div>
          </div>



          {filteredDashboard.length > 0 ? (
            <div className="relative h-[calc(100vh-300px)] overflow-hidden">
              <div className="absolute inset-0 overflow-y-auto">
                <EmployeesTable
                  isCompact
                  filterTasks={filteredDashboard}
                  dynamicHeaders={DISPLAY_COLUMNS
                    .map((colId) => dashboardHeaders.find((header) => header.id === colId))
                    .filter(Boolean)}
                  onCheckboxChange={handleCheckboxChange}
                  onCommitmentChange={handleCommitmentChange}
                  selectedItems={selectedItems}
                  commitments={commitments}
                  showCommitmentToggle={true}
                />
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-gray-500">
                  {searchTerm ? `No employees found for "${searchTerm}"` : "No employees available"}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Scorers */}
        <div className="bg-white rounded-lg border p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Scorers</h2>
          <div className="h-64">
            <HalfCircleChart data={topScorersData} labels={topScorersLabels} />
          </div>
        </div>

        {/* Lowest Scores */}
        <div className="bg-white rounded-lg border p-4 sm:p-6 h-96">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Lowest Scores</h2>
          <div className="h-64">
            <VerticalBarChart
              data={lowestScorersData}
              labels={lowestScorersLabels}
              maxValue={100}
            />
          </div>
        </div>
      </div>

      {/* Pending Tasks */}
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
          <HorizontalBarChart
            data={pendingTasksData}
            labels={pendingTasksLabels}
            maxValue={Math.max(...pendingTasksData) + 1}
          />
        </div>

        <div className="text-right text-xs text-gray-400">
          Showing {pendingTasksLabels.length} users
        </div>
      </div>

      {/* Department Scores - Using static image */}
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Department Scores</h2>
        <div className="h-[500px] w-full overflow-hidden rounded-lg border border-gray-200">
          <iframe
            src={`https://docs.google.com/spreadsheets/d/e/2PACX-1vQXxVx1Rh0dhrvuralV6_E8ckP2VWfsJ30vZiZAxNkJovbUYb0LrbXlGd7a5yxOavXwUsQwl0sShdi_/pubchart?oid=1932717403&amp;format=interactive`}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            className="block"
            title="Department Scores Chart"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;




