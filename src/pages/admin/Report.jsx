import React, { useState, useEffect } from "react";
import { Filter, Search, Calendar, ChevronDown } from "lucide-react";
import { employees, tasks, departments } from "../../data/mockData";


import FilteredDataCharts  from "../../components/charts/DataCharts"; // ya jahan bhi component save kiya ho

const Report = () => {
    const [filterName, setFilterName] = useState("");
    const [filterDepartment, setFilterDepartment] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [uniqueDepartments, setUniqueDepartments] = useState([]);
    const [uniqueNames, setUniqueNames] = useState([]);
    const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);

    const [nameSearchQuery, setNameSearchQuery] = useState("");
    const [deptSearchQuery, setDeptSearchQuery] = useState("");


    // Existing states के साथ ये add करें:
    const [filterFMSName, setFilterFMSName] = useState("");
    const [isFMSDropdownOpen, setIsFMSDropdownOpen] = useState(false);
    const [fmsSearchQuery, setFmsSearchQuery] = useState("");
    const [uniqueFMSNames, setUniqueFMSNames] = useState([]);




    // API Configuration
    const SHEET_NAME = "Data";
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxsivpBFRp-nkwL2tlmVRUNyW3U554AzguV3OQrYIjDBCh_G5cOG47_NWMHWOamOQY4/exec";



    const currentFilters = React.useMemo(() => ({
        filterFMSName,
        filterName,
        filterDepartment,
        startDate,
        endDate
    }), [filterFMSName, filterName, filterDepartment, startDate, endDate]);



    useEffect(() => {
        fetchDataFromSheet();
    }, []);

    const fetchDataFromSheet = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `${WEB_APP_URL}?action=getUsers&sheetName=${SHEET_NAME}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Fetched data:", data);

            if (data.status === "success" && data.users) {
                // Map sheet data to task format with CORRECT column names from your sheet
                const mappedTasks = data.users
                    .filter(user => user["Fms Name"] && user["Task Name"]) // Filter out empty rows
                    .map((user, index) => ({
                        id: `task-${index + 1}`,
                        fmsName: user["Fms Name"] || "",
                        department: user["Department"] || "",
                        taskName: user["Task Name"] || "",
                        personName: user["Person Name"] || "",
                        assignedTo: user["Employee ID"] || "",
                        target: parseInt(user["Target"]) || 0,
                        startDate: user["Start Date"] || "", // Column V
                        endDate: user["End Date"] || "",     // Column W
                        totalAchievement: parseInt(user["Total Achievement"]) || 0,
                        workDone: parseInt(user["% Work Done"]) || 0,
                        workDoneOnTime: parseInt(user["% Work Done On Time"]) || 0,
                        allPendingTillDate: parseInt(user["All Pending Till Date"]) || 0,
                    }));

                console.log("Mapped tasks:", mappedTasks); // Debug ke liye

                setFilteredData(mappedTasks);

                // Get unique departments and names
                const names = [...new Set(mappedTasks.map(t => t.personName).filter(n => n))];
                setUniqueNames(names);

                const depts = [...new Set(mappedTasks.map(t => t.department).filter(d => d))];
                setUniqueDepartments(depts);

                const fmsNames = [...new Set(mappedTasks.map(t => t.fmsName).filter(f => f))];
                setUniqueFMSNames(fmsNames);


            } else {
                throw new Error(data.message || "Failed to fetch data");
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Get unique departments
        const depts = [...new Set(employees.map((emp) => emp.department))];
        setUniqueDepartments(depts);

        // Get unique employee names
        const names = [...new Set(employees.map((emp) => emp.name))];
        setUniqueNames(names);

        // Initialize with all data
        applyFilters();
    }, []);

    // const applyFilters = () => {
    //     let filtered = [...filteredData];

    //     // Filter by Name - personName se match karo
    //     if (filterName) {
    //         filtered = filtered.filter((task) =>
    //             task.personName.toLowerCase().includes(filterName.toLowerCase())
    //         );
    //     }

    //     if (filterFMSName) {
    //         filtered = filtered.filter((task) =>
    //             task.fmsName.toLowerCase().includes(filterFMSName.toLowerCase())
    //         );
    //     }

    //     // Filter by Department - department se match karo (fmsName nahi)
    //     if (filterDepartment) {
    //         filtered = filtered.filter((task) =>
    //             task.department === filterDepartment
    //         );
    //     }

    //     if (startDate) {
    //         filtered = filtered.filter((task) => {
    //             if (!task.startDate) return false;

    //             // यदि date string format में है
    //             const taskStartDate = new Date(task.startDate);
    //             const selectedStartDate = new Date(startDate);

    //             // Same day या उसके बाद की dates filter करो
    //             taskStartDate.setHours(0, 0, 0, 0);
    //             selectedStartDate.setHours(0, 0, 0, 0);

    //             return taskStartDate >= selectedStartDate;
    //         });
    //     }

    //     // Filter by End Date - कॉलम W से match करो
    //     if (endDate) {
    //         filtered = filtered.filter((task) => {
    //             if (!task.endDate) return false;

    //             // यदि date string format में है
    //             const taskEndDate = new Date(task.endDate);
    //             const selectedEndDate = new Date(endDate);

    //             // Same day या उसके पहले की dates filter करो
    //             taskEndDate.setHours(0, 0, 0, 0);
    //             selectedEndDate.setHours(0, 0, 0, 0);

    //             return taskEndDate <= selectedEndDate;
    //         });
    //     }

    //     return filtered;
    // };


    const applyFilters = () => {
    let filtered = [...filteredData];

    // Filter by Name - EXACT match karo
    if (filterName) {
        filtered = filtered.filter((task) =>
            task.personName && 
            task.personName.toLowerCase() === filterName.toLowerCase()
        );
    }

    // Filter by FMS Name - EXACT match karo
    if (filterFMSName) {
        filtered = filtered.filter((task) =>
            task.fmsName && 
            task.fmsName.toLowerCase() === filterFMSName.toLowerCase()
        );
    }

    // Filter by Department - EXACT match karo
    if (filterDepartment) {
        filtered = filtered.filter((task) =>
            task.department && 
            task.department.toLowerCase() === filterDepartment.toLowerCase()
        );
    }

    // Date filters...
    if (startDate) {
        filtered = filtered.filter((task) => {
            if (!task.startDate) return false;
            const taskStartDate = new Date(task.startDate);
            const selectedStartDate = new Date(startDate);
            taskStartDate.setHours(0, 0, 0, 0);
            selectedStartDate.setHours(0, 0, 0, 0);
            return taskStartDate >= selectedStartDate;
        });
    }

    if (endDate) {
        filtered = filtered.filter((task) => {
            if (!task.endDate) return false;
            const taskEndDate = new Date(task.endDate);
            const selectedEndDate = new Date(endDate);
            taskEndDate.setHours(0, 0, 0, 0);
            selectedEndDate.setHours(0, 0, 0, 0);
            return taskEndDate <= selectedEndDate;
        });
    }

    return filtered;
};

    const clearFilters = () => {
        setFilterName("");
        setFilterDepartment("");
        setStartDate("");
        setEndDate("");
        setNameSearchQuery("");
        setDeptSearchQuery("");
        setIsNameDropdownOpen(false);
        setIsDeptDropdownOpen(false);
        setIsFMSDropdownOpen(false);
    };

    const handleNameSelect = (name) => {
        setFilterName(name);
        setIsNameDropdownOpen(false);
    };

    // Calculate metrics for each task
    const getTaskMetrics = (task) => {
        return {
            target: task.target,
            totalAchievement: task.totalAchievement,
            workDonePercentage: task.workDone,
            workDoneOnTimePercentage: task.workDoneOnTime,
            allPendingTillDate: task.allPendingTillDate,
        };
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            completed: { color: "bg-green-100 text-green-800", label: "Completed" },
            "in-progress": {
                color: "bg-blue-100 text-blue-800",
                label: "In Progress",
            },
            pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
        };

        const config = statusConfig[status] || {
            color: "bg-gray-100 text-gray-800",
            label: status,
        };
        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
            >
                {config.label}
            </span>
        );
    };

    const getPriorityBadge = (priority) => {
        const priorityConfig = {
            high: { color: "bg-red-100 text-red-800", label: "High" },
            medium: { color: "bg-yellow-100 text-yellow-800", label: "Medium" },
            low: { color: "bg-green-100 text-green-800", label: "Low" },
        };

        const config = priorityConfig[priority] || {
            color: "bg-gray-100 text-gray-800",
            label: priority,
        };
        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
            >
                {config.label}
            </span>
        );
    };

    useEffect(() => {
        applyFilters();
    }, [filterName, filterDepartment, filterFMSName, startDate, endDate]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error: {error}</p>
                    <button
                        onClick={fetchDataFromSheet}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (


        <div className=" md:space-y-6 ">
            {/* Header */}
            <div className="flex flex-col gap-3 justify-between items-start sm:flex-row sm:items-center ">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                        Department Deeply Report
                    </h1>
                </div>
                <div className="flex flex-shrink-0 gap-2 items-center  text-sm text-gray-500 bg-gray-50 rounded-md">
                    <Filter className="flex-shrink-0 w-4 h-4" />
                    <span className="font-medium whitespace-nowrap">{filteredData.length} tasks found</span>
                </div>
            </div>

            {/* Filters Section - FIXED FILTER BUTTON WIDTH */}
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm md:p-6">
                <div className="flex flex-col gap-4 justify-between items-start mb-6 sm:flex-row sm:items-center sm:mb-4">
                    <h2 className="flex gap-2 items-center text-lg font-semibold text-gray-900">
                        <Filter className="w-5 h-5" />
                        Filters
                    </h2>
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2 text-sm font-medium text-gray-600 rounded-md border border-gray-300 transition-colors hover:text-gray-800 hover:bg-gray-50 whitespace-nowrap flex-shrink-0"
                    >
                        Clear All
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 md:gap-2">
                    {/* Filter by Name */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                            Filter by Employee Name
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsNameDropdownOpen(!isNameDropdownOpen)}
                                className="flex justify-between items-center px-3 py-2.5 w-full bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 truncate"
                            >
                                <span className={filterName ? "text-gray-900 truncate" : "text-gray-500 truncate"}>
                                    {filterName || "Select employee..."}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isNameDropdownOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {isNameDropdownOpen && (
                                <div className="absolute z-50 mt-1 w-full max-h-60 bg-white rounded-md border border-gray-300 shadow-lg overflow-hidden">
                                    {/* Search Input */}
                                    <div className="p-2 border-b border-gray-200">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={nameSearchQuery}
                                                onChange={(e) => setNameSearchQuery(e.target.value)}
                                                placeholder="Search employee..."
                                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-auto max-h-48">
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    handleNameSelect("");
                                                    setNameSearchQuery("");
                                                }}
                                                className="px-3 py-2.5 w-full text-sm text-left text-gray-700 border-b border-gray-100 hover:bg-gray-100 whitespace-nowrap"
                                            >
                                                All Employees
                                            </button>
                                            {uniqueNames
                                                .filter(name => name.toLowerCase().includes(nameSearchQuery.toLowerCase()))
                                                .map((name) => (
                                                    <button
                                                        key={name}
                                                        onClick={() => {
                                                            handleNameSelect(name);
                                                            setNameSearchQuery("");
                                                        }}
                                                        className="flex gap-2 items-center px-3 py-2.5 w-full text-sm text-left text-gray-900 border-b border-gray-100 hover:bg-gray-100 last:border-b-0 whitespace-nowrap"
                                                    >
                                                        {name}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filter by Department */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                            Filter by Department
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDeptDropdownOpen(!isDeptDropdownOpen);
                                    setIsNameDropdownOpen(false);
                                }}
                                className="flex justify-between items-center px-3 py-2.5 w-full bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 truncate"
                            >
                                <span className={filterDepartment ? "text-gray-900 truncate" : "text-gray-500 truncate"}>
                                    {filterDepartment || "Select department..."}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isDeptDropdownOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {isDeptDropdownOpen && (
                                <div className="absolute z-50 mt-1 w-full max-h-60 bg-white rounded-md border border-gray-300 shadow-lg overflow-hidden">
                                    {/* Search Input */}
                                    <div className="p-2 border-b border-gray-200">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={deptSearchQuery}
                                                onChange={(e) => setDeptSearchQuery(e.target.value)}
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
                                                    setIsDeptDropdownOpen(false);
                                                    setDeptSearchQuery("");
                                                }}
                                                className="px-3 py-2.5 w-full text-sm text-left text-gray-700 border-b border-gray-100 hover:bg-gray-100 whitespace-nowrap"
                                            >
                                                All Departments
                                            </button>
                                            {uniqueDepartments
                                                .filter(dept => dept.toLowerCase().includes(deptSearchQuery.toLowerCase()))
                                                .map((dept) => (
                                                    <button
                                                        key={dept}
                                                        onClick={() => {
                                                            setFilterDepartment(dept);
                                                            setIsDeptDropdownOpen(false);
                                                            setDeptSearchQuery("");
                                                        }}
                                                        className="flex gap-2 items-center px-3 py-2.5 w-full text-sm text-left text-gray-900 border-b border-gray-100 hover:bg-gray-100 last:border-b-0 whitespace-nowrap"
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


                    {/* Filter by FMS Name - Filter by Department के बाद add करें */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                            Filter by FMS Name
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFMSDropdownOpen(!isFMSDropdownOpen);
                                    setIsNameDropdownOpen(false);
                                    setIsDeptDropdownOpen(false);
                                }}
                                className="flex justify-between items-center px-3 py-2.5 w-full bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 truncate"
                            >
                                <span className={filterFMSName ? "text-gray-900 truncate" : "text-gray-500 truncate"}>
                                    {filterFMSName || "Select FMS..."}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isFMSDropdownOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {isFMSDropdownOpen && (
                                <div className="absolute z-50 mt-1 w-full max-h-60 bg-white rounded-md border border-gray-300 shadow-lg overflow-hidden">
                                    {/* Search Input */}
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
                                            <button
                                                onClick={() => {
                                                    setFilterFMSName("");
                                                    setIsFMSDropdownOpen(false);
                                                    setFmsSearchQuery("");
                                                }}
                                                className="px-3 py-2.5 w-full text-sm text-left text-gray-700 border-b border-gray-100 hover:bg-gray-100 whitespace-nowrap"
                                            >
                                                All FMS
                                            </button>
                                            {uniqueFMSNames
                                                .filter(fms => fms.toLowerCase().includes(fmsSearchQuery.toLowerCase()))
                                                .map((fms) => (
                                                    <button
                                                        key={fms}
                                                        onClick={() => {
                                                            setFilterFMSName(fms);
                                                            setIsFMSDropdownOpen(false);
                                                            setFmsSearchQuery("");
                                                        }}
                                                        className="flex gap-2 items-center px-3 py-2.5 w-full text-sm text-left text-gray-900 border-b border-gray-100 hover:bg-gray-100 last:border-b-0 whitespace-nowrap"
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


                    {/* Start Date */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                            Start Date
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2 flex-shrink-0" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="py-2.5 pr-3 pl-10 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                            End Date
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2 flex-shrink-0" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="py-2.5 pr-3 pl-10 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards - FIXED CARD WIDTH */}
            <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2 lg:grid-cols-5">
                {/* FMS Name Card */}
                <div className="w-full p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-600 truncate">FMS Name</p>

                            <p className="mt-1 text-lg font-semibold text-gray-900 truncate">
                                {[...new Set(applyFilters().map((task) => task.fmsName))].filter(fms => fms).length}
                            </p>
                        </div>
                        <div className="flex justify-center items-center w-8 h-8 bg-blue-50 rounded-full ml-2 flex-shrink-0">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Employees Card */}
                <div className="w-full p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-600 truncate">Employees</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 truncate">
                                {[...new Set(applyFilters().map((task) => task.personName))].filter(name => name).length}
                            </p>
                        </div>
                        <div className="flex justify-center items-center w-8 h-8 bg-green-50 rounded-full ml-2 flex-shrink-0">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Pending Tasks Card */}
                <div className="w-full p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-600 truncate">Pending Tasks</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 truncate">
                                {applyFilters().reduce((total, task) => total + (task.allPendingTillDate || 0), 0)}
                            </p>
                        </div>
                        <div className="flex justify-center items-center w-8 h-8 bg-orange-50 rounded-full ml-2 flex-shrink-0">
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>


                {/* Overall Score Card */}
                {/* Overall Score Card */}
                <div className="w-full p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-600 truncate">Overall Done Score</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 truncate">
                                {(() => {
                                    const filtered = applyFilters();

                                    const totalTarget = filtered.reduce((sum, task) => sum + (task.target || 0), 0);
                                    const totalAchievement = filtered.reduce((sum, task) => sum + (task.totalAchievement || 0), 0);

                                    if (totalTarget === 0) return 0;

                                    const overallScore = (totalAchievement / totalTarget) * 100;

                                    return Math.round(overallScore);
                                })()}%

                            </p>
                        </div>
                        <div className="flex justify-center items-center w-8 h-8 bg-indigo-50 rounded-full ml-2 flex-shrink-0">
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Delay Score Card */}
                <div className="w-full p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-600 truncate">Delay Score</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 truncate">
                                {(() => {
                                    const filtered = applyFilters();

                                    const totalTarget = filtered.reduce((sum, task) => sum + (task.target || 0), 0);
                                    const totalAchievement = filtered.reduce((sum, task) => sum + (task.totalAchievement || 0), 0);

                                    if (totalTarget === 0) return 0;

                                    const delay = totalTarget - totalAchievement;
                                    const delayPercentage = (delay / totalTarget) * 100;

                                    return Math.round(delayPercentage);
                                })()}%

                            </p>
                        </div>
                        <div className="flex justify-center items-center w-8 h-8 bg-red-50 rounded-full ml-2 flex-shrink-0">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Table View - SCROLL FIXED */}
            <div className="hidden md:block">
                <div className="overflow-hidden border border-gray-200 rounded-lg w-[1200px] mx-auto">

                    <div className=" overflow-y-auto max-h-[calc(100vh-400px)]">
                        <table className="min-w-full max-w-[900px] mx-auto divide-y divide-gray-200">

                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap bg-gray-50">
                                        Employee ID
                                    </th>
                                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap bg-gray-50">
                                        FMS Name
                                    </th>
                                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap bg-gray-50">
                                        Task Name
                                    </th>
                                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap bg-gray-50">
                                        Employee Name
                                    </th>
                                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap bg-gray-50">
                                        Department
                                    </th>
                                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap bg-gray-50">
                                        Target
                                    </th>
                                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap bg-gray-50">
                                        Total Achievement
                                    </th>
                                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap bg-gray-50">
                                        % Work Done
                                    </th>
                                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap bg-gray-50">
                                        % Work Done On Time
                                    </th>
                                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap bg-gray-50">
                                        All Pending Till Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {applyFilters().length > 0 ? (
                                    applyFilters().map((task) => {
                                        const metrics = getTaskMetrics(task);
                                        const employee = employees.find((emp) => emp.id === task.assignedTo);

                                        return (
                                            <tr key={task.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                    {task.assignedTo}

                                                </td>

                                                <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap truncate max-w-[120px]">
                                                    {task.fmsName}
                                                </td>

                                                <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap truncate max-w-[180px]">
                                                    <div className="font-medium truncate" title={task.taskName}>
                                                        {task.taskName}
                                                    </div>
                                                </td>

                                                <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap truncate max-w-[180px]">
                                                    <div className="font-medium truncate" title={task.taskName}>
                                                        {task.personName}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap truncate max-w-[180px]">
                                                    <div className="font-medium truncate" title={task.taskName}>
                                                        {task.department}
                                                    </div>
                                                </td>

                                                <td className="px-3 py-3 text-sm text-center text-gray-900 whitespace-nowrap">
                                                    <span className="inline-flex justify-center items-center w-10 h-7 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                                                        {metrics.target}%
                                                    </span>
                                                </td>

                                                <td className="px-3 py-3 text-sm text-center text-gray-900 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center justify-center w-14 h-7 rounded-full text-xs font-semibold ${metrics.totalAchievement >= metrics.target
                                                            ? "bg-green-100 text-green-800"
                                                            : metrics.totalAchievement >= metrics.target * 0.8
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                            }`}
                                                    >
                                                        {metrics.totalAchievement}%
                                                    </span>
                                                </td>

                                                <td className="px-3 py-3 text-sm text-center text-gray-900 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center justify-center w-14 h-7 rounded-full text-xs font-semibold ${metrics.workDonePercentage >= 90
                                                            ? "bg-green-100 text-green-800"
                                                            : metrics.workDonePercentage >= 70
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                            }`}
                                                    >
                                                        {metrics.workDonePercentage}%
                                                    </span>
                                                </td>

                                                <td className="px-3 py-3 text-sm text-center text-gray-900 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center justify-center w-14 h-7 rounded-full text-xs font-semibold ${metrics.workDoneOnTimePercentage >= 90
                                                            ? "bg-green-100 text-green-800"
                                                            : metrics.workDoneOnTimePercentage >= 70
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                            }`}
                                                    >
                                                        {metrics.workDoneOnTimePercentage}%
                                                    </span>
                                                </td>

                                                <td className="px-3 py-3 text-sm text-center text-gray-900 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${metrics.allPendingTillDate === 0
                                                            ? "bg-green-100 text-green-800"
                                                            : metrics.allPendingTillDate <= 3
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                            }`}
                                                    >
                                                        {metrics.allPendingTillDate}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                            <div className="flex flex-col justify-center items-center">
                                                <Filter className="mb-2 w-10 h-10 text-gray-300" />
                                                <p className="text-base font-medium text-gray-900">No tasks found</p>
                                                <p className="text-sm text-gray-500">Try adjusting your filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Mobile View - OPTIMIZED FOR SMALL SCREENS */}
            <div className="md:hidden">
                <div className="space-y-3">
                    {applyFilters().length > 0 ? (
                        applyFilters().map((task) => {
                            const employee = employees.find(
                                (emp) => emp.id === task.assignedTo
                            );
                            const metrics = getTaskMetrics(task);

                            if (!employee || !metrics) return null;

                            return (
                                <div key={task.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                                    <div className="mb-2">
                                        <div className="text-xs font-medium text-gray-600 mb-1 truncate">
                                            ID: {employee.id}
                                        </div>
                                        <div className="text-xs font-medium text-blue-600 mb-1 truncate">
                                            {task.fmsName}
                                        </div>
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {task.taskName}
                                        </div>
                                    </div>

                                    <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                                        <div className="flex justify-center items-center w-6 h-6 bg-blue-100 rounded-full mr-2 flex-shrink-0">
                                            <span className="text-xs font-medium text-blue-600">
                                                {employee.name.charAt(0)}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-600 truncate flex-1">{employee.name}</span>
                                    </div>

                                    <div className="grid grid-cols-5 gap-1 text-center">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">TGT</div>
                                            <span className="text-xs font-semibold text-blue-600">
                                                {metrics.target}%
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">ACH</div>
                                            <span className={`text-xs font-semibold ${metrics.totalAchievement >= metrics.target
                                                ? "text-green-600"
                                                : "text-red-600"
                                                }`}>
                                                {metrics.totalAchievement}%
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">WD</div>
                                            <span className={`text-xs font-semibold ${metrics.workDonePercentage >= 90
                                                ? "text-green-600"
                                                : metrics.workDonePercentage >= 70
                                                    ? "text-yellow-600"
                                                    : "text-red-600"
                                                }`}>
                                                {metrics.workDonePercentage}%
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">OT</div>
                                            <span className={`text-xs font-semibold ${metrics.workDoneOnTimePercentage >= 90
                                                ? "text-green-600"
                                                : metrics.workDoneOnTimePercentage >= 70
                                                    ? "text-yellow-600"
                                                    : "text-red-600"
                                                }`}>
                                                {metrics.workDoneOnTimePercentage}%
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">PEN</div>
                                            <span className={`text-xs font-semibold ${metrics.allPendingTillDate === 0
                                                ? "text-green-600"
                                                : metrics.allPendingTillDate <= 3
                                                    ? "text-yellow-600"
                                                    : "text-red-600"
                                                }`}>
                                                {metrics.allPendingTillDate}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            <Filter className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm">No tasks found</p>
                        </div>
                    )}
                </div>
            </div>

            <FilteredDataCharts filters={currentFilters}  tableData={applyFilters()}/>
        </div>
    );
};

export default Report;