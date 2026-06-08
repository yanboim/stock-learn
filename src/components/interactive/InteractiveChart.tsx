import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from 'lightweight-charts';

interface Props {
  title?: string;
  height?: number;
  showTD?: boolean;
}

// Generate sample price data with TD markers
function generateSampleData(): CandlestickData[] {
  const data: CandlestickData[] = [];
  let basePrice = 100;
  const startDate = new Date('2024-01-02');

  for (let i = 0; i < 60; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const change = (Math.random() - 0.48) * 3;
    const open = basePrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;

    data.push({
      time: date.toISOString().split('T')[0] as Time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });

    basePrice = close;
  }
  return data;
}

// Simple TD Setup detection
function detectTDSetup(data: CandlestickData[]): { buySignals: number[]; sellSignals: number[] } {
  const buySignals: number[] = [];
  const sellSignals: number[] = [];

  for (let i = 4; i < data.length; i++) {
    // Check for buy setup (9 consecutive closes lower than 4 bars ago)
    if (i >= 12) {
      let buyCount = 0;
      for (let j = i - 8; j <= i; j++) {
        if (data[j].close < data[j - 4].close) {
          buyCount++;
        }
      }
      if (buyCount >= 9) {
        buySignals.push(i);
      }
    }

    // Check for sell setup
    if (i >= 12) {
      let sellCount = 0;
      for (let j = i - 8; j <= i; j++) {
        if (data[j].close > data[j - 4].close) {
          sellCount++;
        }
      }
      if (sellCount >= 9) {
        sellSignals.push(i);
      }
    }
  }

  return { buySignals, sellSignals };
}

export default function InteractiveChart({
  title = '交互式K线图',
  height = 400,
  showTD = true,
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [tdMode, setTdMode] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      width: chartContainerRef.current.clientWidth,
      height,
      timeScale: {
        timeVisible: false,
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#ef4444',
      downColor: '#22c55e',
      borderDownColor: '#22c55e',
      borderUpColor: '#ef4444',
      wickDownColor: '#22c55e',
      wickUpColor: '#ef4444',
    });

    const data = generateSampleData();
    candlestickSeries.setData(data);

    if (showTD && tdMode) {
      const { buySignals, sellSignals } = detectTDSetup(data);

      const markers = [
        ...buySignals.map((idx) => ({
          time: data[idx].time,
          position: 'belowBar' as const,
          color: '#22c55e',
          shape: 'arrowUp' as const,
          text: 'TD9 ↑',
        })),
        ...sellSignals.map((idx) => ({
          time: data[idx].time,
          position: 'aboveBar' as const,
          color: '#ef4444',
          shape: 'arrowDown' as const,
          text: 'TD9 ↓',
        })),
      ];

      candlestickSeries.setMarkers(markers.sort((a, b) => (a.time as string).localeCompare(b.time as string)));
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [tdMode, height, showTD]);

  const regenerate = () => {
    setTdMode((prev) => !prev);
  };

  return (
    <div className="my-6 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <div className="flex gap-2">
          <button
            onClick={regenerate}
            className="px-3 py-1 text-xs font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 transition"
          >
            {tdMode ? '隐藏 TD 标记' : '显示 TD 标记'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-xs font-medium rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            🔄 换一组数据
          </button>
        </div>
      </div>
      <div ref={chartContainerRef} />
      <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-200">
        💡 红色K线=上涨 | 绿色K线=下跌 | 点击"显示TD标记"查看TD9买卖信号
      </div>
    </div>
  );
}
