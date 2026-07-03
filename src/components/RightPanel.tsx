// Tabbed side panel: Live leaderboard, Chat, Stats, Achievements, Bet history,
// Missions, Cosmetics, Shop, Strategy, Tournaments, Friends, Analytics, Replays.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { ACHIEVEMENTS } from "@/lib/achievements";
import { GAME } from "@/lib/constants";
import { formatCoins, formatMult, timeAgo } from "@/lib/format";
import { useGameStore } from "@/store/useGameStore";
import type { BalancePoint } from "@/lib/types";
import { Icon, type IconName } from "./icons";
import { MissionsPanel } from "./MissionsPanel";
import { CosmeticsPanel } from "./CosmeticsPanel";
import { ShopPanel } from "./ShopPanel";
import { StrategyPanel } from "./StrategyPanel";
import { TournamentPanel } from "./TournamentPanel";
import { FriendsPanel } from "./FriendsPanel";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { FairnessVerifier } from "./FairnessVerifier";
import { ReplayViewer } from "./ReplayViewer";

export type TabId =
  | "live"
  | "chat"
  | "stats"
  | "achievements"
  | "bets"
  | "missions"
  | "cosmetics"
  | "shop"
  | "strategy"
  | "tournaments"
  | "friends"
  | "analytics"
  | "fairness"
  | "replays";

export const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: "live", label: "Live", icon: "users" },
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "stats", label: "Stats", icon: "chart" },
  { id: "achievements", label: "Awards", icon: "trophy" },
  { id: "bets", label: "Bets", icon: "clock" },
  { id: "missions", label: "Missions", icon: "flame" },
  { id: "cosmetics", label: "Skins", icon: "sparkles" },
  { id: "shop", label: "Shop", icon: "wallet" },
  { id: "strategy", label: "Strategy", icon: "zap" },
  { id: "tournaments", label: "Cup", icon: "trophy" },
  { id: "friends", label: "Friends", icon: "users" },
  { id: "analytics", label: "Analytics", icon: "chart" },
  { id: "fairness", label: "Fair", icon: "check" },
  { id: "replays", label: "Replays", icon: "play" },
];

export function RightPanel({ initialTab = "live" }: { initialTab?: TabId } = {}) {
  const [tab, setTab] = useState<TabId>(initialTab);

  return (
    <div className="glass sheet-scroll flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl">
      <div className="flex shrink-0 gap-1 border-b border-white/10 p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-label={`${t.label} tab`}
            aria-selected={tab === t.id}
            className={`tap-target flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition focus-visible:outline-cyan-400 ${
              tab === t.id
                ? "bg-white/10 text-cyan-300"
                : "text-white/45 hover:bg-white/5 hover:text-white/70"
            }`}
          >
            <Icon name={t.icon} className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="nice-scroll relative flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="p-3"
          >
            {tab === "live" && <Leaderboard />}
            {tab === "chat" && <Chat />}
            {tab === "stats" && <Stats />}
            {tab === "achievements" && <Achievements />}
            {tab === "bets" && <BetHistory />}
            {tab === "missions" && <MissionsPanel />}
            {tab === "cosmetics" && <CosmeticsPanel />}
            {tab === "shop" && <ShopPanel />}
            {tab === "strategy" && <StrategyPanel />}
            {tab === "tournaments" && <TournamentPanel />}
            {tab === "friends" && <FriendsPanel />}
            {tab === "analytics" && <AnalyticsPanel />}
            {tab === "fairness" && <FairnessVerifier />}
            {tab === "replays" && <ReplayViewer />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Leaderboard() {
  const leaderboard = useGameStore((s) => s.leaderboard);
  const online = useGameStore((s) => s.onlineCount);
  const sorted = [...leaderboard].sort((a, b) => b.won - a.won).slice(0, 25);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Online now
        </span>
        <span className="font-mono text-sm font-bold text-emerald-300">
          {online.toLocaleString()}
        </span>
      </div>
      {sorted.map((e, i) => (
        <div
          key={e.id}
          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2"
        >
          <span
            className={`w-5 text-center font-display text-sm font-bold ${
              i === 0
                ? "text-amber-300"
                : i === 1
                ? "text-slate-300"
                : i === 2
                ? "text-orange-400"
                : "text-white/40"
            }`}
          >
            {i + 1}
          </span>
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: e.color }}
          />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white/85">
            {e.name}
          </span>
          <span className="font-mono text-xs font-bold text-lime-300">
            {formatCoins(e.won)}
          </span>
          {e.online && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
        </div>
      ))}
    </div>
  );
}

function Chat() {
  const chat = useGameStore((s) => s.chat);
  const postChat = useGameStore((s) => s.postChat);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const ordered = [...chat].reverse();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length]);

  const submit = () => {
    postChat(text);
    setText("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="nice-scroll sheet-scroll mb-2 max-h-[52vh] space-y-2 overflow-y-auto lg:max-h-[60vh]">
        {ordered.map((m) => (
          <div key={m.id} className="flex items-start gap-2 text-sm">
            <span
              className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
              style={{ background: m.color }}
            />
            <div className="min-w-0">
              <span
                className={`font-semibold ${
                  m.you ? "text-cyan-300" : "text-white/60"
                }`}
              >
                {m.user}
              </span>
              <span className="ml-1 text-white/40">{timeAgo(m.ts)}</span>
              <p className="break-words text-white/85">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="mt-auto flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Say something…"
          maxLength={120}
          enterKeyHint="send"
          className="tap-target min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-400/50"
        />
        <button
          onClick={submit}
          className="tap-target grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white transition hover:opacity-90 focus-visible:outline-cyan-400"
          aria-label="Send message"
        >
          <Icon name="chat" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: BalancePoint[] }) {
  if (data.length < 2) {
    return (
      <div className="grid h-20 place-items-center rounded-xl border border-white/10 bg-black/20 text-xs text-white/30">
        Play to build your balance graph
      </div>
    );
  }
  const W = 300;
  const H = 80;
  const vals = data.map((d) => d.b);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.b - min) / span) * (H - 8) - 4;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  const up = vals[vals.length - 1] >= vals[0];
  const stroke = up ? "#a3e635" : "#f87171";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-20 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
        {label}
      </div>
      <div className={`mt-1 font-mono text-base font-bold ${accent ?? "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function Stats() {
  const stats = useGameStore((s) => s.stats);
  const balance = useGameStore((s) => s.balance);
  const graph = useGameStore((s) => s.balanceGraph);
  const history = useGameStore((s) => s.history);

  const net = stats.totalReturned - stats.totalWagered;
  const decided = stats.wins + stats.losses;
  const winRate = decided ? (stats.wins / decided) * 100 : 0;
  const recent = history.slice(0, 24).reverse();

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Balance graph
          </span>
          <span className="font-mono text-xs text-white/50">
            {formatCoins(balance)}
          </span>
        </div>
        <Sparkline data={graph} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Net profit"
          value={(net >= 0 ? "+" : "") + formatCoins(net)}
          accent={net >= 0 ? "text-lime-300" : "text-rose-300"}
        />
        <StatCard label="Wagered" value={formatCoins(stats.totalWagered)} />
        <StatCard label="Returned" value={formatCoins(stats.totalReturned)} />
        <StatCard
          label="Win rate"
          value={decided ? winRate.toFixed(0) + "%" : "—"}
        />
        <StatCard label="Wins" value={String(stats.wins)} accent="text-emerald-300" />
        <StatCard label="Losses" value={String(stats.losses)} accent="text-rose-300" />
        <StatCard label="Biggest win" value={formatCoins(stats.biggestWin)} />
        <StatCard
          label="Best cashout"
          value={stats.bestMultiplier ? formatMult(stats.bestMultiplier) : "—"}
          accent="text-cyan-300"
        />
        <StatCard label="Rounds" value={String(stats.roundsPlayed)} />
        <StatCard label="Highest crash" value={formatMult(stats.highestCrashSeen)} />
      </div>

      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">
          Recent crashes
        </div>
        <div className="flex h-20 items-end gap-1 rounded-xl border border-white/10 bg-black/20 p-2">
          {recent.length === 0 && (
            <span className="px-2 text-xs text-white/30">No rounds yet</span>
          )}
          {recent.map((r) => {
            const h = Math.min(100, (r.crashPoint / 10) * 100 + 8);
            const color =
              r.crashPoint >= 10
                ? "bg-emerald-400"
                : r.crashPoint >= 2
                ? "bg-fuchsia-400"
                : "bg-rose-400";
            return (
              <div
                key={r.id}
                className="group relative flex-1"
                title={formatMult(r.crashPoint)}
              >
                <div
                  className={`w-full rounded-t ${color} opacity-80`}
                  style={{ height: `${h}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Achievements() {
  const unlocked = useGameStore((s) => s.achievements);
  const set = new Set(unlocked);
  const count = unlocked.length;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-center">
        <span className="font-display text-lg font-bold text-amber-300">
          {count}
        </span>
        <span className="text-white/50"> / {ACHIEVEMENTS.length} unlocked</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const got = set.has(a.id);
          return (
            <div
              key={a.id}
              className={`rounded-xl border p-3 transition ${
                got
                  ? "border-amber-400/40 bg-amber-400/10"
                  : "border-white/10 bg-white/[0.02] opacity-50"
              }`}
            >
              <div className="text-2xl">{got ? a.icon : "🔒"}</div>
              <div className="mt-1 text-xs font-bold text-white/90">{a.name}</div>
              <div className="text-[10px] leading-tight text-white/50">
                {a.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BetHistory() {
  const bets = useGameStore((s) => s.betHistory);

  if (bets.length === 0) {
    return (
      <div className="grid place-items-center py-10 text-center text-sm text-white/30">
        <Icon name="clock" className="mb-2 h-8 w-8 text-white/20" />
        No bets placed yet.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {bets.map((b) => (
        <div
          key={`${b.roundId}-${b.ts}`}
          className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-sm"
        >
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
              b.win
                ? "bg-emerald-400/15 text-emerald-300"
                : "bg-rose-400/15 text-rose-300"
            }`}
          >
            <Icon name={b.win ? "check" : "x"} className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-xs text-white/50">
              {formatCoins(b.amount)} {b.multiplier ? "@ " + formatMult(b.multiplier) : "· crashed"}
            </div>
            <div className="text-[10px] text-white/30">{timeAgo(b.ts)}</div>
          </div>
          <span
            className={`font-mono text-sm font-bold ${
              b.win ? "text-lime-300" : "text-rose-400"
            }`}
          >
            {b.win ? "+" + formatCoins(b.payout) : "-" + formatCoins(b.amount)}
          </span>
        </div>
      ))}
      <p className="pt-1 text-center text-[10px] text-white/25">
        Showing last {GAME.BET_HISTORY_LIMIT} bets
      </p>
    </div>
  );
}
