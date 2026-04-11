# FIANA - 投資体験シミュレーター

ハピネスプラスEAの集客アプリ。投資タイプ診断 → 記述式結果 → 2週間体験版 → 個別相談誘導のフロー。

## セットアップ

```bash
npm install
cp .env.example .env.local
# .env.local に Supabase の URL と ANON KEY を入力
npm run dev
```

## ルート

- `/` — エントリ（自動リダイレクト）
- `/register` / `/login` — Google OAuth 認証
- `/shindan` — 投資タイプ診断（12問）
- `/result` — 診断結果（動物タイプ＋長文＋個別相談CTA）
- `/dashboard` — 3タブ（体験版／バックテスト／経済指標）
- `/backtest` — 詳細バックテスト

## 実績データの差し替え

`src/lib/fiana-happiness-data.ts` 上部のTODOを参照。ハピネスプラスの実績を3箇所差し替えれば反映されます。
