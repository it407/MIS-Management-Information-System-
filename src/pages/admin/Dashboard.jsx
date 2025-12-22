// ============ DASHBOARD PAGE ============
import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import Select from 'react-select';


import EmployeesTable from "../../components/tables/EmployeesTable";
import HalfCircleChart from "../../components/charts/HalfCircleChart";
import HorizontalBarChart from "../../components/charts/HorizontalBarChart";
import VerticalBarChart from "../../components/charts/VerticalBarChart";
import { generateDashboardPDF } from "../../utils/pdfGenerator";

const AdminDashboard = () => {
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [employeeCommitments, setEmployeeCommitments] = useState({});
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [filterName, setFilterName] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterFMS, setFilterFMS] = useState("");

  const nameDropdownRef = useRef(null);
  const departmentDropdownRef = useRef(null);
  const fmsDropdownRef = useRef(null);

  const [rawGoogleData, setRawGoogleData] = useState([]);


  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);
  const [isFMSDropdownOpen, setIsFMSDropdownOpen] = useState(false);

  const [departmentSearchQuery, setDepartmentSearchQuery] = useState("");
  const [nameSearchQuery, setNameSearchQuery] = useState("");
  const [fmsSearchQuery, setFmsSearchQuery] = useState("");

  const [departmentChartData, setDepartmentChartData] = useState({
    data: [],
    labels: []
  });





  //   // Line 135 के बाद ये add करें:
  // const filteredDepartmentsForChart = departments.filter(dept => {
  //   // If filterDepartment is set, only show that department
  //   if (filterDepartment && filterDepartment !== "") {
  //     return dept.department === filterDepartment;
  //   }
  //   return true; // Show all departments if no filter
  // });

  // // Prepare chart data
  // // const departmentChartData = filteredDepartmentsForChart.map(dept => dept.score);
  // const departmentChartLabels = filteredDepartmentsForChart.map(dept => dept.department);

  // Line 243 के बाद:
  const uniqueDepartmentsForFilter = [
    ...new Set(departments.map(dept => dept.department)),
  ];

  useEffect(() => {
    if (rawGoogleData.length > 0) {
      console.log("Recalculating department chart data with FMS filter:", filterFMS);

      // Calculate department scores with FMS filter
      const departmentScores = calculateDepartmentScoresByFMS(rawGoogleData, filterFMS);

      console.log("Recalculated department scores:", departmentScores);

      // Apply department filter if selected
      const filteredDepartmentsForChart = departmentScores.filter(dept => {
        if (filterDepartment && filterDepartment !== "") {
          return dept.department === filterDepartment;
        }
        return true;
      });

      console.log("Final chart data:", filteredDepartmentsForChart);

      setDepartmentChartData({
        data: filteredDepartmentsForChart.map(dept => dept.score),
        labels: filteredDepartmentsForChart.map(dept => dept.department)
      });
    } else {
      console.log("No raw data available yet");
    }
  }, [rawGoogleData, filterFMS, filterDepartment]); // <-- filterFMS ko dependency mein add karein


  useEffect(() => {
    function handleClickOutside(event) {
      // Close department dropdown if click is outside
      if (
        departmentDropdownRef.current &&
        !departmentDropdownRef.current.contains(event.target)
      ) {
        setIsDepartmentDropdownOpen(false);
      }

      // Close name dropdown if click is outside
      if (
        nameDropdownRef.current &&
        !nameDropdownRef.current.contains(event.target)
      ) {
        setIsNameDropdownOpen(false);
      }

      // Close FMS dropdown if click is outside
      if (
        fmsDropdownRef.current &&
        !fmsDropdownRef.current.contains(event.target)
      ) {
        setIsFMSDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // calculateDepartmentScoresFromGoogleData function ke baad yeh add karein:
  // Line 135 के पास calculateDepartmentScoresByFMS फ़ंक्शन जोड़ें:
  const calculateDepartmentScoresByFMS = (googleSheetData, selectedFMS) => {
    // Agar FMS filter selected hai to uske hisaab se filter karein
    const filteredData = selectedFMS
      ? googleSheetData.filter(row =>
        row["Fms Name"]?.trim() === selectedFMS
      )
      : googleSheetData;

    const departmentMap = {};

    // Process each row
    filteredData.forEach((row) => {
      const department = row["Department"]?.trim() || "Unassigned";
      const totalAchievement = parseInt(row["Total Achievement"]) || 0;
      const target = parseInt(row["Target"]) || 0;

      if (target === 0) return;

      if (!departmentMap[department]) {
        departmentMap[department] = {
          totalAchievementSum: 0,
          totalTargetSum: 0,
          rowCount: 0
        };
      }

      departmentMap[department].totalAchievementSum += totalAchievement;
      departmentMap[department].totalTargetSum += target;
      departmentMap[department].rowCount += 1;
    });

    // Calculate percentage for each department
    const departmentScores = [];

    Object.entries(departmentMap).forEach(([deptName, data]) => {
      if (data.totalTargetSum > 0) {
        const score = Math.round((data.totalAchievementSum / data.totalTargetSum) * 100);
        departmentScores.push({
          department: deptName,
          score: Math.min(100, Math.max(0, score)),
          totalAchievement: data.totalAchievementSum,
          totalTarget: data.totalTargetSum,
          employeesCount: data.rowCount,
          filteredByFMS: !!selectedFMS
        });
      }
    });

    // Sort by score (highest first)
    departmentScores.sort((a, b) => b.score - a.score);

    return departmentScores;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://script.google.com/macros/s/AKfycbxsivpBFRp-nkwL2tlmVRUNyW3U554AzguV3OQrYIjDBCh_G5cOG47_NWMHWOamOQY4/exec?action=getUsers&sheetName=Data`
        );
        const data = await response.json();
        console.log("API Raw Data:", data);

        if (data.status === "success" && data.users) {
          // Transform Google Sheets data to match your component's structure
          const transformedEmployees = data.users.map((user, index) => {
            // Column mapping based on your sheet structure
            const employeeId = user["Employee ID"] || user["Person Name"] || `EMP-${index + 1}`;
            const name = user["Person Name"] || "Unknown";
            const department = user["Department"] || "Unassigned";

            // Parse image URL from "Link With Name" column
            let image = "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600";
            if (user["Link With Name"]) {
              const linkParts = user["Link With Name"].split(',');
              if (linkParts[0] && linkParts[0].startsWith('http')) {
                image = linkParts[0].trim();
              }
            }

            // Calculate scores and metrics
            const target = parseInt(user["Target"]) || 0;
            const actualAchievement = parseInt(user["Actual Achievement"]) || 0;
            const totalAchievement = parseInt(user["Total Achievement"]) || 0;
            const workDonePercent = parseInt(user["% Work Done"]) || 0;
            const workDoneOnTimePercent = parseInt(user["% Work Done On Time"]) || 0;
            const allPending = parseInt(user["All Pending Till Date"]) || 0;
            const weekPending = parseInt(user["Week Pending Task"]) || 0;

            // Calculate score (you can adjust this formula)
            const score = Math.round(
              (workDonePercent * 0.4) +
              (workDoneOnTimePercent * 0.3) +
              (actualAchievement * 0.3)
            );

            return {
              id: employeeId,
              name: name,
              department: department,
              image: image,
              target: target,
              actualWorkDone: actualAchievement,
              weeklyWorkDone: workDonePercent,
              weeklyWorkDoneOnTime: workDoneOnTimePercent,
              totalWorkDone: totalAchievement,
              weekPending: weekPending,
              allPendingTillDate: allPending,
              plannedWorkNotDone: Math.max(0, 100 - workDonePercent),
              plannedWorkNotDoneOnTime: Math.max(0, 100 - workDoneOnTimePercent),
              commitment: 0, // Default commitment
              score: Math.min(100, Math.max(0, score)),
              hrName: user["Gmail ID"] || "", // Using Gmail as HR name
              fmsName: user["Fms Name"] || "",
              taskName: user["Task Name"] || "",
              systemType: user["System Type"] || "",
              sheetKey: user["Sheet Key"] || "",
              startDate: user["Start Date"] || "",
              endDate: user["End Date"] || ""
            };
          });

          setEmployees(transformedEmployees);
          setRawGoogleData(data.users);

          const departmentScores = calculateDepartmentScoresFromGoogleData(data.users);
          console.log("Department Scores Calculated:", departmentScores);

          // Calculate department statistics for employee averages
          const departmentMap = {}; // ये यहाँ define करें
          transformedEmployees.forEach(emp => {
            if (!departmentMap[emp.department]) {
              departmentMap[emp.department] = {
                totalScore: 0,
                count: 0,
                employees: []
              };
            }
            departmentMap[emp.department].totalScore += emp.score;
            departmentMap[emp.department].count += 1;
            departmentMap[emp.department].employees.push(emp);
          });

          const departmentStats = Object.entries(departmentMap).map(([deptName, data]) => ({
            name: deptName,
            averageScore: Math.round(data.totalScore / data.count),
            employeeCount: data.count,
            employees: data.employees
          }));

          // Set departments for chart
          setDepartments(departmentScores);

          // Calculate department statistics
          // const departmentMap = {};
          // transformedEmployees.forEach(emp => {
          //   if (!departmentMap[emp.department]) {
          //     departmentMap[emp.department] = {
          //       totalScore: 0,
          //       count: 0,
          //       employees: []
          //     };
          //   }
          //   departmentMap[emp.department].totalScore += emp.score;
          //   departmentMap[emp.department].count += 1;
          //   departmentMap[emp.department].employees.push(emp);
          // });

          // const departmentStats = Object.entries(departmentMap).map(([deptName, data]) => ({
          //   name: deptName,
          //   averageScore: Math.round(data.totalScore / data.count),
          //   employeeCount: data.count,
          //   employees: data.employees
          // }));

          // setDepartments(departmentStats);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("employeeCommitments");
    if (saved) {
      setEmployeeCommitments(JSON.parse(saved));
    }
  }, []);

  // Filter employees
  // Filter employees के function में console.log जोड़ें
  const filteredEmployees = employees.filter((emp) => {
    console.log("Filtering employee:", emp.name, {
      name: emp.name,
      department: emp.department,
      hrName: emp.hrName,
      fmsName: emp.fmsName,
      matchesName: emp.name.toLowerCase().includes(filterName.toLowerCase()),
      matchesDepartment: filterDepartment === "" || emp.department === filterDepartment,
      matchesHR: filterName === "" || emp.nameName === filterName,
      matchesFMS: filterFMS === "" || emp.fmsName === filterFMS
    });

    // Filter employees
    const filteredEmployees = employees.filter((emp) => {
      const matchesName = emp.name
        .toLowerCase()
        .includes(filterName.toLowerCase());
      const matchesDepartment =
        filterDepartment === "" || emp.department === filterDepartment;
      const matchesHR = filterName === "" ||
        emp.name.toLowerCase().includes(filterName.toLowerCase());
      const matchesFMS = filterFMS === "" ||
        emp.fmsName?.toLowerCase().includes(filterFMS.toLowerCase());

      return matchesName && matchesDepartment && matchesHR && matchesFMS;
    });
    const matchesName = emp.name
      .toLowerCase()
      .includes(filterName.toLowerCase());
    const matchesDepartment =
      filterDepartment === "" || emp.department === filterDepartment;
    const matchesHR = filterName === "" || emp.hrName === filterName;
    const matchesFMS = filterFMS === "" || emp.fmsName === filterFMS;

    return matchesName && matchesDepartment && matchesHR && matchesFMS;
  });

  // Get unique departments and HR names
  const uniqueDepartments = [
    ...new Set(employees.map((emp) => emp.department)),
  ];
  const uniqueHRNames = [
    ...new Set(employees.map((emp) => emp.hrName).filter(Boolean)),
  ];
  const uniqueEmployeeNames = [
    ...new Set(employees.map((emp) => emp.name).filter(Boolean)),
  ];
  const uniqueFMSNames = [
    ...new Set(
      employees
        .map((emp) => emp.fmsName)
        .filter(Boolean) // ये null/undefined values को filter करेगा
    ),
  ];



  const topScorers = [...filteredEmployees]
    .map(emp => ({
      ...emp,
      weeklyWorkDone: Number(emp.weeklyWorkDone) || 0 // 👈 fix
    }))
    .sort((a, b) => b.weeklyWorkDone - a.weeklyWorkDone)
    .slice(0, 5);
  console.log(
    topScorers.map(e => ({
      name: e.name,
      weeklyWorkDone: e.weeklyWorkDone
    }))
  );

  // Calculate lowest scorers - FMS filtered
  // 🔽 Lowest % Work Done (Column M) - Top 5
  const lowestScorers = [...filteredEmployees]
    .map(emp => ({
      ...emp,
      weeklyWorkDone: Number(emp.weeklyWorkDone) || 0 // Column M
    }))
    .sort((a, b) => a.weeklyWorkDone - b.weeklyWorkDone) // ASC = lowest first
    .slice(0, 5);


  // Calculate employees by pending tasks - FMS filtered
  const employeesByPending = [...filteredEmployees]
    .sort(
      (a, b) =>
        (Number(b.allPendingTillDate) || 0) -
        (Number(a.allPendingTillDate) || 0)
    )
    .slice(0, 5);






  const filteredDepartments = {};
  filteredEmployees.forEach(emp => {
    if (!filteredDepartments[emp.department]) {
      filteredDepartments[emp.department] = {
        totalScore: 0,
        count: 0
      };
    }
    filteredDepartments[emp.department].totalScore += emp.score;
    filteredDepartments[emp.department].count += 1;
  });

  const departmentScoresData = Object.values(filteredDepartments)
    .map(dept => Math.round(dept.totalScore / dept.count));
  const departmentScoresLabels = Object.keys(filteredDepartments);


  // const topScorersData = topScorers.map((emp) => emp.score);
  // const topScorersLabels = topScorers.map((emp) => emp.name);

  const topScorersData = topScorers.map(emp => emp.weeklyWorkDone);
  const topScorersLabels = topScorers.map(emp => emp.name);

  console.log("new top", topScorersData)
  const lowestScorersLabels = lowestScorers.map(emp => emp.name);

  const lowestScorersData = lowestScorers.map(
    emp => emp.weeklyWorkDone
  );

  // const pendingTasksData = employeesByPending.map((emp) => emp.weekPending);
  // const pendingTasksLabels = employeesByPending.map((emp) => emp.name);
  const pendingTasksData = employeesByPending.map(
    (emp) => Number(emp.allPendingTillDate) || 0
  );

  const pendingTasksLabels = employeesByPending.map(
    (emp) => emp.name
  );


  // Get weekly commitment comparison (placeholder - you can implement real logic)
  const getWeeklyCommitmentComparison = () => {
    return {
      currentWeek: 75,
      lastWeek: 68,
      change: 7
    };
  };
  const commitmentComparison = getWeeklyCommitmentComparison();

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map((emp) => emp.id));
    }
    setSelectAll(!selectAll);
  };

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleCommitmentChange = (employeeId, field, value) => {
    setEmployeeCommitments((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: parseInt(value) || 0,
      },
    }));
  };

  const handleRowClick = (employee) => {
    // Fetch task details for selected employee
    const employeeWithTasks = {
      ...employee,
      tasks: [
        {
          fmsName: employee.fmsName || "Not Specified",
          taskName: employee.taskName || "No Task Assigned",
          target: employee.target,
          actualAchievement: employee.actualWorkDone,
          workNotDone: 100 - employee.weeklyWorkDone,
          workNotDoneOnTime: 100 - employee.weeklyWorkDoneOnTime,
          allPendingTillDate: employee.allPendingTillDate,
        }
      ]
    };
    setSelectedUserDetails(employeeWithTasks);
  };




  const handleSubmit = async () => {
    try {
      const selectedEmployeeData = selectedEmployees.map((empId) => {
        const emp = employees.find((e) => e.id === empId);
        const nextWeekStart = getNextWeekDateRange().start;
        const nextWeekEnd = getNextWeekDateRange().end;

        return {
          employeeId: empId,
          name: emp.name,
          department: emp.department,
          target: emp.target,
          commitment: employeeCommitments[empId]?.commitment || 0,
          nextWeekPlannedWorkNotDone:
            employeeCommitments[empId]?.nextWeekPlannedWorkNotDone || 0,
          nextWeekPlannedWorkNotDoneOnTime:
            employeeCommitments[empId]?.nextWeekPlannedWorkNotDoneOnTime || 0,
          dateStart: nextWeekStart,
          dateEnd: nextWeekEnd,
          submittedAt: new Date().toISOString(),
        };
      });

      // Save commitments to Google Sheets
      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbxsivpBFRp-nkwL2tlmVRUNyW3U554AzguV3OQrYIjDBCh_G5cOG47_NWMHWOamOQY4/exec`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'insertInSingleColumn',
            sheetName: 'For Records',
            spreadsheetId: '1t_-LmxTDhiibPo2HaBZIQJvXOBz_vQ_zsv2f8MhhdGM',
            data: JSON.stringify(selectedEmployeeData.map(emp => ({
              name: emp.name,
              commitment: emp.commitment,
              plannedWorkNotDone: emp.nextWeekPlannedWorkNotDone,
              plannedWorkNotDoneOnTime: emp.nextWeekPlannedWorkNotDoneOnTime
            })))
          })
        }
      );

      const result = await response.json();
      console.log("result", result)

      if (result.success) {
        // Also save to localStorage
        const existingHistory = JSON.parse(
          localStorage.getItem("commitmentHistory") || "[]"
        );
        const updatedHistory = [...existingHistory, ...selectedEmployeeData];

        localStorage.setItem("commitmentHistory", JSON.stringify(updatedHistory));
        localStorage.setItem(
          "employeeCommitments",
          JSON.stringify(employeeCommitments)
        );

        alert("Commitments submitted successfully!");
        setSelectedEmployees([]);
        setSelectAll(false);
      } else {
        alert("Error submitting commitments: " + result.message);
      }
    } catch (error) {
      console.error("Error submitting commitments:", error);
      alert("Failed to submit commitments. Please try again.");
    }
  };

  const getNextWeekDateRange = () => {
    const today = new Date();
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(
      nextWeekStart.getDate() + (8 - nextWeekStart.getDay())
    );
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);

    return {
      start: nextWeekStart.toISOString().split("T")[0],
      end: nextWeekEnd.toISOString().split("T")[0],
    };
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    );
  }
  return (
    <div className="space-y-4 lg:space-y-6 p-2 md:p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-lg md:text-2xl font-bold text-blue-600">
          {/* Admin Dashboard */}
          Graph Analysis
        </h1>

        <button
          onClick={() => generateDashboardPDF(
            filteredEmployees,        // List of People
            departments,              // Department scores
            topScorers,              // Top 5 scorers
            lowestScorers,           // Lowest 5 scorers
            employeesByPending,      // Pending tasks by user
            selectedEmployees,       // Selected employees
            employeeCommitments,     // Employee commitments
            filterDepartment,        // Current department filter
            filterFMS,              // Current FMS filter
            uniqueDepartments       // Unique departments
          )}
          // className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-xs md:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          className="w-full sm:w-auto inline-flex items-center justify-center 
px-3 py-2.5 sm:py-2 
border border-transparent rounded-md shadow-sm 
text-xs md:text-sm font-medium text-white 
bg-violet-600 hover:bg-violet-700 focus:ring-violet-500

focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
transition-colors"

        >
          <Download className="h-4 w-4 mr-2" />
          Download Weekly Report
        </button>
      </div>

      {/* List of People Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 md:p-4 border-b border-gray-200">
          {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"> */}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">

            <h2 className="text-base md:text-lg font-semibold text-gray-800">
              List of People
            </h2>
            <button
              onClick={handleSubmit}
              disabled={selectedEmployees.length === 0}
              // className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
              className="hidden md:inline-flex items-center justify-center sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >

              Submit ({selectedEmployees.length})
            </button>
          </div>

          {/* Filters */}
          {/* <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"> */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">


            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                Filter by Department
              </label>
              <div className="relative" ref={departmentDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDepartmentDropdownOpen(!isDepartmentDropdownOpen)}
                  className="flex justify-between items-center px-3 py-2.5 w-full bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 truncate"
                >
                  <span className={filterDepartment ? "text-gray-900 truncate" : "text-gray-500 truncate"}>
                    {filterDepartment || "Select department..."}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isDepartmentDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDepartmentDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 bg-white rounded-md border border-gray-300 shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2" />
                        <input
                          type="text"
                          value={departmentSearchQuery}
                          onChange={(e) => setDepartmentSearchQuery(e.target.value)}
                          placeholder="Search department..."
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="overflow-auto max-h-48">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setFilterDepartment("");
                            setDepartmentSearchQuery("");
                          }}
                          className="px-3 py-2.5 w-full text-sm text-left text-gray-700 border-b border-gray-100 hover:bg-gray-100 whitespace-nowrap"
                        >
                          All Departments
                        </button>
                        {uniqueDepartments
                          .filter((dept) => dept.toLowerCase().includes(departmentSearchQuery.toLowerCase()))
                          .map((dept) => (
                            <button
                              key={dept}
                              onClick={() => {
                                setFilterDepartment(dept);
                                setDepartmentSearchQuery("");
                                setIsDepartmentDropdownOpen(false);
                              }}
                              className="px-3 py-2.5 w-full text-sm text-left text-gray-900 border-b border-gray-100 hover:bg-gray-100 whitespace-nowrap"
                            >
                              {dept}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>



            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                Filter by FMS Name
              </label>
              <div className="relative" ref={fmsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsFMSDropdownOpen(!isFMSDropdownOpen)}
                  className="flex justify-between items-center px-3 py-2.5 w-full bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 truncate"
                >
                  <span className={filterFMS ? "text-gray-900 truncate" : "text-gray-500 truncate"}>
                    {filterFMS || "Select FMS..."}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isFMSDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>


                {isFMSDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 bg-white rounded-md border border-gray-300 shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fmsSearchQuery}
                          onChange={(e) => setFmsSearchQuery(e.target.value)}
                          placeholder="Search FMS..."
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="overflow-auto max-h-48">
                      <div className="py-1">
                        {/* Clear All Filters Button */}
                        <button
                          onClick={() => {
                            setFilterFMS("");
                            setFilterDepartment("");
                            setFilterName("");
                            setFmsSearchQuery("");
                          }}
                          className="px-3 py-2.5 w-full text-sm text-left text-red-600 font-medium border-b border-gray-100 hover:bg-red-50 whitespace-nowrap"
                        >
                          Clear All Filters
                        </button>

                        <button
                          onClick={() => {
                            setFilterFMS("");
                            setFmsSearchQuery("");
                          }}
                          className="px-3 py-2.5 w-full text-sm text-left text-gray-700 border-b border-gray-100 hover:bg-gray-100 whitespace-nowrap"
                        >
                          All FMS Names
                        </button>
                        {uniqueFMSNames
                          .filter((fms) => fms.toLowerCase().includes(fmsSearchQuery.toLowerCase()))
                          .map((fms) => (
                            <button
                              key={fms}
                              onClick={() => {
                                setFilterFMS(fms);
                                setFmsSearchQuery("");
                                setIsFMSDropdownOpen(false);
                              }}
                              className="px-3 py-2.5 w-full text-sm text-left text-gray-900 border-b border-gray-100 hover:bg-gray-100 whitespace-nowrap"
                            >
                              {fms}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Mobile Submit Button */}
          <div className="mt-4 md:hidden flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={selectedEmployees.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md 
               hover:bg-blue-700 focus:outline-none focus:ring-2 
               focus:ring-blue-500 focus:ring-offset-2 
               disabled:opacity-50 disabled:cursor-not-allowed 
               text-sm transition-colors"
            >
              Submit ({selectedEmployees.length})
            </button>
          </div>

        </div>



        {/* Desktop Table */}
        <div className="hidden md:block overflow-y-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  FMS Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Target
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Actual Work
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Weekly Done %
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Weekly On Time %
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Total Work
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Week Pending
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  All Pending
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Planned Not Done %
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Not Done On Time %
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Commitment
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Next Week Not Done
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Next Week Not Done On Time
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Next Week Commitment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  onClick={() => handleRowClick(employee)}
                  className={`hover:bg-gray-50 cursor-pointer ${selectedEmployees.includes(employee.id) ? "bg-blue-50" : ""
                    }`}
                >
                  <td
                    className="w-12 px-3 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => handleEmployeeSelect(employee.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.id}
                  </td>

                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-8 w-8 rounded-full object-cover"
                        src={employee.image}
                        alt={employee.name}
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {employee.department}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.fmsName || "-"}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.target}%
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.actualWorkDone}%
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.weeklyWorkDone}%
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.weeklyWorkDoneOnTime}%
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.totalWorkDone}%
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${employee.weekPending > 3
                        ? "bg-red-100 text-red-800"
                        : employee.weekPending > 1
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                        }`}
                    >
                      {employee.weekPending}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.allPendingTillDate}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.plannedWorkNotDone}%
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.plannedWorkNotDoneOnTime}%
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.commitment}%
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {selectedEmployees.includes(employee.id) ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={
                          employeeCommitments[employee.id]
                            ?.nextWeekPlannedWorkNotDone || 0
                        }
                        onChange={(e) =>
                          handleCommitmentChange(
                            employee.id,
                            "nextWeekPlannedWorkNotDone",
                            e.target.value
                          )
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-sm text-gray-500">0</span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {selectedEmployees.includes(employee.id) ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={
                          employeeCommitments[employee.id]
                            ?.nextWeekPlannedWorkNotDoneOnTime || 0
                        }
                        onChange={(e) =>
                          handleCommitmentChange(
                            employee.id,
                            "nextWeekPlannedWorkNotDoneOnTime",
                            e.target.value
                          )
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-sm text-gray-500">0</span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {selectedEmployees.includes(employee.id) ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={
                          employeeCommitments[employee.id]?.commitment || 0
                        }
                        onChange={(e) =>
                          handleCommitmentChange(
                            employee.id,
                            "commitment",
                            e.target.value
                          )
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-sm text-gray-500">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Fixed */}
        <div className="md:hidden">
          <div className="px-3 py-3 bg-gray-50 flex items-center gap-3 border-b border-gray-200 sticky top-0 z-10">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({filteredEmployees.length})
            </span>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                className={`border-b border-gray-200 ${selectedEmployees.includes(employee.id) ? "bg-blue-50" : ""
                  }`}
              >
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => handleEmployeeSelect(employee.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => handleRowClick(employee)}
                      >
                        <img
                          className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                          src={employee.image}
                          alt={employee.name}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {employee.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {employee.department}
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Target:</span>
                          <span className="font-semibold">
                            {employee.target}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Actual:</span>
                          <span className="font-semibold">
                            {employee.actualWorkDone}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Pending:</span>
                          <span
                            className={`font-semibold ${employee.weekPending > 3
                              ? "text-red-600"
                              : employee.weekPending > 1
                                ? "text-yellow-600"
                                : "text-green-600"
                              }`}
                          >
                            {employee.weekPending}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Commitment:</span>
                          <span className="font-semibold">
                            {employee.commitment}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedEmployee(
                          expandedEmployee === employee.id ? null : employee.id
                        )
                      }
                      className="p-2 hover:bg-gray-200 rounded flex-shrink-0"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${expandedEmployee === employee.id ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                  </div>

                  {/* Expanded Content */}
                  {expandedEmployee === employee.id && (
                    <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-gray-500">FMS Name</p>
                          <p className="font-semibold text-gray-900">
                            {employee.fmsName || "Not Assigned"}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-gray-500">Weekly Done</p>
                          <p className="font-semibold text-gray-900">
                            {employee.weeklyWorkDone}%
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-gray-500">On Time</p>
                          <p className="font-semibold text-gray-900">
                            {employee.weeklyWorkDoneOnTime}%
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-gray-500">Total Work</p>
                          <p className="font-semibold text-gray-900">
                            {employee.totalWorkDone}%
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-gray-500">All Pending</p>
                          <p className="font-semibold text-gray-900">
                            {employee.allPendingTillDate}
                          </p>
                        </div>
                      </div>

                      {selectedEmployees.includes(employee.id) && (
                        <div className="bg-blue-50 p-3 rounded border border-blue-200 space-y-3">
                          <p className="text-xs font-semibold text-blue-900">
                            Next Week Inputs
                          </p>
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">
                                Work Not Done %
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={
                                  employeeCommitments[employee.id]
                                    ?.nextWeekPlannedWorkNotDone || 0
                                }
                                onChange={(e) =>
                                  handleCommitmentChange(
                                    employee.id,
                                    "nextWeekPlannedWorkNotDone",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">
                                Work Not Done On Time %
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={
                                  employeeCommitments[employee.id]
                                    ?.nextWeekPlannedWorkNotDoneOnTime || 0
                                }
                                onChange={(e) =>
                                  handleCommitmentChange(
                                    employee.id,
                                    "nextWeekPlannedWorkNotDoneOnTime",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">
                                Commitment %
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={
                                  employeeCommitments[employee.id]
                                    ?.commitment || 0
                                }
                                onChange={(e) =>
                                  handleCommitmentChange(
                                    employee.id,
                                    "commitment",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Details Modal - Fixed for Mobile */}
      {selectedUserDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 md:p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                  src={selectedUserDetails.image}
                  alt={selectedUserDetails.name}
                />
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-gray-900 truncate">
                    {selectedUserDetails.name}
                  </h2>
                  <p className="text-xs text-gray-500 truncate">
                    {selectedUserDetails.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetails(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Tasks Table */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Task Details
                  </h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <div className="min-w-[600px]">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                              FMS Name
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                              Task Name
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                              Target
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                              Actual
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                              Not Done
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                              Late
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                              Pending
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedUserDetails.tasks &&
                            selectedUserDetails.tasks.length > 0 ? (
                            selectedUserDetails.tasks.map((task, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">
                                  {task.fmsName}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">
                                  {task.taskName}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-900 font-medium whitespace-nowrap">
                                  {task.target}
                                </td>
                                <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${task.actualAchievement < task.target
                                      ? "bg-red-100 text-red-800"
                                      : task.actualAchievement === task.target
                                        ? "bg-green-100 text-green-800"
                                        : "bg-blue-100 text-blue-800"
                                      }`}
                                  >
                                    {task.actualAchievement}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">
                                  {task.workNotDone}%
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">
                                  {task.workNotDoneOnTime}%
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">
                                  {task.allPendingTillDate}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="7"
                                className="px-3 py-2 text-center text-xs text-gray-500"
                              >
                                No tasks available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-3 flex justify-end gap-2 flex-shrink-0">
              <button
                onClick={() => setSelectedUserDetails(null)}
                className="px-3 py-2 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Charts Grid - Fixed for Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {/* Top 5 Scorers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
          <h2 className="text-xl md:text-base font-semibold text-teal-400 mb-2 md:mb-3">
            Top 5 Scorers
          </h2>
          <div className="h-48 md:h-56 lg:h-64">
            <HalfCircleChart
              data={topScorersData}
              labels={topScorersLabels}
              colors={["#8DD9D5", "#6BBBEA", "#BEA1E8", "#FFB77D", "#FF99A8"]}
            />
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
          <h2 className="text-xl md:text-sm font-semibold text-red-500 mb-2 md:mb-3">
            Pending Tasks by User
          </h2>

          <div className="h-32 md:h-40 lg:h-48">
            <HorizontalBarChart
              data={pendingTasksData}
              labels={pendingTasksLabels}
              colors={["#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2"]}
              maxValue={Math.max(...pendingTasksData) + 1}
            />
          </div>
        </div>

        {/* Lowest Scores */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
          <h2 className="text-xl md:text-sm font-semibold text-[#f59e0b] mb-2 md:mb-3">
            Lowest Scores
          </h2>

          <div className="h-32 md:h-40 lg:h-48 overflow-hidden">
            <VerticalBarChart
              data={lowestScorersData}
              labels={lowestScorersLabels}
              colors={["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7"]}
              maxValue={100}
            />
          </div>
        </div>
      </div>

      {/* Department Scores & Overall Score - Fixed for Mobile */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
        <h2 className="text-x6 md:text-sm font-bold text-gray-800 mb-2 md:mb-3">
          Department Scores
          {filterFMS && (
            <span className="text-blue-600 ml-2">- Filtered by FMS: {filterFMS}</span>
          )}
          {filterDepartment && !filterFMS && (
            <span className="text-blue-600 ml-2">- Filtered by Department: {filterDepartment}</span>
          )}
          {filterDepartment && filterFMS && (
            <span className="text-blue-600 ml-2">- Filtered by: {filterDepartment} (FMS: {filterFMS})</span>
          )}
        </h2>
        <div className="overflow-x-auto">
          <div className="min-w-[1200px] h-32 md:h-40 lg:h-48">
            {departmentChartData.data.length > 0 ? (
              <VerticalBarChart
                data={departmentChartData.data}
                labels={departmentChartData.labels}
                colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]}
                maxValue={100}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">
                  {filterFMS ? `No department data found for FMS: ${filterFMS}` : "No department data available"}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          {filterFMS
            ? `Showing department scores for FMS: ${filterFMS}`
            : filterDepartment
              ? `Showing department scores for: ${filterDepartment}`
              : "Showing all department scores"
          }
        </div>
      </div>


      {/* <div className="bg-white rounded-lg border p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Overall score</h2>
        <div className="h-[500px] w-full overflow-auto rounded-lg border border-gray-200">
          <iframe
            src={`https://docs.google.com/spreadsheets/d/e/2PACX-1vQevflaEBcHCIR2_hEsSC154BDiqUBrNYWTkzPrSLqtjPyB7pCpg8WhTeGyQwyJePlfsHjP3SR9jv1X/pubchart?oid=1932717403&format=interactive`}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="yes"
            className="block"
            title="Department Scores Chart"
            style={{ border: 'none' }}
          />
        </div>
      </div> */}
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Overall score</h2>
        <div className="w-full h-[400px] md:h-[500px] overflow-hidden md:overflow-auto rounded-lg border border-gray-200">
          <iframe
            src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQevflaEBcHCIR2_hEsSC154BDiqUBrNYWTkzPrSLqtjPyB7pCpg8WhTeGyQwyJePlfsHjP3SR9jv1X/pubchart?oid=1932717403&format=interactive"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="yes"
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
