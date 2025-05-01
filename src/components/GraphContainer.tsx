import React, { useEffect, useRef } from 'react';
import { FilterState } from '../types/FilterState';

// Reset 3D error state and force remount when filters change
useEffect(() => {
  setHas3DError(false);
  
  // Increment the filter change counter - this will be used for remounting
  filterChangeCountRef.current += 1;
  
  // Only show loading state for significant filter changes, not for time slider adjustments
  // Check if the change is just a time range adjustment
  const isOnlyTimeRangeChange = (prevFilters: FilterState) => {
    if (!prevFilters) return false;
    
    // Return true if only timeRange changed, false if any other filter changed
    return (
      JSON.stringify(prevFilters.entityTypes) === JSON.stringify(filters.entityTypes) &&
      JSON.stringify(prevFilters.relationshipTypes) === JSON.stringify(filters.relationshipTypes) &&
      prevFilters.layout === filters.layout &&
      prevFilters.nodeSizeAttribute === filters.nodeSizeAttribute &&
      prevFilters.showCommunities === filters.showCommunities
    );
  };
  
  // Store the previous filters for comparison
  const prevFiltersRef = useRef(filters);
  
  // If it's only a time range change, don't show loading
  if (isOnlyTimeRangeChange(prevFiltersRef.current)) {
    console.log("GraphContainer: Time range change detected, updating without loading state");
  } else {
    // For other filter changes, briefly show loading state
    console.log("GraphContainer: Non-time filter change detected, forcing re-render");
    setIsLoading(true);
    
    // Use a very short timeout to trigger a complete re-render cycle
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      console.log("GraphContainer: Re-render complete");
    }, 50); // Very short timeout to minimize visible loading state
    
    return () => clearTimeout(loadingTimeout);
  }
  
  // Update the previous filters reference
  prevFiltersRef.current = {...filters};
}, [filters]); 