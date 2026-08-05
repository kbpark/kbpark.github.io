/* =========================================================================
 *  바이올리니스트 메이커 — 게임 데이터 정의 (data.js)
 *  캐릭터 / 4대 스킬 / 10곡 퀘스트 / 대사·선택지·엔딩을 한 곳에서 관리한다.
 *
 *  대사 line 형식: { who, expr?, text, img?, bg? }
 *    who : CHARACTERS 키 (narr = 지문/나레이션)
 *    expr: 초상 표정 (neutral/happy/blush/sad/angry/surprised/shy/proud)
 *    img : (선택) 이 대사에서 화면을 덮을 일러스트 경로. 예) 'assets/img/cg/q5.png'
 *          파일이 없으면 자동으로 무시되고 캐릭터 무대가 그대로 보인다.
 *    bg  : (선택) 이 대사 동안 바꿀 배경 이미지 경로. 예) 'assets/img/bg/plaza.png'
 *  ※ 이미지 추가 방법은 ASSETS_GUIDE.md 참고.
 * ========================================================================= */
const GameData = (() => {
  'use strict';

  /* ---- 등장인물 --------------------------------------------------------- */
  const CHARACTERS = {
    leon:        { name: '레온',              color: '#6fb7ff' },
    violet:      { name: '바이올렛',          color: '#c58bff' },
    andrea:      { name: '마에스트로 안드레아', color: '#ffd166' },
    store_owner: { name: '가게 사장님',       color: '#7be0a4' },
    friend:      { name: '이웃 친구',         color: '#ff9db0' },
    narr:        { name: '',                  color: '#cfd8e3' },
  };

  /* ---- 4대 스킬 --------------------------------------------------------- *
   *  kind: 'tap'  = 탭당 획득 포인트 +power/Lv
   *        'auto' = 초당 자동 획득 +power/Lv (보잉)
   *        'mult' = 모든 획득량 배수 +power/Lv (박자)
   *  → 스킬마다 역할이 겹치지 않아, 4가지 모두 키울 이유가 생긴다.
   * --------------------------------------------------------------------- */
  const SKILLS = {
    pitch:      { id: 'pitch',      label: '음정',   icon: '🎯', kind: 'tap',  power: 1.2,  baseCost: 16, growth: 1.15,
                  desc: '정확한 음정으로 탭당 획득 포인트를 직접 올려요.' },
    tempo:      { id: 'tempo',      label: '박자',   icon: '⏱️', kind: 'mult', power: 0.02, baseCost: 22, growth: 1.15,
                  desc: '흔들림 없는 박자로 탭·자동 모든 획득량을 %로 높여요.' },
    bowing:     { id: 'bowing',     label: '보잉',   icon: '🏹', kind: 'auto', power: 0.6,  baseCost: 36, growth: 1.16,
                  desc: '활이 스스로 노래해요. 가만히 둬도 포인트가 쌓여요.' },
    expression: { id: 'expression', label: '표현력', icon: '💜', kind: 'burst', power: 0, baseCost: 28, growth: 1.15,
                  desc: '「감정 폭발」 발동! 잠시 동안 모든 획득이 10배로 치솟아요. (레벨↑ = 지속↑·쿨타임↓)' },
  };
  const SKILL_ORDER = ['pitch', 'tempo', 'bowing', 'expression'];

  /* ---- 표현력 액티브 「감정 폭발」 파라미터 ---------------------------- *
   *  발동 시 duration 초 동안 모든 획득 ×mult.  이후 cooldown 초 재충전.
   *  표현력 레벨이 오를수록 지속시간↑ · 쿨타임↓.
   * --------------------------------------------------------------------- */
  const ENCORE = { mult: 8, baseDuration: 8, durPerLv: 0.18, baseCooldown: 90, cdPerLv: 0.65, minCooldown: 35 };

  /* ---- 10곡 퀘스트 ------------------------------------------------------ *
   *  진행 흐름(2단계 게이트):
   *   ① pre(선제조건)  충족 → intro(인트로) 재생 + 퀘스트 목록에 공개
   *   ② req(달성조건)  충족 → '연주하기' → outro(=QUEST_CLEAR) 재생 + 클리어
   *  pre 는 req 의 50~60% 수준으로 잡아, 조금 더 연습하면 다음 곡이 "예고"된다.
   * --------------------------------------------------------------------- */
  const QUESTS = [
    { n: 1,  title: '반짝반짝 작은별',            book: '스즈키 1권',      pre: {},                    req: { pitch: 7 },
      intro: [
        { who: 'andrea', expr: 'neutral',   img: 'assets/img/cg/intro-q1-first-lesson.png', text: '자, 견습생 첫 임무다. 「작은별」부터 정확하게 켜봐라.' },
        { who: 'leon',   expr: 'neutral',   text: '네, 마에스트로! (활을 너무 힘주어 잡다 후다닥 놓치며) 앗, 활털이 다 튀었어?!' },
        { who: 'narr',                      text: '레온이 엉성한 자세로 삐걱거리며 악기를 켜자, 어딘가 어설프지만 묘하게 따뜻한 톤이 흘러나온다.' },
        { who: 'violet', expr: 'proud',     text: '(팔짱을 끼며) 풋… 저게 뭐야. 악기 잡는 법도 모르는 청소부를 대단한 재원처럼 데려오다니.' },
        { who: 'leon',   expr: 'shy',       text: '헤헤, 처음엔 원래 바닥부터 다지는 법이지! (땀을 뻘뻘 흘림)' },
        { who: 'andrea', expr: 'happy',     text: '자세는 빙구 같아도 음감은 썩 나쁘지 않단 말이지… 계속 해보게!' },
      ] },

    { n: 2,  title: '유모레스크',                 book: '스즈키 2권',      pre: { tempo: 9 },          req: { tempo: 13, expression: 12 },
      intro: [
        { who: 'andrea', expr: 'neutral',   img: 'assets/img/cg/intro-q2-humoresque-practice.png', text: '이번 곡은 「유모레스크」. 경쾌하게 템포를 타야 한다.' },
        { who: 'leon',   expr: 'neutral',   text: '템포요? (박자에 맞춰 고개를 까딱이다 악보를 거꾸로 봄) 잠깐, 이게 도야 레야?' },
        { who: 'narr',                      text: '레온이 악보를 거꾸로 든 채 허둥지둥 활을 긋자, 엉뚱한 리듬이 튀어나온다.' },
        { who: 'violet', expr: 'neutral',   text: '(복도를 지나다 멈춰 서며) ……저 한심한 생물은 또 뭐야. 악보도 거꾸로 보고 있잖아.' },
        { who: 'leon',   expr: 'surprised', text: '오, 바이올렛! 마침 잘 왔다. 이 부분 박자 좀 알려줄래?' },
        { who: 'violet', expr: 'proud',     text: '구제불능이네. 그런 실력으로 이 아카데미에 들어오다니 양심도 없지.' },
      ] },

    { n: 3,  title: '자이츠 협주곡 2번',          book: '스즈키 4권',      pre: { bowing: 15, pitch: 12 }, req: { bowing: 20, pitch: 18 },
      intro: [
        { who: 'andrea', expr: 'neutral',   img: 'assets/img/cg/intro-q3-wide-bowing.png', text: '「자이츠 협주곡」이다. 활을 넓게 쓰는 보잉 기술이 필요해.' },
        { who: 'leon',   expr: 'neutral',   text: '활을 넓게… (지나치게 크게 휘두르다 악기를 벽에 부딪힐 뻔함) 앗차차!' },
        { who: 'narr',                      text: '아슬아슬하게 자세를 고친 레온이 활을 긋자, 엉성한 동작과 달리 제법 시원한 음색이 울려 퍼진다.' },
        { who: 'violet', expr: 'neutral',   text: '(문틈으로 훔쳐보며) 또 저러네… 진짜 엉성하기 짝이 없는데.' },
        { who: 'violet', expr: 'surprised', text: '잠깐… 저 엉터리 같은 폼인데도, 어째서 소리만큼은 묘하게 밀착되는 거지?' },
        { who: 'leon',   expr: 'happy',     text: '에라 모르겠다, 일단 긋고 보자! 이야차차!' },
      ] },

    { n: 4,  title: '두 대의 바이올린을 위한 협주곡', book: '바흐/스즈키 5권', pre: { pitch: 22, tempo: 18, bowing: 22, expression: 18 }, req: { pitch: 27, tempo: 27, bowing: 27, expression: 27 },
      intro: [
        { who: 'andrea', expr: 'neutral',   img: 'assets/img/cg/intro-q4-duet-rehearsal.png', text: '이번 과제는 두 대의 바이올린 합주다. 파트너와 호흡을 맞춰라.' },
        { who: 'leon',   expr: 'surprised', text: '네? 제 파트너가 누구라고요? 설마… 저기 얼음장 같은 분이요?' },
        { who: 'violet', expr: 'angry',     text: '내가 왜 저런 엉터리 청소부랑 합주를 해야 하는 거지, 교수님?!' },
        { who: 'andrea', expr: 'happy',     text: '허허, 둘이 같이 켜보면 알게 될 테니 사양 말고 자리에 서게.' },
        { who: 'leon',   expr: 'shy',       text: '어색하겠지만… 바이올렛, 잘 부탁해! (싱긋 웃음)' },
        { who: 'violet', expr: 'proud',     text: '(흥, 엉망진창으로 틀리기만 해봐 아주 가만두지 않을 거야.)' },
      ] },

    { n: 5,  title: '타이스의 명상곡',            book: '마스네',          pre: { expression: 31, tempo: 30 }, req: { expression: 39, tempo: 36 },
      intro: [
        { who: 'narr', bg: 'assets/img/bg/bg-practice-room.png', img: 'assets/img/cg/intro-q5-violet-practice-room.png', text: '연습실 구석, 바이올렛이 쉴 틈도 없이 바이올린을 쥐고 벌벌 떨고 있다.' },
        { who: 'violet', expr: 'sad',       text: '(안 돼… 이번에도 수석을 놓치면 아버지께 또 호되게 혼날 거야. 완벽해야 해, 무조건…)' },
        { who: 'leon',   expr: 'shy',       text: '(지나가다 멈춰 서며) 바이올렛? 너 얼굴이 왜 이래? 숨도 제대로 못 쉬고 있잖아.' },
        { who: 'violet', expr: 'angry',     text: '상관없잖아! 네가 뭔데 내 연습에 참견이야? 비켜!' },
        { who: 'leon',   expr: 'neutral',   text: '가문이니 수석이니 그런 건 몰라도, 지금 너 엄청 울고 싶은 표정이야.' },
        { who: 'leon',   expr: 'shy',       text: '내가 옆에서 그냥… 내 마음대로 한번 켜볼 테니까, 귀 기울여 들어볼래?' },
      ] },

    { n: 6,  title: '라 폴리아',                  book: '스즈키 7권',      pre: { bowing: 42, pitch: 38 }, req: { bowing: 52, pitch: 48 },
      intro: [
        { who: 'andrea', expr: 'neutral',   img: 'assets/img/cg/intro-q6-la-folia.png', text: '광기 어린 변주곡, 「라 폴리아」다. 감정을 다잡고 몰아쳐라.' },
        { who: 'leon',   expr: 'neutral',   text: '알겠어 마에스트로! 이번엔 빙구미 안 부리고 진지하게 간다!' },
        { who: 'narr',                      text: '바이올렛이 한층 부드러워진 눈빛으로 레온을 바라보며 고개를 끄덕인다.' },
        { who: 'violet', expr: 'neutral',   text: '레온, 저번처럼 실수하기만 해봐. 이번엔 안 봐줄 거야.' },
        { who: 'leon',   expr: 'happy',     text: '하하, 믿으라구! 이제 나도 제법 거장 같아졌으니까!' },
        { who: 'andrea', expr: 'happy',     text: '좋다, 그 자신감으로 폭풍 같은 변주를 시작해 보게나!' },
      ] },

    { n: 7,  title: '차르다시',                   book: '몬티',            pre: { tempo: 52, bowing: 48 }, req: { tempo: 66, bowing: 62 },
      intro: [
        { who: 'andrea', expr: 'neutral',   img: 'assets/img/cg/intro-q7-czardas-memory.png', text: '이번 곡은 몬티의 「차르다시」다. 애절한 슬픔에서 폭발적인 광기로 치달아야 해.' },
        { who: 'leon',   expr: 'neutral',   text: '애절한 슬픔이라… 왠지 이 곡의 도입부, 내 어릴 적 기억을 꼭 닮았어.' },
        { who: 'narr',                      text: '레온이 눈을 감자, 아기 때 사고로 부모를 잃고 조부모의 거친 손에 이끌려 자라던 가난했던 시절의 풍경이 스친다.' },
        { who: 'violet', expr: 'neutral',   text: '(레온의 굳은 표정을 눈치채며) 레온? 연주 시작하기 전인데 왜 그렇게 슬픈 눈을 하고 있어?' },
        { who: 'leon',   expr: 'shy',       text: '아니, 그냥… 우리 할머니 할아버지가 생각나서. 빈털터리였던 날 키워주신 분들이거든.' },
        { who: 'violet', expr: 'soft',      text: '……너의 그 쓸쓸한 눈빛마저, 이번 곡에 전부 쏟아내 봐. 내가 곁에서 받아줄 테니까.' },
      ] },

    { n: 8,  title: '서주와 알레그로',            book: '크라이슬러',      pre: { pitch: 64, expression: 60 }, req: { pitch: 81, expression: 76 },
      intro: [
        { who: 'andrea', expr: 'neutral',    img: 'assets/img/cg/intro-q8-broken-practice.png', text: '크라이슬러의 「서주와 알레그로」다. 이제 화려한 기교와 장엄함을 증명해 보일 차례야.' },
        { who: 'leon',   expr: 'neutral',    text: '네, 마에스트로! 이번에도 제대로… (활을 긋자마자 찌그러진 소리가 난다) 엇?' },
        { who: 'narr',                       text: '비브라토는 경련처럼 떨리고, 활을 바꿀 때마다 소리가 뚝뚝 끊기며 박자는 절뚝거리기 시작한다.' },
        { who: 'leon',   expr: 'frustrated', text: '왜 이러지… 활은 비실비실한 소리만 나고, 포지션 이동은 완전히 운에 맡겨야 하잖아.' },
        { who: 'andrea', expr: 'strict',     text: '멈추게! 이래서야 악기를 제대로 쥐고 있는 게 맞나? 집중해라!' },
        { who: 'leon',   expr: 'angry',      text: '나도 마음대로 안 된다고요! 더 이상 안 해, 해봤자 소용없어! (바이올린을 내려놓고 밖으로 도망친다)' },
      ] },

    { n: 9,  title: '샤콘느',                     book: '바흐',            pre: { expression: 78, tempo: 73, pitch: 65 }, req: { expression: 98, tempo: 92, pitch: 81 },
      intro: [
        { who: 'andrea', expr: 'neutral', bg: 'assets/img/bg/bg-cathedral-night.png', img: 'assets/img/cg/intro-q9-cathedral-chaconne.png', text: '무반주 바이올린 곡의 성경, 바흐의 「샤콘느」다. 혼자서 모든 것을 채워야 해.' },
        { who: 'leon',   expr: 'neutral',   text: '피아노나 오케스트라의 도움 없이, 오직 내 현과 활로만…' },
        { who: 'narr',                      text: '레온이 눈을 감고 활을 긋자, 텅 빈 공간이 고독하면서도 거대한 울림으로 채워진다.' },
        { who: 'violet', expr: 'sad',       text: '(저 쓸쓸하면서도 아름다운 음색… 레온의 진심이 고스란히 전해져.)' },
        { who: 'leon',   expr: 'neutral',   text: '(이 소리가 너에게 닿기를, 내 모든 감정이 전해지기를.)' },
        { who: 'andrea', expr: 'happy',     text: '(음악으로 영혼을 교감하고 있군. 더 이상 바랄 게 없네.)' },
      ] },

    { n: 10, title: '바이올린 협주곡',            book: '차이코프스키',    pre: { pitch: 90, tempo: 85, bowing: 85, expression: 90 }, req: { pitch: 110, tempo: 110, bowing: 110, expression: 110 },
      intro: [
        { who: 'andrea', expr: 'neutral', bg: 'assets/img/bg/bg-cremona-plaza.png', img: 'assets/img/cg/intro-q10-competition-stage.png', text: '드디어 마지막 관문이다. 「차이코프스키 협주곡」으로 콩쿠르 무대를 제패해라.' },
        { who: 'leon',   expr: 'neutral',   text: '지금까지 갈고닦은 모든 기술과 감정을 이 무대에 쏟아붓겠어.' },
        { who: 'violet', expr: 'happy',     text: '레온, 네 뒤에는 항상 내가 있어. 마음껏 연주해줘!' },
        { who: 'narr',                      text: '크레모나 대극장, 수많은 관객들의 시선이 무대 위 레온에게 집중된다.' },
        { who: 'leon',   expr: 'happy',     text: '(시작하자, 우리들의 마지막이자 최고의 음악을!)' },
        { who: 'narr',                      text: '화려하고 폭발적인 선율이 극장 전체를 뒤흔들며 거대한 파도를 일으킨다.' },
      ] },
  ];

  /* ---- 프롤로그 (오프닝, 7컷) ------------------------------------------- */
  const PROLOGUE = [
    { who: 'narr',   img: 'assets/img/cg/opening-audition-hall.png', text: '여기는 이탈리아 크레모나, "세브지크 바이올린 아카데미" 대강당. 엄숙한 블라인드 입시 오디션이 한창이다.' },
    { who: 'narr',   img: 'assets/img/cg/opening-leon-finds-violin.png', text: '강당 청소 알바를 하러 온 레온은 무대 구석에 덩그러니 놓인 바이올린을 발견했다.' },
    { who: 'leon',   expr: 'shy',       text: '이런 게 여기 왜 있지... 한 번만 켜봐도 될까.' },
    { who: 'narr',   img: 'assets/img/cg/opening-hidden-talent.png', text: '호기심에 활을 그은 순간, 자세는 엉망이었지만 강당을 뒤흔드는 경이로운 울림이 터져 나왔다.' },
    { who: 'andrea', expr: 'surprised', text: '(문 뒤에서 튀어나오며) 으아니?! 방금 그 원시적이면서도 소름 돋는 음색은 대체 뭐란 말인가!' },
    { who: 'leon',   expr: 'surprised', text: '억, 들켰다! 죄송합니다 변상할 돈은 없어요 살려주세요! (허겁지겁 도망)' },
    { who: 'andrea', expr: 'happy',     text: '(레온의 멱살을 잡으며) 도망가지 마라! 알바하면서 돈도 벌고, 내 전속 견습생으로 들어와라!' },
    { who: 'violet', expr: 'proud',     text: '(청소부가 견습생? …흥, 무대는 그렇게 만만한 곳이 아니에요.)' },
  ];

  /* ---- 퀘스트 아웃트로 (순서대로 재생, 선택지는 인라인) ----------------- *
   *  각 항목은 대사 배열. { choice: {...} } 를 중간에 끼우면 선택지가 뜬다.
   * --------------------------------------------------------------------- */
  const QUEST_CLEAR = {
    1: [
      { who: 'andrea', expr: 'happy',   img: 'assets/img/cg/outro-q1-little-star.png', text: '어설프지만 「작은별」 완주 성공이다. 첫발은 내디뎠어.' },
      { who: 'leon',   expr: 'happy',   text: '해냈지롱! 어때 바이올렛, 내 천재적인 연주 실력이?' },
      { who: 'violet', expr: 'angry',   text: '어이가 없어서 원. 유치원생 장기자랑 보는 줄 알았네. 두 번 다시 내 눈앞에서 그런 엉성한 연주 하지 마.' },
      { who: 'leon',   expr: 'neutral', text: '(속닥) 쟤는 왜 저렇게 화가 나 있지… 나 뭐 잘못했나?' },
      { who: 'narr',                    text: '툴툴거리며 자리를 뜨는 바이올렛의 뒷모습. 하지만 그녀의 귓가에는 어설프면서도 묘하게 남는 레온의 톤이 계속 맴돌았다.' },
      { who: 'andrea', expr: 'proud',   text: '자, 다음 과제로 넘어가세. 빙구미는 잠시 넣어두고 집중하게나!' },
      { who: 'leon',   expr: 'neutral', text: '넵! 다음엔 더 멋지게 켜볼게요!' },
    ],

    2: [
      { who: 'narr', img: 'assets/img/cg/outro-q2-humoresque-after.png', text: '진땀을 흘리며 간신히 곡을 끝마친 레온이 헥헥거린다.' },
      { choice: {
        prompt: '연습실 앞, 바이올렛이 팔짱을 낀 채 서 있다. 뭐라고 할까?',
        options: [
          { label: '“네가 들으면, 내 심장이 먼저 연주해.”', aff: +18, reply: { who: 'violet', expr: 'blush', text: '뭐, 뭐야 갑자기. 그런 식으로 말하면… 연습에 집중이 안 되잖아.' } },
          { label: '“지금은 네 시선보다 내 소리의 이유가 궁금해.”', aff: -18, reply: { who: 'violet', expr: 'neutral', text: '…그렇구나. 그럼 증명해 봐. 네가 어디까지 음악을 파고들 수 있는지.' } },
        ] } },
      { who: 'narr', text: '그 한마디를 기점으로 두 사람의 관계는 조금씩 방향을 잡기 시작한다. 서로에게 끌릴지, 음악이라는 같은 별을 바라볼지는 레온의 선택에 달려 있다.' },
    ],

    3: [
      { who: 'andrea', expr: 'happy',   img: 'assets/img/cg/outro-q3-seitz-breakthrough.png', text: '폼은 빙구 같아도 보잉의 밀도가 순간적으로 확 살았어! 합격이다!' },
      { who: 'leon',   expr: 'panting', text: '아이고 팔야… 활 쓰기 진짜 힘드네.' },
      { who: 'violet', expr: 'proud',   text: '(나타나며) 요행인 줄 알아. 그런 엉성한 폼으로 거장이 될 리 없으니까.' },
      { who: 'leon',   expr: 'neutral', text: '오, 바이올렛! 내 연주 들었어? 어땠어?' },
      { who: 'violet', expr: 'blush',   text: '시, 시끄러워! 묻지도 마! (황급히 도망)' },
      { who: 'narr',                    text: '얼굴이 빨개져 도망치는 바이올렛의 눈빛에는, 레온의 엉성함 뒤에 숨은 「특별한 재능」을 어렴풋이 직감한 기색이 담겨 있었다.' },
      { who: 'narr',                    text: '점차 진화하는 레온의 소리에 아카데미의 시선이 조금씩 달라지기 시작한다.' },
    ],

    4: [
      { who: 'narr', img: 'assets/img/cg/q4-duet.png', text: '우려와 달리, 두 사람의 활이 맞물리며 강당을 채우는 완벽한 화음이 터져 나온다.' },
      { choice: {
        prompt: '첫 듀엣을 마친 직후, 상기된 바이올렛에게…',
        options: [
          { label: '“너와 함께 숨 쉬고 싶었어.”', aff: +20, reply: { who: 'violet', expr: 'blush', text: '…그런 말을 무대 끝나자마자 하는 건 반칙이야. 하지만, 싫진 않았어.' } },
          { label: '“오늘 배운 건 네가 아니라 바흐의 구조야.”', aff: -20, reply: { who: 'violet', expr: 'proud', text: '흥, 낭만은 없지만 정확하네. 그런 몰입이라면… 나도 연주자로서 인정할게.' } },
        ] } },
      { who: 'narr', text: '같은 화음을 지나왔지만, 레온의 마음은 두 갈래로 갈라진다. 그녀와 더 가까워지는 길, 혹은 음악 그 자체로 더 깊이 들어가는 길.' },
    ],

    5: [
      { who: 'narr', img: 'assets/img/cg/q5-meditation.png', text: '레온이 켜기 시작한 타이스의 명상곡. 테크닉은 투박하지만, 모든 압박을 감싸 안는 듯한 온화한 음색이 퍼져나간다.' },
      { who: 'violet', expr: 'sad',     text: '(이 따뜻한 소리는 뭐지… 늘 완벽해야 한다는 압박에 짓눌려 있던 내 마음이, 거짓말처럼 풀려…)' },
      { who: 'narr',                    text: '바이올렛의 눈에서 참아왔던 눈물이 툭 떨어지며 활을 쥔 손의 힘이 스르륵 풀린다.' },
      { who: 'violet', expr: 'blush',   text: '바보 같아… 어째서 네 소리만 들으면, 난 자꾸 솔직해지는 걸까.' },
      { who: 'leon',   expr: 'happy',   text: '울지 마, 바이올렛. 음악은 힘든 걸 잠시 잊으라고 있는 거니까.' },
      { who: 'andrea', expr: 'proud',   text: '(문가에서 흐뭇하게 보며) 녀석, 기술은 부족해도 사람의 상처를 치유하는 천재적인 재주가 있단 말이야.' },
      { who: 'narr',                    text: '레온의 따뜻한 위로 속에 바이올렛은 그를 경쟁자도, 초보자도 아닌 한 명의 연주자로 다시 보기 시작한다.' },
    ],

    6: [
      { who: 'violet', expr: 'neutral', img: 'assets/img/cg/outro-q6-la-folia-success.png', text: '라 폴리아. 네가 가진 그 무서운 잠재력, 이제야 제대로 알겠어.' },
      { who: 'leon',   expr: 'panting', text: '후유… 온 힘을 다 쏟아부었더니 다리가 후들거리네.' },
      { who: 'violet', expr: 'proud',   text: '(피식 웃으며) 여전히 끝에 가서는 허당이라니까. …그래도, 멋졌어.' },
      { who: 'narr',                    text: '연주가 끝난 무대 위로 학생들의 환호성이 터져 나온다.' },
      { who: 'andrea', expr: 'proud',   text: '훌륭하다. 두 사람이 서로를 이끌어주는 최고의 파트너가 되었어.' },
      { who: 'leon',   expr: 'neutral', text: '자, 다음 고난도 곡들도 이 기세로 돌파해 보자고!' },
      { who: 'narr',                    text: '아카데미를 뒤흔드는 두 사람의 앙상블은 이제 누구도 막을 수 없다.' },
    ],

    7: [
      { who: 'narr', img: 'assets/img/cg/q7-czardas.png', text: '차르다시의 휘몰아치는 후반부가 끝나고, 두 사람의 거친 숨소리만이 연습실을 채운다.' },
      { choice: {
        prompt: '연주를 마친 레온이 눈가를 쓸어내린다. 바이올렛이 다가와 조용히 물어본다.',
        options: [
          { label: '“그 외로움 속에서, 네가 떠올랐어.”', aff: +20, reply: { who: 'violet', expr: 'blush', text: '(가만히 레온의 소매를 잡으며) ……이제는 내가 네 곁에 있어 줄게. 혼자가 아니야.' } },
          { label: '“외로움도 결국 음색을 만드는 재료였어.”', aff: -20, reply: { who: 'violet', expr: 'soft',  text: '너답다. 사람보다 먼저 소리를 들여다보는구나. …그래도 그 깊이는 싫지 않아.' } },
        ] } },
      { who: 'narr', text: '바이올렛은 레온의 상처를 이해한다. 다만 그 상처가 사랑으로 향할지, 더 깊은 음악성으로 향할지는 아직 정해지지 않았다.' },
    ],

    8: [
      { who: 'narr', img: 'assets/img/cg/outro-q8-return-home.png', text: '캄캄한 골목길, 우연히 마주친 시내 단골 가게 사장님이 건네는 따뜻한 음료 한 잔에 레온의 마음이 조금씩 녹아내린다.' },
      { who: 'store_owner', expr: 'friendly', text: '레온, 악기 안 켜고 무슨 일이야? 네가 가게 앞에서 켜주던 그 투박한 소리가 은근히 골목 활력소였는데 말이야.' },
      { who: 'narr',                        text: '발길을 돌려 찾아간 이웃집 친구가 건네는 무심한 위로 속에서, 레온은 자신도 모르게 음악이 스며 있던 일상을 떠올린다.' },
      { who: 'friend', expr: 'warm',        text: '너 맨날 삐걱대도 이상하게 네 연주 들으면 마음이 편해졌거든? 포기하지 마, 너 잘하잖아.' },
      { who: 'narr',                        text: '마지막으로 터덜터덜 찾아간 집에서 할머니와 할아버지가 묵묵히 차려주신 밥상을 받자, 잊고 있던 바이올린을 향한 진짜 진심이 선명해진다.' },
      { who: 'leon', expr: 'determined',    text: '……그래, 내가 진짜 사랑하는 음악을 이대로 놓아버릴 순 없어!' },
      { who: 'narr',                        text: '한층 더 단단해진 마음으로 아카데미 문을 벌컥 연 레온의 손끝에서, 마침내 새로운 생기가 피어오른다.' },
    ],

    9: [
      { who: 'narr', img: 'assets/img/cg/q9-chaconne-moonlight.png', text: '샤콘느의 마지막 여운이 사라지고, 사방이 숨을 죽인 듯 고요해진다.' },
      { choice: {
        prompt: '샤콘느의 마지막 음. 바이올렛의 눈에 눈물이 맺힌다.',
        options: [
          { label: '“이 곡은 너를 사랑해서 태어난 거야.”', aff: +22, reply: { who: 'violet', expr: 'blush', text: '…그렇게 말하면, 난 더는 모른 척할 수 없잖아.' } },
          { label: '“이 곡은 내가 음악에게 바치는 고백이야.”', aff: -22, reply: { who: 'violet', expr: 'shy', text: '…알아. 너는 그 순간, 나보다 더 먼 곳을 보고 있었어. 그래도 난 그 시선을 응원하고 싶어.' } },
        ] } },
      { who: 'violet', expr: 'sad', text: '사랑이든, 음악이든… 네 진심은 결국 활 끝에서 숨을 쉬는구나.' },
    ],

    10: [
      { who: 'narr', img: 'assets/img/cg/q10-final-stage.png', text: '크레모나 광장. 마지막 음이 하늘로 흩어진다. — 커튼콜.' },
      { who: 'narr',                    text: '관객석에서 폭풍 같은 기립박수와 환호성이 터져 나온다.' },
      { who: 'andrea', expr: 'proud',   text: '브라보! 브라보 레온! 완벽한 연주였다!' },
      { who: 'leon',   expr: 'panting', text: '해냈습니다… 아니, 해냈어! 마에스트로, 그리고 바이올렛.' },
      { who: 'violet', expr: 'happy',   text: '최고의 무대였어. 정말 자랑스러워, 레온.' },
      { who: 'narr',                    text: '쏟아지는 노을빛 아래, 두 사람은 서로를 바라보며 조용히 고개를 끄덕인다.' },
      { who: 'narr',                    text: '🎻 차이코프스키 완곡 — 최종 엔딩으로 진입합니다.' },
    ],
  };

  /* ---- 엔딩 (오프닝처럼 6~7컷) ----------------------------------------- */
  const ENDING = {
    high: { // 사랑 엔딩 (사랑 게이지 ≥ 50)
      cg: 'high', cgImg: 'assets/img/cg/ending-true-duet.png',
      lines: [
        { who: 'narr',   text: '크레모나 대성당 광장. 콩쿠르의 마지막 음이 노을 속으로 흩어진다.' },
        { who: 'andrea', expr: 'proud', text: '청소부에서 최우수상이라니… 내 눈은 틀리지 않았어.' },
        { who: 'leon',   expr: 'blush', text: '마에스트로, 그리고… 바이올렛. 내 음악은 너를 만나고서야 심장을 갖게 됐어.' },
        { who: 'violet', expr: 'blush', text: '네가 나를 향해 켠 모든 음을 들었어. 그래서 나도 더는 숨기지 않을래.' },
        { who: 'leon',   expr: 'happy', text: '바이올렛. 앞으로도 너를 사랑하는 마음을 내 음악에 녹여낼게. 평생 나와 이중주를 켜줘.' },
        { who: 'violet', expr: 'happy', text: '…응. 다음 곡은 우리 둘의 사랑으로 쓰자.' },
        { who: 'narr',   text: '🎻 THE END — 「사랑으로 쓰는 이중주」 · 사랑 엔딩' },
      ],
    },
    normal: { // 음악성 탐구 엔딩
      cg: 'normal', cgImg: 'assets/img/cg/ending-music-seeker.png',
      lines: [
        { who: 'narr',   text: '크레모나 광장. 우승 트로피보다도, 레온의 시선은 아직 끝나지 않은 악보를 향해 있다.' },
        { who: 'andrea', expr: 'happy',   text: '해냈군, 레온. 하지만 자네 눈을 보니 알겠어. 이미 다음 소리를 찾고 있군.' },
        { who: 'leon',   expr: 'neutral', text: '네. 오늘의 박수보다, 방금 마지막 악장에 숨어 있던 가능성이 더 신경 쓰입니다.' },
        { who: 'violet', expr: 'neutral', text: '레온, 넌 나를 사랑의 끝으로 데려가진 않았어. 대신 음악이 얼마나 깊어질 수 있는지 보여줬지.' },
        { who: 'violet', expr: 'happy',   text: '나는 네 팬이자 동료이자 조력자로 남을게. 네가 더 먼 곳까지 가는 걸 가장 가까이서 응원할게.' },
        { who: 'leon',   expr: 'happy',   text: '고마워, 바이올렛. 언젠가 내가 찾아낸 소리를, 제일 먼저 너에게 들려줄게.' },
        { who: 'narr',   text: '🎻 THE END — 「끝없는 소리의 탐구자」 · 음악성 엔딩' },
      ],
    },
  };

  /* ======================================================================
   *  방치형 확장 (Particle Clicker 벤치마킹)
   * ==================================================================== */

  /* ---- 조력자: 자동 수익 6단계 (Particle Clicker의 workers) ----------- *
   *  rate = 1개/1명당 초당 포인트, cost = base×growth^보유수
   * -------------------------------------------------------------------- */
  const HELPERS = [
    { id: 'metronome', label: '메트로놈',      icon: '🎚️', baseCost: 30,       growth: 1.17, rate: 0.3,  desc: '똑딱똑딱, 스스로 박자를 맞춰 포인트를 쌓아요.' },
    { id: 'junior',    label: '후배 연습생',    icon: '🧑‍🎓', baseCost: 240,      growth: 1.17, rate: 2,    desc: '당신을 따르는 후배가 함께 연습해요.' },
    { id: 'pianist',   label: '반주자',        icon: '🎹', baseCost: 2600,     growth: 1.17, rate: 12,   desc: '피아노 반주가 붙어 연습이 배가돼요.' },
    { id: 'chamber',   label: '실내악 동료',    icon: '🎻', baseCost: 28000,    growth: 1.17, rate: 65,   desc: '사중주 동료들과 합을 맞춰요.' },
    { id: 'orchestra', label: '오케스트라 단원', icon: '🎺', baseCost: 320000,   growth: 1.17, rate: 350,  desc: '단원 전체가 당신의 무대를 채워요.' },
    { id: 'ta',        label: '음악 조교',      icon: '🧑‍🏫', baseCost: 4000000,  growth: 1.17, rate: 2000, desc: '조교가 연습을 관리해 효율을 극대화해요.' },
  ];

  /* ---- 상점 업그레이드: 일회성 배수 (Particle Clicker의 upgrades) ----- *
   *  effect.type: tap(탭배수) / auto(자동배수) / all(전체배수) / helper(조력자배수)
   *  unlock.type: taps / helpersOwned / lifetime / quest / helperCount
   * -------------------------------------------------------------------- */
  const UPGRADES = [
    { id: 'rosin',    label: '좋은 송진',        icon: '🟫', cost: 800,     effect: { type: 'tap',  mult: 2 },                    unlock: { type: 'taps', v: 80 },              desc: '활에 잘 발린 송진. 탭당 획득 ×2.' },
    { id: 'finebow',  label: '명품 활',          icon: '🏹', cost: 5000,    effect: { type: 'auto', mult: 2 },                    unlock: { type: 'helpersOwned', v: 8 },       desc: '가벼운 명품 활. 자동 획득 ×2.' },
    { id: 'shoulder', label: '어깨받침',         icon: '🎽', cost: 18000,   effect: { type: 'all',  mult: 1.5 },                  unlock: { type: 'lifetime', v: 12000 },       desc: '자세가 안정돼 전체 획득 ×1.5.' },
    { id: 'metromas', label: '메트로놈 마스터',   icon: '⏰', cost: 12000,   effect: { type: 'helper', target: 'metronome', mult: 3 }, unlock: { type: 'helperCount', target: 'metronome', v: 15 }, desc: '메트로놈 효율 ×3.' },
    { id: 'ensemble', label: '앙상블 호흡',       icon: '🌬️', cost: 140000,  effect: { type: 'helper', target: 'all', mult: 2 },   unlock: { type: 'helpersOwned', v: 36 },      desc: '모든 조력자 효율 ×2.' },
    { id: 'strad',    label: '스트라디바리우스',  icon: '🎻', cost: 600000,  effect: { type: 'all',  mult: 2 },                    unlock: { type: 'quest', v: 5 },              desc: '전설의 명기. 전체 획득 ×2.' },
    { id: 'charisma', label: '무대 카리스마',     icon: '✨', cost: 2400000, effect: { type: 'tap',  mult: 3 },                    unlock: { type: 'lifetime', v: 1200000 },     desc: '관객을 사로잡는 존재감. 탭당 ×3.' },
    { id: 'maestro',  label: '마에스트로의 지도', icon: '🎼', cost: 5000000, effect: { type: 'all',  mult: 2 },                    unlock: { type: 'quest', v: 8 },              desc: '거장의 가르침. 전체 획득 ×2.' },
  ];

  /* ---- 업적: 마일스톤 + 일부 영구 보너스 (Particle Clicker의 discoveries) *
   *  cond.type: taps / helpersOwned / lifetime / quest / affection
   *  bonus.mult: (선택) 전체 획득 배수
   * -------------------------------------------------------------------- */
  const ACHIEVEMENTS = [
    { id: 'firstnote', label: '첫 음',        icon: '🎵', cond: { type: 'taps', v: 1 },              desc: '처음으로 활을 그었다.' },
    { id: 'finger',    label: '손끝의 감각',   icon: '👆', cond: { type: 'taps', v: 500 },           bonus: { mult: 1.05 }, desc: '탭 500회. 전체 +5%.' },
    { id: 'diligent',  label: '성실한 연습',   icon: '📅', cond: { type: 'taps', v: 5000 },          bonus: { mult: 1.05 }, desc: '탭 5,000회. 전체 +5%.' },
    { id: 'firsthelp', label: '첫 조력자',     icon: '🤝', cond: { type: 'helpersOwned', v: 1 },     desc: '함께하는 이가 생겼다.' },
    { id: 'smallens',  label: '작은 앙상블',   icon: '👥', cond: { type: 'helpersOwned', v: 10 },    bonus: { mult: 1.05 }, desc: '조력자 10명. 전체 +5%.' },
    { id: 'grandens',  label: '대편성',        icon: '🏟️', cond: { type: 'helpersOwned', v: 50 },    bonus: { mult: 1.1 },  desc: '조력자 50명. 전체 +10%.' },
    { id: 'million',   label: '백만장자',      icon: '💰', cond: { type: 'lifetime', v: 1000000 },   bonus: { mult: 1.1 },  desc: '누적 100만 포인트. 전체 +10%.' },
    { id: 'debut',     label: '데뷔 무대',     icon: '🌟', cond: { type: 'quest', v: 1 },            desc: '첫 곡을 완주했다.' },
    { id: 'midway',    label: '중반 고비',     icon: '⛰️', cond: { type: 'quest', v: 5 },            desc: '절반을 넘어섰다.' },
    { id: 'virtuoso',  label: '거장의 길',     icon: '👑', cond: { type: 'quest', v: 10 },           bonus: { mult: 1.2 },  desc: '전곡 완주! 전체 +20%.' },
    { id: 'firstlove', label: '사랑의 선율', icon: '💗', cond: { type: 'affection', v: 50 },       desc: '바이올렛을 향한 마음이 음악에 스며들었다.' },
  ];

  const OFFLINE = { capHours: 8, efficiency: 0.5, minSeconds: 120 };

  return { CHARACTERS, SKILLS, SKILL_ORDER, ENCORE, QUESTS, PROLOGUE, QUEST_CLEAR, ENDING,
           HELPERS, UPGRADES, ACHIEVEMENTS, OFFLINE };
})();
