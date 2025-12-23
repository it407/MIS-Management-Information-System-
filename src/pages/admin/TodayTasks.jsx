


import React, { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";

// Google Apps Script Web App URL
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxsivpBFRp-nkwL2tlmVRUNyW3U554AzguV3OQrYIjDBCh_G5cOG47_NWMHWOamOQY4/exec";
const SPREADSHEET_ID = "1t_-LmxTDhiibPo2HaBZIQJvXOBz_vQ_zsv2f8MhhdGM";
const SHEET_NAME = "Data";

const AdminTodayTasks = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [personFilter, setPersonFilter] = useState("all");
  const [fmsFilter, setFmsFilter] = useState("all");
  const [tasks, setTasks] = useState([]);
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
          const transformedTasks = data.users
            .filter(user => user['Person Name'] && user['Task Name']) // Filter out empty rows
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

              return {
                id: `task-${index + 1}`,
                fmsName: user['Fms Name'] || 'N/A',
                taskName: user['Task Name'] || 'N/A',
                assignedTo: user['Employee ID'] || `emp-${String(index + 1).padStart(3, '0')}`,
                todayTaskCount: parseInt(user['Today Task']) || 0,
                personName: user['Person Name'] || 'Unknown',
                personImage: personImage,
                department: user['Department'] || 'N/A',
                // Add other fields if needed for display
                employeeId: user['Employee ID'] || '',
                target: user['Target'] || 0,
                achievement: user['Total Achievement'] || 0,
                percentDone: user['% Work Done'] || 0,
                percentOnTime: user['% Work Done On Time'] || 0
              };
            });

          setTasks(transformedTasks);

          // Create employees list from unique person names
          const uniqueEmployees = Array.from(
            new Map(
              transformedTasks.map(task => [task.personName, {
                id: task.assignedTo,
                name: task.personName,
                email: '', // Email not in provided columns
                image: task.personImage,
                department: task.department,
                designation: task.department // Using department as designation
              }])
            ).values()
          );

          setEmployees(uniqueEmployees);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Keep using dummy data as fallback
        console.log("Using fallback data due to fetch error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get employee by ID
  const getEmployee = (employeeId) => {
    return employees.find((emp) => emp.id === employeeId);
  };

  // Enrich tasks with employee data (now using actual data)
  const enrichedTasks = useMemo(() => {
    return tasks.map((task) => {
      const employee = getEmployee(task.assignedTo);
      return {
        ...task,
        personName: employee?.name || task.personName || "Unknown",
        personImage: employee?.image || task.personImage || "",
        department: employee?.department || task.department || "N/A",
      };
    });
  }, [tasks, employees]);

  // Extract unique persons and FMS names from actual data
  const persons = useMemo(() => {
    const uniquePersons = [
      ...new Set(enrichedTasks.map((task) => task.personName)),
    ].filter(name => name && name !== "Unknown");
    return uniquePersons.sort();
  }, [enrichedTasks]);

  const fmsNames = useMemo(() => {
    const uniqueFMS = [...new Set(enrichedTasks.map((task) => task.fmsName))]
      .filter(fms => fms && fms !== "N/A");
    return uniqueFMS.sort();
  }, [enrichedTasks]);

  // Filter tasks based on all criteria
  // Filter tasks based on all criteria - ONLY TODAY'S TASKS
  const filteredTasks = useMemo(() => {
    return enrichedTasks.filter((task) => {
      // Only include tasks with todayTaskCount > 0
      if (task.todayTaskCount <= 0) {
        return false;
      }

      const matchesSearch =
        task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.fmsName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPerson =
        personFilter === "all" || task.personName === personFilter;
      const matchesFMS = fmsFilter === "all" || task.fmsName === fmsFilter;

      return matchesSearch && matchesPerson && matchesFMS;
    });
  }, [enrichedTasks, searchQuery, personFilter, fmsFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading data from Google Sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">



        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"> */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          {/* Total Persons Card */}
          <div className="rounded-lg shadow-sm p-4 border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Total Persons
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {personFilter === "all" ? persons.length : 1}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total FMS Names Card */}
          <div className="rounded-lg shadow-sm p-4 border border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">
                  Total FMS Names
                </p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {[...new Set(filteredTasks.map(task => task.fmsName))].length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Task Names Card */}
          <div className="rounded-lg shadow-sm p-4 border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">
                  Total Task Names
                </p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {[...new Set(filteredTasks.map(task => task.taskName))].length}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Today's Total Tasks Card */}
          <div className="rounded-lg shadow-sm p-4 border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">
                  Today's Total Tasks
                </p>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  {filteredTasks.reduce((total, task) => total + task.todayTaskCount, 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

        </div>




        {/* Search and Filter Bar */}
        <div className="bg-white rounded shadow-sm p-4 mb-4">
          <div className="flex flex-col gap-3 md:flex-row md:gap-3">
            {/* Search Input */}
            <div className="w-full md:flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by task, person, or FMS name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filters Container */}
            <div className="grid grid-cols-2 gap-3 md:flex md:gap-3">
              {/* Person Filter */}
              <div className="w-full md:w-56">
                <select
                  value={personFilter}
                  onChange={(e) => setPersonFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="all">All Persons</option>
                  {persons.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </div>

              {/* FMS Name Filter */}
              <div className="w-full md:w-56">
                <select
                  value={fmsFilter}
                  onChange={(e) => setFmsFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="all">All FMS Names</option>
                  {fmsNames.map((fms) => (
                    <option key={fms} value={fms}>
                      {fms}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>


        {/* Summary Cards */}


        {/* Tasks List */}
        <div className="bg-white rounded shadow-sm">
          {/* Section Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-700">
              All Tasks ({filteredTasks.length} found)
            </h2>
          </div>

          {filteredTasks.length > 0 ? (
            <>
              {/* Desktop Table View */}
              {/* <div className="hidden md:block overflow-x-auto"> */}
        <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-96">


                <table className="w-full">
                  {/* <thead className="bg-gray-50"> */}
                  <thead className="bg-gray-50 sticky top-0 z-20">

                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Link with Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        FMS Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Today Task
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {task.assignedTo}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={task.personImage}
                              alt={task.personName}
                              className="w-8 h-8 rounded-full object-cover mr-3"
                            />
                            <span className="text-sm text-gray-900">
                              {task.personName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.fmsName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.taskName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {task.todayTaskCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center flex-1">
                        <img
                          src={task.personImage}
                          alt={task.personName}
                          className="w-10 h-10 rounded-full object-cover mr-3"
                        />
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">
                            ID: {task.assignedTo}
                          </div>
                          <div className="text-xs text-gray-500 mb-1">
                            Link with Name
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {task.personName}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-xs text-gray-500 mb-1">
                          Today Task
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {task.todayTaskCount}
                        </div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="text-xs text-gray-500 mb-1">FMS Name</div>
                      <div className="text-sm text-gray-900">
                        {task.fmsName}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Task Name
                      </div>
                      <div className="text-sm text-gray-900">
                        {task.taskName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">
                No Tasks Found
              </h3>
              <p className="text-sm text-gray-500">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTodayTasks;
