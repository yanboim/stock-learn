import { useState } from 'react';

interface ComparisonRow {
  dimension: string;
  left: string;
  right: string;
}

interface Props {
  title: string;
  leftTitle: string;
  rightTitle: string;
  leftColor?: string;
  rightColor?: string;
  rows: ComparisonRow[];
}

export default function ComparisonTable({
  title,
  leftTitle,
  rightTitle,
  leftColor = 'blue',
  rightColor = 'orange',
  rows,
}: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const leftBg: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  const rightBg: Record<string, string> = {
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200',
    pink: 'bg-pink-50 border-pink-200',
  };

  return (
    <div className="my-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="cursor-pointer"
            onClick={() => setExpanded(expanded === idx ? null : idx)}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-4 p-3 bg-gray-50 rounded-lg font-medium text-gray-700 text-sm border border-gray-100">
                {row.dimension}
              </div>
              <div className={`md:col-span-4 p-3 rounded-lg text-sm border ${leftBg[leftColor] || leftBg.blue}`}>
                {row.left}
              </div>
              <div className={`md:col-span-4 p-3 rounded-lg text-sm border ${rightBg[rightColor] || rightBg.orange}`}>
                {row.right}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-3 text-xs text-gray-400">
        <span>◀ {leftTitle}</span>
        <span>|</span>
        <span>{rightTitle} ▶</span>
      </div>
    </div>
  );
}
