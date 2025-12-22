import React, { useEffect, useState, useRef, useMemo } from "react";
import KpikraTable from "../../components/tables/KpikraTable";
import { useAuth } from "../../contexts/AuthContext";

const KpiKra = () => {
  const { user } = useAuth();
  const [selectedData, setSelectedData] = useState({
    designation: "",
    department: "",
    name: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [initialLoadError, setInitialLoadError] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedName, setSelectedName] = useState("");


  // Store all available data for dropdown
  const [allEmployeeData, setAllEmployeeData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);


  const designationOptions = useMemo(() => {
    return [...new Set(allEmployeeData.map(i => i.designation))];
  }, [allEmployeeData]);

  const departmentOptions = useMemo(() => {
    return [...new Set(
      allEmployeeData
        .filter(i => i.designation === selectedDesignation)
        .map(i => i.department)
    )];
  }, [allEmployeeData, selectedDesignation]);

  const nameOptions = useMemo(() => {
    return allEmployeeData.filter(
      i =>
        i.designation === selectedDesignation &&
        i.department === selectedDepartment
    );
  }, [allEmployeeData, selectedDesignation, selectedDepartment]);


  const handleFinalSelection = (employee) => {
    handleDropdownChange(employee); // 🔥 existing functionality
  };



  // Fetch all employee data from Master sheet
  const fetchAllEmployeeData = async () => {
    try {
      const SPREADSHEET_ID = "1sMwYAo58dN1icoR0db91wTbMD2CA7tEbl61jV6AKy6I";
      const SHEET_NAME = "Master";

      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const json = JSON.parse(text.substring(jsonStart, jsonEnd));

      if (!json.table || !json.table.rows) {
        setAllEmployeeData([]);
        return;
      }

      // Extract unique combinations of designation, department, and name
      const uniqueData = [];
      const seen = new Set();

      json.table.rows.forEach((row) => {
        if (row.c && row.c.length >= 3) {
          const designation = row.c[0]?.v || row.c[0]?.f || "";
          const department = row.c[1]?.v || row.c[1]?.f || "";
          const name = row.c[2]?.v || row.c[2]?.f || "";

          if (designation && department && name) {
            const key = `${designation}|${department}|${name}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueData.push({
                designation,
                department,
                name,
                displayText: `${designation} (${department}) - ${name}`
              });
            }
          }
        }
      });

      setAllEmployeeData(uniqueData);
      setFilteredData(uniqueData);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setAllEmployeeData([]);
    }
  };

  // Initialize data based on user role
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        // Admin के लिए सभी employee data fetch करें
        fetchAllEmployeeData();
      } else {
        // Regular users के लिए उनका ही data set करें
        if (user.designations && user.designations.length > 0) {
          setSelectedData({
            designation: user.designations[0],
            department: user.department || "",
            name: user.name || ""
          });
        }
      }
    }
  }, [user]);

  // Filter data based on search text
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredData(allEmployeeData);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = allEmployeeData.filter(item =>
      item.designation.toLowerCase().includes(searchLower) ||
      item.department.toLowerCase().includes(searchLower) ||
      item.name.toLowerCase().includes(searchLower) ||
      item.displayText.toLowerCase().includes(searchLower)
    );

    setFilteredData(filtered);
  }, [searchText, allEmployeeData]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDropdownChange = (employeeData) => {
    setSelectedData({
      designation: employeeData.designation,
      department: employeeData.department,
      name: employeeData.name
    });

    setSearchText(employeeData.displayText);
    setOpen(false);

    setIsSubmitting(true);
    setSubmitMessage(`✅ Selected: ${employeeData.designation} - ${employeeData.department} - ${employeeData.name}`);

    // Trigger table refresh
    setRefreshTrigger(prev => prev + 1);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage("");
    }, 3000);
  };

  // Get effective data based on user role
  const getEffectiveData = () => {
    if (user?.role === "admin") {
      return selectedData;
    } else {
      return {
        designation: user?.designations?.[0] || "",
        department: user?.department || "",
        name: user?.name || ""
      };
    }
  };

  const effectiveData = getEffectiveData();

  return (
    <div className="space-y-6">


      {/* KPI & KRA Header & Dropdown */}
      {/* <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-sm"> */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-sm gap-4">

        <div>
          <h1 className="text-2xl font-bold text-white">KPI & KRA Dashboard</h1>
          <p className="text-blue-100 mt-1">
            {user?.role === "admin" ? "Admin View - Select Employee" : "Your Performance Metrics"}
          </p>
        </div>



        {user?.role === "admin" && (
          <div className="flex gap-2 w-full sm:w-auto md:ml-4">

            {/* DESIGNATION */}
            <select
              value={selectedDesignation}
              onChange={(e) => {
                setSelectedDesignation(e.target.value);
                setSelectedDepartment("");
                setSelectedName("");
              }}
              className="px-4 py-2 rounded-lg w-1/3 sm:w-auto"
            >
              <option value="">Select Designation</option>
              {designationOptions.slice(1).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* DEPARTMENT */}
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedName("");
              }}
              disabled={!selectedDesignation}
              className="px-4 py-2 rounded-lg w-1/3 sm:w-auto"
            >
              <option value="">Select Department</option>
              {departmentOptions.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>

            {/* NAME */}
            <select
              value={selectedName}
              onChange={(e) => {
                setSelectedName(e.target.value);

                const employee = nameOptions.find(
                  i => i.name === e.target.value
                );

                if (employee) {
                  handleFinalSelection(employee);
                }
              }}
              disabled={!selectedDepartment}
              className="px-4 py-2 rounded-lg w-1/3 sm:w-auto"
            >
              <option value="">Select Name</option>
              {nameOptions.map(emp => (
                <option key={emp.name} value={emp.name}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* Message / Status */}
      {(isSubmitting || submitMessage) && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <span className="text-white">
            {submitMessage}
          </span>
        </div>
      )}

      {/* Selected Info Display (Admin only) */}



      {/* Loading Spinner or Table */}
      {isLoadingData ? (
        <div className="flex justify-center items-center h-32 text-blue-500 font-semibold text-lg">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
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
              d="M4 12a8 8 0 018-8v8z"
            ></path>
          </svg>
          Loading data...
        </div>
      ) : (
        <KpikraTable
          designation={effectiveData.designation}
          department={effectiveData.department}
          name={effectiveData.name}
          key={`${effectiveData.designation}-${effectiveData.department}-${effectiveData.name}-${refreshTrigger}`}
          isAdmin={user?.role === "admin"}
          isEmpty={!effectiveData.designation}
        />
      )}
    </div>
  );
};

export default KpiKra;