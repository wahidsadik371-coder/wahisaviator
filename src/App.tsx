// Wahid's Aviator — application shell.
// Wires the simulated engine to the store, boots the round loop, and lays out
// the responsive game UI. All branding credits Developer Wahid Sadik.
//
// RESPONSIVE LAYOUT:
//   - Desktop (≥1024px): unchanged 2-column grid (arena | right panel).
//   - Mobile (<1024px): single column. Arena fills viewport height. The
//     right panel becomes a slide-up bottom sheet summoned by a floating
//     tab bar (Live / Chat / Stats / Awards / Bets). Betting panel sits
//     above the tab bar. This keeps the arena, the bet button, and the
//     panel-tabs all within thumb reach on a phone.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { engine } from "@/engine/crashEngine";
import { useGameStore } from "@/store/useGameStore";
import { sound } from "@/lib/sound";
import { APP } from "@/lib/constants";
import { useInterval, useIsMobile } from "@/hooks";
import { installDevTools } from "@/utils/devTools";
import { monitoring } from "@/lib/monitoring";

import { Background } from "@/components/Background";
import { MadeByBadge } from "@/components/Watermark";
import { TopBar } from "@/components/TopBar";
import { HistoryStrip } from "@/components/HistoryStrip";
import { CrashArena } from "@/components/CrashArena";
import { BettingPanel } from "@/components/BettingPanel";
import { RightPanel, type TabId, TABS } from "@/components/RightPanel";
import { Confetti } from "@/components/Confetti";
import { Toasts } from "@/components/Toasts";
import { SettingsModal } from "@/components/SettingsModal";
import { DailyBonusModal } from "@/components/DailyBonusModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppBootLoader } from "@/components/AppBootLoader";
import { Icon } from "@/components/icons";
import { ErrorReporter } from "@/components/ErrorReporter";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { DebugOverlay } from "@/components/DebugOverlay";
import { ProfileModal } from "@/components/ProfileModal";

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [booted, setBooted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isMobile = useIsMobile();
  const [sheetTab, setSheetTab] = useState<TabId | null>(null);

  useEffect(() => {
    const store = useGameStore.getState();
    store.init();

    // Initialize the engine with the provably-fair seed system.
    // The engine generates a server seed epoch and pre-computes the first
    // crash point asynchronously via HMAC-SHA256.
    let cancelled = false;
    engine.init(store.clientSeed || "").then(() => {
      if (cancelled) return;
      engine.cb = {
        onLaunch: (roundId) => useGameStore.getState().onLaunch(roundId),
        onCrash: (snap) => useGameStore.getState().onCrash(snap),
        onTick: (snap) =>
          useGameStore.getState().checkAutoCashout(snap.multiplier),
        onCountdownSecond: (sec) => {
          if (sec > 0 && sec <= 3) sound.play("tick");
        },
        onSeedEpochEnd: (epoch) => useGameStore.getState().onSeedEpochEnd(epoch),
      };
      engine.markCallbacksWired();
      engine.start();
    });

    const unlock = () => sound.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    const bootTimer = window.setTimeout(() => setBooted(true), 350);

    installDevTools({
      getState: () => useGameStore.getState(),
      setState: (s) => useGameStore.setState(s),
    });
    monitoring.breadcrumb("session", "app_mount", {});

    return () => {
      cancelled = true;
      window.clearTimeout(bootTimer);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      engine.cb = {};
      engine.stop();
    };
  }, []);

  useInterval(() => useGameStore.getState().tickSocial(), 4000);

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <ErrorBoundary
        fallback={<CrashFallback label="Background failed to load" />}
      >
        <Background />
      </ErrorBoundary>

      <TopBar onOpenSettings={() => setSettingsOpen(true)} />

      {/* CRITICAL: main is a flex column so section can flex-1 and inherit
          main's definite height (which comes from flex-1 in the outer
          min-h-[100dvh] flex-col). Without this, section's height is auto
          and the arena's flex-1 has no space to fill → arena collapses. */}
      <main className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-1 flex-col px-3 pb-4 pt-3 lg:px-4 lg:pb-8">
        {isMobile ? (
          <MobileLayout
            sheetTab={sheetTab}
            setSheetTab={setSheetTab}
          />
        ) : (
          <DesktopLayout />
        )}

        <footer className="mx-auto mt-4 max-w-3xl space-y-2 border-t border-white/10 pt-4 text-center lg:mt-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <MadeByBadge />
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-white/35">
              {APP.NAME}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-white/50">
            Virtual coins only — no real money, purchases, or withdrawals. Provably-fair local simulation.
          </p>
          <p className="text-xs text-white/30">
            © {APP.YEAR} {APP.NAME}. Designed & built by{" "}
            <span className="font-semibold text-cyan-300/70">
              {APP.DEVELOPER}
            </span>
          </p>
        </footer>
      </main>

      <ErrorBoundary fallback={null}>
        <Confetti />
      </ErrorBoundary>

      <Toasts />
      <DailyBonusModal />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <TutorialOverlay />

      {/* Phase 1: Error reporter (invisible) */}
      <ErrorReporter />
      {/* Phase 6: Global keyboard shortcuts (invisible) */}
      <KeyboardShortcuts />
      {/* Phase 9: Debug overlay (dev-only, toggled via Ctrl+Shift+D) */}
      <DebugOverlay />

      {!booted && <AppBootLoader />}
    </div>
  );
}

/** Desktop: 2-column grid with the right panel docked on the right. */
function DesktopLayout() {
  return (
    <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_372px]">
      <section className="flex min-h-[70vh] flex-col gap-3">
        <HistoryStrip />
        {/* absolute inset-0 wrapper gives CrashArena a definite height.
            h-full alone doesn't resolve when the parent's height comes
            from min-height in a flex context. */}
        <div className="relative min-h-[330px] flex-1">
          <div className="absolute inset-0">
            <ErrorBoundary fallback={<CrashFallback label="Game arena unavailable" />}>
              <CrashArena />
            </ErrorBoundary>
          </div>
        </div>
        <BettingPanel />
      </section>

      <aside className="lg:sticky lg:top-[140px] lg:h-[calc(100dvh-160px)]">
        <RightPanel />
      </aside>
    </div>
  );
}

/** Primary tabs shown in the mobile floating tab bar (5 max for thumb reach).
 *  The remaining tabs are accessible via the "More" button. */
const PRIMARY_MOBILE_TABS: TabId[] = ["live", "chat", "stats", "missions"];
const SECONDARY_MOBILE_TABS: TabId[] = [
  "achievements", "bets", "cosmetics", "shop", "strategy",
  "tournaments", "friends", "analytics", "fairness", "replays",
];

/**
 * Mobile: arena fills available height, betting panel sits above a floating
 * tab bar that summons a slide-up bottom sheet containing the RightPanel.
 *
 * FIXES APPLIED:
 *   - section has flex-1 to inherit main's definite height (main is now
 *     a flex column). This fixes the arena collapsing to 2px.
 *   - Only 5 primary tabs shown in the floating bar (4 + More). The
 *     remaining 10 tabs are in the "More" sheet. This prevents the
 *     14×44px=616px overflow.
 *   - Tab buttons use min-w-0 (not .tap-target min-w-44) so they can
 *     shrink to fit the container.
 *   - 100dvh used everywhere for dynamic viewport.
 */
function MobileLayout({
  sheetTab,
  setSheetTab,
}: {
  sheetTab: TabId | null;
  setSheetTab: (t: TabId | null) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  // Close any open sheet on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSheetTab(null);
        setMoreOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSheetTab]);

  const primaryTabs = TABS.filter((t) => PRIMARY_MOBILE_TABS.includes(t.id));
  const secondaryTabs = TABS.filter((t) => SECONDARY_MOBILE_TABS.includes(t.id));

  return (
    <>
      {/* section has flex-1 + min-h-0 so it can shrink below its content's
          natural height on short viewports (e.g. landscape phone). Without
          min-h-0, flex children default to min-height: auto and the section
          would overflow instead of letting the arena shrink. */}
      <section className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden lg:gap-2">
        <HistoryStrip />
        {/* Arena: absolute inset-0 wrapper gives CrashArena a definite height.
            min-h uses clamp() so it shrinks on short viewports (e.g. 120px on
            a 400px-tall landscape phone) but grows on tall ones (300px on
            portrait). The flex-1 lets it absorb remaining space. */}
        <div
          className="relative flex-1 overflow-hidden"
          style={{ minHeight: "max(140px, 30dvh)" }}
        >
          <div className="absolute inset-0">
            <ErrorBoundary fallback={<CrashFallback label="Game arena unavailable" />}>
              <CrashArena />
            </ErrorBoundary>
          </div>
        </div>
        <BettingPanel />
      </section>

      {/* Floating tab bar — 4 primary tabs + "More" button.
          Each tab uses min-w-0 so it can shrink to fit; no .tap-target min-w-44. */}
      <div className="safe-x sticky bottom-2 z-20 mt-2 shrink-0">
        <div className="glass-strong flex gap-1 rounded-2xl p-1.5 shadow-2xl">
          {primaryTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSheetTab(sheetTab === t.id ? null : t.id)}
              aria-label={`Open ${t.label} panel`}
              aria-pressed={sheetTab === t.id}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-semibold transition focus-visible:outline-cyan-400 ${
                sheetTab === t.id
                  ? "bg-cyan-400/20 text-cyan-300"
                  : "text-white/55 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <Icon name={t.icon} className="h-4 w-4" />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
          {/* More button — opens a sheet listing secondary tabs */}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="Open more panels"
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-semibold text-white/55 transition hover:bg-white/5 hover:text-white/80 focus-visible:outline-cyan-400"
          >
            <Icon name="settings" className="h-4 w-4" />
            <span className="truncate">More</span>
          </button>
        </div>
      </div>

      {/* Bottom sheet for primary tabs — slides up, dims the arena. */}
      <AnimatePresence>
        {sheetTab && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSheetTab(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="safe-x relative max-h-[85dvh] overflow-hidden rounded-t-3xl border-t border-white/10"
              style={{ overscrollBehavior: "contain" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="safe-top flex justify-center pt-2">
                <div className="h-1.5 w-10 rounded-full bg-white/25" />
              </div>
              <div className="h-[75dvh] max-h-[75dvh] overflow-hidden p-2">
                <RightPanelWithTab tab={sheetTab} />
              </div>
              <div className="safe-bottom h-2" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "More" sheet — lists secondary tabs in a grid. Tapping one opens
          that tab's bottom sheet. */}
      <AnimatePresence>
        {moreOpen && !sheetTab && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMoreOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="safe-x relative overflow-hidden rounded-t-3xl border-t border-white/10"
              style={{ overscrollBehavior: "contain" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="safe-top flex justify-center pt-2">
                <div className="h-1.5 w-10 rounded-full bg-white/25" />
              </div>
              <div className="p-3">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">
                  More panels
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {secondaryTabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSheetTab(t.id);
                        setMoreOpen(false);
                      }}
                      className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-cyan-400"
                    >
                      <Icon name={t.icon} className="h-5 w-5" />
                      <span className="truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="safe-bottom h-2" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Renders RightPanel with a specific tab pre-selected. We use a `key` prop
 * so mounting a new tab remounts the panel cleanly without leaking state
 * between sheet opens.
 */
function RightPanelWithTab({ tab }: { tab: TabId }) {
  return <RightPanel key={tab} initialTab={tab} />;
}

function CrashFallback({ label }: { label: string }) {
  return (
    <div
      role="alert"
      className="grid min-h-[200px] place-items-center rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-center"
    >
      <div>
        <div className="font-sans font-bold text-sm font-bold uppercase tracking-widest text-red-300">
          {label}
        </div>
        <p className="mt-1 text-xs text-white/50">
          Please reload the page. If the issue persists, try a different
          browser.
        </p>
      </div>
    </div>
  );
}
