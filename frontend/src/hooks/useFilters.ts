import { useState, useCallback } from 'react';
import type { ScorecardKey } from '@/components/ScoreCardGrid';

export type FilterState = {
  tahun: string;
  opd_id?: string;
  pilar_id?: string;
  indikator_id?: string;
  status_tl?: string;
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>({ tahun: '2025' });
  const [scorecardKey, setScorecardKey] = useState<ScorecardKey | null>(null);

  const setFilter = useCallback((key: string, value: string) => {
    setScorecardKey(null);
    setFilters(prev => {
      const next = { ...prev };
      if (value === '' || value === undefined) {
        delete (next as any)[key];
      } else {
        (next as any)[key] = value;
      }
      return next;
    });
  }, []);

  const selectScorecard = useCallback((_key: ScorecardKey) => {
    setScorecardKey(prev => {
      const nextKey = prev === _key ? null : _key;

      // Apply filter based on the NEW key (not prev)
      if (nextKey === null) {
        setFilters({ tahun: '2025' });
      } else if (nextKey === 'on_track') {
        setFilters({ tahun: '2025', status_tl: 'On Track' });
      } else if (nextKey === 'warning') {
        setFilters({ tahun: '2025', status_tl: 'Warning' });
      } else if (nextKey === 'alert') {
        setFilters({ tahun: '2025', status_tl: 'Alert' });
      } else {
        setFilters({ tahun: '2025' });
      }

      return nextKey;
    });
  }, []);

  return { filters, setFilter, scorecardKey, selectScorecard };
}
