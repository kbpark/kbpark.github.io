/* =========================================================================
 *  바이올리니스트 메이커 — 상태 & 저장 (state.js)
 *  게임 진행 상태를 보관하고 LocalStorage 자동 저장/복원을 담당한다.
 * ========================================================================= */
const GameState = (() => {
  'use strict';

  const SAVE_KEY = 'violinist-maker.save.v1';

  /* 기본(신규) 상태 */
  function freshState() {
    return {
      points: 0,            // 연습 포인트 (재화)
      lifetimePoints: 0,    // 누적 획득(업적/해금 기준)
      totalTaps: 0,         // 통계용 누적 탭
      skills: { pitch: 0, tempo: 0, bowing: 0, expression: 0 }, // 스킬 레벨
      helpers: {},          // 조력자 보유수 { id: count }
      upgrades: {},         // 보유 업그레이드 { id: true }
      achievements: {},     // 달성 업적 { id: true }
      questIndex: 0,        // 클리어한 퀘스트 수 (현재 도전 = QUESTS[questIndex])
      introShown: {},       // 인트로 재생 완료한 퀘스트 { n: true }
      affection: 0,         // 바이올렛 사랑 게이지 (0=음악성 탐구, 100=사랑)
      buyMode: 'x1',        // 구매 수량 모드 x1/x10/max
      clearedPrologue: false,
      tutorialShown: false, // 조작법 안내 1회 표시 여부
      endingShown: false,   // 엔딩 연출 재생 여부
      bgmOn: true,          // 배경음악 켜짐
      sfxOn: true,          // 효과음(타건/연출) 켜짐
      savedAt: 0,
    };
  }

  let state = freshState();

  /* ---- 접근자 ---------------------------------------------------------- */
  function get() { return state; }
  function skillLevel(id) { return state.skills[id] || 0; }
  function helperCount(id) { return state.helpers[id] || 0; }
  function totalHelpers() {
    let n = 0; for (const k in state.helpers) n += state.helpers[k]; return n;
  }
  function addAffection(delta) {
    state.affection = Math.max(0, Math.min(100, state.affection + delta));
    return state.affection;
  }
  /* 포인트 획득은 항상 이 함수로 → 잔액과 누적을 함께 갱신 */
  function addPoints(n) {
    if (n <= 0) return;
    state.points += n;
    state.lifetimePoints += n;
  }

  /* ---- 저장 / 복원 ----------------------------------------------------- */
  function save() {
    try {
      state.savedAt = _now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('[save] 실패:', e);
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      // 신규 필드가 추가돼도 깨지지 않도록 기본값과 병합
      const base = freshState();
      state = Object.assign(base, parsed, {
        skills:       Object.assign(base.skills, parsed.skills || {}),
        helpers:      Object.assign({}, parsed.helpers || {}),
        upgrades:     Object.assign({}, parsed.upgrades || {}),
        achievements: Object.assign({}, parsed.achievements || {}),
        introShown:   Object.assign({}, parsed.introShown || {}),
      });
      return true;
    } catch (e) {
      console.warn('[load] 실패, 새 게임으로 시작:', e);
      state = freshState();
      return false;
    }
  }

  function reset() {
    state = freshState();
    try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
  }

  // 이전에 저장된 진행 데이터가 있는지
  function hasSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      return hasProgress(JSON.parse(raw));
    } catch (_) {
      return false;
    }
  }

  function hasProgress(s) {
    if (!s) return false;
    if ((s.questIndex || 0) > 0) return true;
    if ((s.totalTaps || 0) > 0) return true;
    if ((s.lifetimePoints || 0) > 0) return true;
    if (s.clearedPrologue) return true;
    if (Object.keys(s.helpers || {}).length) return true;
    if (Object.keys(s.upgrades || {}).length) return true;
    if (Object.keys(s.achievements || {}).length) return true;
    if (Object.keys(s.introShown || {}).length) return true;
    return false;
  }

  /* Date.now() 대체 — 일부 샌드박스 환경 대응 */
  function _now() {
    try { return Date.now(); } catch (_) { return 0; }
  }

  return { get, skillLevel, helperCount, totalHelpers, addAffection, addPoints,
           save, load, reset, hasSave, freshState, SAVE_KEY };
})();
