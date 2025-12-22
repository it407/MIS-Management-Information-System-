



import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Briefcase, CheckSquare, Target, Users, MessageSquare, Database, Link, AlertCircle, PlayCircle } from "lucide-react";

const KpikraTable = ({ designation, department, name, isAdmin = false, isEmpty = false }) => {
    const [pendingTasks, setPendingTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    const SPREADSHEET_ID = "1sMwYAo58dN1icoR0db91wTbMD2CA7tEbl61jV6AKy6I";
    const SHEET_NAME = "Master"; // Master sheet से डेटा fetch करेंगे

    const fetchPendingData = useCallback(async (designationToFetch, dept, userName) => {
        if (!designationToFetch) {
            setPendingTasks([]);
            return;
        }

        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();
            setIsLoading(true);
            setError(null);

            // Fetch from Master sheet
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

            const response = await fetch(url, {
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            const json = JSON.parse(text.substring(jsonStart, jsonEnd));

            const allItems = json.table.rows.map((row, rowIndex) => {
                const itemObj = {
                    _id: `${rowIndex}-${Math.random().toString(36).substr(2, 9)}`,
                    _rowIndex: rowIndex + 1
                };
                if (row.c) {
                    row.c.forEach((cell, i) => {
                        itemObj[`col${i}`] = cell?.v ?? cell?.f ?? "";
                    });
                }
                return itemObj;
            });

            // Filter data based on designation, department, and name
            let filteredItems = allItems;

            if (isAdmin) {
                // Admin के लिए: designation, department, और name से फिल्टर करें
                filteredItems = allItems.filter(item => {
                    const itemDesignation = String(item.col0 || "").toLowerCase().trim();
                    const itemDepartment = String(item.col1 || "").toLowerCase().trim();
                    const itemName = String(item.col2 || "").toLowerCase().trim();

                    const searchDesignation = designation.toLowerCase().trim();
                    const searchDepartment = department.toLowerCase().trim();
                    const searchName = name.toLowerCase().trim();

                    return itemDesignation === searchDesignation &&
                        itemDepartment === searchDepartment &&
                        itemName === searchName;
                });
            } else {
                // Regular user के लिए: केवल designation से फिल्टर करें
                filteredItems = allItems.filter(item =>
                    String(item.col0 || "").toLowerCase().trim() === designation.toLowerCase().trim()
                );
            }

            console.log(`Found ${filteredItems.length} records for:`, {
                designation,
                department,
                name,
                isAdmin
            });

            setPendingTasks(filteredItems);
        } catch (err) {
            if (err.name !== 'AbortError') {
                let errorMessage = err.message;

                if (err.message.includes('Failed to fetch')) {
                    errorMessage = 'Network error - please check your internet connection';
                } else if (err.message.includes('404')) {
                    errorMessage = 'Data not found for your designation';
                } else if (err.message.includes('403')) {
                    errorMessage = 'You do not have permission to view this data';
                }

                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [isAdmin]);

    useEffect(() => {
        if (isEmpty || !designation) {
            setPendingTasks([]);
            setError(null);
            setIsLoading(false);
            return;
        }

        fetchPendingData(designation, department, name);

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [designation, department, name, fetchPendingData, isEmpty]);

    const { firstRowData, row6Data, tableData } = useMemo(() => ({
        firstRowData: pendingTasks[0] || {},
        row6Data: pendingTasks[5] || {},
        tableData: pendingTasks.slice(3) || []
    }), [pendingTasks]);

    // Get team communication data from columns (adjust indices based on your sheet)
    const communicationTeam = useMemo(() => {
        const col11Value = firstRowData.col11; // Column L - Communication Team
        if (!col11Value) return [];

        return String(col11Value).split(",").map(item => item.trim()).filter(item => item.length > 0);
    }, [firstRowData]);

    const howToCommunicate = firstRowData.col13 || "No data available"; // Column N
    const keyPerson = firstRowData.col12 || "No data available"; // Column M
    const actualRole = firstRowData.col10 || "No data available"; // Column K

    // Get systems data from columns
    const systemsData = useMemo(() => {
        return pendingTasks.map(row => ({
            systemName: row.col3 || "", // Column D
            taskName: row.col4 || "", // Column E
            description: row.col5 || "", // Column F
            systemLink: row.col5 || "", // Column G
            dbLink: row.col6 || "", // Column H
            trainingLink: row.col7 || "", // Column I
        })).filter(item => item.systemName || item.taskName);
    }, [pendingTasks]);

    console.log("systemsData",systemsData)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading data...</p>
                </div>
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
                            onClick={() => fetchPendingData(designation, department, name)}
                            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Role Information Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6 transform transition-all hover:scale-[1.02]">
                    <div className="flex items-center gap-3 mb-4">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-800">Role Details</h2>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <h3 className="text-sm font-medium text-blue-600 mb-2">Actual Role</h3>
                        <p className="text-gray-800">{actualRole}</p>
                    </div>
                </div>

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
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-100 p-6 transform transition-all hover:scale-[1.02]">
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
                </div>

                {/* Team Communication Card */}
                <div className="lg:col-span-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6 text-amber-600" />
                            <h2 className="text-lg font-semibold text-gray-800">Team Communication & Communication Process</h2>
                        </div>
                    </div>

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
                                {pendingTasks.length > 0 ? (
                                    pendingTasks.map((item, index) => (
                                        <tr key={index} className="hover:bg-amber-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-normal">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.col10 || "Not specified"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-normal">
                                                <div className="text-sm text-gray-700">
                                                    {item.col11 ?
                                                        item.col11.split(",").map((team, i) => (
                                                            <span key={i} className="inline-block bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs mr-1 mb-1">
                                                                {team.trim()}
                                                            </span>
                                                        ))
                                                        : "Not specified"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-normal">
                                                <div className="text-sm text-gray-700">
                                                    {item.col12 || "Not specified"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-normal">
                                                <div className="text-sm text-gray-700">
                                                    {item.col13 || "Not specified"}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-3 text-center text-sm text-gray-500">
                                            No team communication data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Systems Table */}
                <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <Database className="w-6 h-6 text-gray-600" />
                            <h2 className="text-lg font-semibold text-gray-800">Systems and Resources</h2>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Personal systems for {designation} in {department}</p>
                    </div>

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
                                {systemsData.length > 0 ? (
                                    systemsData.map((row, index) => (
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
                                                            <span className="text-sm font-medium">Link of System</span>
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
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No systems data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(KpikraTable);