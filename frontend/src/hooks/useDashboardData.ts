import { useState, useEffect, useRef } from 'react';
import type { Scorecards, TableRow, FilterOptions } from '../types';
import { fetchScorecards, fetchTable, fetchFilters } from '../services/api';

// Global counter to force re-fetch
let triggerCount = 0;

export function forceRefresh() {
  triggerCount++;
}

export function useDashboardData(filtersObj: Record<string, any>) {
  const [scorecards, setScorecards] = useState<Scorecards | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);

  // Build params from filter object
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filtersObj)) {
    if (v) params.set(k, String(v));
  }
  const queryString = params.toString();

  // Monitor for changes
  const prevQuery = useRef<string>('');

  useEffect(() => {
    fetchFilters().then(setFilterOptions).catch(console.error);
  }, []);

  useEffect(() => {
    if (prevQuery.current === queryString) return; // skip if same
    prevQuery.current = queryString;

    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch('api/dashboard/scorecards?' + queryString).then(r => r.json()),
      fetch('api/dashboard/table?' + queryString).then(r => r.json()),
    ]).then(([sc, tbl]) => {
      if (!cancelled) {
        setScorecards(sc);
        setTableData(tbl);
        setLoading(false);
      }
    }).catch(err => {
      console.error(err);
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [queryString]);

  return { scorecards, tableData, filterOptions, loading };
}
