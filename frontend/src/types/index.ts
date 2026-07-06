export interface OPD {
  id: number;
  kode_opd: string;
  nama_opd: string;
}

export interface Pilar {
  id: number;
  no_pilar: number;
  nama_pilar: string;
}

export interface IndikatorOption {
  id: number;
  kode: string;
  nama_indikator: string;
}

export interface FilterOptions {
  opd: OPD[];
  pilar: Pilar[];
  indikator: IndikatorOption[];
  tahun: number[];
  status_tl: string[];
}

export interface Scorecards {
  total_indikator: number;
  total_opd: number;
  on_track: number;
  warning: number;
  alert: number;
  target_belum_diinput: number;
  capaian_belum_diinput: number;
}

export interface TableRow {
  kode: string;
  nama_indikator: string;
  nama_opd: string;
  nama_pilar: string;
  status_tl: string;
  warna_tl: string;
  target: number | null;
  capaian: number | null;
  gap: number | null;
  pct_gap: number | null;
  satuan: string;
  tahun: string | null;
}

export interface RenaksiItem {
  no: number;
  rencana_aksi: string;
  tahun: string;
  status: string;
  catatan: string | null;
  opd: string;
}

export interface RenaksiResponse {
  indikator: {
    kode: string;
    nama: string;
  };
  renaksi: RenaksiItem[];
}

export interface ChartDataPoint {
  tahun: string;
  avg_target: string | null;
  avg_capaian: string | null;
  count: number;
}

export interface RenaksiPieData {
  terlaksana: number;
  tidak_terlaksana: number;
  belum_input: number;
}

export interface RenaksiListItem {
  no: number;
  indikator: string;
  rencana_aksi: string;
  tahun: string;
  status: string;
  catatan: string | null;
  opd: string;
}

export interface PerPilarItem {
  pilar: string;
  on_track: number;
  warning: number;
  alert: number;
  belum_diisi: number;
}

export interface PerOpdItem {
  opd: string;
  on_track: number;
  warning: number;
  alert: number;
  belum_diisi: number;
}

export interface HeatmapRow {
  kode: string;
  nama_indikator: string;
  pilar: string;
  status_2025: string;
  warna_2025: string;
  status_2026: string;
  warna_2026: string;
  status_2027: string;
  warna_2027: string;
  status_2028: string;
  warna_2028: string;
  status_2029: string;
  warna_2029: string;
}

export interface ChartPilarEntry {
  pilar: string;
  data: ChartDataPoint[];
}

export interface DashboardFilters {
  opd_id?: string;
  pilar_id?: string;
  indikator_id?: string;
  tahun?: string;
  status_tl?: string;
}
