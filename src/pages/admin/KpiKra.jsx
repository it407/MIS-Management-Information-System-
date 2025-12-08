import React, { useEffect, useState, useRef } from "react";
import KpikraTable from "../../components/tables/KpikraTable";
import { useAuth } from "../../contexts/AuthContext";

const KpiKra = () => {
  const { user } = useAuth();
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [initialLoadError, setInitialLoadError] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [availableDesignations, setAvailableDesignations] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);


  const filteredDesignations = availableDesignations.filter((d) =>
    d.toLowerCase().includes(searchText.toLowerCase())
  );

  // Initialize available designations based on user role
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        // Admin can see all designations
        setAvailableDesignations([
          "Manager",
          "Office Boy",
          "EA to Director",
          "Gardner",
          "Executive",
          "Assistant Manager",
          "Sr. Executive",
          "Sr. Manager",
          "Deputy Manager",
          "General Manager",
          "CRE & Reception",
          "AGM",
          "Purchase Executive",
          "Key Account Manager",
          "Driver",
          "Loader",
          "Supervisor",
          "Fitter",
          "Electrician",
          "Assistant Fitter",
          "Machine Operator",
          "Plant Head",
          "Data Entry Operator",
          "Floor Supervisor",
          "Distributor Relationship Manager",
          "Retailer Relationship Executive",
          "Customer Care Executive",
          "Marketing Lead",
          "ASM",
          "BDM",
          "AGM - International Business",
          "ASE",
          "BDO",
          "Sales Representative",
          "Sales Coordinator",
          "Business Development Executive",
          "Sales Officer",
          "Sr. Area Sales Executive",
          "Area Sales Manager",
          "Area Sales Executive",
          "SO",
          "Vice President",
          "Chief of Staff",
          "Team Lead - Customer Success",
          "Management",

          // Add your existing options also:
          "CRM",
          "Purchase",
          "HR",
          "EA",
          "Sales Executive",
          "Marketing",
          "Developer",
          "Designer",
        ]);

        // Don't auto-select anything for admin - let them choose
      } else if (user.designations && user.designations.length > 0) {
        // Regular users can only see their assigned designations
        setAvailableDesignations(user.designations);
        // Don't auto-select for users - show placeholder first
      } else {
        setAvailableDesignations([]);
      }
    }
  }, [user]);

  // CORS-free method to update Google Sheets using Apps Script proxy
  const updateGoogleSheet = async (designation) => {
    try {
      // Method 1: Try with JSONP callback (works better with Google Apps Script)
      const scriptUrl = "https://script.google.com/macros/s/AKfycbzI2RV-bO1v1xhzhOCkWKhvFvNw0GOdpZr1YI7s_ODpZNYD3S2gyS03fr8ASwIAOYA2/exec";

      // Create form data for POST request
      const params = new URLSearchParams();
      params.append("action", "updateCell");
      params.append("sheetName", "Dashboard");
      params.append("row", "2");
      params.append("column", "1");
      params.append("value", designation);

      // Try using fetch with no-cors mode (limited response access but might work)
      const response = await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors", // This bypasses CORS but limits response access
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      // Since we're using no-cors, we can't check response status
      // We'll assume success and let the table refresh handle any issues
      return { success: true };

    } catch (error) {
      console.warn("Primary method failed, trying alternative:", error);

      // Method 2: Try with CORS proxy service
      try {
        const proxyUrl = "https://cors-anywhere.herokuapp.com/";
        const scriptUrl = "https://script.google.com/macros/s/AKfycbzI2RV-bO1v1xhzhOCkWKhvFvNw0GOdpZr1YI7s_ODpZNYD3S2gyS03fr8ASwIAOYA2/exec";

        const params = new URLSearchParams();
        params.append("action", "updateCell");
        params.append("sheetName", "Dashboard");
        params.append("row", "2");
        params.append("column", "1");
        params.append("value", designation);

        const response = await fetch(proxyUrl + scriptUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: params.toString(),
        });

        if (response.ok) {
          const result = await response.json();
          return result;
        }

        throw new Error("Proxy method failed");
      } catch (proxyError) {
        console.warn("Proxy method also failed:", proxyError);

        // Method 3: Use dynamic script tag (JSONP-style)
        return new Promise((resolve) => {
          const callbackName = `jsonp_callback_${Date.now()}`;
          const scriptUrl = `https://script.google.com/macros/s/AKfycbzI2RV-bO1v1xhzhOCkWKhvFvNw0GOdpZr1YI7s_ODpZNYD3S2gyS03fr8ASwIAOYA2/exec?action=updateCell&sheetName=Dashboard&row=2&column=1&value=${encodeURIComponent(designation)}&callback=${callbackName}`;

          // Create callback function
          window[callbackName] = function (data) {
            resolve(data);
            // Cleanup
            document.head.removeChild(script);
            delete window[callbackName];
          };

          // Create script tag
          const script = document.createElement('script');
          script.src = scriptUrl;
          script.onerror = () => {
            resolve({ success: false, error: "Script load failed" });
            document.head.removeChild(script);
            delete window[callbackName];
          };

          document.head.appendChild(script);

          // Timeout after 10 seconds
          setTimeout(() => {
            if (window[callbackName]) {
              resolve({ success: false, error: "Timeout" });
              document.head.removeChild(script);
              delete window[callbackName];
            }
          }, 10000);
        });
      }
    }
  };



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleDropdownChange = async (newDesignation) => {
    if (newDesignation === selectedDesignation) return;

    setSelectedDesignation(newDesignation);
    setIsSubmitting(true);
    setIsLoadingData(true);
    setSubmitMessage("");

    try {
      if (user.role === "admin") {
        // Only admins update the global designation
        const result = await updateGoogleSheet(newDesignation);

        if (result && result.success !== false) {
          {/* Message Display */ }
          {
            submitMessage && (
              <p
                className={`mt-2 text-sm ${submitMessage.includes("✅")
                  ? "text-black"       // success message black
                  : submitMessage.includes("⚠️")
                    ? "text-yellow-600"  // warning message
                    : "text-gray-600"    // loading or default
                  }`}
              >
                {submitMessage}
              </p>
            )
          }

        } else {
          // Even if update fails, continue with local state update
          setSubmitMessage("⚠️ Selection updated locally (server update may have failed)");
        }
      } else {
        // For non-admin users, just update local state
        setSubmitMessage("✅ Designation selected!");
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error:", error);
      setSubmitMessage("⚠️ Selection updated locally (connection issue)");
      setRefreshTrigger((prev) => prev + 1); // Still refresh the table
    } finally {
      setIsSubmitting(false);
      setIsLoadingData(false);
      setTimeout(() => setSubmitMessage(""), 5000);
    }
  };

  // Fixed: Get the correct designation based on user role
  const getEffectiveDesignation = () => {
    return selectedDesignation;
  };

  const effectiveDesignation = getEffectiveDesignation();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}

      {/* KPI & KRA Header & Dropdown */}
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white">KPI & KRA Dashboard</h1>
          <p className="text-blue-100 mt-1">
            {user?.role === "admin" ? "Admin View" : "Your Performance Metrics"}
          </p>
        </div>

        {availableDesignations.length > 0 && (
          <div className="relative">
            <div ref={dropdownRef} className="relative min-w-[200px]">
              {/* Search Box */}
              <input
                type="text"
                placeholder="Search Designation..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setOpen(true)}
                className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/50 pr-10 text-lg font-semibold w-full"
              />

              {/* Dropdown */}
              {open && (
                <div className="absolute mt-2 w-full bg-white rounded-xl shadow-lg max-h-60 overflow-y-auto z-30">
                  {filteredDesignations.length > 0 ? (
                    filteredDesignations.map((designation) => (
                      <div
                        key={designation}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-800"
                        onClick={() => {
                          setSearchText("");     // clear search
                          setOpen(false);        // close dropdown
                          handleDropdownChange(designation);
                        }}
                      >
                        {designation}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">No results found</div>
                  )}
                </div>
              )}

              {/* Arrow Icon */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>


            {availableDesignations.length > 1 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message / Status */}
      {(isSubmitting || submitMessage) && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          {isSubmitting ? (
            <span className="flex items-center gap-2 text-white">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Saving selection...
            </span>
          ) : (
            <span className="text-white">
              {submitMessage}
            </span>
          )}
        </div>
      )}

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
          designation={effectiveDesignation}
          key={`${effectiveDesignation}-${refreshTrigger}-${user?.role}`}
          isAdmin={user?.role === "admin"}
          isEmpty={!effectiveDesignation}
        />
      )}
    </div>
  );
};

export default KpiKra;