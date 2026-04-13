// ========================================
// 診断ロジック
// ========================================
// 12問の質問 + 生年月日で投資タイプを診断
// 動物占い（個性心理學ベースの12動物）で見出しを作る
//
// 動物決定: 生年月日から六十干支（60日周期）を計算 → 12動物にマッピング
// 投資タイプ: 診断スコア上位から安定/成長/積極/長期戦略のいずれかを算出
// 見出し: ${投資タイプ}の${動物名}タイプ （例: 積極運用型の黒ひょうタイプ）
//
// ※60→12マッピングは弦本將裕『個性心理學』の公式テーブル（著作権あり）ではなく、
//   公開可能な等分方式（5連続で12動物）を採用。完全一致しないケースがあるため、
//   ANIMAL_OFFSET を1ケースのキャリブレーション値として調整できるようにしてある。

// ========================================
// 動物タイプ定義（動物占いの12動物）
// ========================================
export interface AnimalType {
  id: string;
  animal: string;
  emoji: string;
  name: string;
  /** 後方互換のためのプレースホルダ（実際の見出しは calculateDiagnosis で動的に生成） */
  investorType: string;
  headline: string;
  description: string;
  longDescription: string;
  traits: string[];
}

export const ANIMAL_TYPES: AnimalType[] = [
  {
    id: "wolf",
    animal: "狼",
    emoji: "🐺",
    name: "狼タイプ",
    investorType: "独立心型",
    headline: "独立心型の狼タイプ",
    description: "自分の判断を最も信じ、群れずに動く一匹狼の投資家。",
    longDescription:
      "あなたは単独行動を愛する一匹狼のように、自分の判断と直感を誰よりも信じる独立心の強い投資家です。人の意見に簡単には流されず、納得のいく根拠がある時だけ動く——その慎重さと自立心があなたの最大の武器であり、他人の雑音に振り回されない強さを持っています。\n\n一方で、独りで全部を抱え込もうとするあまり、情報収集と判断に時間をかけすぎて、結果的に大きな機会を逃すこともあります。「自分だけで完結させたい」というプライドが、ときに"動けない理由"になってしまっていないでしょうか。\n\n狼タイプが本当の意味で力を発揮するのは、自分と同じ温度感で対話できる"信頼できる参謀"を持った瞬間です。群れに溶け込む必要はありません。プロの視点を一枚かませて、最終判断だけは自分で下す——その形こそ、あなたの独立心と資産形成の結果を両立させる最適解です。",
    traits: ["独立心", "自分軸", "忍耐"],
  },
  {
    id: "fawn",
    animal: "こじか",
    emoji: "🦌",
    name: "こじかタイプ",
    investorType: "素直素朴型",
    headline: "素直素朴型のこじかタイプ",
    description: "純粋で素直、周りに溶け込みやすい心優しい投資家。",
    longDescription:
      "あなたは森の中で静かに耳を澄ますこじかのように、純粋で素直、周りの空気に敏感な心優しい投資家です。人を疑うよりも信じることから始めるタイプで、真面目にコツコツ取り組めるあなたの姿勢は、投資の世界で実はとても希少な才能です。\n\nただ、優しさゆえに強く言われると流されやすく、「これで本当にいいのかな」と迷いながら時間だけが過ぎていく——そんな経験はないでしょうか。自分で決めたはずなのに、気がつけば周囲の言葉で判断が揺れてしまう繊細さも、こじかタイプの特徴です。\n\nこじかタイプが安心して成果を出せるのは、強引に売り込まれるのではなく、あなたのペースに合わせて丁寧に説明してくれる専門家と出会えたときです。信頼できる相手と一緒に方針を固めてしまえば、あとは真面目なあなたの継続力が、何よりも力強い味方になります。",
    traits: ["素直", "繊細", "真面目"],
  },
  {
    id: "monkey",
    animal: "猿",
    emoji: "🐵",
    name: "猿タイプ",
    investorType: "機敏行動型",
    headline: "機敏行動型の猿タイプ",
    description: "頭の回転が速く、行動と切り替えが抜群に速い投資家。",
    longDescription:
      "あなたは木から木へ軽やかに飛び移る猿のように、頭の回転が速く、状況に合わせた切り替えが抜群に上手い投資家です。興味を持ったら即行動、ダメなら即撤退——その軽やかなフットワークで、人より一歩早くチャンスを掴む瞬発力があなたの武器です。\n\nその反面、飽きっぽさと気移りの早さがあなたの弱点です。新しい情報に次々飛びつくうちに、一つのことをじっくり育てる時間が足りず、「結局どれも中途半端だった」という結果に終わることがあります。継続こそ最大のリターン源——という投資の基本原則と、あなたの性格は少しだけ相性が悪いです。\n\n猿タイプが爆発的な成果を出すのは、「続けることを仕組みに任せる」選択をしたときです。あなたの瞬発力を活かしつつ、地道な継続部分はプロや自動化された運用に預ける。その組み合わせが、あなたの才能を最大化する一番賢い使い方です。",
    traits: ["機敏", "行動力", "切り替え"],
  },
  {
    id: "cheetah",
    animal: "チーター",
    emoji: "🐆",
    name: "チータータイプ",
    investorType: "瞬発成果型",
    headline: "瞬発成果型のチータータイプ",
    description: "短期集中で一気に結果を出す瞬発力型の投資家。",
    longDescription:
      "あなたは時速100kmで獲物に襲いかかるチーターのように、一度集中すれば誰よりも速く結果を出せる瞬発力型の投資家です。ダラダラ続けるより、決めた期間で一気に仕上げたい——そんな短期集中型の気質があなたを支えています。目の前にチャンスがあれば迷わず走り出せる、その決断の速さは大きな武器です。\n\nただ、走り切ったあとに疲れて動けなくなる——これもチーターの宿命です。短期的な成果は出せても、長期で淡々と続ける作業が苦手で、気づけばアプリを開かなくなってしまう、そんな傾向はないでしょうか。投資では「走り続けられる仕組み」を持てるかどうかが勝敗を分けます。\n\nチータータイプの最適解は、「自分が走るポイント」と「任せるポイント」を最初にきっちり分けておくことです。あなたが決断と判断に集中し、日々の継続はプロのロジックに任せる。その役割分担ができた瞬間、あなたのスピード感はそのまま資産の成長速度になります。",
    traits: ["瞬発力", "集中力", "決断"],
  },
  {
    id: "panther",
    animal: "黒ひょう",
    emoji: "🐆",
    name: "黒ひょうタイプ",
    investorType: "情報洗練型",
    headline: "情報洗練型の黒ひょうタイプ",
    description: "新しいものに敏感でおしゃれ、情報感度が高いスマートな投資家。",
    longDescription:
      "あなたは闇夜に光る目で一瞬の機微を見逃さない黒ひょうのように、情報感度が高く、新しいものをいち早く察知する洗練された投資家です。「これから来るもの」を嗅ぎ分ける感覚と、流行に流されない審美眼を兼ね備えており、表面的な派手さよりも"本物かどうか"を見抜く力を持っています。\n\n一方で、アンテナが高いがゆえに情報量に疲れてしまう時があります。いろんな選択肢が見えすぎて、「どれが自分にとってのベストか」を決めきれず、気がつけば動けないままチャンスが通り過ぎてしまう——そんな経験はないでしょうか。見えすぎることは、黒ひょうタイプ最大の盲点です。\n\n黒ひょうタイプが本領を発揮するのは、「自分の軸を代わりに整理してくれる対話相手」を持てたときです。情報を集める力はあなたが一番強い。あとは、それを"動ける形"にまで落とし込む作業を一緒にやってくれるプロがいれば、あなたのセンスは一気に資産形成の推進力に変わります。",
    traits: ["情報通", "洗練", "審美眼"],
  },
  {
    id: "lion",
    animal: "ライオン",
    emoji: "🦁",
    name: "ライオンタイプ",
    investorType: "王者決断型",
    headline: "王者決断型のライオンタイプ",
    description: "自信と決断力でチームを率いる王者のような投資家。",
    longDescription:
      "あなたは群れの頂点に立つライオンのように、圧倒的な決断力と存在感を持つ王者タイプの投資家です。「やると決めたらやる」「中途半端が一番嫌い」——この感覚が体の芯にあって、中途半端な情報や曖昧な提案では動きません。あなたが動くときは、すでに覚悟も方針も決まっているときです。\n\nその強さは武器ですが、裏を返すと"負けを認めるのが遅い"という弱点にもなります。自分を信じる力が強い人ほど、相場では「自分の読みに固執して損失を広げる」リスクが高くなります。プライドが、ときに撤退の判断を鈍らせるのが王者タイプの宿命です。\n\nライオンタイプが本当の意味で資産を大きくできるのは、自分の感情とは別のところに"もう一つの判断軸"を置けたときです。狩りの本能を消す必要はありません。王者であるあなたが、代わりに相場を24時間見張ってくれる"冷静な参謀"を持つこと。その瞬間、あなたの決断力は最大限の資産形成力に変わります。",
    traits: ["王者", "決断", "リーダー"],
  },
  {
    id: "tiger",
    animal: "虎",
    emoji: "🐯",
    name: "虎タイプ",
    investorType: "慎重堂々型",
    headline: "慎重堂々型の虎タイプ",
    description: "堂々とした存在感と強い正義感を持つ慎重派の投資家。",
    longDescription:
      "あなたは森の奥に静かに構える虎のように、堂々とした存在感と強い正義感を持った投資家です。派手さはないけれど、一度腰を据えたら誰よりも重厚な運用ができるタイプで、「納得してから動く」という基本姿勢があなたを支えています。軽率な判断とは無縁の、まさに王道の投資家気質です。\n\nただ、慎重さゆえに動き出しが遅く、良い話に出会っても「もう少し様子を見てから」と先送りにしがちです。その慎重さは守りには強いのですが、時間を味方につける投資の世界では"始めた時点で7割は決まる"と言われるほど、開始タイミングが大きな意味を持ちます。後悔を減らすためには、1日でも早く動き始めた人が有利です。\n\n虎タイプに必要なのは、"信頼できるかどうか"を確信した瞬間に背中を押してくれる存在です。自分で全部調べ尽くすのではなく、あなたの目線で真剣に話し合ってくれるプロの意見を一度聞くこと。それだけで、堂々としたあなたの運用は止まらない強さを手に入れます。",
    traits: ["堂々", "正義感", "重厚"],
  },
  {
    id: "tanuki",
    animal: "たぬき",
    emoji: "🦝",
    name: "たぬきタイプ",
    investorType: "老獪柔軟型",
    headline: "老獪柔軟型のたぬきタイプ",
    description: "場を和ませる人当たりの良さと、したたかな柔軟性を持つ投資家。",
    longDescription:
      "あなたはどんな環境にもするりと溶け込むたぬきのように、人当たりの良さと、一見のんびりしているようでしたたかな柔軟性を兼ね備えた投資家です。物事を俯瞰して見る目と、長年の経験で培われた"勘"があり、極端な選択をせずにバランスよく立ち回れる老獪さがあなたの武器です。\n\n反面、穏やかな性格ゆえに「決断の先延ばし」が起きやすいのも特徴です。周りの顔色を見すぎて自分の意志を後回しにしたり、「まあいいか」で判断を流してしまう癖が、資産形成のスピードを少しだけ遅らせてしまっていないでしょうか。柔らかさはあなたの美徳ですが、時に自分の足を引っ張ります。\n\nたぬきタイプが最高のパフォーマンスを出すのは、"自分の代わりに決めることを手伝ってくれる誰か"と組んだときです。あなたは決して決められない人ではありません。ただ、一人だと先延ばしになるだけ。信頼できる専門家と一緒に"今決める時間"を持てば、あなたの持つ老獪さは本物の資産形成力に変わります。",
    traits: ["柔軟", "老獪", "人当たり"],
  },
  {
    id: "koala",
    animal: "子守熊",
    emoji: "🐨",
    name: "子守熊タイプ",
    investorType: "マイペース芸術型",
    headline: "マイペース芸術型の子守熊タイプ",
    description: "独自のこだわりと感性を大切にするマイペース型の投資家。",
    longDescription:
      "あなたはユーカリの木の上でゆったりと自分の時間を過ごす子守熊のように、独自のこだわりと感性を大切にするマイペース型の投資家です。他人の流行や世間の声よりも、「自分が納得できるかどうか」を最優先する美学があり、焦らされても崩れない芯の強さを持っています。\n\nその反面、自分の世界が強すぎるあまり、新しい情報や外部からのアドバイスを受け取るのが少し苦手です。「自分のやり方がある」という感覚が強すぎると、結果的に視野が狭くなって、相場の大きな流れに乗り遅れることがあります。こだわりが強いほど、気づかないうちに機会損失も大きくなっているタイプです。\n\n子守熊タイプに必要なのは、"あなたのスタイルを尊重しながら新しい視点をくれる相手"です。あなたの世界を壊さず、でも必要な時にだけプロのロジックを注入してくれる仕組みがあれば、マイペースなまま資産だけがしっかり育っていく——それが子守熊タイプにとって理想の投資の形です。",
    traits: ["マイペース", "こだわり", "感性"],
  },
  {
    id: "elephant",
    animal: "ゾウ",
    emoji: "🐘",
    name: "ゾウタイプ",
    investorType: "努力継続型",
    headline: "努力継続型のゾウタイプ",
    description: "圧倒的な忍耐力と継続力で大きな成果を積み上げる投資家。",
    longDescription:
      "あなたは重い歩みで着実に前へ進むゾウのように、圧倒的な忍耐力と継続力を持った投資家です。短期の派手な成果には惑わされず、「やると決めたら淡々と続ける」——そのブレない姿勢こそが、時間を味方につけて大きな資産を築ける数少ないタイプの証です。投資の神様が一番味方したい気質と言っても過言ではありません。\n\nただ、真面目すぎるがゆえに、"仕組みで解決できること"まで全部自分の努力でやろうとしてしまう傾向があります。毎日チャートを見て、数字を記録して、自分を追い込む——その頑張りは尊いですが、続けるのに必要以上のエネルギーを使っているとしたら、それはすごくもったいない消耗です。\n\nゾウタイプの本当の強みは、「正しい仕組みに乗った瞬間」に何倍にも発揮されます。あなたの継続力は、自動化された運用やプロのロジックと組み合わさることで、努力を減らしたまま結果だけがどんどん積み上がる状態を作り出せます。頑張ることと、成果を出すことは、本来別の話なのです。",
    traits: ["忍耐", "継続", "努力家"],
  },
  {
    id: "sheep",
    animal: "ひつじ",
    emoji: "🐑",
    name: "ひつじタイプ",
    investorType: "協調調和型",
    headline: "協調調和型のひつじタイプ",
    description: "周囲との調和と安心感を何より大切にする気配り上手な投資家。",
    longDescription:
      "あなたは群れの中で安心感を生み出すひつじのように、周囲との調和を何よりも大切にする気配り上手な投資家です。「みんなにとっていい選択」を無意識に考えられるあなたは、家族や大切な人のことを最優先にできる、投資の世界ではとても希少な温かさを持っています。\n\nその優しさの裏側には、「自分の意見を強く主張できない」「周囲に同調してしまう」という特徴もあります。投資の判断が必要な場面で、本当はイエスと言いたいのに周りの反応が気になって動けない——そんな経験はないでしょうか。あなたの決断が遅れる理由は、たいてい自分ではなく"周りのこと"を考えているからです。\n\nひつじタイプに必要なのは、「あなたと家族の未来を一緒に設計してくれる専門家」の存在です。一人で決めるのは苦手でも、信頼できる相手と肩を並べて設計図を描くなら、あなたの気配り力は"家族を守る資産形成"という一番尊い形に変わります。大切な人のためにこそ、相談してみる価値があります。",
    traits: ["協調", "気配り", "温かさ"],
  },
  {
    id: "pegasus",
    animal: "ペガサス",
    emoji: "🦄",
    name: "ペガサスタイプ",
    investorType: "感性自由型",
    headline: "感性自由型のペガサスタイプ",
    description: "研ぎ澄まされた感性と自由な発想で独自の道を切り拓く投資家。",
    longDescription:
      "あなたは空を自在に駆けるペガサスのように、研ぎ澄まされた感性と自由な発想力を持つ特別な投資家です。理屈よりも直感で本質を捉える力があり、他の人には見えない"何か"を感じ取れるタイプ。気分が乗った時のあなたの判断力と行動力は、群を抜く爆発力を持っています。\n\nその反面、気分の波に強く左右されるのがペガサスタイプの特徴です。乗っているときと乗っていないときの差が激しく、昨日まで燃えていたことが今日は全く手につかない——そんな気質が、継続を必要とする投資の世界では少しだけ不利に働くことがあります。天才肌ゆえの気まぐれは、放っておくと資産形成の一貫性を奪います。\n\nペガサスタイプが本来の力を発揮するのは、「継続のしんどい部分を全部任せられる仕組み」に出会ったときです。あなたの直感は判断の場面で使い、日々の運用は自動化とプロに預ける。その役割分担ができたとき、あなたの感性は"いつの間にか資産が大きくなっている"という最高の体験に変わります。",
    traits: ["感性", "直感", "自由"],
  },
];

// ========================================
// 投資タイプ（スコア由来）
// ========================================
export interface InvestmentType {
  key: string;
  label: string;
  description: string;
}

export const INVESTMENT_TYPES: Record<string, InvestmentType> = {
  stability: {
    key: "stability",
    label: "安定重視型",
    description: "リスクを抑え、守りの運用を大切にするタイプ",
  },
  patience: {
    key: "patience",
    label: "長期戦略型",
    description: "時間を味方につけ、じっくり育てるタイプ",
  },
  growth: {
    key: "growth",
    label: "バランス成長型",
    description: "守りと攻めのバランスで着実に増やすタイプ",
  },
  active: {
    key: "active",
    label: "積極運用型",
    description: "チャンスを逃さず攻めの姿勢で大きく狙うタイプ",
  },
};

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

export function getZodiacSign(birthday: string): ZodiacSign | null {
  const d = new Date(birthday);
  if (isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const code = m * 100 + day;

  if (code >= 1222 || code <= 119) return ZODIAC_SIGNS[0];
  if (code >= 120 && code <= 218) return ZODIAC_SIGNS[1];
  if (code >= 219 && code <= 320) return ZODIAC_SIGNS[2];
  if (code >= 321 && code <= 419) return ZODIAC_SIGNS[3];
  if (code >= 420 && code <= 520) return ZODIAC_SIGNS[4];
  if (code >= 521 && code <= 621) return ZODIAC_SIGNS[5];
  if (code >= 622 && code <= 722) return ZODIAC_SIGNS[6];
  if (code >= 723 && code <= 822) return ZODIAC_SIGNS[7];
  if (code >= 823 && code <= 922) return ZODIAC_SIGNS[8];
  if (code >= 923 && code <= 1023) return ZODIAC_SIGNS[9];
  if (code >= 1024 && code <= 1122) return ZODIAC_SIGNS[10];
  if (code >= 1123 && code <= 1221) return ZODIAC_SIGNS[11];
  return null;
}

// ========================================
// 生年月日 → 運命数（1-9）
// ========================================
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
// 動物タイプ判定（六十干支ベース）
// ========================================
// 1984-02-02 を「甲子」（60日周期の1日目、動物番号1）として
// 生年月日までの経過日数を60で割った余りで動物番号を決定する。
// 60 → 12動物 マッピングは5連続ずつの等分方式（公開可能な近似）。
//
// ANIMAL_OFFSET は1ケースキャリブレーション用。
// 既知の「生年月日 → 動物」ペアから逆算して調整できる。

const REFERENCE_DATE = Date.UTC(1984, 1, 2); // 1984-02-02 UTC (甲子基準)
const MS_PER_DAY = 86400000;

// 動物の配列（60番号の1-5→[0], 6-10→[1] ... の順）
// ※この順序は固定ではなく、ANIMAL_OFFSET と合わせてキャリブレーション可能
const ANIMAL_ORDER_12 = [
  "wolf", // 1-5
  "fawn", // 6-10
  "monkey", // 11-15
  "cheetah", // 16-20
  "panther", // 21-25
  "lion", // 26-30
  "tiger", // 31-35
  "tanuki", // 36-40
  "koala", // 41-45
  "elephant", // 46-50
  "sheep", // 51-55
  "pegasus", // 56-60
];

// キャリブレーション用オフセット（0-59）
// 既知の正解ペアが見つかったらここを調整する
export const ANIMAL_OFFSET = 0;

export function getSexagenaryNumber(birthday: string): number | null {
  const d = new Date(birthday);
  if (isNaN(d.getTime())) return null;
  const birthUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const daysDiff = Math.floor((birthUtc - REFERENCE_DATE) / MS_PER_DAY);
  let n = (daysDiff + ANIMAL_OFFSET) % 60;
  if (n < 0) n += 60;
  return n + 1; // 1-60
}

function determineAnimal(birthday?: string): AnimalType {
  if (!birthday) {
    return ANIMAL_TYPES[4]; // 黒ひょう（デフォルト）
  }
  const num = getSexagenaryNumber(birthday);
  if (num === null) return ANIMAL_TYPES[4];
  const animalIndex = Math.floor((num - 1) / 5);
  const animalId = ANIMAL_ORDER_12[animalIndex];
  return ANIMAL_TYPES.find((a) => a.id === animalId) || ANIMAL_TYPES[4];
}

// ========================================
// スコア → 投資タイプ
// ========================================
function determineInvestmentType(
  scores: Record<string, number>,
): InvestmentType {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topKey = sorted[0][0];
  return INVESTMENT_TYPES[topKey] ?? INVESTMENT_TYPES.growth;
}

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
  investmentType: InvestmentType;
  depositHint: number | null;
  assetsHint: number | null;
  lifePathNumber: number | null;
  lifePathKeyword: string | null;
  zodiacSign: ZodiacSign | null;
  sexagenaryNumber: number | null;
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
  const investmentType = determineInvestmentType(scores);
  const animal = determineAnimal(birthday);

  // 動的に見出しを生成（投資タイプ × 動物名）
  const headline = `${investmentType.label}の${animal.animal}タイプ`;

  const lifePathNumber = birthday ? calculateLifePathNumber(birthday) : null;
  const lifePathKeyword =
    lifePathNumber !== null ? LIFE_PATH_KEYWORDS[lifePathNumber] ?? null : null;
  const zodiacSign = birthday ? getZodiacSign(birthday) : null;
  const sexagenaryNumber = birthday ? getSexagenaryNumber(birthday) : null;

  return {
    type: topType,
    typeLabel: investmentType.label,
    headline,
    description: animal.description,
    longDescription: animal.longDescription,
    animal,
    investmentType,
    depositHint,
    assetsHint,
    lifePathNumber,
    lifePathKeyword,
    zodiacSign,
    sexagenaryNumber,
  };
}
