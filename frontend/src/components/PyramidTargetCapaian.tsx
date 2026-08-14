import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { ChartPilarEntry } from '@/types';
import { Loader2, TrendingUp } from 'lucide-react';

interface Props {
  data: ChartPilarEntry[];
  tahun: string;
  loading: boolean;
}

const TARGET_COLOR = '#3b82f6';
const CAPAIAN_COLOR = '#22c55e';

export default function PyramidTargetCapaian({ data, tahun, loading }: Props) {
  const pyramidData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(entry => {
      const yearData = entry.data.find(d => d.tahun === tahun);
      const target = yearData?.avg_target ? parseFloat(yearData.avg_target) : 0;
      const capaian = yearData?.avg_capaian ? parseFloat(yearData.avg_capaian) : 0;

      const shortName = entry.pilar
        .replace('Pilar 1: ', '')
        .replace('Pilar 2: ', '')
        .replace('Pilar 3: ', '')
        .replace('Pilar 4: ', '')
        .replace('Pilar 5: ', '')
        .replace('Pengendalian Kuantitas Penduduk', 'Kuantitas')
        .replace('Peningkatan Kualitas Penduduk', 'Kualitas')
        .replace('Pembangunan Keluarga', 'Keluarga')
        .replace('Penataan Persebaran dan Pengarahan Mobilitas Penduduk', 'Persebaran')
        .replace('Penataan Administrasi Data Kependudukan', 'Adminduk');

      return {
        pilar: shortName,
        fullPilar: entry.pilar,
        target: target > 0 ? -target : 0,
        capaian: capaian,
        targetAbs: target,
        capaianAbs: capaian,
      };
    });
  }, [data, tahun]);

  const hasData = pyramidData.some(d => d.targetAbs > 0 || d.capaianAbs > 0);

  if (loading) {
    return (
      <div className="rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', padding: '1.5rem' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)', marginBottom: '0.75rem' }}>Target vs Capaian per Pilar</h3>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Target vs Capaian per Pilar
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
            {tahun}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.688rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: TARGET_COLOR }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>Target</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: CAPAIAN_COLOR }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>Capaian</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}>
            Capaian belum tersedia untuk tahun {tahun}
          </span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={pyramidData}
            layout="vertical"
            barCategoryGap={8}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="var(--color-border)"
              opacity={0.3}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 9, fill: 'var(--color-text-secondary)' }}
              tickFormatter={(v: number) => Math.abs(v).toLocaleString('id-ID', { maximumFractionDigits: 1 })}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="pilar"
              tick={{ fontSize: 11, fill: 'var(--color-text)' }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
              }}
              formatter={(value: number, name: string) => [
                Math.abs(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }),
                name === 'target' ? 'Target' : 'Capaian',
              ]}
              labelFormatter={(label: string, payload: unknown[]) => {
                const d = (payload as { payload: { fullPilar: string } }[])[0]?.payload;
                return d?.fullPilar ?? label;
              }}
            />
            <ReferenceLine x={0} stroke="var(--color-border)" strokeWidth={1.5} />

            <Bar dataKey="target" name="target" fill={TARGET_COLOR} barSize={26} opacity={0.85} radius={[4, 0, 0, 4]} />
            <Bar dataKey="capaian" name="capaian" fill={CAPAIAN_COLOR} barSize={26} opacity={0.9} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
