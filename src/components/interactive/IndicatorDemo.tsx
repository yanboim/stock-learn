import { useEffect, useRef, useMemo, useState } from 'react';
import {
  createChart,
  ColorType,
  type IChartApi,
  type CandlestickData,
  type Time,
  type HistogramData,
  type LineData,
} from 'lightweight-charts';

/**
 * 专门用于技术指标教程的交互式演示组件。
 * 支持单指标深入演示，适合嵌入各篇教程中。
 */

interface OHLCVData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Annotation {
  time: string;
  position: 'aboveBar' | 'belowBar';
  color: string;
  shape: 'arrowUp' | 'arrowDown' | 'circle';
  text: string;
}

interface Props {
  /** 教程类型，决定默认显示哪些指标 */
  preset: 'ma' | 'macd' | 'rsi' | 'volume' | 'kline' | 'trendline' | 'td' | 'custom';
  /** 图表高度 */
  height?: number;
  /** 自定义数据 */
  data?: OHLCVData[];
  /** 标注点（买卖信号、形态标注等） */
  annotations?: Annotation[];
  /** 说明文字 */
  caption?: string;
}

// --- Indicator calculations ---
function calcEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) { result.push(data[0]); }
    else { ema = data[i] * k + ema * (1 - k); result.push(ema); }
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

function calcMACD(closes: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);
  const dif = emaFast.map((v, i) => v - emaSlow[i]);
  const dea = calcEMA(dif, signal);
  const histogram = dif.map((v, i) => (v - dea[i]) * 2);
  return { dif, dea, histogram };
}

function calcRSI(closes: number[], period = 14): number[] {
  const result: number[] = [50];
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (i <= period) {
      avgGain += Math.max(change, 0);
      avgLoss += Math.abs(Math.min(change, 0));
      if (i === period) {
        avgGain /= period; avgLoss /= period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        result.push(100 - 100 / (1 + rs));
      } else { result.push(50); }
    } else {
      avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(Math.min(change, 0))) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

// Generate realistic sample data with specific patterns
function generateSampleData(preset: string): OHLCVData[] {
  const data: OHLCVData[] = [];
  let basePrice = 100;
  const startDate = new Date('2024-01-02');

  for (let i = 0; i < 150; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    let change: number;
    // Generate different patterns based on preset
    switch (preset) {
      case 'macd': {
        // Create clear divergence pattern
        const phase = Math.sin(i / 25);
        change = phase * 1.5 + (Math.random() - 0.48) * 2;
        break;
      }
      case 'rsi': {
        // Create overbought/oversold swings
        const swing = Math.sin(i / 20) * 2;
        change = swing + (Math.random() - 0.5) * 1.5;
        break;
      }
      case 'volume': {
        // Create volume spikes
        change = (Math.random() - 0.48) * 2.5;
        break;
      }
      case 'trendline': {
        // Create trend with clear support/resistance
        const trend = i < 60 ? 0.15 : i < 90 ? -0.1 : 0.2;
        change = trend + (Math.random() - 0.5) * 2;
        break;
      }
      default: {
        change = (Math.random() - 0.48) * 3 + Math.sin(i / 30) * 0.1;
      }
    }

    const open = basePrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    const volume = Math.round(30000 + Math.random() * 80000 + Math.abs(change) * 20000);

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

const MA_COLORS: Record<number, string> = {
  5: '#f59e0b', 10: '#3b82f6', 20: '#a855f7', 60: '#10b981', 120: '#ef4444',
};

export default function IndicatorDemo({
  preset,
  height = 350,
  data: externalData,
  annotations = [],
  caption,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const rawData = useMemo(() => externalData || generateSampleData(preset), [externalData, preset]);
  const closes = useMemo(() => rawData.map((d) => d.close), [rawData]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const showMACD = preset === 'macd' || preset === 'custom';
    const showRSI = preset === 'rsi' || preset === 'custom';
    const showVol = preset === 'volume' || preset !== 'kline';
    const showMA = preset === 'ma' || preset === 'custom';

    const subPanelHeight = (showMACD ? 100 : 0) + (showRSI ? 100 : 0) + (showVol ? 70 : 0);
    const totalHeight = height + subPanelHeight;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      width: container.clientWidth,
      height: totalHeight,
      timeScale: { timeVisible: false },
    });

    chartRef.current = chart;

    // Candlestick
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#ef4444',
      downColor: '#22c55e',
      borderDownColor: '#22c55e',
      borderUpColor: '#ef4444',
      wickDownColor: '#22c55e',
      wickUpColor: '#ef4444',
    });
    candleSeries.setData(
      rawData.map((d) => ({
        time: d.time as Time, open: d.open, high: d.high, low: d.low, close: d.close,
      }))
    );

    // MA lines
    if (showMA) {
      [5, 10, 20, 60].forEach((period) => {
        const ma = calcMA(closes, period);
        const line = chart.addLineSeries({
          color: MA_COLORS[period],
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        const ld: LineData[] = [];
        ma.forEach((v, i) => { if (v !== null) ld.push({ time: rawData[i].time as Time, value: v }); });
        line.setData(ld);
      });
    }

    // Annotations (buy/sell markers)
    if (annotations.length > 0) {
      candleSeries.setMarkers(
        annotations.map((a) => ({
          time: a.time as Time,
          position: a.position,
          color: a.color,
          shape: a.shape,
          text: a.text,
        }))
      );
    }

    // Volume
    if (showVol) {
      const volSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      volSeries.setData(
        rawData.map((d) => ({
          time: d.time as Time,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)',
        }))
      );
    }

    // MACD
    if (showMACD) {
      const { dif, dea, histogram } = calcMACD(closes);
      const psId = 'macd';
      const margins = { top: showRSI ? 0.6 : showVol ? 0.65 : 0.7, bottom: showRSI ? 0.3 : showVol ? 0.15 : 0 };

      const difLine = chart.addLineSeries({ color: '#3b82f6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, priceScaleId: psId });
      const deaLine = chart.addLineSeries({ color: '#f97316', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, priceScaleId: psId });
      const histLine = chart.addHistogramSeries({ priceScaleId: psId, priceLineVisible: false, lastValueVisible: false });
      chart.priceScale(psId).applyOptions({ scaleMargins: margins });

      difLine.setData(dif.map((v, i) => ({ time: rawData[i].time as Time, value: v })));
      deaLine.setData(dea.map((v, i) => ({ time: rawData[i].time as Time, value: v })));
      histLine.setData(histogram.map((v, i) => ({
        time: rawData[i].time as Time, value: v,
        color: v >= 0 ? 'rgba(239,68,68,0.5)' : 'rgba(34,197,94,0.5)',
      })));
    }

    // RSI
    if (showRSI) {
      const rsi = calcRSI(closes);
      const psId = 'rsi';
      const rsiLine = chart.addLineSeries({ color: '#a855f7', lineWidth: 2, priceLineVisible: false, lastValueVisible: false, priceScaleId: psId });
      chart.priceScale(psId).applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
      rsiLine.setData(rsi.map((v, i) => ({ time: rawData[i].time as Time, value: v })));

      const obLine = chart.addLineSeries({ color: 'rgba(239,68,68,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, priceScaleId: psId, crosshairMarkerVisible: false });
      const osLine = chart.addLineSeries({ color: 'rgba(34,197,94,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, priceScaleId: psId, crosshairMarkerVisible: false });
      obLine.setData(rawData.map((d) => ({ time: d.time as Time, value: 70 })));
      osLine.setData(rawData.map((d) => ({ time: d.time as Time, value: 30 })));
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [rawData, preset, height, annotations, closes]);

  return (
    <div className="my-6 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-600">
          {preset === 'ma' && '📈 均线系统演示'}
          {preset === 'macd' && '📊 MACD指标演示'}
          {preset === 'rsi' && '🌡️ RSI指标演示'}
          {preset === 'volume' && '📊 成交量分析演示'}
          {preset === 'kline' && '🕯️ K线形态演示'}
          {preset === 'trendline' && '📐 趋势线与形态演示'}
          {preset === 'td' && '🔢 TD Sequential演示'}
          {preset === 'custom' && '📊 综合指标演示'}
        </span>
      </div>
      <div ref={containerRef} />
      {caption && (
        <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-200">
          {caption}
        </div>
      )}
    </div>
  );
}
