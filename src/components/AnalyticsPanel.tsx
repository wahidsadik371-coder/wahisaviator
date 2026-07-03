// Analytics panel — player insights, profit chart, recommendations.

import { useGameStore } from "@/store/useGameStore";
import { computeInsights, profitOverTime } from "@/lib/analytics";
import { calculateLevelProgress, getLevelTitle } from "@/lib/levels";
import { formatCoins } from "@/lib/format";
import { Icon } from "./icons";

function InsightCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</div>
      <div className={`mt-1 font-mono text-base font-bold ${accent ?? "text-white"}`}>{value}</div>
    </div>
  );
}

export function AnalyticsPanel() {
  const stats = useGameStore((s) => s.stats);
  const betHistory = useGameStore((s) => s.betHistory);
  const balanceGraph = useGameStore((s) => s.balanceGraph);
  const totalXP = useGameStore((s) => s.totalXP);

  const insights = computeInsights(stats, betHistory, balanceGraph);
  const progress = calculateLevelProgress(totalXP);
  const { title, icon } = getLevelTitle(progress.currentLevel);
  const profitData = profitOverTime(balanceGraph);

  // Simple sparkline path
  const sparkPath = profitData.length > 1
    ? profitData.map((p, i) => `${i === 0 ? "M" : "L"}${i * 10} ${50 - (p.profit / 1000) * 5}`).join(" ")
    : "";

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="text-[10px] uppercase text-white/40">Level {progress.currentLevel}</div>
            <div className="font-display text-lg font-bold text-white">{title}</div>
          </div>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
            style={{ width: `${progress.progress * 100}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[10px] font-mono text-white/40">
          {progress.currentLevelXP} / {progress.nextLevelXP} XP
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InsightCard
          label="Win Rate"
          value={`${insights.winRate.toFixed(1)}%`}
          accent={insights.winRate >= 50 ? "text-emerald-300" : "text-rose-300"}
        />
        <InsightCard
          label="Avg Cashout"
          value={`${insights.averageCashout.toFixed(2)}x`}
          accent="text-cyan-300"
        />
        <InsightCard
          label="Risk Score"
          value={`${insights.riskScore.toFixed(0)}/100`}
          accent={insights.riskScore > 60 ? "text-rose-300" : insights.riskScore > 30 ? "text-amber-300" : "text-emerald-300"}
        />
        <InsightCard
          label="Percentile"
          value={`${insights.percentile}%`}
          accent="text-violet-300"
        />
        <InsightCard
          label="Total Profit"
          value={`${insights.totalProfit >= 0 ? "+" : ""}${formatCoins(insights.totalProfit)}`}
          accent={insights.totalProfit >= 0 ? "text-emerald-300" : "text-rose-300"}
        />
        <InsightCard
          label="Total XP"
          value={formatCoins(totalXP)}
          accent="text-amber-300"
        />
      </div>

      {profitData.length > 1 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">
            Profit over time
          </div>
          <svg viewBox={`0 0 ${(profitData.length - 1) * 10} 50`} className="h-20 w-full" preserveAspectRatio="none">
            <path
              d={sparkPath}
              fill="none"
              stroke={insights.totalProfit >= 0 ? "#34d399" : "#f87171"}
              strokeWidth="1.5"
            />
          </svg>
        </div>
      )}

      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
        <div className="flex items-start gap-2">
          <Icon name="sparkles" className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div>
            <div className="text-xs font-bold text-amber-200">Recommendation</div>
            <div className="mt-0.5 text-[11px] text-white/70">{insights.recommendation}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
