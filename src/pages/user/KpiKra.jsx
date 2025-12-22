import React, { useEffect, useState } from 'react';
import UserKpiKraTable from './UserKpiTable';
import { useAuth, SafeImage } from "../../contexts/AuthContext";

function UserKpiKra() {
  const { user, submitDesignationToDashboard } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [availableDesignations, setAvailableDesignations] = useState([]);
  const [isSubmittingAndLoading, setIsSubmittingAndLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    console.log("👤 UserKpiKra: User effect triggered:", user);
    
    if (user) {
      if (user.designations?.length > 0) {
        setAvailableDesignations(user.designations);
        
        // Get stored designation from localStorage
        const userKey = user.id || user.username || 'default';
        const storageKey = `kpi_selected_designation_${userKey}`;
        const storedDesignation = localStorage.getItem(storageKey);
        
        const designationToUse = storedDesignation || user.designations[0];
        setSelectedDesignation(designationToUse);
        
        // Since AuthContext already auto-submitted designation on login,
        // we just need to trigger table refresh without duplicate submission
        handleInitialLoad(designationToUse);
      } else {
        setIsLoading(false);
        setError("No designations found for user");
      }
    }
  }, [user]);

  const handleInitialLoad = async (designation) => {
    console.log("🔄 UserKpiKra: Initial load for designation:", designation);
    setIsSubmittingAndLoading(true);
    setError(null);
    
    try {
      // Save to localStorage (in case it's not already saved)
      const userKey = user?.id || user?.username || 'default';
      const storageKey = `kpi_selected_designation_${userKey}`;
      localStorage.setItem(storageKey, designation);
      
      // Trigger table refresh (designation already submitted by AuthContext)
      setRefreshTrigger(prev => prev + 1);
      
      // Show loading for minimum 1 second for smooth UX
      setTimeout(() => {
        setIsSubmittingAndLoading(false);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("❌ UserKpiKra: Error in initial load:", error);
      setError("Failed to initialize designation");
      setIsSubmittingAndLoading(false);
      setIsLoading(false);
    }
  };

  const handleDropdownChange = async (newDesignation) => {
    if (newDesignation === selectedDesignation) return;

    console.log("🔄 UserKpiKra: Designation change from", selectedDesignation, "to", newDesignation);

    setSelectedDesignation(newDesignation);
    setIsSubmittingAndLoading(true);
    setSubmitMessage("");
    setError(null);

    try {
      // Submit new designation to Dashboard sheet using AuthContext method
      await submitDesignationToDashboard(newDesignation, user);
      
      // Save to localStorage
      const userKey = user?.id || user?.username || 'default';
      const storageKey = `kpi_selected_designation_${userKey}`;
      localStorage.setItem(storageKey, newDesignation);
      
      // Trigger table refresh with new designation
      setRefreshTrigger(prev => prev + 1);
      setSubmitMessage("✅ Designation updated successfully!");
      
    } catch (error) {
      console.error("❌ UserKpiKra: Error changing designation:", error);
      setSubmitMessage("❌ Failed to update designation");
      // Revert to previous designation
      setSelectedDesignation(availableDesignations[0] || '');
      setError("Failed to update designation");
    } finally {
      // Show loading for minimum time then hide
      setTimeout(() => {
        setIsSubmittingAndLoading(false);
        setSubmitMessage("");
      }, 1500);
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    if (!selectedDesignation) return;
    
    console.log("🔄 UserKpiKra: Manual refresh triggered for:", selectedDesignation);
    setIsSubmittingAndLoading(true);
    setError(null);
    
    // Clear any cached data
    const cachedKeys = Object.keys(localStorage).filter(key => 
      key.includes('kpi_dashboard_data') || key.includes('userKpiKra')
    );
    cachedKeys.forEach(key => localStorage.removeItem(key));
    
    // Re-submit and refresh
    handleDropdownChange(selectedDesignation);
  };

  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-sm">
        <div className="flex items-center space-x-4">
          {user?.image ? (
            <SafeImage 
              src={user.image} 
              alt="Profile" 
              name={user.name}
              className="w-12 h-12 rounded-full border-2 border-white object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full border-2 border-white bg-white/20 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome, {user?.name}</h1>
            
          </div>
        </div>
        
        {availableDesignations.length > 0 && (
          <div className="relative">
            <select
              value={selectedDesignation}
              onChange={(e) => handleDropdownChange(e.target.value)}
              disabled={isLoading || isSubmittingAndLoading}
              className="appearance-none px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/50 focus:border-transparent disabled:opacity-50 pr-12 text-lg font-semibold min-w-[150px] cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              {availableDesignations.map((designation) => (
                <option key={designation} value={designation} className="text-gray-900 bg-white">
                  {designation}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isSubmittingAndLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
           
            </div>
            <p className="mt-3 text-gray-700 font-medium">
              Submitting to Dashboard & loading KPI data...
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Processing {selectedDesignation} designation
            </p>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {submitMessage && !isSubmittingAndLoading && (
        <div className={`p-4 rounded-lg ${submitMessage.includes("✅") ? 'bg-green-100 border border-green-200 text-green-700' : 'bg-red-100 border border-red-200 text-red-700'}`}>
          <div className="flex items-center gap-2">
            {submitMessage.includes("✅") ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{submitMessage}</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isSubmittingAndLoading && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button 
                onClick={handleManualRefresh}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                disabled={isSubmittingAndLoading}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - UserKpiKraTable */}
      {!isLoading && !error && selectedDesignation && !isSubmittingAndLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          
          <UserKpiKraTable 
            designation={selectedDesignation}
            key={`${selectedDesignation}-${refreshTrigger}`}
            isAdmin={false}
            userDepartment={user?.department}
            user={user}
          />
        </div>
      )}

    </div>
  );
}

export default UserKpiKra;