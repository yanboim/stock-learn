import { useState, useMemo } from 'react';

/**
 * 仓位管理和止损计算器组件
 * 用于风险控制相关教程的交互式演示
 */

interface Props {
  mode: 'stopLoss' | 'positionSize' | 'riskReward' | 'compound';
}

export default function RiskCalculator({ mode }: Props) {
  if (mode === 'stopLoss') return <StopLossCalc />;
  if (mode === 'positionSize') return <PositionSizeCalc />;
  if (mode === 'riskReward') return <RiskRewardCalc />;
  if (mode === 'compound') return <CompoundCalc />;
  return null;
}

function StopLossCalc() {
  const [buyPrice, setBuyPrice] = useState('25.00');
  const [stopPercent, setStopPercent] = useState('6');
  const [shares, setShares] = useState('1000');

  const stopPrice = useMemo(() => {
    const p = parseFloat(buyPrice) || 0;
    const s = parseFloat(stopPercent) || 0;
    return Math.round(p * (1 - s / 100) * 100) / 100;
  }, [buyPrice, stopPercent]);

  const lossAmount = useMemo(() => {
    const p = parseFloat(buyPrice) || 0;
    const n = parseInt(shares) || 0;
    return Math.round((p - stopPrice) * n * 100) / 100;
  }, [buyPrice, stopPrice, shares]);

  const lossPercent = ((parseFloat(buyPrice) || 0) - stopPrice) / (parseFloat(buyPrice) || 1) * 100;

  return (
    <div className="my-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h4 className="text-lg font-bold text-gray-800 mb-4">🛑 止损计算器</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">买入价格（元）</label>
          <input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" step="0.01" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">止损幅度（%）</label>
          <input type="number" value={stopPercent} onChange={(e) => setStopPercent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" step="0.5" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">持有股数</label>
          <input type="number" value={shares} onChange={(e) => setShares(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
      </div>
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-red-600 mb-1">止损价格</div>
            <div className="text-2xl font-bold text-red-700">{stopPrice.toFixed(2)} 元</div>
          </div>
          <div>
            <div className="text-xs text-red-600 mb-1">最大亏损金额</div>
            <div className="text-2xl font-bold text-red-700">{lossAmount.toFixed(0)} 元</div>
          </div>
          <div>
            <div className="text-xs text-red-600 mb-1">实际亏损比例</div>
            <div className="text-2xl font-bold text-red-700">{lossPercent.toFixed(1)}%</div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">💡 输入买入价格、止损幅度和持有股数，自动计算止损价格和最大亏损</p>
    </div>
  );
}

function PositionSizeCalc() {
  const [totalCapital, setTotalCapital] = useState('100000');
  const [riskPerTrade, setRiskPerTrade] = useState('2');
  const [stopPercent, setStopPercent] = useState('6');

  const result = useMemo(() => {
    const capital = parseFloat(totalCapital) || 0;
    const risk = parseFloat(riskPerTrade) || 0;
    const stop = parseFloat(stopPercent) || 1;
    const riskAmount = capital * risk / 100;
    const positionSize = riskAmount / (stop / 100);
    const positionPercent = positionSize / capital * 100;
    return {
      riskAmount: Math.round(riskAmount),
      positionSize: Math.round(positionSize),
      positionPercent: Math.round(positionPercent * 10) / 10,
    };
  }, [totalCapital, riskPerTrade, stopPercent]);

  return (
    <div className="my-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h4 className="text-lg font-bold text-gray-800 mb-4">💰 仓位计算器</h4>
      <p className="text-sm text-gray-500 mb-4">根据风险容忍度计算每笔交易的最大仓位</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">总资金（元）</label>
          <input type="number" value={totalCapital} onChange={(e) => setTotalCapital(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">单笔风险（%）</label>
          <input type="number" value={riskPerTrade} onChange={(e) => setRiskPerTrade(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" step="0.5" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">止损幅度（%）</label>
          <input type="number" value={stopPercent} onChange={(e) => setStopPercent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" step="0.5" />
        </div>
      </div>
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-blue-600 mb-1">最大可承受亏损</div>
            <div className="text-2xl font-bold text-blue-700">{result.riskAmount.toLocaleString()} 元</div>
          </div>
          <div>
            <div className="text-xs text-blue-600 mb-1">建议仓位金额</div>
            <div className="text-2xl font-bold text-blue-700">{result.positionSize.toLocaleString()} 元</div>
          </div>
          <div>
            <div className="text-xs text-blue-600 mb-1">占总资金比例</div>
            <div className={`text-2xl font-bold ${result.positionPercent > 30 ? 'text-red-600' : 'text-blue-700'}`}>
              {result.positionPercent}%
            </div>
          </div>
        </div>
      </div>
      {result.positionPercent > 30 && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          ⚠️ 仓位超过30%，风险较大。建议调低单笔风险比例或增大止损幅度。
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400">💡 公式：仓位 = (总资金 × 单笔风险%) / 止损幅度%</p>
    </div>
  );
}

function RiskRewardCalc() {
  const [entryPrice, setEntryPrice] = useState('25.00');
  const [stopPrice, setStopPrice] = useState('23.50');
  const [target1, setTarget1] = useState('28.00');
  const [target2, setTarget2] = useState('30.00');

  const result = useMemo(() => {
    const entry = parseFloat(entryPrice) || 1;
    const stop = parseFloat(stopPrice) || 0;
    const t1 = parseFloat(target1) || 0;
    const t2 = parseFloat(target2) || 0;
    const risk = entry - stop;
    const rr1 = risk > 0 ? ((t1 - entry) / risk).toFixed(1) : '0';
    const rr2 = risk > 0 ? ((t2 - entry) / risk).toFixed(1) : '0';
    const win1 = ((t1 - entry) / entry * 100).toFixed(1);
    const win2 = ((t2 - entry) / entry * 100).toFixed(1);
    const lossPct = (risk / entry * 100).toFixed(1);
    return { risk, rr1, rr2, win1, win2, lossPct };
  }, [entryPrice, stopPrice, target1, target2]);

  return (
    <div className="my-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h4 className="text-lg font-bold text-gray-800 mb-4">⚖️ 风险收益比计算器</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">买入价格</label>
          <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" step="0.01" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">止损价格</label>
          <input type="number" value={stopPrice} onChange={(e) => setStopPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400" step="0.01" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">目标价1</label>
          <input type="number" value={target1} onChange={(e) => setTarget1(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" step="0.01" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">目标价2</label>
          <input type="number" value={target2} onChange={(e) => setTarget2(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" step="0.01" />
        </div>
      </div>

      {/* Visual bar */}
      <div className="mb-4">
        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
          <div className="absolute left-0 top-0 h-full bg-red-200 rounded-l-full" style={{ width: `${Math.min(parseFloat(result.lossPct) * 3, 50)}%` }}>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-red-700">
              亏损 {result.lossPct}%
            </span>
          </div>
          <div className="absolute right-0 top-0 h-full bg-green-200 rounded-r-full" style={{ width: `${Math.min(parseFloat(result.win2) * 3, 50)}%` }}>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-green-700">
              盈利 {result.win2}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="text-xs text-red-600 mb-1">风险（止损幅度）</div>
          <div className="text-xl font-bold text-red-700">{result.lossPct}%</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-xs text-green-600 mb-1">目标1收益</div>
          <div className="text-xl font-bold text-green-700">{result.win1}%</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-xs text-green-600 mb-1">目标2收益</div>
          <div className="text-xl font-bold text-green-700">{result.win2}%</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-blue-600 mb-1">风险收益比</div>
          <div className="text-xl font-bold text-blue-700">1:{result.rr1} ~ 1:{result.rr2}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">💡 一般要求风险收益比 &gt; 2:1 才值得操作</p>
    </div>
  );
}

function CompoundCalc() {
  const [initial, setInitial] = useState('100000');
  const [monthlyReturn, setMonthlyReturn] = useState('3');
  const [months, setMonths] = useState('24');
  const [monthlyAdd, setMonthlyAdd] = useState('5000');

  const result = useMemo(() => {
    const init = parseFloat(initial) || 0;
    const rate = parseFloat(monthlyReturn) / 100 || 0;
    const n = parseInt(months) || 0;
    const add = parseFloat(monthlyAdd) || 0;

    let balance = init;
    const monthlyBalances: { month: number; balance: number }[] = [{ month: 0, balance: init }];

    for (let i = 1; i <= n; i++) {
      balance = balance * (1 + rate) + add;
      monthlyBalances.push({ month: i, balance: Math.round(balance) });
    }

    const totalContributed = init + add * n;
    const totalProfit = balance - totalContributed;

    return {
      finalBalance: Math.round(balance),
      totalContributed: Math.round(totalContributed),
      totalProfit: Math.round(totalProfit),
      returnRate: ((balance / totalContributed - 1) * 100).toFixed(1),
      monthlyBalances,
    };
  }, [initial, monthlyReturn, months, monthlyAdd]);

  return (
    <div className="my-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h4 className="text-lg font-bold text-gray-800 mb-4">📈 复利计算器</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">初始资金（元）</label>
          <input type="number" value={initial} onChange={(e) => setInitial(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">月均收益率（%）</label>
          <input type="number" value={monthlyReturn} onChange={(e) => setMonthlyReturn(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" step="0.5" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">投资月数</label>
          <input type="number" value={months} onChange={(e) => setMonths(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">每月追加（元）</label>
          <input type="number" value={monthlyAdd} onChange={(e) => setMonthlyAdd(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-xs text-green-600 mb-1">最终资产</div>
          <div className="text-xl font-bold text-green-700">{result.finalBalance.toLocaleString()}</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-blue-600 mb-1">累计投入</div>
          <div className="text-xl font-bold text-blue-700">{result.totalContributed.toLocaleString()}</div>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg">
          <div className="text-xs text-amber-600 mb-1">投资收益</div>
          <div className="text-xl font-bold text-amber-700">{result.totalProfit.toLocaleString()}</div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="text-xs text-purple-600 mb-1">总收益率</div>
          <div className="text-xl font-bold text-purple-700">{result.returnRate}%</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">💡 复利的力量：每月稳定盈利3%，2年后资产翻倍不是梦</p>
    </div>
  );
}
