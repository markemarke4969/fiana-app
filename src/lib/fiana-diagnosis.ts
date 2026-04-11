// ========================================
// 診断ロジック
// ========================================
// 12問の質問 + 生年月日で投資タイプを診断
// 動物占い風に「積極運用型のライオンタイプ」のような見出し＋長文の記述を返す
//
// 動物決定ロジック（生年月日あり）:
//   1. 診断スコアの上位2つで動物候補プール（3種）を絞り込む
//   2. 生年月日から決定論的にプール内の1種を選ぶ
//   → 同じ生年月日でも答えが違えば違う動物、答えが同じでも生年月日で動物が変わる
//
// さらに生年月日からは「運命数(1-9)」と「12星座」を算出して表示し
// 動物占いらしい「当たってる感」を演出する

// ========================================
// 動物タイプ定義
// ========================================
export interface AnimalType {
  id: string;
  animal: string;
  emoji: string;
  name: string;
  investorType: string;
  headline: string;
  description: string;
  longDescription: string;
  traits: string[];
}

export const ANIMAL_TYPES: AnimalType[] = [
  {
    id: "fox",
    animal: "キツネ",
    emoji: "🦊",
    name: "堅実キツネタイプ",
    investorType: "安定重視型",
    headline: "安定重視型のキツネタイプ",
    description: "リスクを賢く見極め、着実に資産を積み上げるタイプ。",
    longDescription:
      "あなたは、ひと目で状況の「におい」を嗅ぎ分けるキツネのような冷静さを持った投資家です。周囲が盛り上がる相場にも簡単には飛び乗らず、本当に勝てる局面をじっと待てる忍耐力と、無駄な負けを嫌う合理性が最大の武器です。\n\n一方で、慎重すぎるがゆえに「気になっているのに動けずに機会を逃す」「自分では決めきれず先延ばしにしてしまう」という傾向も持っています。情報は十分に集まっているのに、最後のスイッチだけ入らない——そんな経験に心当たりはありませんか？\n\nキツネタイプが結果を出しやすいのは、ルールが明確で感情の入り込む余地が少ない運用スタイルです。自分の判断だけに頼るより、信頼できる仕組みやプロの視点を一枚かませることで、あなたの慎重さは「堅実に勝つ力」へと変わります。",
    traits: ["慎重", "分析的", "着実"],
  },
  {
    id: "owl",
    animal: "フクロウ",
    emoji: "🦉",
    name: "戦略フクロウタイプ",
    investorType: "長期戦略型",
    headline: "長期戦略型のフクロウタイプ",
    description: "深い洞察力で長期的に資産を育てるタイプ。",
    longDescription:
      "あなたは暗闇の中でも獲物を捉える夜の賢者、フクロウのように、目先の値動きよりも「全体像」と「流れ」を見る眼を持った投資家です。短期的な上げ下げに一喜一憂せず、時間を味方につけることの価値を直感的に理解できる、数少ないタイプでもあります。\n\nそのぶん、頭で考えすぎて最初の一歩が重くなりがちです。「もっと勉強してから」「もう少し良いタイミングで」と言いながら、実は一番もったいない時間＝何もしていない時間を積み重ねていないでしょうか。\n\nフクロウタイプの強みは、情報を体系立てて整理する力です。独りで調べ続けるよりも、専門家と一緒に戦略そのものを組み立てる場を持つほうが、圧倒的にスピードと精度が上がります。あなたに必要なのは「学ぶ」ことではなく、「学んだことを動かす相棒」です。",
    traits: ["知的", "忍耐強い", "戦略的"],
  },
  {
    id: "eagle",
    animal: "イーグル",
    emoji: "🦅",
    name: "攻撃イーグルタイプ",
    investorType: "積極成長型",
    headline: "積極成長型のイーグルタイプ",
    description: "大きなチャンスを逃さない鋭い眼を持つタイプ。",
    longDescription:
      "あなたは高い空から獲物を一気に仕留めるイーグルのような、決断力と瞬発力を持つ投資家です。小さく稼ぐよりも、人生を変えるような大きなリターンに強く惹かれるタイプで、「攻めてこそ投資」という感覚を本能的に持っています。\n\nその反面、勝負どころで感情が先走り、勝ちを急ぎすぎて損失を膨らませてしまうことがあります。あなたの最大のリスクは相場ではなく、「勝ちたい気持ち」そのものです。\n\nイーグルタイプの力が一番発揮されるのは、攻めと守りの役割がきちんと分かれた運用の仕組みの中にいる時です。エントリーとエグジットをプロのロジックに預けてしまえば、あなたは本来得意な「大局の判断」と「次の一手」に集中できるようになります。正しく翼を休ませるほど、次の飛躍は大きくなります。",
    traits: ["大胆", "行動的", "野心的"],
  },
  {
    id: "dolphin",
    animal: "イルカ",
    emoji: "🐬",
    name: "バランスイルカタイプ",
    investorType: "バランス重視型",
    headline: "バランス重視型のイルカタイプ",
    description: "安定と成長の両方を取りにいくタイプ。",
    longDescription:
      "あなたは群れで動きながら、場の空気を読んで賢く泳ぎを変えるイルカのような、しなやかな投資家です。極端な安全策も、一発逆転狙いも好まず、「守りながら育てる」という言葉に一番しっくり来るのではないでしょうか。\n\nバランス感覚が良いことは最大の武器ですが、裏を返すと「軸がブレやすい」という弱点にもなります。情報が増えるほど迷いが生まれ、気づけば一番大事な「継続すること」が止まってしまうことがあります。\n\nイルカタイプは、自分専用の運用バランスが1枚の設計図として見えている状態で、一気に力を発揮します。資産の中でどれくらい守り、どれくらい攻めるか——それを一緒に設計してくれる存在がいるかどうかで、5年後10年後の結果は驚くほど変わります。",
    traits: ["柔軟", "バランス感覚", "適応力"],
  },
  {
    id: "turtle",
    animal: "カメ",
    emoji: "🐢",
    name: "じっくりカメタイプ",
    investorType: "超安定マイペース型",
    headline: "超安定型のカメタイプ",
    description: "焦らず自分のペースで資産を育てたいタイプ。",
    longDescription:
      "あなたは「ウサギとカメ」のカメのように、周囲のスピードに振り回されず、自分の歩幅で確実に前へ進める落ち着きを持った投資家です。派手さはなくても、途中でやめない人が最後に一番遠くまで行く——その真実を体で分かっているタイプです。\n\nただし、慎重なあまり始まりが遅れやすく、「もう少し年齢が若ければ」「もっと早く知っていれば」という後悔の種を抱えやすいのも、このタイプの特徴です。時間はカメの最大の味方ですが、使わなかった時間だけは永久に戻りません。\n\nあなたに必要なのは「もっと速く走ること」ではありません。今の生活を壊さず、無理のないペースで続けられる運用の型を、最初に丁寧に作っておくことです。一度型が決まれば、あとは歩き続けるだけで必ず結果がついてきます。",
    traits: ["忍耐", "着実", "堅実"],
  },
  {
    id: "lion",
    animal: "ライオン",
    emoji: "🦁",
    name: "王者ライオンタイプ",
    investorType: "積極運用型",
    headline: "積極運用型のライオンタイプ",
    description: "自信と決断力で市場に挑むタイプ。",
    longDescription:
      "あなたは群れの先頭に立ち、ここぞという瞬間に一気に距離を詰めるライオンのような、圧倒的な決断力と自信を持った投資家です。「やると決めたらやる」「中途半端が一番嫌い」——この感覚に心あたりがあるのではないでしょうか。\n\nその強さゆえに、一度負けを認めるのが遅れやすいという弱点も持っています。自分を信じる力が強い人ほど、相場では「自分の読みに固執して損失が膨らむ」リスクが大きくなります。\n\nライオンタイプが本当の意味で資産を大きくするのは、自分の感情とは別のところにもう一つの判断軸——冷静なロジックやプロの仕組み——を置けたときです。狩りの本能を消す必要はありません。王者であるあなたが、自分の代わりに相場を見張ってくれる「参謀」を持てば、そのスピードと決断力は最大限の資産形成力に変わります。",
    traits: ["自信", "決断力", "リーダー"],
  },
  {
    id: "cat",
    animal: "ネコ",
    emoji: "🐱",
    name: "マイペースネコタイプ",
    investorType: "自由気まま型",
    headline: "自由気まま型のネコタイプ",
    description: "自分のリズムと直感を大切にするタイプ。",
    longDescription:
      "あなたは、気の向いた時にスッと動き、気が乗らなければ動かない——そんなネコのような自由さを持った投資家です。他人に決められるのが嫌いで、自分のリズムで投資と付き合える余白をとても大切にするタイプです。\n\nマイペースは大きな強みですが、裏側には「続かない」「気が変わる」という落とし穴もあります。最初は気合十分でも、気づいたらアプリを開かなくなっている——そんな経験はありませんか？\n\nネコタイプが結果を出すコツは、「頑張らなくても続く仕組み」に乗ることです。自分で毎日何かを決める運用よりも、勝手に動き続けてくれる仕組みを「一度だけ正しく選ぶ」ほうが、あなたの性格には圧倒的に合っています。自由を失うことなく、資産だけがちゃんと育っていく——それが、あなたにとって最高の投資スタイルです。",
    traits: ["自由", "直感的", "マイペース"],
  },
  {
    id: "wolf",
    animal: "オオカミ",
    emoji: "🐺",
    name: "戦略オオカミタイプ",
    investorType: "戦略アクティブ型",
    headline: "戦略アクティブ型のオオカミタイプ",
    description: "独自の視点と集中力で成果を狙うタイプ。",
    longDescription:
      "あなたは群れで動きながらも自分の眼で獲物を選ぶ、オオカミのような孤高の投資家です。流行や多数派の意見にはあまり魅力を感じず、「自分が納得できる筋道」で動きたい——そういう強いこだわりを持っています。\n\nその反面、納得するまで動かないので、チャンスそのものを逃しがちです。また、一度「これだ」と決めると周りの声が耳に入らなくなり、リスクを過小評価してしまうこともあります。\n\nオオカミタイプの本当の強さは、信頼できる仲間——プロや仕組み——と組んだ瞬間に一気に引き出されます。独りで全部抱え込む運用ではなく、戦略そのものを一緒に練ってくれる相手を持つこと。そうすれば、あなたの集中力と洞察力は「孤高」から「最強の連携」へと進化し、資産形成のスピードは何倍にもなります。",
    traits: ["戦略的", "集中力", "独自路線"],
  },
];

// ========================================
// 質問定義
// ========================================
export interface DiagnosisOption {
  label: string;
  value: string;
  score: Record<string, number>;
  depositHint?: number;
  assetsHint?: number;
}

export interface DiagnosisQuestion {
  id: number;
  question: string;
  options: DiagnosisOption[];
}

// スコアキー: stability(安定志向), growth(成長志向), active(積極性), patience(忍耐力)
export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    id: 1,
    question: "投資で一番大切だと思うことは？",
    options: [
      { label: "損をしないこと", value: "a", score: { stability: 3, patience: 2 } },
      { label: "コツコツ増やすこと", value: "b", score: { stability: 2, growth: 2, patience: 1 } },
      { label: "大きく増やすチャンスを狙うこと", value: "c", score: { growth: 3, active: 2 } },
      { label: "プロに任せて安心したい", value: "d", score: { stability: 2, patience: 3 } },
    ],
  },
  {
    id: 2,
    question: "もし100万円が手に入ったら？",
    options: [
      { label: "全額貯金する", value: "a", score: { stability: 3, patience: 1 } },
      { label: "半分貯金、半分投資", value: "b", score: { stability: 1, growth: 2, patience: 1 } },
      { label: "積極的に投資に回す", value: "c", score: { growth: 3, active: 2 } },
      { label: "まず勉強してから考える", value: "d", score: { patience: 3, stability: 1 } },
    ],
  },
  {
    id: 3,
    question: "投資の経験はありますか？",
    options: [
      { label: "全くの初心者（経験ゼロ）", value: "a", score: { stability: 2, patience: 2 } },
      { label: "少しだけやったことがある", value: "b", score: { growth: 1, active: 1, stability: 1 } },
      { label: "FXや株の経験あり（利益は出ていない）", value: "c", score: { growth: 2, active: 2 } },
      { label: "投資信託やNISAをコツコツやっている", value: "d", score: { stability: 1, growth: 2, patience: 1 } },
    ],
  },
  {
    id: 4,
    question: "毎日チャートを見る時間はどれくらい取れそう？",
    options: [
      { label: "全く見れない", value: "a", score: { stability: 3, patience: 2 } },
      { label: "1日10〜30分くらい", value: "b", score: { stability: 1, growth: 2 } },
      { label: "1日30分以上", value: "c", score: { growth: 2, active: 2 } },
      { label: "時間があればずっと見ていたい", value: "d", score: { active: 3, growth: 1 } },
    ],
  },
  {
    id: 5,
    question: "投資で目指したい月の利益は？",
    options: [
      { label: "お小遣いレベル（月1〜3万円）", value: "a", score: { stability: 3, patience: 1 } },
      { label: "月5〜10万円", value: "b", score: { stability: 1, growth: 2 } },
      { label: "月30万円を目指したい", value: "c", score: { growth: 3, active: 1 } },
      { label: "それ以上を目指したい", value: "d", score: { active: 3, growth: 2 } },
    ],
  },
  {
    id: 6,
    question: "含み損（一時的なマイナス）が出たらどうする？",
    options: [
      { label: "怖いのですぐ損切りしたい", value: "a", score: { stability: 2, active: 1 } },
      { label: "ルール通りに対応したい", value: "b", score: { stability: 2, patience: 2 } },
      { label: "もっと勉強してから判断したい", value: "c", score: { patience: 3, growth: 1 } },
      { label: "プロの判断に任せたい", value: "d", score: { stability: 3, patience: 2 } },
    ],
  },
  {
    id: 7,
    question: "理想の投資スタイルは？",
    options: [
      { label: "完全おまかせ", value: "a", score: { stability: 3, patience: 3 } },
      { label: "たまに状況を確認する程度", value: "b", score: { stability: 2, growth: 1, patience: 1 } },
      { label: "自分でも少し判断に関わりたい", value: "c", score: { growth: 2, active: 2 } },
      { label: "積極的にトレードにも関わりたい", value: "d", score: { active: 3, growth: 3 } },
    ],
  },
  {
    id: 8,
    question: "投資に回せる初期資金はどのくらい？",
    options: [
      { label: "10万円くらい", value: "a", score: { stability: 3, patience: 2 }, depositHint: 100000 },
      { label: "30万円くらい", value: "b", score: { stability: 2, growth: 1 }, depositHint: 300000 },
      { label: "50万〜100万円", value: "c", score: { growth: 2, active: 1 }, depositHint: 500000 },
      { label: "100万円以上", value: "d", score: { active: 2, growth: 2 }, depositHint: 1000000 },
    ],
  },
  {
    id: 9,
    question: "現在の金融資産の総額はどのくらい？",
    options: [
      { label: "500万円未満", value: "a", score: { stability: 2 }, assetsHint: 3000000 },
      { label: "500万〜1,000万円", value: "b", score: { stability: 1, growth: 1 }, assetsHint: 7500000 },
      { label: "1,000万〜3,000万円", value: "c", score: { growth: 2, active: 1 }, assetsHint: 20000000 },
      { label: "3,000万円以上", value: "d", score: { growth: 2, active: 2 }, assetsHint: 50000000 },
    ],
  },
  {
    id: 10,
    question: "投資で一番叶えたいゴールは？",
    options: [
      { label: "老後の生活資金を確保したい", value: "a", score: { stability: 3, patience: 2 } },
      { label: "子どもや家族のために残したい", value: "b", score: { stability: 2, patience: 2 } },
      { label: "早期リタイア・FIREを実現したい", value: "c", score: { growth: 2, active: 3 } },
      { label: "自由に使えるお金を増やしたい", value: "d", score: { growth: 3, active: 1 } },
    ],
  },
  {
    id: 11,
    question: "大きな経済ニュースが流れた時、あなたは？",
    options: [
      { label: "不安で資産状況を何度も確認する", value: "a", score: { stability: 3 } },
      { label: "今後の影響をじっくり分析する", value: "b", score: { patience: 3, growth: 1 } },
      { label: "チャンスかもしれないと動きたくなる", value: "c", score: { active: 3, growth: 2 } },
      { label: "正直よく分からないので誰かに聞きたい", value: "d", score: { stability: 2, patience: 2 } },
    ],
  },
  {
    id: 12,
    question: "資産運用を本格的に始めたいタイミングは？",
    options: [
      { label: "できれば今すぐにでも", value: "a", score: { active: 3, growth: 2 } },
      { label: "1ヶ月以内には動き出したい", value: "b", score: { growth: 2, active: 1 } },
      { label: "半年以内を目安に考えている", value: "c", score: { patience: 2, stability: 1 } },
      { label: "良いタイミングが来れば", value: "d", score: { patience: 3, stability: 1 } },
    ],
  },
];

// ========================================
// 12星座データ
// ========================================
export interface ZodiacSign {
  id: string;
  name: string;
  emoji: string;
  dateRange: string;
  keyword: string;
}

const ZODIAC_SIGNS: ZodiacSign[] = [
  { id: "capricorn", name: "山羊座", emoji: "♑", dateRange: "12/22-1/19", keyword: "堅実と野心" },
  { id: "aquarius", name: "水瓶座", emoji: "♒", dateRange: "1/20-2/18", keyword: "革新と独立" },
  { id: "pisces", name: "魚座", emoji: "♓", dateRange: "2/19-3/20", keyword: "直感と共感" },
  { id: "aries", name: "牡羊座", emoji: "♈", dateRange: "3/21-4/19", keyword: "行動と情熱" },
  { id: "taurus", name: "牡牛座", emoji: "♉", dateRange: "4/20-5/20", keyword: "安定と粘り強さ" },
  { id: "gemini", name: "双子座", emoji: "♊", dateRange: "5/21-6/21", keyword: "知性と柔軟性" },
  { id: "cancer", name: "蟹座", emoji: "♋", dateRange: "6/22-7/22", keyword: "慎重と守備力" },
  { id: "leo", name: "獅子座", emoji: "♌", dateRange: "7/23-8/22", keyword: "自信とリーダーシップ" },
  { id: "virgo", name: "乙女座", emoji: "♍", dateRange: "8/23-9/22", keyword: "分析と完璧主義" },
  { id: "libra", name: "天秤座", emoji: "♎", dateRange: "9/23-10/23", keyword: "調和とバランス" },
  { id: "scorpio", name: "蠍座", emoji: "♏", dateRange: "10/24-11/22", keyword: "集中と洞察力" },
  { id: "sagittarius", name: "射手座", emoji: "♐", dateRange: "11/23-12/21", keyword: "自由と楽観" },
];

// ========================================
// 生年月日 → 12星座
// ========================================
export function getZodiacSign(birthday: string): ZodiacSign | null {
  const d = new Date(birthday);
  if (isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const code = m * 100 + day;

  if (code >= 1222 || code <= 119) return ZODIAC_SIGNS[0]; // 山羊
  if (code >= 120 && code <= 218) return ZODIAC_SIGNS[1]; // 水瓶
  if (code >= 219 && code <= 320) return ZODIAC_SIGNS[2]; // 魚
  if (code >= 321 && code <= 419) return ZODIAC_SIGNS[3]; // 牡羊
  if (code >= 420 && code <= 520) return ZODIAC_SIGNS[4]; // 牡牛
  if (code >= 521 && code <= 621) return ZODIAC_SIGNS[5]; // 双子
  if (code >= 622 && code <= 722) return ZODIAC_SIGNS[6]; // 蟹
  if (code >= 723 && code <= 822) return ZODIAC_SIGNS[7]; // 獅子
  if (code >= 823 && code <= 922) return ZODIAC_SIGNS[8]; // 乙女
  if (code >= 923 && code <= 1023) return ZODIAC_SIGNS[9]; // 天秤
  if (code >= 1024 && code <= 1122) return ZODIAC_SIGNS[10]; // 蠍
  if (code >= 1123 && code <= 1221) return ZODIAC_SIGNS[11]; // 射手
  return null;
}

// ========================================
// 生年月日 → 運命数（1-9）
// ========================================
// 生年月日の全桁を1桁になるまで足し続ける（数秘術）
export function calculateLifePathNumber(birthday: string): number | null {
  const d = new Date(birthday);
  if (isNaN(d.getTime())) return null;
  const digits = `${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`;
  let sum = digits.split("").reduce((s, c) => s + parseInt(c, 10), 0);
  while (sum > 9) {
    sum = sum
      .toString()
      .split("")
      .reduce((s, c) => s + parseInt(c, 10), 0);
  }
  return sum;
}

// 運命数ごとの短いキーワード（投資観点でカスタム）
export const LIFE_PATH_KEYWORDS: Record<number, string> = {
  1: "開拓者：新しい道を切り拓く力を持つ",
  2: "協調者：パートナーと組むことで成果を出すタイプ",
  3: "表現者：直感と好奇心で成長を加速させる",
  4: "建設者：コツコツと揺るぎない土台を築く",
  5: "挑戦者：変化を恐れず行動で道を開く",
  6: "調整者：家族や周囲を守る責任感が強い",
  7: "探究者：深く考え抜いて本質を見抜く",
  8: "実現者：現実的な成果と富を引き寄せる",
  9: "賢者：広い視野で全体最適を選べる",
};

// ========================================
// 診断結果の型
// ========================================
export interface DiagnosisResult {
  type: string;
  typeLabel: string;
  headline: string;
  description: string;
  longDescription: string;
  animal: AnimalType;
  depositHint: number | null;
  assetsHint: number | null;
  lifePathNumber: number | null;
  lifePathKeyword: string | null;
  zodiacSign: ZodiacSign | null;
}

// ========================================
// 動物タイプ判定
// ========================================
// スコア上位2キーから候補プール（3種）を作り、
// 生年月日がある場合はプール内から決定論的に1種を選ぶ
const SCORE_TO_ANIMAL_POOL: Record<string, string[]> = {
  "stability-patience": ["fox", "owl", "turtle"],
  "stability-growth": ["dolphin", "fox", "turtle"],
  "stability-active": ["fox", "cat", "dolphin"],
  "patience-stability": ["owl", "turtle", "fox"],
  "patience-growth": ["owl", "turtle", "wolf"],
  "patience-active": ["owl", "wolf", "lion"],
  "growth-active": ["eagle", "lion", "wolf"],
  "growth-stability": ["dolphin", "fox", "owl"],
  "growth-patience": ["wolf", "owl", "dolphin"],
  "active-growth": ["lion", "eagle", "wolf"],
  "active-stability": ["cat", "lion", "fox"],
  "active-patience": ["wolf", "lion", "owl"],
};

function birthdaySeed(birthday: string): number {
  const d = new Date(birthday);
  if (isNaN(d.getTime())) return 0;
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function determineAnimal(
  scores: Record<string, number>,
  birthday?: string,
): AnimalType {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = sorted[0][0];
  const second = sorted[1][0];
  const key = `${top}-${second}`;
  const pool = SCORE_TO_ANIMAL_POOL[key] || ["dolphin", "owl", "fox"];

  let animalId: string;
  if (birthday) {
    const seed = birthdaySeed(birthday);
    animalId = pool[seed % pool.length];
  } else {
    animalId = pool[0];
  }

  return ANIMAL_TYPES.find((a) => a.id === animalId) || ANIMAL_TYPES[3];
}

// ========================================
// 診断結果を算出
// ========================================
export function calculateDiagnosis(
  answers: string[],
  birthday?: string,
): DiagnosisResult {
  const scores: Record<string, number> = {
    stability: 0,
    growth: 0,
    active: 0,
    patience: 0,
  };

  let depositHint: number | null = null;
  let assetsHint: number | null = null;

  answers.forEach((answer, index) => {
    const question = DIAGNOSIS_QUESTIONS[index];
    if (!question) return;
    const option = question.options.find((o) => o.value === answer);
    if (!option) return;
    for (const [key, val] of Object.entries(option.score)) {
      scores[key] = (scores[key] || 0) + val;
    }
    if (option.depositHint) depositHint = option.depositHint;
    if (option.assetsHint) assetsHint = option.assetsHint;
  });

  const sortedTypes = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topType = sortedTypes[0][0];
  const animal = determineAnimal(scores, birthday);

  const lifePathNumber = birthday ? calculateLifePathNumber(birthday) : null;
  const lifePathKeyword =
    lifePathNumber !== null ? LIFE_PATH_KEYWORDS[lifePathNumber] ?? null : null;
  const zodiacSign = birthday ? getZodiacSign(birthday) : null;

  return {
    type: topType,
    typeLabel: animal.investorType,
    headline: animal.headline,
    description: animal.description,
    longDescription: animal.longDescription,
    animal,
    depositHint,
    assetsHint,
    lifePathNumber,
    lifePathKeyword,
    zodiacSign,
  };
}
