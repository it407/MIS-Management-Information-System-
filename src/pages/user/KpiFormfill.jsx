import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Briefcase, CheckSquare, Target, Users, MessageSquare, Database, Link, AlertCircle, PlayCircle, User, TrendingUp, RefreshCw, Settings, Plus } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const CompleteKpiDashboard = () => {
    console.log("🚀 COMPLETE KPI DASHBOARD STARTED");

    const { user, submitDesignationToDashboard } = useAuth();
    console.log("👤 User from Auth:", user);

    // State management
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDesignation, setSelectedDesignation] = useState('');
    const [availableDesignations, setAvailableDesignations] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState("");
    const [pendingTasks, setPendingTasks] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [isEmpty, setIsEmpty] = useState(false);

    const [teamCommunicationData, setTeamCommunicationData] = useState([]);
    const [isTeamDataLoading, setIsTeamDataLoading] = useState(false);

    // New state for modal and designation brief
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [designationBriefData, setDesignationBriefData] = useState({
        designation: "",
        department: "",
        actualRole: "",
        communicationTeam: "",
        keyPerson: "",
        howToCommunicate: ""
    });
    const [isSubmittingBrief, setIsSubmittingBrief] = useState(false);
    const [briefSubmitMessage, setBriefSubmitMessage] = useState("");


    // State management section में जोड़ें
const [performanceScoringData, setPerformanceScoringData] = useState({
    howScoringWorks: "",
    howToScoreBetter: ""
});

    const [systemsData, setSystemsData] = useState([]);
    const [isSystemsDataLoading, setIsSystemsDataLoading] = useState(false);

    // Persistent data storage
    const persistentData = useRef(null);
    const hasFetched = useRef(false);
    const abortControllerRef = useRef(null);

    // Google Sheets configuration
    const SPREADSHEET_ID = "1sMwYAo58dN1icoR0db91wTbMD2CA7tEbl61jV6AKy6I";
    const SHEET_NAME = "Dashboard"; // Dashboard sheet for all operations
    const DESIGNATION_BRIEF_SHEET = "Designation Brief"; // New sheet for designation brief

    // Restore data from localStorage on mount with user-specific keys
    useEffect(() => {
        console.log("🔄 Restoring data from localStorage...");

        if (!user) return;

        const userKey = user.id || user.username || 'default';
        const storageKey = `kpi_selected_designation_${userKey}`;
        const storedDesignation = localStorage.getItem(storageKey);

        if (storedDesignation) {
            setSelectedDesignation(storedDesignation);
            console.log('✅ Restored designation:', storedDesignation);

            const stored = localStorage.getItem(`kpi_dashboard_data_${storedDesignation}`);
            if (stored) {
                try {
                    const parsedData = JSON.parse(stored);
                    setPendingTasks(parsedData);
                    persistentData.current = parsedData;
                    hasFetched.current = true;
                    setIsEmpty(parsedData.length === 0);
                    console.log('✅ Restored designation-specific data');
                } catch (e) {
                    console.error('❌ Failed to restore data:', e);
                    localStorage.removeItem(`kpi_dashboard_data_${storedDesignation}`);
                }
            }
        }
    }, [user]);

    // Handle user authentication and designation setup
    useEffect(() => {
        console.log("👤 User effect triggered:", user);

        if (user) {
            console.log('👤 User loaded:', {
                name: user.name,
                id: user.id || user.username,
                designations: user.designations,
                department: user.department
            });

            if (user.designations && user.designations.length > 0) {
                setAvailableDesignations(user.designations);

                const userKey = user.id || user.username || 'default';
                const storageKey = `kpi_selected_designation_${userKey}`;
                const storedDesignation = localStorage.getItem(storageKey);

                // Check if stored designation is valid for current user
                const isValidDesignation = storedDesignation && user.designations.includes(storedDesignation);

                if (!isValidDesignation) {
                    const firstDesignation = user.designations[0];
                    setSelectedDesignation(firstDesignation);
                    localStorage.setItem(storageKey, firstDesignation);
                    console.log('🎯 Auto-selected user designation:', firstDesignation);

                    // Clear invalid cached data if exists
                    if (storedDesignation) {
                        localStorage.removeItem(`kpi_dashboard_data_${storedDesignation}`);
                        console.log("🗑️ CompleteKpiDashboard: Cleared invalid designation data:", storedDesignation);
                    }

                    // Since AuthContext already submitted designation on login, just fetch data
                    fetchPendingData(firstDesignation);
                } else {
                    setSelectedDesignation(storedDesignation);
                    console.log('✅ CompleteKpiDashboard: Using valid stored designation:', storedDesignation);

                    const hasDataForCurrentDesignation = localStorage.getItem(`kpi_dashboard_data_${storedDesignation}`);
                    if (!hasDataForCurrentDesignation) {
                        console.log('🔍 No cached data found, fetching fresh data...');
                        fetchPendingData(storedDesignation);
                    }
                }
            } else {
                console.warn('⚠️ No designations found for user:', user.name);
                setAvailableDesignations([]);
                setIsEmpty(true);
            }

            // Auto-fill designation and department for modal
            if (user.designation && user.department) {
                setDesignationBriefData(prev => ({
                    ...prev,
                    designation: user.designation,
                    department: user.department
                }));
            }

            setIsLoading(false);
        } else {
            console.log("❌ No user data available");
        }
    }, [user]);

    // Fetch pending data from Dashboard sheet (same structure as KpikraTable) - Improved error handling
    const fetchPendingData = useCallback(async (designationToFetch = selectedDesignation) => {
        if (!designationToFetch) {
            setPendingTasks([]);
            return;
        }

        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();
            setIsDataLoading(true);
            setError(null);
            setIsEmpty(false);

            console.log(`🔍 Fetching data for designation: ${designationToFetch} from Dashboard sheet`);

            // Reduced wait time for better UX
            await new Promise(resolve => setTimeout(resolve, 500));

            // Fetch from Dashboard sheet (same as KpikraTable)
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

            const response = await fetch(url, {
                signal: abortControllerRef.current.signal,
                method: 'GET',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const text = await response.text();

            // Improved JSON parsing
            let jsonData;
            try {
                const jsonStart = text.indexOf('{');
                const jsonEnd = text.lastIndexOf('}') + 1;
                if (jsonStart === -1 || jsonEnd === 0) {
                    throw new Error('Invalid response format from Google Sheets');
                }
                jsonData = JSON.parse(text.substring(jsonStart, jsonEnd));
            } catch (parseError) {
                console.error('JSON parsing error:', parseError);
                throw new Error('Failed to parse response from Google Sheets');
            }

            // Check if we have valid data
            if (!jsonData.table || !jsonData.table.rows) {
                console.log('⚠️ No data found in Dashboard sheet');
                setPendingTasks([]);
                setIsEmpty(true);
                return;
            }

            const items = jsonData.table.rows.map((row, rowIndex) => {
                const itemObj = {
                    _id: `${rowIndex}-${Math.random().toString(36).substr(2, 9)}`,
                    _rowIndex: rowIndex + 1,
                    _designation: designationToFetch,
                    _userId: user?.id || user?.username || 'unknown',
                    _fetchTime: new Date().toISOString()
                };
                if (row.c) {
                    row.c.forEach((cell, i) => {
                        itemObj[`col${i}`] = cell?.v ?? cell?.f ?? "";
                    });
                }
                return itemObj;
            });

            console.log(`✅ Successfully fetched ${items.length} records from Dashboard sheet`);

            if (items.length === 0) {
                setIsEmpty(true);
            } else {
                setPendingTasks(items);
                persistentData.current = items;
                hasFetched.current = true;
                setIsEmpty(false);

                // Cache the data
                const storageKey = `kpi_dashboard_data_${designationToFetch}`;
                try {
                    localStorage.setItem(storageKey, JSON.stringify(items));
                } catch (storageError) {
                    console.warn('Failed to cache data:', storageError);
                }
            }

            return items;
        } catch (err) {
            if (err.name !== 'AbortError') {
                let errorMessage = err.message;

                if (err.message.includes('Failed to fetch')) {
                    errorMessage = 'Network error - please check your internet connection and try again';
                } else if (err.message.includes('404')) {
                    errorMessage = 'Dashboard sheet not found - please contact administrator';
                } else if (err.message.includes('403')) {
                    errorMessage = 'Access denied - please check sheet permissions';
                } else if (err.message.includes('Invalid response format')) {
                    errorMessage = 'Invalid data format from Google Sheets';
                }

                console.error('❌ Fetch error:', err);
                setError(errorMessage);
            }
        } finally {
            setIsDataLoading(false);
            abortControllerRef.current = null;
        }
    }, [selectedDesignation, user?.id, user?.username]);



//     const fetchTeamCommunicationData = useCallback(async () => {
//         if (!user || !user.designation || !user.department || !user.username) {
//             console.log("❌ User data incomplete for fetching data");
//             return;
//         }

//         try {
//             setIsTeamDataLoading(true);
//             console.log(`🔍 Fetching all data for: ${user.designation}, ${user.department}`);

//             // Fetch from Master sheet
//             const MASTER_SHEET_NAME = "Master";
//             const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(MASTER_SHEET_NAME)}`;

//             const response = await fetch(url, {
//                 method: 'GET',
//                 headers: {
//                     'Accept': 'application/json, text/plain, */*',
//                 },
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const text = await response.text();
//             console.log("text",text)
//             const jsonStart = text.indexOf('{');
//             const jsonEnd = text.lastIndexOf('}') + 1;

//             if (jsonStart === -1 || jsonEnd === 0) {
//                 throw new Error('Invalid response format from Google Sheets');
//             }

//             const jsonData = JSON.parse(text.substring(jsonStart, jsonEnd));

//             if (!jsonData.table || !jsonData.table.rows) {
//                 console.log('⚠️ No data found in Master sheet');
//                 setTeamCommunicationData([]);
//                 setSystemsData([]); // Empty systems data too
//                 return;
//             }

//             // Process all rows
//             const allData = jsonData.table.rows.map((row, rowIndex) => {
//                 const item = { _id: `${rowIndex}-${Date.now()}` };
//                 if (row.c) {
//                     row.c.forEach((cell, colIndex) => {
//                         item[`col${colIndex}`] = cell?.v ?? cell?.f ?? "";
//                     });
//                 }
//                 return item;
//             });

//             // Filter by designation and department
//             const filteredData = allData.filter(row => {
//                 const rowDesignation = String(row.col0 || "").trim();
//                 const rowDepartment = String(row.col1 || "").trim();
//                 const rowName = String(row.col2 || "").trim();

//                 const userDesignation = String(user.designation || "").trim();
//                 const userDepartment = String(user.department || "").trim();
//                 const userName =String(user.username || "").trim()

//                 console.log({
//   rowName,
//   userName,
//   match: rowName === userName
// });


//                 return rowDesignation === userDesignation &&
//                     rowDepartment === userDepartment &&
//                     rowName === userName
//             });
            

//             console.log(`✅ Found ${filteredData.length} matching records`);

//             // Team communication data
//             const teamCommData = filteredData
//                 .map(row => ({
//                     actualRole: row.col10 || "", // Column K (index 10)
//                     communicationTeam: row.col11 || "", // Column L (index 11)
//                     keyPerson: row.col12 || "", // Column M (index 12)
//                     howToCommunicate: row.col13 || "", // Column N (index 13)
//                 }))
//                 .filter(item => item.actualRole || item.communicationTeam || item.keyPerson || item.howToCommunicate);

//             setTeamCommunicationData(teamCommData);

//             // Systems data
//             const systemsFilteredData = filteredData
//                 .map(row => ({
//                     systemName: row.col3 || "", // Column C (index 2) - System Name
//                     taskName: row.col4 || "", // Column D (index 3) - Task Name
//                     description: row.col5 || "", // Column E (index 4) - Description
//                     systemLink: row.col6 || "", // Column F (index 5) - Link Of System
//                     dbLink: row.col7 || "", // Column G (index 6) - DB Link
//                     trainingLink: row.col8 || "", // Column H (index 7) - Training Video Link 1
//                 }))
//                 .filter(item => item.systemName || item.taskName || item.description);

      
//                 console.log(`📊 Found ${systemsFilteredData.length} systems records`);
//             setSystemsData(systemsFilteredData);

//         } catch (error) {
//             console.error('❌ Error fetching data:', error);
//             setTeamCommunicationData([]);
//             setSystemsData([]);
//         } finally {
//             setIsTeamDataLoading(false);
//             setIsSystemsDataLoading(false); // ये भी set करें
//         }
//     }, [user, SPREADSHEET_ID]);



const fetchTeamCommunicationData = useCallback(async () => {
    if (!user || !user.designation || !user.department || !user.username) {
        console.log("❌ User data incomplete for fetching data");
        return;
    }

    try {
        setIsTeamDataLoading(true);
        console.log(`🔍 Fetching all data for: ${user.designation}, ${user.department}`);

        // Fetch from Master sheet
        const MASTER_SHEET_NAME = "Master";
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(MASTER_SHEET_NAME)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, */*',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;

        if (jsonStart === -1 || jsonEnd === 0) {
            throw new Error('Invalid response format from Google Sheets');
        }

        const jsonData = JSON.parse(text.substring(jsonStart, jsonEnd));

        if (!jsonData.table || !jsonData.table.rows) {
            console.log('⚠️ No data found in Master sheet');
            setTeamCommunicationData([]);
            setSystemsData([]);
            setPerformanceScoringData({ howScoringWorks: "", howToScoreBetter: "" }); // Reset performance data
            return;
        }

        // Process all rows
        const allData = jsonData.table.rows.map((row, rowIndex) => {
            const item = { _id: `${rowIndex}-${Date.now()}` };
            if (row.c) {
                row.c.forEach((cell, colIndex) => {
                    item[`col${colIndex}`] = cell?.v ?? cell?.f ?? "";
                });
            }
            return item;
        });

        // Filter by designation, department and username
        const filteredData = allData.filter(row => {
            const rowDesignation = String(row.col0 || "").trim();
            const rowDepartment = String(row.col1 || "").trim();
            const rowName = String(row.col2 || "").trim();
            const userDesignation = String(user.designation || "").trim();
            const userDepartment = String(user.department || "").trim();
            const userName = String(user.username || "").trim();

            return rowDesignation === userDesignation &&
                rowDepartment === userDepartment &&
                rowName === userName;
        });

        console.log(`✅ Found ${filteredData.length} matching records`);

        // Team communication data
        const teamCommData = filteredData
            .map(row => ({
                actualRole: row.col10 || "", // Column K (index 10)
                communicationTeam: row.col11 || "", // Column L (index 11)
                keyPerson: row.col12 || "", // Column M (index 12)
                howToCommunicate: row.col13 || "", // Column N (index 13)
            }))
            .filter(item => item.actualRole || item.communicationTeam || item.keyPerson || item.howToCommunicate);

        setTeamCommunicationData(teamCommData);

        // Systems data
        const systemsFilteredData = filteredData
            .map(row => ({
                systemName: row.col3 || "", // Column C (index 2) - System Name
                taskName: row.col4 || "", // Column D (index 3) - Task Name
                description: row.col5 || "", // Column E (index 4) - Description
                systemLink: row.col6 || "", // Column F (index 5) - Link Of System
                dbLink: row.col7 || "", // Column G (index 6) - DB Link
                trainingLink: row.col8 || "", // Column H (index 7) - Training Video Link 1
            }))
            .filter(item => item.systemName || item.taskName || item.description);

        setSystemsData(systemsFilteredData);

        // Performance Scoring Data - Column O and P (index 14, 15)
        const performanceData = filteredData
            .map(row => ({
                howScoringWorks: row.col14 || "", // Column O (index 14) - How Scoring Work
                howToScoreBetter: row.col15 || "", // Column P (index 15) - How to score better
            }))
            .find(item => item.howScoringWorks || item.howToScoreBetter) || { 
                howScoringWorks: "", 
                howToScoreBetter: "" 
            };

        setPerformanceScoringData(performanceData);
        console.log(`📊 Performance scoring data:`, performanceData);

    } catch (error) {
        console.error('❌ Error fetching data:', error);
        setTeamCommunicationData([]);
        setSystemsData([]);
        setPerformanceScoringData({ howScoringWorks: "", howToScoreBetter: "" });
    } finally {
        setIsTeamDataLoading(false);
        setIsSystemsDataLoading(false);
    }
}, [user, SPREADSHEET_ID]);



    
    useEffect(() => {
        if (user && user.designation && user.department) {
            fetchTeamCommunicationData();
        }
    }, [user, fetchTeamCommunicationData]);

    // Add this to your existing fetchPendingData or create a separate refresh function
    const refreshTeamData = () => {
        fetchTeamCommunicationData();
    };

    // Manual refresh function
    const handleManualRefresh = () => {
        if (!selectedDesignation) return;

        console.log('🔄 Manual refresh triggered for:', selectedDesignation);
        hasFetched.current = false;
        localStorage.removeItem(`kpi_dashboard_data_${selectedDesignation}`);
        setPendingTasks([]);
        persistentData.current = null;
        setIsEmpty(false);
        setError(null);

        fetchPendingData(selectedDesignation);
    };

    // Open modal function
    const openDesignationBriefModal = () => {
        console.log("📝 Opening Designation Brief Modal");
        setIsModalOpen(true);

        // Reset form with current user data
        if (user) {
            setDesignationBriefData({
                designation: user.designation || "",
                department: user.department || "",
                actualRole: "",
                communicationTeam: "",
                keyPerson: "",
                howToCommunicate: ""
            });
        }
    };

    // Close modal function
    const closeDesignationBriefModal = () => {
        setIsModalOpen(false);
        setBriefSubmitMessage("");
    };

    // Handle input change for designation brief form
    const handleBriefInputChange = (e) => {
        const { name, value } = e.target;
        setDesignationBriefData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const submitDesignationBrief = async () => {
        if (!user || !user.username) {
            setBriefSubmitMessage("❌ User not authenticated");
            return;
        }

        // Validate required fields
        if (!designationBriefData.designation || !designationBriefData.department) {
            setBriefSubmitMessage("❌ Designation and Department are required");
            return;
        }

        if (!designationBriefData.actualRole.trim()) {
            setBriefSubmitMessage("❌ Actual Role is required");
            return;
        }

        setIsSubmittingBrief(true);
        setBriefSubmitMessage("");

        try {
            console.log("📤 Submitting designation brief to Google Sheets...");

            // Prepare data for submission
            const submissionData = {
                timestamp: new Date().toISOString(),
                username: user.username,
                name: user.name,
                designation: designationBriefData.designation,
                department: designationBriefData.department,
                actualRole: designationBriefData.actualRole,
                communicationTeam: designationBriefData.communicationTeam,
                keyPerson: designationBriefData.keyPerson,
                howToCommunicate: designationBriefData.howToCommunicate
            };

            console.log("📋 Submission Data:", submissionData);

            // Create the payload for Google Apps Script
            const payload = {
                spreadsheetId: "1sMwYAo58dN1icoR0db91wTbMD2CA7tEbl61jV6AKy6I",
                sheetName: "Designation Brief",
                action: "insertDesignationBrief",
                data: JSON.stringify(submissionData) // ✅ IMPORTANT
            };

            // Google Apps Script Web App URL
            const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzI2RV-bO1v1xhzhOCkWKhvFvNw0GOdpZr1YI7s_ODpZNYD3S2gyS03fr8ASwIAOYA2/exec";

            console.log("📤 Submitting to:", APPS_SCRIPT_URL);
            console.log("📦 Payload:", payload);

            // Make the POST request to Google Apps Script
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Important for Google Apps Script
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(payload).toString()
            });

            // Since we're using no-cors mode, we can't read the response directly
            // But we know if there's no error, it worked
            console.log("✅ Submission request sent");

            setBriefSubmitMessage("✅ Designation brief submitted successfully!");

            // Clear form after successful submission
            setTimeout(() => {
                closeDesignationBriefModal();

                // Reset form
                setDesignationBriefData({
                    name:user.username || "",
                    designation: user.designation || "",
                    department: user.department || "",
                    actualRole: "",
                    communicationTeam: "",
                    keyPerson: "",
                    howToCommunicate: ""
                });
            }, 1500);

        } catch (error) {
            console.error("❌ Error submitting designation brief:", error);
            setBriefSubmitMessage(`❌ Failed to submit: ${error.message}`);
        } finally {
            setIsSubmittingBrief(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);


    useEffect(() => {
        if (user && user.designation && user.department) {
            fetchTeamCommunicationData(); // ये अब सभी data fetch करेगा
        }
    }, [user, fetchTeamCommunicationData]);

    // Get current data (same structure as KpikraTable)
    const currentData = pendingTasks || persistentData.current || [];

    // Process data for UI components (same as KpikraTable structure)
    const { firstRowData, row6Data, tableData } = useMemo(() => ({
        firstRowData: currentData[0] || {},
        row6Data: currentData[5] || {},
        tableData: currentData.slice(3) || []
    }), [currentData]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium text-red-800">Error Loading Data</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                        <button
                            onClick={handleManualRefresh}
                            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                            disabled={isDataLoading || isSubmitting}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium text-yellow-800">No Data Available</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                            No data found for {selectedDesignation} in the Dashboard sheet.
                        </p>
                        <button
                            onClick={handleManualRefresh}
                            className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline"
                            disabled={isDataLoading || isSubmitting}
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header with Designation Brief Button */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    {submitMessage && (
                        <div className={`text-sm ${submitMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                            {submitMessage}
                        </div>
                    )}
                </div>

                <button
                    onClick={openDesignationBriefModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Designation Brief
                </button>
            </div>

            {/* Designation Brief Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Settings className="w-6 h-6 text-blue-600" />
                                    <h2 className="text-xl font-bold text-gray-800">Designation Brief</h2>
                                </div>
                                <button
                                    onClick={closeDesignationBriefModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                Please fill in your designation details. Designation and Department are auto-filled from your profile.
                            </p>
                        </div>

                        {/* Modal Body - Form */}
                        <div className="p-6 space-y-6">
                            {/* Success/Error Message */}
                            {briefSubmitMessage && (
                                <div className={`p-4 rounded-lg ${briefSubmitMessage.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {briefSubmitMessage}
                                </div>
                            )}

                            {/* Form Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Designation - Auto-filled */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Designation <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="designation"
                                        value={designationBriefData.designation}
                                        readOnly
                                        className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500">Auto-filled from your profile</p>
                                </div>

                                {/* Department - Auto-filled */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={designationBriefData.department}
                                        readOnly
                                        className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500">Auto-filled from your profile</p>
                                </div>

                                {/* Actual Role - Manual input */}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Actual Role <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="actualRole"
                                        value={designationBriefData.actualRole}
                                        onChange={handleBriefInputChange}
                                        rows={3}
                                        placeholder="Describe your actual role and responsibilities..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                {/* Communication Team */}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Communication Team
                                    </label>
                                    <textarea
                                        name="communicationTeam"
                                        value={designationBriefData.communicationTeam}
                                        onChange={handleBriefInputChange}
                                        rows={2}
                                        placeholder="Enter communication team members (comma separated)..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Key Person */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Key Person
                                    </label>
                                    <input
                                        type="text"
                                        name="keyPerson"
                                        value={designationBriefData.keyPerson}
                                        onChange={handleBriefInputChange}
                                        placeholder="Enter key person name..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* How To Communicate */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        How To Communicate
                                    </label>
                                    <input
                                        type="text"
                                        name="howToCommunicate"
                                        value={designationBriefData.howToCommunicate}
                                        onChange={handleBriefInputChange}
                                        placeholder="Enter communication method..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={closeDesignationBriefModal}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                    disabled={isSubmittingBrief}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitDesignationBrief}
                                    disabled={isSubmittingBrief}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmittingBrief ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckSquare className="w-4 h-4" />
                                            Submit to Designation Brief Sheet
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Data State */}
            {(isDataLoading || isSubmitting) && (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-gray-600">
                            {isSubmitting ? 'Submitting designation to Dashboard sheet...' : 'Loading data...'}
                        </p>
                    </div>
                </div>
            )}

            {/* Main Content - Same structure as KpikraTable */}
            {!isDataLoading && !isSubmitting && selectedDesignation && currentData && currentData.length > 0 && (
                <div className="space-y-6">
                    {/* ... Rest of your existing dashboard content ... */}
                    {/* (Keep all the existing dashboard UI code exactly as it was) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Role Information Card */}
                        {/* Role Information Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6 transform transition-all hover:scale-[1.02]">
                            <div className="flex items-center gap-3 mb-4">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                                <h2 className="text-lg font-semibold text-gray-800">Role Details</h2>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                                <h3 className="text-sm font-medium text-blue-600 mb-2">Actual Role</h3>
                                <p className="text-gray-800">
                                    {teamCommunicationData.length > 0
                                        ? teamCommunicationData[0].actualRole || "No data available"
                                        : "Loading role data..."}
                                </p>
                            </div>
                        </div>

                        {/* Tasks Card */}
                        {/* Tasks Card */}
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-sm border border-emerald-100 p-6 transform transition-all hover:scale-[1.02]">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckSquare className="w-6 h-6 text-emerald-600" />
                                <h2 className="text-lg font-semibold text-gray-800">Task Overview</h2>
                            </div>
                            <div className="bg-white rounded-lg p-6 border border-emerald-100 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-emerald-600">{systemsData.length}</p>
                                    <p className="text-sm text-gray-600 mt-1">Total Systems/Tasks</p>
                                </div>
                            </div>
                        </div>

                        {/* Performance Scoring Card */}
                        {/* <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-100 p-6 transform transition-all hover:scale-[1.02]">
                            <div className="flex items-center gap-3 mb-4">
                                <Target className="w-6 h-6 text-purple-600" />
                                <h2 className="text-lg font-semibold text-gray-800">Performance Scoring</h2>
                            </div>
                            <div className="space-y-4">
                                {firstRowData.col4 && (
                                    <a
                                        href={firstRowData.col4}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block bg-white rounded-lg p-4 border border-purple-100 hover:bg-purple-50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <PlayCircle className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm font-medium text-purple-600">How Scoring Works</span>
                                        </div>
                                    </a>
                                )}
                                {firstRowData.col5 && (
                                    <a
                                        href={firstRowData.col5}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block bg-white rounded-lg p-4 border border-purple-100 hover:bg-purple-50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <PlayCircle className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm font-medium text-purple-600">How To Score Better</span>
                                        </div>
                                    </a>
                                )}
                            </div>
                        </div> */}


                        {/* Performance Scoring Card */}
<div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-100 p-6 transform transition-all hover:scale-[1.02]">
    <div className="flex items-center gap-3 mb-4">
        <Target className="w-6 h-6 text-purple-600" />
        <h2 className="text-lg font-semibold text-gray-800">Performance Scoring</h2>
    </div>
    <div className="space-y-4">
        {performanceScoringData.howScoringWorks && (
            <a
                href={performanceScoringData.howScoringWorks}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-lg p-4 border border-purple-100 hover:bg-purple-50 transition-colors group"
            >
                <div className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-purple-600">How Scoring Works</span>
                </div>
            </a>
        )}
        {performanceScoringData.howToScoreBetter && (
            <a
                href={performanceScoringData.howToScoreBetter}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-lg p-4 border border-purple-100 hover:bg-purple-50 transition-colors group"
            >
                <div className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-purple-600">How To Score Better</span>
                </div>
            </a>
        )}
        {!performanceScoringData.howScoringWorks && !performanceScoringData.howToScoreBetter && !isTeamDataLoading && (
            <div className="text-center py-4 text-gray-500 text-sm">
                No performance scoring links available
            </div>
        )}
    </div>
</div>

                        {/* Team Communication Card */}
                        <div className="lg:col-span-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-100 p-6">

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Users className="w-6 h-6 text-amber-600" />
                                    <h2 className="text-lg font-semibold text-gray-800">Team Communication & Communication Process</h2>
                                </div>
                                <button
                                    onClick={refreshTeamData}
                                    disabled={isTeamDataLoading}
                                    className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800 transition-colors"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isTeamDataLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>

                            {isTeamDataLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                                </div>
                            ) : teamCommunicationData.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr className="bg-amber-50">
                                                <th className="px-4 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                                                    Actual Role
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                                                    Communication Team
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                                                    Key Person
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-amber-600 uppercase tracking-wider">
                                                    How To Communicate
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {teamCommunicationData.map((item, index) => (
                                                <tr key={index} className="hover:bg-amber-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-normal">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {item.actualRole || "Not specified"}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-normal">
                                                        <div className="text-sm text-gray-700">
                                                            {item.communicationTeam ?
                                                                item.communicationTeam.split(",").map((team, i) => (
                                                                    <span key={i} className="inline-block bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs mr-1 mb-1">
                                                                        {team.trim()}
                                                                    </span>
                                                                ))
                                                                : "Not specified"}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-normal">
                                                        <div className="text-sm text-gray-700">
                                                            {item.keyPerson || "Not specified"}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-normal">
                                                        <div className="text-sm text-gray-700">
                                                            {item.howToCommunicate || "Not specified"}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">
                                        No team communication data found for <span className="font-semibold">{user?.designation}</span> in <span className="font-semibold">{user?.department}</span>
                                    </p>
                                    <button
                                        onClick={refreshTeamData}
                                        className="mt-3 text-sm text-amber-600 hover:text-amber-800 underline"
                                    >
                                        Try again
                                    </button>
                                </div>
                            )}
                        </div>


                     
                        {/* Systems Table */}
                        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <Database className="w-6 h-6 text-gray-600" />
                                    <h2 className="text-lg font-semibold text-gray-800">Systems and Resources</h2>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">Personal systems for {selectedDesignation} in {user?.department}</p>
                            </div>

                            {isTeamDataLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            ) : systemsData.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    System Name
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Task Name
                                                </th>
                                               
                                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Links
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {systemsData.map((row, index) => (
                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="text-sm font-medium text-gray-900">{row.systemName || "N/A"}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="text-sm text-gray-700">{row.taskName || "N/A"}</div>
                                                    </td>
                                            
                                                    <td className="px-6 py-4 text-center">
                                                       <div className="flex items-center justify-center gap-4 flex-wrap text-center">
                                                            {row.systemLink && (
                                                                <a
                                                                    href={row.systemLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                                                                >
                                                                    <Link className="w-4 h-4" />
                                                                    <span className="text-sm font-medium">System</span>
                                                                </a>
                                                            )}
                                                            {row.dbLink && (
                                                                <a
                                                                    href={row.dbLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 transition-colors"
                                                                >
                                                                    <Database className="w-4 h-4" />
                                                                    <span className="text-sm font-medium">Dashboard</span>
                                                                </a>
                                                            )}
                                                            {row.trainingLink && (
                                                                <a
                                                                    href={row.trainingLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors"
                                                                >
                                                                    <PlayCircle className="w-4 h-4" />
                                                                    <span className="text-sm font-medium">Training</span>
                                                                </a>
                                                            )}
                                                            {!row.systemLink && !row.dbLink && !row.trainingLink && (
                                                                <span className="text-sm text-gray-400">No links available</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">
                                        No systems data found for <span className="font-semibold">{user?.designation}</span> in <span className="font-semibold">{user?.department}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(CompleteKpiDashboard);