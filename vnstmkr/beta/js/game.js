/* =========================================================================
 *  바이올리니스트 메이커 — 게임 로직 & 루프 (game.js)
 *  스킬 · 조력자 · 상점 업그레이드 · 업적 · 오프라인 수익 · 퀘스트(2단계 게이트)
 *  · 표현력 액티브「감정 폭발」 · 사랑 게이지 · 사운드 · 엔딩 · 메인 루프.
 *
 *  퀘스트 흐름: pre(선제조건) 충족 → intro 재생 + 목록 공개
 *              → req(달성조건) 충족 → '연주하기' → outro 재생 + 클리어
 * ========================================================================= */
const Game = (() => {
  'use strict';

  const D = GameData;
  const { SKILLS, SKILL_ORDER, ENCORE, QUESTS, PROLOGUE, QUEST_CLEAR,
          HELPERS, UPGRADES, ACHIEVEMENTS, OFFLINE } = D;
  const HELP = Object.fromEntries(HELPERS.map((h) => [h.id, h]));
  const UP   = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
  const ROMANCE_ENDING_MIN = 50; // 0~49 음악성 엔딩, 50~100 사랑 엔딩
  const BUY_MODES = ['x1', 'x10', 'max'];

  let lastTick = 0, autoAccrual = 0, running = false;
  let burstUntil = 0, cdUntil = 0, wasBurst = false; // 감정 폭발 상태(비저장)

  const now = () => { try { return Date.now(); } catch (_) { return 0; } };

  /* ---- 표현력 「감정 폭발」 --------------------------------------------- */
  const encDuration = () => ENCORE.baseDuration + ENCORE.durPerLv * GameState.skillLevel('expression');
  const encCooldown = () => Math.max(ENCORE.minCooldown, ENCORE.baseCooldown - ENCORE.cdPerLv * GameState.skillLevel('expression'));
  const encActive   = () => now() < burstUntil;

  function encore() {
    if (now() < cdUntil) return false;         // 재충전 중
    const t = now();
    burstUntil = t + encDuration() * 1000;
    cdUntil    = t + encCooldown() * 1000;
    Audio.emotionBurst();
    UI.toast('🎭 감정 폭발!', `${encDuration().toFixed(0)}초 동안 모든 획득 ×${ENCORE.mult}!`, 2500);
    UI.render();
    return true;
  }
  function encoreState() {
    const t = now();
    if (t < burstUntil) return { state: 'active',   remain: (burstUntil - t) / 1000, mult: ENCORE.mult };
    if (t < cdUntil)    return { state: 'cooldown', remain: (cdUntil - t) / 1000 };
    return { state: 'ready', dur: encDuration(), cd: encCooldown(), mult: ENCORE.mult };
  }

  /* ---- 배수 집계 ------------------------------------------------------- */
  function multipliers() {
    const st = GameState.get();
    let tap = 1, auto = 1, all = 1, ach = 1, helperAll = 1;
    const helper = {};
    for (const id in st.upgrades) {
      if (!st.upgrades[id] || !UP[id]) continue;
      const e = UP[id].effect;
      if (e.type === 'tap') tap *= e.mult;
      else if (e.type === 'auto') auto *= e.mult;
      else if (e.type === 'all') all *= e.mult;
      else if (e.type === 'helper') {
        if (e.target === 'all') helperAll *= e.mult;
        else helper[e.target] = (helper[e.target] || 1) * e.mult;
      }
    }
    for (const a of ACHIEVEMENTS) if (st.achievements[a.id] && a.bonus) ach *= a.bonus.mult;
    if (encActive()) all *= ENCORE.mult;       // 감정 폭발: 전체 ×10
    return { tap, auto, all, ach, helper, helperAll };
  }

  const tempoMult = () => 1 + SKILLS.tempo.power * GameState.skillLevel('tempo');

  function tapValue() {
    const m = multipliers();
    let base = 1;
    for (const key of SKILL_ORDER) if (SKILLS[key].kind === 'tap') base += SKILLS[key].power * GameState.skillLevel(key);
    return base * tempoMult() * m.tap * m.all * m.ach;
  }
  function helperRate(id, m) {
    m = m || multipliers();
    const h = HELP[id], cnt = GameState.helperCount(id);
    return h.rate * cnt * (m.helper[id] || 1) * m.helperAll * tempoMult() * m.auto * m.all * m.ach;
  }
  function autoPerSec() {
    const m = multipliers();
    let bow = 0;
    for (const key of SKILL_ORDER) if (SKILLS[key].kind === 'auto') bow += SKILLS[key].power * GameState.skillLevel(key);
    let helpers = 0;
    for (const h of HELPERS) helpers += h.rate * GameState.helperCount(h.id) * (m.helper[h.id] || 1) * m.helperAll;
    return (bow + helpers) * tempoMult() * m.auto * m.all * m.ach;
  }

  /* ---- 비용 & 대량구매 ------------------------------------------------- */
  const skillCostAt  = (key, lv)   => Math.ceil(SKILLS[key].baseCost * Math.pow(SKILLS[key].growth, lv));
  const helperCostAt = (id, owned) => Math.ceil(HELP[id].baseCost * Math.pow(HELP[id].growth, owned));
  function plan(costAt, current, mode, budget) {
    const limit = mode === 'x1' ? 1 : mode === 'x10' ? 10 : 100000;
    let qty = 0, cost = 0;
    for (let i = 0; i < limit; i++) {
      const c = costAt(current + i);
      if (budget - cost < c) break;
      cost += c; qty++;
    }
    return { qty, cost };
  }
  const skillCost  = (key) => skillCostAt(key, GameState.skillLevel(key));
  const helperCost = (id)  => helperCostAt(id, GameState.helperCount(id));
  const skillPlan  = (key) => plan((lv) => skillCostAt(key, lv), GameState.skillLevel(key), GameState.get().buyMode, GameState.get().points);
  const helperPlan = (id)  => plan((o) => helperCostAt(id, o),  GameState.helperCount(id),  GameState.get().buyMode, GameState.get().points);

  function skillEffect(key) {
    const s = SKILLS[key], lv = GameState.skillLevel(key);
    if (s.kind === 'tap')   return { per: `탭당 +${s.power}`,      now: `현재 +${(s.power*lv).toFixed(1)}` };
    if (s.kind === 'auto')  return { per: `자동 +${s.power}/초`,   now: `현재 +${(s.power*lv).toFixed(1)}/초` };
    if (s.kind === 'mult')  return { per: `전체 +${s.power*100}%`, now: `현재 ×${tempoMult().toFixed(2)}` };
    if (s.kind === 'burst') return { per: `폭발 ×${ENCORE.mult} ${encDuration().toFixed(0)}s`, now: `쿨타임 ${encCooldown().toFixed(0)}s` };
    return { per: '', now: '' };
  }

  /* ---- 업그레이드 / 업적 ---------------------------------------------- */
  function isUnlocked(up) {
    const st = GameState.get(), u = up.unlock;
    switch (u.type) {
      case 'taps':         return st.totalTaps >= u.v;
      case 'helpersOwned': return GameState.totalHelpers() >= u.v;
      case 'lifetime':     return st.lifetimePoints >= u.v;
      case 'quest':        return st.questIndex >= u.v;
      case 'helperCount':  return GameState.helperCount(u.target) >= u.v;
      default: return true;
    }
  }
  function upgradeState(id) {
    if (GameState.get().upgrades[id]) return 'owned';
    return isUnlocked(UP[id]) ? 'available' : 'locked';
  }
  function condMet(a) {
    const st = GameState.get(), c = a.cond;
    switch (c.type) {
      case 'taps':         return st.totalTaps >= c.v;
      case 'helpersOwned': return GameState.totalHelpers() >= c.v;
      case 'lifetime':     return st.lifetimePoints >= c.v;
      case 'quest':        return st.questIndex >= c.v;
      case 'affection':    return st.affection >= c.v;
      default: return false;
    }
  }
  function runAchievements() {
    const st = GameState.get();
    for (const a of ACHIEVEMENTS)
      if (!st.achievements[a.id] && condMet(a)) { st.achievements[a.id] = true; UI.toast(`🏆 업적 달성 — ${a.label}`, a.desc); }
  }

  /* ---- 퀘스트 2단계 게이트 -------------------------------------------- */
  function currentQuest() { return QUESTS[GameState.get().questIndex] || null; }
  function preMet(q) {
    return !q.pre || Object.entries(q.pre).every(([k, lv]) => GameState.skillLevel(k) >= lv);
  }
  /* 상태: cleared / active(인트로 봄·연습중) / ready(선제조건 충족, 눌러서 시작)
   *      / locked(선제조건 미충족) / future */
  function questPhase(n) {
    const st = GameState.get(), idx = st.questIndex;
    if (n <= idx) return 'cleared';
    if (n === idx + 1) {
      if (!preMet(QUESTS[idx])) return 'locked';
      return st.introShown[n] ? 'active' : 'ready';
    }
    return 'future';
  }
  function preText(q) {
    if (!q || !q.pre) return '';
    return Object.entries(q.pre).map(([k, lv]) => `${SKILLS[k].icon}${SKILLS[k].label} Lv.${lv}`).join(' · ');
  }
  function questReady() {
    const q = currentQuest();
    return !!q && Object.entries(q.req).every(([k, lv]) => GameState.skillLevel(k) >= lv);
  }

  // 플레이어가 퀘스트를 눌러 인트로를 재생하고 도전을 시작한다
  function startQuest() {
    const q = currentQuest();
    if (!q || questPhase(q.n) !== 'ready') return false;
    GameState.get().introShown[q.n] = true;
    GameState.save();
    if (q.intro && q.intro.length) UI.showDialogue(q.intro, () => UI.render());
    else UI.render();
    return true;
  }
  // 퀘스트 버튼/행 클릭 → 상태에 따라 시작 또는 연주
  function questAction() {
    const q = currentQuest();
    if (!q) return;
    const ph = questPhase(q.n);
    if (ph === 'ready') startQuest();
    else if (ph === 'active') tryClearQuest();
  }

  /* ---- 액션 ------------------------------------------------------------ */
  function tap() {
    const st = GameState.get();
    const gain = tapValue();
    st.totalTaps += 1;
    GameState.addPoints(gain);
    Audio.tap();
    UI.pulseTap(); UI.floatTap(gain);
    runAchievements(); UI.render();
  }
  function buySkill(key) {
    if (!SKILLS[key]) return false;
    const st = GameState.get(); const p = skillPlan(key);
    if (p.qty < 1) { UI.flash('skill-' + key); return false; }
    st.points -= p.cost; st.skills[key] += p.qty;
    Audio.blip(); runAchievements(); GameState.save(); UI.render();
    return true;
  }
  function buyHelper(id) {
    if (!HELP[id]) return false;
    const st = GameState.get(); const p = helperPlan(id);
    if (p.qty < 1) { UI.flash('helper-' + id); return false; }
    st.points -= p.cost; st.helpers[id] = (st.helpers[id] || 0) + p.qty;
    Audio.blip(); runAchievements(); GameState.save(); UI.render();
    return true;
  }
  function buyUpgrade(id) {
    const up = UP[id]; if (!up) return false;
    const st = GameState.get();
    if (st.upgrades[id] || !isUnlocked(up) || st.points < up.cost) { UI.flash('up-' + id); return false; }
    st.points -= up.cost; st.upgrades[id] = true;
    Audio.fanfare(); UI.toast(`✨ 업그레이드 — ${up.label}`, up.desc);
    runAchievements(); GameState.save(); UI.render();
    return true;
  }
  function addAffection(delta) { const v = GameState.addAffection(delta); runAchievements(); return v; }
  function cycleBuyMode() {
    const st = GameState.get();
    st.buyMode = BUY_MODES[(BUY_MODES.indexOf(st.buyMode) + 1) % BUY_MODES.length];
    GameState.save(); UI.render(); return st.buyMode;
  }

  function tryClearQuest() {
    const q = currentQuest();
    if (!q || questPhase(q.n) !== 'active' || !questReady()) return false;
    const st = GameState.get();
    st.questIndex += 1;
    runAchievements(); GameState.save();

    Audio.applause();
    UI.showDialogue((QUEST_CLEAR[q.n] || []).slice(), () => {
      const next = currentQuest();
      if (next) { Audio.setQuest(next.n); }   // 다음 곡은 눌러서 시작
      else if (!st.endingShown) {
        st.endingShown = true;
        const tier = st.affection >= ROMANCE_ENDING_MIN ? 'high' : 'normal';
        GameState.save(); UI.showEnding(tier);
      }
      GameState.save();
    });
    UI.render();
    return true;
  }

  function restart() {
    if (!confirm('처음부터 다시 시작할까요? 모든 진행과 저장 데이터가 초기화됩니다.')) return;
    GameState.reset(); location.reload();
  }

  /* ---- 오프라인 수익 --------------------------------------------------- */
  function claimOffline() {
    const st = GameState.get();
    if (!st.savedAt) return;
    const dt = (now() - st.savedAt) / 1000;
    if (dt < OFFLINE.minSeconds) return;
    const earned = Math.floor(autoPerSec() * Math.min(dt, OFFLINE.capHours * 3600) * OFFLINE.efficiency);
    if (earned <= 0) return;
    GameState.addPoints(earned); runAchievements();
    UI.toast('🏠 다녀오셨네요!',
      `자리를 비운 ${fmtDuration(dt)} 동안 조력자들이 +${fmtNum(earned)} 벌었어요. (효율 ${OFFLINE.efficiency*100}%)`, 7000);
  }

  /* ---- 메인 루프 ------------------------------------------------------- */
  function loop(ts) {
    if (!running) return;
    if (!lastTick) lastTick = ts;
    const dt = (ts - lastTick) / 1000; lastTick = ts;

    const gain = autoPerSec() * dt;
    if (gain > 0) {
      autoAccrual += gain;
      if (autoAccrual >= 1) {
        const whole = Math.floor(autoAccrual);
        GameState.addPoints(whole); autoAccrual -= whole;
        runAchievements(); UI.render();
      }
    }
    // 감정 폭발/재충전 표시는 매 프레임 갱신, 상태 전환 시 전체 렌더
    const active = encActive();
    if (active !== wasBurst) { wasBurst = active; UI.render(); }
    UI.updateEncore();
    requestAnimationFrame(loop);
  }

  function startAutosave() {
    setInterval(() => GameState.save(), 10000);
    window.addEventListener('beforeunload', () => GameState.save());
  }

  /* ---- 포맷 ------------------------------------------------------------ */
  function fmtNum(n) {
    if (n < 1000) return String(Math.floor(n));
    const u = ['', 'K', 'M', 'B', 'T']; let i = 0;
    while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
    return n.toFixed(n < 10 ? 2 : 1).replace(/\.?0+$/, '') + u[i];
  }
  function fmtDuration(s) {
    if (s < 60) return `${Math.floor(s)}초`;
    if (s < 3600) return `${Math.floor(s/60)}분`;
    return `${Math.floor(s/3600)}시간 ${Math.floor((s%3600)/60)}분`;
  }

  /* ---- 부트스트랩 ------------------------------------------------------ */
  function start() {
    GameState.load();
    const hadSave = GameState.hasSave();
    const st = GameState.get();
    Audio.setBgm(st.bgmOn); Audio.setSfx(st.sfxOn);

    UI.init({
      tap, buySkill, buyHelper, buyUpgrade, tryClearQuest, startQuest, questAction, restart, addAffection, cycleBuyMode, encore,
      tapValue, autoPerSec, tempoMult, helperRate, encoreState,
      skillCost, skillPlan, skillEffect, helperCost, helperPlan, upgradeState, isUnlocked,
      currentQuest, questReady, questPhase, preText, fmtNum,
      toggleBgm: () => { const v = Audio.toggleBgm(); GameState.get().bgmOn = v; GameState.save(); return v; },
      toggleSfx: () => { const v = Audio.toggleSfx(); GameState.get().sfxOn = v; GameState.save(); return v; },
      isBgm: () => Audio.isBgm(), isSfx: () => Audio.isSfx(),
    });

    const cur = currentQuest();
    if (cur) Audio.setQuest(cur.n);
    UI.render();

    UI.showTitleScreen(hadSave, () => {
      claimOffline(); runAchievements(); UI.render();

      if (!st.tutorialShown) { // 조작법 가이드(최초 1회)
        st.tutorialShown = true; GameState.save();
        UI.toast('🎮 조작법', '그림을 탭하면 연습! 오른쪽 위 🎭 아이콘을 탭하면 감정 폭발!', 7000);
      }

      if (!st.clearedPrologue) {
        UI.showDialogue(PROLOGUE, () => { GameState.get().clearedPrologue = true; GameState.save(); UI.render(); });
      }
    });
    // 인트로는 플레이어가 퀘스트를 눌렀을 때만 재생된다

    running = true;
    startAutosave();
    requestAnimationFrame(loop);
  }

  return { start, tap, buySkill, buyHelper, buyUpgrade, tryClearQuest, startQuest, questAction, restart, addAffection, cycleBuyMode, encore,
           tapValue, autoPerSec, tempoMult, helperRate, encoreState,
           skillCost, skillPlan, skillEffect, helperCost, helperPlan, upgradeState, isUnlocked,
           currentQuest, questReady, questPhase, preText, fmtNum };
})();

window.addEventListener('DOMContentLoaded', Game.start);
