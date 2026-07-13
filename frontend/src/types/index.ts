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
  target_2025: number | null;
  capaian_2025: number | null;
  gap_2025: number | null;
  target_2026: number | null;
  capaian_2026: number | null;
  gap_2026: number | null;
  target_2027: number | null;
  capaian_2027: number | null;
  gap_2027: number | null;
  target_2028: number | null;
  capaian_2028: number | null;
  gap_2028: number | null;
  target_2029: number | null;
  capaian_2029: number | null;
  gap_2029: number | null;
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

export interface RencanaAksiRow {
  no: number;
  id: number;
  kode: string;
  indikator: string;
  pilar: string;
  pilar_no: number;
  rencana_aksi: string;
  tahun: string;
  status: string;
  opd: string;
  kolaborasi: string | null;
  catatan: string | null;
}

export interface RencanaAksiSummary {
  total: number;
  terlaksana: number;
  tidak_terlaksana: number;
  persentase: number;
}
