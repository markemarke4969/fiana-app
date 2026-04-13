"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { isDemoMode, getDemoProfile, saveDemoProfile } from "@/lib/fiana-demo";
import { LINE_URL, formatJPY, formatJPYPlain } from "@/lib/fiana-config";
import {
  HAPPINESS_DAILY_STATS,
  HAPPINESS_RECENT_TRADES,
  scaleByCapital,
  scaleLot,
} from "@/lib/fiana-happiness-data";

// ========================================
// MT4 風フォーマッタ（半角スペース区切り・小数点2桁）
// 例: 1 234 567.89
// ========================================
function fmtMT4(n: number): string {
  const sign = n < 0 ? "-" : "";
  const [intPart, decPart] = Math.abs(n).toFixed(2).split(".");
  return `${sign}${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}.${decPart}`;
}
function fmtMT4Signed(n: number): string {
  return n >= 0 ? `+${fmtMT4(n)}` : fmtMT4(n);
}

// MT4 損益カラー（MT4 iOS はプラス損益を BUY と同じ青で表示）
const MT4_RED = "#FF3B30";
const MT4_BUY = "#2196F3";

// ========================================
// 型
// ========================================
interface Profile {
  user_id: string;
  virtual_deposit: number;
  lot_size: number;
  trial_start_date: string;
  animal_type?: string;
  current_assets?: number;
}

type TabKey = "trial" | "backtest" | "economy";

const TRIAL_DAYS_FREE = 14;

// ========================================
// メインダッシュボード
// ========================================
export default function FianaDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("trial");

  useEffect(() => {
    const load = async () => {
      if (isDemoMode()) {
        const demo = getDemoProfile();
        if (!demo?.virtual_deposit) {
          router.replace("/shindan");
          return;
        }
        if (!demo.trial_start_date) {
          const today = new Date().toISOString().split("T")[0];
          saveDemoProfile({ trial_start_date: today });
          demo.trial_start_date = today;
        }
        setProfile({
          user_id: demo.user_id,
          virtual_deposit: demo.virtual_deposit,
          lot_size: demo.lot_size || 0.03,
          trial_start_date: demo.trial_start_date,
          animal_type: demo.animal_type,
          current_assets: demo.current_assets,
        });
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("fiana_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (!data?.virtual_deposit) {
        router.replace("/shindan");
        return;
      }

      if (!data.trial_start_date) {
        const today = new Date().toISOString().split("T")[0];
        await supabase
          .from("fiana_profiles")
          .update({ trial_start_date: today })
          .eq("user_id", session.user.id);
        data.trial_start_date = today;
      }

      setProfile({
        user_id: data.user_id,
        virtual_deposit: data.virtual_deposit,
        lot_size: data.lot_size || 0.03,
        trial_start_date: data.trial_start_date,
        animal_type: data.animal_type,
        current_assets: data.current_assets,
      });
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="fiana-heading text-2xl font-bold fiana-text-glow mb-4">
            FIANA
          </h1>
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  const accountNo = `FIA-${Math.floor(
    profile.virtual_deposit * 7 + profile.lot_size * 1000 + 100000,
  )
    .toString()
    .slice(0, 7)}`;

  return (
    <div
      className="min-h-screen bg-black text-white pb-24 relative"
      style={{ WebkitFontSmoothing: "antialiased" }}
    >
      {/* MT4 風タイトルバー */}
      <header className="sticky top-0 z-20 bg-[#0b0b0b] border-b border-[#1f1f1f]">
        <div className="max-w-lg mx-auto px-4 h-[46px] flex items-center justify-between">
          <div className="text-[11px] text-gray-500 font-mono tracking-wider">
            {accountNo}
          </div>
          <div className="text-[14px] font-medium tracking-wide text-white">
            口座履歴
          </div>
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#2196F3] hover:text-blue-300"
          >
            相談
          </a>
        </div>
      </header>

      {/* MT4 風タブ（下線アクティブ） */}
      <nav className="sticky top-[46px] z-10 bg-[#0b0b0b] border-b border-[#1f1f1f]">
        <div className="max-w-lg mx-auto grid grid-cols-3">
          {[
            { key: "trial" as const, label: "履歴" },
            { key: "backtest" as const, label: "バックテスト" },
            { key: "economy" as const, label: "ニュース" },
          ].map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`py-3 text-[13px] font-medium transition-colors ${
                  active ? "text-white" : "text-gray-500"
                }`}
                style={{
                  borderBottom: active
                    ? `2px solid ${MT4_BUY}`
                    : "2px solid transparent",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* コンテンツ */}
      <div className="max-w-lg mx-auto">
        {tab === "trial" && <TrialTab profile={profile} />}
        {tab === "backtest" && (
          <div className="px-4 py-5">
            <BacktestTab profile={profile} />
          </div>
        )}
        {tab === "economy" && (
          <div className="px-4 py-5">
            <EconomyTab profile={profile} />
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// システム体験版タブ（ハピネスプラス実績データ）
// ========================================
function TrialTab({ profile }: { profile: Profile }) {
  const daysElapsed = useMemo(() => {
    const start = new Date(profile.trial_start_date).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  }, [profile.trial_start_date]);

  const daysLeft = Math.max(0, TRIAL_DAYS_FREE - daysElapsed);
  const expired = daysLeft <= 0;
  const deposit = profile.virtual_deposit;

  // ハピネスプラスの実績データをユーザー資金にスケーリング
  const scaled = useMemo(() => {
    const dailyStats = HAPPINESS_DAILY_STATS.map((d) => ({
      ...d,
      profit: scaleByCapital(d.profitAtBase, deposit),
    }));

    // 累積損益を算出して資産推移を作る
    let running = 0;
    const equityCurve = dailyStats.map((d) => {
      running += d.profit;
      return {
        date: d.date,
        profit: d.profit,
        equity: deposit + running,
      };
    });

    const totalProfit = running;
    const totalTrades = dailyStats.reduce((s, d) => s + d.trades, 0);
    const totalWins = dailyStats.reduce((s, d) => s + d.wins, 0);
    const totalLosses = dailyStats.reduce((s, d) => s + d.losses, 0);
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
    const returnRate = (totalProfit / deposit) * 100;

    const trades = HAPPINESS_RECENT_TRADES.map((t) => ({
      ...t,
      lot: scaleLot(t.lotAtBase, deposit),
      profit: scaleByCapital(t.profitAtBase, deposit),
    }));

    return {
      dailyStats,
      equityCurve,
      totalProfit,
      totalTrades,
      totalWins,
      totalLosses,
      winRate,
      returnRate,
      trades,
    };
  }, [deposit]);

  const equity = deposit + scaled.totalProfit;

  // 取引を日付でグルーピング（新しい日付が上）
  const tradesByDate = useMemo(() => {
    const groups = new Map<string, typeof scaled.trades>();
    for (const t of scaled.trades) {
      if (!groups.has(t.date)) groups.set(t.date, []);
      groups.get(t.date)!.push(t);
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [scaled.trades]);

  return (
    <div>
      {/* 体験版ステータス（MT4 らしさを壊さない薄い帯） */}
      <div
        className="px-4 h-[24px] flex items-center justify-between text-[11px] font-mono border-b border-[#1f1f1f] bg-[#0a0a0a]"
        style={{ letterSpacing: "0.05em" }}
      >
        <span className="text-gray-500">
          {expired ? "DEMO EXPIRED" : "DEMO ACCOUNT"}
        </span>
        <span className={expired ? "text-[#FF3B30]" : "text-gray-500"}>
          {expired ? "期間終了" : `体験版 残り ${daysLeft} 日`}
        </span>
      </div>

      {/* アカウントサマリー */}
      <div className="px-4 py-3 border-b border-[#1f1f1f] text-[14px] space-y-[3px]">
        <SummaryRow label="残高:" value={fmtMT4(deposit)} />
        <SummaryRow label="有効証拠金:" value={fmtMT4(equity)} />
        <SummaryRow label="損益:" value="0.00" />
        <SummaryRow label="預託証拠金:" value="0.00" />
        <SummaryRow label="空き証拠金:" value={fmtMT4(equity)} />
      </div>

      {/* 日付ごとの取引履歴 */}
      {tradesByDate.map(([date, trades]) => {
        const dayTotal = trades.reduce((s, t) => s + t.profit, 0);
        return (
          <div key={date}>
            {/* 日付セパレータ（MT4 の "2026.04.10" スタイル） */}
            <div className="px-4 h-[28px] flex items-center justify-between bg-[#111] border-b border-[#1f1f1f] text-[12px] font-mono">
              <span className="text-gray-400">
                {date.replace(/-/g, ".")}
              </span>
              <span
                style={{ color: dayTotal >= 0 ? MT4_BUY : MT4_RED }}
              >
                {fmtMT4Signed(dayTotal)}
              </span>
            </div>

            {/* 取引行（2行: 種別/Lot/損益 + 時刻/価格） */}
            {trades.map((t) => (
              <div
                key={t.id}
                className="px-4 py-2 border-b border-[#1a1a1a]"
              >
                <div className="flex items-baseline justify-between text-[14px] font-mono">
                  <span className="text-white">
                    {t.pair},{" "}
                    <span
                      style={{
                        color:
                          t.direction === "BUY" ? MT4_BUY : MT4_RED,
                      }}
                    >
                      {t.direction.toLowerCase()}
                    </span>{" "}
                    {t.lot.toFixed(2)}
                  </span>
                  <span
                    style={{
                      color: t.profit >= 0 ? MT4_BUY : MT4_RED,
                    }}
                  >
                    {fmtMT4Signed(t.profit)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-[12px] font-mono text-gray-500 mt-0.5">
                  <span>
                    {date.replace(/-/g, ".")} {t.time}
                  </span>
                  <span>
                    {t.entryPrice.toFixed(3)} → {t.exitPrice.toFixed(3)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* 合計 */}
      <div className="px-4 py-3 bg-[#0a0a0a] border-b border-[#1f1f1f] flex items-baseline justify-between text-[14px] font-mono">
        <span className="text-gray-400">合計:</span>
        <span
          style={{
            color: scaled.totalProfit >= 0 ? MT4_BUY : MT4_RED,
          }}
          className="font-bold"
        >
          {fmtMT4Signed(scaled.totalProfit)}
        </span>
      </div>

      {/* サブサマリー（取引数・勝率・収益率） */}
      <div className="px-4 py-2 border-b border-[#1f1f1f] text-[12px] font-mono text-gray-500 flex items-baseline justify-between">
        <span>取引数: {scaled.totalTrades}</span>
        <span>勝率: {scaled.winRate.toFixed(1)}%</span>
        <span style={{ color: MT4_BUY }}>
          +{scaled.returnRate.toFixed(2)}%
        </span>
      </div>

      {/* 相談CTA（MT4 画面外） */}
      <div className="px-4 py-5">
        <ConsultCTA
          headline={
            expired
              ? "体験期間が終了しました"
              : `あなたの${formatJPYPlain(deposit)}で実運用に切り替える前に`
          }
          body={
            expired
              ? "実際の運用に切り替えるかどうか、資産運用アドバイザーと個別に相談できます。"
              : `体験中の実績（${formatJPY(scaled.totalProfit)} / 収益率 +${scaled.returnRate.toFixed(1)}%）をもとに、あなた専用の運用プランを無料で作成します。`
          }
        />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-mono">{value}</span>
    </div>
  );
}

// ========================================
// バックテストタブ
// ========================================
function BacktestTab({ profile }: { profile: Profile }) {
  const router = useRouter();

  // 決定論的な結果を初期資金から生成
  const result = useMemo(() => {
    const deposit = profile.virtual_deposit;
    // 月利8.3% ± depositによる微調整
    const rate = 0.083 + ((deposit % 7) / 1000);
    const profit = Math.round(deposit * rate);
    const trades = 42 + (deposit % 11);
    const wins = Math.round(trades * 0.69);
    return {
      deposit,
      profit,
      finalBalance: deposit + profit,
      rate: (rate * 100).toFixed(1),
      trades,
      wins,
      losses: trades - wins,
      winRate: ((wins / trades) * 100).toFixed(0),
    };
  }, [profile.virtual_deposit]);

  return (
    <div className="space-y-4">
      <div className="fiana-card p-5 text-center">
        <p className="text-[11px] text-indigo-400 mb-2 tracking-wide">
          バックテスト検証結果
        </p>
        <p className="text-xs text-gray-500 mb-3">
          検証期間：2026-01-01 〜 2026-01-31（1ヶ月）
        </p>
        <div
          className="rounded-2xl p-6 mb-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))",
            border: "1px solid rgba(16,185,129,0.35)",
          }}
        >
          <p className="text-[11px] text-emerald-200/70 mb-1">
            あなたの {formatJPYPlain(result.deposit)} で検証した結果
          </p>
          <p className="text-4xl font-bold text-emerald-300 mb-2">
            {formatJPY(result.profit)}
          </p>
          <p className="text-[13px] text-emerald-200/80">
            収益率 +{result.rate}% ／ 最終残高{" "}
            {formatJPYPlain(result.finalBalance)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[10px] text-gray-500">取引回数</p>
            <p className="text-base font-bold text-white">{result.trades}回</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[10px] text-gray-500">勝率</p>
            <p className="text-base font-bold text-green-400">
              {result.winRate}%
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[10px] text-gray-500">勝ち/負け</p>
            <p className="text-base font-bold text-white">
              {result.wins}/{result.losses}
            </p>
          </div>
        </div>
      </div>

      {/* 詳細シミュレーションへ */}
      <button
        onClick={() => router.push("/backtest")}
        className="w-full py-4 rounded-xl border border-white/15 text-gray-200 font-medium hover:bg-white/5 transition-all"
      >
        詳細バックテスト（期間・システム指定）→
      </button>

      {/* 相談CTA */}
      <ConsultCTA
        headline="この結果をもとに、あなた専用の運用プランを作ります"
        body={`${formatJPYPlain(result.deposit)}の運用で狙える現実的な目標設定・リスク管理まで、資産運用アドバイザーが無料で個別にご提案します。`}
      />

      <p className="text-center text-[10px] text-gray-600">
        ※シミュレーションに基づく過去検証です。将来の利益を保証するものではありません。
      </p>
    </div>
  );
}

// ========================================
// 経済指標タブ
// ========================================
function EconomyTab({ profile }: { profile: Profile }) {
  const assets = profile.current_assets ?? 0;

  // ダミーの経済指標データ
  const events = [
    {
      date: "04/12",
      time: "21:30",
      country: "🇺🇸",
      name: "米 消費者物価指数 (CPI)",
      impact: "high",
    },
    {
      date: "04/13",
      time: "03:00",
      country: "🇺🇸",
      name: "FOMC議事要旨公表",
      impact: "high",
    },
    {
      date: "04/14",
      time: "08:50",
      country: "🇯🇵",
      name: "日銀 企業物価指数",
      impact: "mid",
    },
    {
      date: "04/15",
      time: "21:30",
      country: "🇺🇸",
      name: "米 小売売上高",
      impact: "high",
    },
    {
      date: "04/16",
      time: "15:00",
      country: "🇪🇺",
      name: "欧 ECB政策金利発表",
      impact: "high",
    },
  ];

  const news = [
    {
      tag: "為替",
      title: "ドル円、トランプ発言で一時1円超の円安進行",
      summary: "関税に関する発言を受け、ドル円相場が急伸。",
    },
    {
      tag: "株式",
      title: "日経平均、半導体株主導で反発",
      summary: "米ハイテク株高を受けて買い優勢の展開。",
    },
    {
      tag: "金利",
      title: "米10年債利回り、4.6%台に上昇",
      summary: "インフレ再燃懸念から長期金利が上昇基調。",
    },
  ];

  // 今週の変動影響額（ダミー試算: 資産の0.4%程度動いた想定）
  const weeklyImpact = assets ? Math.round(assets * -0.004) : null;

  return (
    <div className="space-y-4">
      {/* 今週のポートフォリオ影響 */}
      {weeklyImpact !== null && (
        <div
          className="rounded-2xl p-5 border"
          style={{
            background:
              "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(249,115,22,0.08))",
            borderColor: "rgba(239,68,68,0.3)",
          }}
        >
          <p className="text-[11px] text-orange-300 mb-2 tracking-wide">
            ⚠️ 今週のあなたのポートフォリオ影響
          </p>
          <p className="text-xs text-gray-300 mb-3 leading-relaxed">
            ドル円が1円超の円安進行。保有資産{formatJPYPlain(assets)}の方は
            概算で以下の影響が出ています：
          </p>
          <p className="text-3xl font-bold text-red-300">
            {formatJPY(weeklyImpact)}
          </p>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-400 mb-2">
              値幅が大きい週は、分散の見直しが有効です
            </p>
            <a
              href={LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2.5 text-sm font-bold rounded-xl"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "white",
              }}
            >
              ポートフォリオ分散を相談する
            </a>
          </div>
        </div>
      )}

      {/* 経済指標カレンダー */}
      <div className="fiana-card p-5">
        <h2 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-lg">📅</span>今週の経済指標カレンダー
        </h2>
        <div className="space-y-2">
          {events.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2.5 border-b border-white/5"
            >
              <div className="text-center w-12 shrink-0">
                <p className="text-xs font-bold text-white">{e.date}</p>
                <p className="text-[10px] text-gray-500">{e.time}</p>
              </div>
              <span className="text-lg">{e.country}</span>
              <p className="flex-1 text-xs text-gray-200">{e.name}</p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  e.impact === "high"
                    ? "bg-red-500/20 text-red-300"
                    : "bg-yellow-500/20 text-yellow-300"
                }`}
              >
                {e.impact === "high" ? "高" : "中"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ニュース一覧 */}
      <div className="fiana-card p-5">
        <h2 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-lg">📰</span>注目ニュース
        </h2>
        <div className="space-y-3">
          {news.map((n, i) => (
            <div key={i} className="pb-3 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                  {n.tag}
                </span>
              </div>
              <p className="text-sm font-bold text-white mb-1">{n.title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {n.summary}
              </p>
            </div>
          ))}
        </div>
      </div>

      <ConsultCTA
        headline="相場の流れに合った運用戦略を知りたい方へ"
        body="経済指標の動きに合わせて、あなたの資産をどう守り、どう攻めるか——専門アドバイザーが一緒に整理します。"
      />
    </div>
  );
}

// ========================================
// 共通: 個別相談CTA
// ========================================
function ConsultCTA({
  headline,
  body,
}: {
  headline: string;
  body: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        background:
          "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.1))",
        borderColor: "rgba(139,92,246,0.35)",
        boxShadow: "0 0 30px rgba(99,102,241,0.2)",
      }}
    >
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">💬</div>
        <h3 className="fiana-heading text-base font-bold text-white mb-2 leading-snug">
          {headline}
        </h3>
        <p className="text-xs text-gray-300 leading-relaxed">{body}</p>
      </div>
      <a
        href={LINE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full fiana-btn text-center py-3.5 text-sm font-bold"
      >
        無料で個別相談を予約する
      </a>
      <p className="text-center text-[10px] text-gray-500 mt-2">
        LINEで相談日時を調整します
      </p>
    </div>
  );
}
