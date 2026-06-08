import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  type HistogramData,
  type LineData,
} from 'lightweight-charts';

// --- Types ---
interface OHLCVData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Props {
  title?: string;
  height?: number;
  data?: OHLCVData[];
  showMA?: boolean;
  showMACD?: boolean;
  showRSI?: boolean;
  showVolume?: boolean;
  showTD?: boolean;
  maPeriods?: number[];
  macdParams?: [number, number, number];
  rsiPeriod?: number;
}

// --- Technical indicator calculations ---
function calcEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[0]);
    } else {
      ema = data[i] * k + ema * (1 - k);
      result.push(ema);
    }
  }
  return result;
}

function calcMA(data: number[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function calcMACD(
  closes: number[],
  fast: number = 12,
  slow: number = 26,
  signal: number = 9
): { dif: number[]; dea: number[]; histogram: number[] } {
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);
  const dif = emaFast.map((v, i) => v - emaSlow[i]);
  const dea = calcEMA(dif, signal);
  const histogram = dif.map((v, i) => (v - dea[i]) * 2);
  return { dif, dea, histogram };
}

function calcRSI(closes: number[], period: number = 14): number[] {
  const result: number[] = [50];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (i <= period) {
      avgGain += Math.max(change, 0);
      avgLoss += Math.abs(Math.min(change, 0));
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        result.push(100 - 100 / (1 + rs));
      } else {
        result.push(50);
      }
    } else {
      avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(Math.min(change, 0))) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

// TD Setup detection
function detectTDSetup(
  data: OHLCVData[]
): { buySignals: number[]; sellSignals: number[] } {
  const buySignals: number[] = [];
  const sellSignals: number[] = [];

  for (let i = 12; i < data.length; i++) {
    let buyCount = 0;
    for (let j = i - 8; j <= i; j++) {
      if (data[j].close < data[j - 4].close) buyCount++;
    }
    if (buyCount >= 9) buySignals.push(i);

    let sellCount = 0;
    for (let j = i - 8; j <= i; j++) {
      if (data[j].close > data[j - 4].close) sellCount++;
    }
    if (sellCount >= 9) sellSignals.push(i);
  }

  return { buySignals, sellSignals };
}

// Generate sample data
function generateSampleData(): OHLCVData[] {
  const data: OHLCVData[] = [];
  let basePrice = 100;
  const startDate = new Date('2024-01-02');

  for (let i = 0; i < 120; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const trend = Math.sin(i / 30) * 5;
    const change = (Math.random() - 0.48) * 3 + trend * 0.02;
    const open = basePrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    const volume = Math.round(50000 + Math.random() * 100000 + Math.abs(change) * 30000);

    data.push({
      time: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });

    basePrice = close;
  }
  return data;
}

// MA colors
const MA_COLORS: Record<number, string> = {
  5: '#f59e0b',
  10: '#3b82f6',
  20: '#a855f7',
  30: '#ec4899',
  60: '#10b981',
  120: '#ef4444',
  250: '#6366f1',
};

export default function InteractiveChart({
  title = '交互式K线图',
  height = 400,
  data: externalData,
  showMA: initialMA = false,
  showMACD: initialMACD = false,
  showRSI: initialRSI = false,
  showVolume: initialVol = true,
  showTD: initialTD = false,
  maPeriods = [5, 10, 20, 60],
  macdParams = [12, 26, 9],
  rsiPeriod = 14,
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const [toggleMA, setToggleMA] = useState(initialMA);
  const [toggleMACD, setToggleMACD] = useState(initialMACD);
  const [toggleRSI, setToggleRSI] = useState(initialRSI);
  const [toggleVol, setToggleVol] = useState(initialVol);
  const [toggleTD, setToggleTD] = useState(initialTD);
  const [darkMode, setDarkMode] = useState(false);

  const rawData = useMemo(() => externalData || generateSampleData(), [externalData]);

  const closes = useMemo(() => rawData.map((d) => d.close), [rawData]);

  const indicators = useMemo(() => {
    const maData: Record<number, (number | null)[]> = {};
    maPeriods.forEach((p) => {
      maData[p] = calcMA(closes, p);
    });
    const macd = calcMACD(closes, macdParams[0], macdParams[1], macdParams[2]);
    const rsi = calcRSI(closes, rsiPeriod);
    return { maData, macd, rsi };
  }, [closes, maPeriods, macdParams, rsiPeriod]);

  // Chart rendering
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;

    // Destroy old chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const bg = darkMode ? '#1a1a2e' : '#ffffff';
    const text = darkMode ? '#d1d5db' : '#333';
    const gridLine = darkMode ? '#2d2d44' : '#f0f0f0';

    const totalHeight = height + (toggleMACD ? 120 : 0) + (toggleRSI ? 120 : 0) + (toggleVol ? 80 : 0);

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: text,
      },
      grid: {
        vertLines: { color: gridLine },
        horzLines: { color: gridLine },
      },
      width: container.clientWidth,
      height: totalHeight,
      timeScale: {
        timeVisible: false,
      },
      rightPriceScale: {
        borderColor: darkMode ? '#3a3a55' : '#e5e7eb',
      },
    });

    chartRef.current = chart;

    // Main candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#ef4444',
      downColor: '#22c55e',
      borderDownColor: '#22c55e',
      borderUpColor: '#ef4444',
      wickDownColor: '#22c55e',
      wickUpColor: '#ef4444',
    });

    const candleData: CandlestickData[] = rawData.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candleSeries.setData(candleData);

    // MA lines
    if (toggleMA) {
      maPeriods.forEach((period) => {
        const maValues = indicators.maData[period];
        if (!maValues) return;
        const lineSeries = chart.addLineSeries({
          color: MA_COLORS[period] || '#888',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        const lineData: LineData[] = [];
        maValues.forEach((v, i) => {
          if (v !== null) {
            lineData.push({ time: rawData[i].time as Time, value: v });
          }
        });
        lineSeries.setData(lineData);
      });
    }

    // TD markers
    if (toggleTD) {
      const { buySignals, sellSignals } = detectTDSetup(rawData);
      const markers = [
        ...buySignals.map((idx) => ({
          time: rawData[idx].time as Time,
          position: 'belowBar' as const,
          color: '#22c55e',
          shape: 'arrowUp' as const,
          text: 'TD9 ↑',
        })),
        ...sellSignals.map((idx) => ({
          time: rawData[idx].time as Time,
          position: 'aboveBar' as const,
          color: '#ef4444',
          shape: 'arrowDown' as const,
          text: 'TD9 ↓',
        })),
      ];
      candleSeries.setMarkers(
        markers.sort((a, b) => (a.time as string).localeCompare(b.time as string))
      );
    }

    // Volume
    if (toggleVol) {
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        color: '#888',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      const volData: HistogramData[] = rawData.map((d) => ({
        time: d.time as Time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)',
      }));
      volumeSeries.setData(volData);
    }

    // MACD sub-chart
    if (toggleMACD) {
      const macdSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        priceScaleId: 'macd',
      });
      chart.priceScale('macd').applyOptions({
        scaleMargins: {
          top: toggleRSI ? 0.6 : toggleVol ? 0.65 : 0.7,
          bottom: toggleRSI ? 0.3 : toggleVol ? 0.15 : 0,
        },
      });

      const signalSeries = chart.addLineSeries({
        color: '#f97316',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        priceScaleId: 'macd',
      });

      const histSeries = chart.addHistogramSeries({
        priceScaleId: 'macd',
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const { dif, dea, histogram } = indicators.macd;
      macdSeries.setData(
        dif.map((v, i) => ({ time: rawData[i].time as Time, value: v }))
      );
      signalSeries.setData(
        dea.map((v, i) => ({ time: rawData[i].time as Time, value: v }))
      );
      histSeries.setData(
        histogram.map((v, i) => ({
          time: rawData[i].time as Time,
          value: v,
          color: v >= 0 ? 'rgba(239,68,68,0.6)' : 'rgba(34,197,94,0.6)',
        }))
      );
    }

    // RSI sub-chart
    if (toggleRSI) {
      const rsiSeries = chart.addLineSeries({
        color: '#a855f7',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        priceScaleId: 'rsi',
      });
      chart.priceScale('rsi').applyOptions({
        scaleMargins: {
          top: 0.85,
          bottom: 0,
        },
      });
      rsiSeries.setData(
        indicators.rsi.map((v, i) => ({ time: rawData[i].time as Time, value: v }))
      );

      // Overbought/oversold reference lines
      const obLine = chart.addLineSeries({
        color: 'rgba(239,68,68,0.4)',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        priceScaleId: 'rsi',
        crosshairMarkerVisible: false,
      });
      obLine.setData(rawData.map((d) => ({ time: d.time as Time, value: 70 })));

      const osLine = chart.addLineSeries({
        color: 'rgba(34,197,94,0.4)',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        priceScaleId: 'rsi',
        crosshairMarkerVisible: false,
      });
      osLine.setData(rawData.map((d) => ({ time: d.time as Time, value: 30 })));
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
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [rawData, toggleMA, toggleMACD, toggleRSI, toggleVol, toggleTD, darkMode, height, indicators, maPeriods]);

  const ToolbarButton = ({
    active,
    onClick,
    label,
    color,
  }: {
    active: boolean;
    onClick: () => void;
    label: string;
    color: string;
  }) => (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
        active
          ? `text-white ${color}`
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={`my-6 rounded-xl border overflow-hidden shadow-sm ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Toolbar */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b flex-wrap gap-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <ToolbarButton active={toggleMA} onClick={() => setToggleMA(!toggleMA)} label="MA均线" color="bg-amber-500" />
          <ToolbarButton active={toggleVol} onClick={() => setToggleVol(!toggleVol)} label="成交量" color="bg-slate-500" />
          <ToolbarButton active={toggleMACD} onClick={() => setToggleMACD(!toggleMACD)} label="MACD" color="bg-blue-500" />
          <ToolbarButton active={toggleRSI} onClick={() => setToggleRSI(!toggleRSI)} label="RSI" color="bg-purple-500" />
          <ToolbarButton active={toggleTD} onClick={() => setToggleTD(!toggleTD)} label="TD9" color="bg-emerald-500" />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-2 py-1 text-xs rounded-md transition ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} />

      {/* Legend */}
      <div className={`px-4 py-2 text-xs border-t flex flex-wrap gap-x-4 gap-y-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
        {toggleMA && maPeriods.map((p) => (
          <span key={p} style={{ color: MA_COLORS[p] }}>MA{p}</span>
        ))}
        {toggleMACD && (
          <>
            <span className="text-blue-500">DIF</span>
            <span className="text-orange-500">DEA</span>
            <span>MACD柱</span>
          </>
        )}
        {toggleRSI && <span className="text-purple-500">RSI({rsiPeriod})</span>}
        {toggleTD && <span className="text-emerald-500">TD9</span>}
        <span className="ml-auto">🔴 涨 🔵 跌</span>
      </div>
    </div>
  );
}
