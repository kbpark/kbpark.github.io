/* =========================================================================
 *  바이올리니스트 메이커 — UI 렌더링 (ui.js)
 *  3인 캐릭터 무대 · 탭 패널(스킬/조력자/상점/업적) · 대량구매 · 플로팅 +N ·
 *  토스트 알림 · 미연시 대사창 · 사랑 게이지 · BGM/SFX 토글 · 엔딩 CG.
 * ========================================================================= */
const UI = (() => {
  'use strict';

  const D = GameData;
  const { SKILLS, SKILL_ORDER, CHARACTERS, HELPERS, UPGRADES, ACHIEVEMENTS, QUESTS } = D;
  const CAST = { andrea: 1, leon: 1, violet: 1 };
  const HELP = Object.fromEntries(HELPERS.map((h) => [h.id, h]));

  let api = {}, el = {};
  let dq = [], dqDone = null, awaitingChoice = false, lastTap = null;
  let activeTab = 'skills';
  let updaters = [], lastSig = null;
  let endQueue = [];

  const castExpr = { andrea: 'neutral', leon: 'neutral', violet: 'proud' };
  const id = (x) => document.getElementById(x);
  const unlock = () => { try { Audio.unlock(); } catch (_) {} };
  const startBgm = () => { try { (Audio.ensureBgm || Audio.unlock)(); } catch (_) {} };
  const fmt = (n) => api.fmtNum(n);
  const displayExpr = (who, expr) => who === 'leon' ? 'neutral' : (expr || 'neutral');
  let titleEnterHandler = null;

  function bindPress(node, handler, opts) {
    if (!node) return;
    opts = opts || {};
    let startX = 0, startY = 0, moved = false;
    const invoke = (e) => {
      if (opts.stop) e.stopPropagation();
      if (opts.prevent !== false && e.cancelable) e.preventDefault();
      handler(e);
    };
    if (window.PointerEvent) {
      node.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        startX = e.clientX || 0; startY = e.clientY || 0; moved = false;
      }, { passive: true });
      node.addEventListener('pointermove', (e) => {
        if (Math.abs((e.clientX || 0) - startX) + Math.abs((e.clientY || 0) - startY) > 14) moved = true;
      }, { passive: true });
      node.addEventListener('pointerup', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (moved) return;
        invoke(e);
      }, { passive: false });
      node.addEventListener('click', (e) => {
        if (e.detail !== 0) return; // pointer taps are handled by pointerup; keep keyboard activation.
        invoke(e);
      });
    } else {
      node.addEventListener('touchend', invoke, { passive: false });
      node.addEventListener('click', invoke);
    }
  }

  /* ---- 초기화 ---------------------------------------------------------- */
  function init(gameApi) {
    api = gameApi;
    el = {
      points: id('points'), perTap: id('per-tap'), perSec: id('per-sec'),
      titleScreen: id('title-screen'), titleNote: id('title-note'), titleStart: id('title-start'),
      settingsBtn: id('settings-btn'), settingsMenu: id('settings-menu'),
      bgmBtn: id('bgm-btn'), sfxBtn: id('sfx-btn'), resetBtn: id('reset-btn'),
      stage: id('stage'), encoreBtn: id('encore-btn'), buymodeBtn: id('buymode-btn'), panel: id('panel'), tabs: id('tabs'),
      questTitle: id('quest-title'), questBook: id('quest-book'),
      questReq: id('quest-req'), questBtn: id('quest-btn'),
      stageBg: id('stage-bg'), castAndrea: id('cast-andrea'), castLeon: id('cast-leon'),
      castViolet: id('cast-violet'), cgLayer: id('cg-layer'),
      dialogue: id('dialogue'), dlgPortrait: id('dialogue-portrait'), dlgName: id('dlg-name'), dlgText: id('dlg-text'),
      dlgChoices: id('dlg-choices'), dlgNext: id('dlg-next'),
      ending: id('ending'), cg: id('cg'), endName: id('ending-name'),
      endText: id('ending-text'), endActions: id('ending-actions'),
      endContinue: id('ending-continue'), endRestart: id('ending-restart'),
      toastLayer: id('toast-layer'),
    };

    // 그림(무대)을 탭 = 연습, 그림 속 🎭 아이콘 탭 = 감정 폭발
    bindPress(el.stage, (e) => { unlock(); lastTap = { x: e.clientX || 0, y: e.clientY || 0 }; api.tap(); });
    bindPress(el.encoreBtn, () => { unlock(); api.encore(); }, { stop: true });
    bindPress(el.settingsBtn, () => toggleSettings(), { stop: true });
    bindPress(el.resetBtn, () => { closeSettings(); api.restart(); }, { stop: true });
    bindPress(el.questBtn, () => { unlock(); api.questAction(); });
    bindPress(el.buymodeBtn, () => api.cycleBuyMode());
    bindPress(el.dialogue, () => { unlock(); advanceDialogue(); });
    bindPress(el.bgmBtn, () => { unlock(); syncBgm(api.toggleBgm()); closeSettings(); }, { stop: true });
    bindPress(el.sfxBtn, () => { unlock(); syncSfx(api.toggleSfx()); closeSettings(); }, { stop: true });
    bindPress(el.ending, () => { unlock(); advanceEnding(); });
    bindPress(el.endContinue, () => continueAfterEnding(), { stop: true });
    bindPress(el.endRestart, () => api.restart(), { stop: true });
    el.tabs.querySelectorAll('.tab').forEach((b) =>
      bindPress(b, () => switchTab(b.dataset.tab)));
    bindPress(el.titleStart, () => { startBgm(); if (titleEnterHandler) titleEnterHandler(); }, { stop: true });
    document.addEventListener('pointerdown', unlock, { once: true, capture: true });
    document.addEventListener('touchstart', unlock, { once: true, capture: true, passive: true });
    document.addEventListener('keydown', unlock, { once: true, capture: true });

    setBackground(null);
    renderCastSlot('andrea'); renderCastSlot('leon'); renderCastSlot('violet');
    syncBgm(api.isBgm()); syncSfx(api.isSfx());
    switchTab('skills');
  }

  function toggleSettings() {
    if (!el.settingsMenu) return;
    el.settingsMenu.classList.toggle('hidden');
  }
  function closeSettings() {
    if (el.settingsMenu) el.settingsMenu.classList.add('hidden');
  }

  function showTitleScreen(hasSave, onEnter) {
    if (!el.titleScreen) return;
    let entered = false;
    const enter = () => {
      if (entered) return;
      entered = true;
      hideTitleScreen();
      if (onEnter) onEnter();
    };
    el.titleScreen.classList.remove('hidden', 'hide');
    if (el.titleNote) el.titleNote.textContent = hasSave ? '이어 하는 중...' : '처음부터 시작합니다';
    if (el.titleStart) {
      el.titleStart.classList.remove('hidden');
      el.titleStart.textContent = hasSave ? '계속하기' : '게임시작';
      titleEnterHandler = null;
    }
    if (el.titleStart) {
      titleEnterHandler = enter;
    }
  }

  function hideTitleScreen() {
    if (!el.titleScreen) return;
    el.titleScreen.classList.add('hide');
    setTimeout(() => el.titleScreen.classList.add('hidden'), 320);
  }

  /* ---- 전체 렌더 (가벼운 갱신 위주) ----------------------------------- */
  function render() {
    const st = GameState.get();
    el.points.textContent = fmt(Math.floor(st.points));
    el.perTap.textContent = '탭당 +' + fmt(api.tapValue());
    el.perSec.textContent = '초당 +' + fmt(api.autoPerSec());
    el.buymodeBtn.textContent = '구매 ' + st.buyMode;

    renderAffection();
    renderQuest();
    if (!el.dialogue.classList.contains('show')) renderIdleCast();
    refreshPanel();
  }

  /* ---- 탭 패널 --------------------------------------------------------- */
  function switchTab(tab) {
    activeTab = tab;
    el.tabs.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    el.buymodeBtn.classList.toggle('hidden', tab !== 'skills' && tab !== 'helpers');
    buildPanel(tab);
    runUpdaters();
  }

  function currentSig(tab) {
    const st = GameState.get();
    if (tab === 'shop')  return UPGRADES.map((u) => api.upgradeState(u.id)).join(',');
    if (tab === 'ach')   return ACHIEVEMENTS.map((a) => st.achievements[a.id] ? '1' : '0').join('');
    if (tab === 'quest') return QUESTS.map((q) => api.questPhase(q.n)).join(',');
    return 'static'; // skills/helpers 구조 고정
  }

  function buildPanel(tab) {
    el.panel.innerHTML = ''; updaters = [];
    if (tab === 'skills')  buildSkills();
    else if (tab === 'helpers') buildHelpers();
    else if (tab === 'shop') buildShop();
    else if (tab === 'ach')  buildAch();
    else if (tab === 'quest') buildQuest();
    lastSig = currentSig(tab);
  }
  function refreshPanel() {
    const sig = currentSig(activeTab);
    if (sig !== lastSig) { buildPanel(activeTab); }
    runUpdaters();
  }
  function runUpdaters() { for (const u of updaters) u(); }

  // 공통: 구매 카드의 비용/수량 라벨과 구매가능 표시
  function costLabel(plan, single) {
    const affordable = plan.qty >= 1;
    const cost = affordable ? plan.cost : single;
    return { text: '💰 ' + fmt(cost) + (plan.qty > 1 ? ' ×' + plan.qty : ''), affordable };
  }

  /* 스킬 패널 */
  function buildSkills() {
    const grid = div('card-grid two');
    for (const key of SKILL_ORDER) {
      const s = SKILLS[key];
      const card = document.createElement('button');
      card.className = 'ic-card'; card.id = 'skill-' + key;
      card.innerHTML =
        `<div class="ic-top"><span class="ic-icon">${s.icon}</span><span class="ic-label">${s.label}</span><span class="ic-lv" data-lv></span></div>
         <div class="ic-desc">${s.desc}</div>
         <div class="ic-foot"><span class="ic-eff" data-eff></span><span class="ic-cost" data-cost></span></div>`;
      bindPress(card, () => api.buySkill(key));
      grid.appendChild(card);
      updaters.push(() => {
        const eff = api.skillEffect(key), p = api.skillPlan(key), c = costLabel(p, api.skillCost(key));
        card.querySelector('[data-lv]').textContent = 'Lv.' + GameState.skillLevel(key);
        card.querySelector('[data-eff]').textContent = eff.per;
        card.querySelector('[data-cost]').textContent = c.text;
        card.title = eff.now;
        card.classList.toggle('affordable', c.affordable);
      });
    }
    el.panel.appendChild(grid);
  }

  /* 조력자 패널 */
  function buildHelpers() {
    const list = div('card-list');
    for (const h of HELPERS) {
      const card = document.createElement('button');
      card.className = 'hl-card'; card.id = 'helper-' + h.id;
      card.innerHTML =
        `<span class="hl-icon">${h.icon}</span>
         <span class="hl-body">
           <span class="hl-top"><b class="hl-label">${h.label}</b><span class="hl-own" data-own></span></span>
           <span class="hl-desc">${h.desc}</span>
           <span class="hl-rate" data-rate></span>
         </span>
         <span class="hl-cost" data-cost></span>`;
      bindPress(card, () => api.buyHelper(h.id));
      list.appendChild(card);
      updaters.push(() => {
        const cnt = GameState.helperCount(h.id);
        const p = api.helperPlan(h.id), c = costLabel(p, api.helperCost(h.id));
        const unit = h.id === 'metronome' ? '개당' : '명당';
        card.querySelector('[data-own]').textContent = '보유 ' + cnt;
        card.querySelector('[data-rate]').textContent =
          `${unit} +${h.rate}/초` + (cnt ? ` · 합계 +${fmt(api.helperRate(h.id))}/초` : '');
        card.querySelector('[data-cost]').textContent = c.text;
        card.classList.toggle('affordable', c.affordable);
      });
    }
    el.panel.appendChild(list);
  }

  /* 상점(업그레이드) 패널 */
  function buildShop() {
    const list = div('card-list');
    let any = false;
    for (const u of UPGRADES) {
      const state = api.upgradeState(u.id);
      if (state === 'locked') continue; // 잠긴 건 숨김(해금되면 나타남)
      any = true;
      const card = document.createElement('button');
      card.className = 'up-card ' + state; card.id = 'up-' + u.id;
      card.innerHTML =
        `<span class="up-icon">${u.icon}</span>
         <span class="up-body"><b>${u.label}</b><span class="up-desc">${u.desc}</span></span>
         <span class="up-cost">${state === 'owned' ? '✔ 보유' : '💰 ' + fmt(u.cost)}</span>`;
      if (state === 'available') bindPress(card, () => api.buyUpgrade(u.id));
      list.appendChild(card);
      updaters.push(() => {
        if (api.upgradeState(u.id) === 'available')
          card.classList.toggle('affordable', GameState.get().points >= u.cost);
      });
    }
    if (!any) {
      const lockedNext = UPGRADES.find((u) => api.upgradeState(u.id) === 'locked');
      el.panel.appendChild(hint('아직 열린 상품이 없어요. ' + (lockedNext ? describeUnlock(lockedNext.unlock) + ' 하면 열려요.' : '')));
      return;
    }
    // 잠긴 다음 상품 힌트 1개
    const nextLocked = UPGRADES.find((u) => api.upgradeState(u.id) === 'locked');
    el.panel.appendChild(list);
    if (nextLocked) el.panel.appendChild(hint('🔒 다음 해금: ' + nextLocked.label + ' — ' + describeUnlock(nextLocked.unlock)));
  }
  function describeUnlock(u) {
    switch (u.type) {
      case 'taps':         return `탭 ${u.v}회`;
      case 'helpersOwned': return `조력자 ${u.v}명`;
      case 'lifetime':     return `누적 ${fmt(u.v)} 포인트`;
      case 'quest':        return `Q${u.v} 클리어`;
      case 'helperCount':  return `${HELP[u.target].label} ${u.v}개`;
      default: return '';
    }
  }

  /* 업적 패널 */
  function buildAch() {
    const st = GameState.get();
    const unlocked = ACHIEVEMENTS.filter((a) => st.achievements[a.id]).length;
    el.panel.appendChild(hint(`🏆 달성 ${unlocked} / ${ACHIEVEMENTS.length}`));
    const list = div('card-list');
    for (const a of ACHIEVEMENTS) {
      const got = !!st.achievements[a.id];
      const card = div('ach-card ' + (got ? 'got' : 'locked'));
      card.innerHTML =
        `<span class="ach-icon">${got ? a.icon : '🔒'}</span>
         <span class="ach-body"><b>${a.label}</b><span class="ach-desc">${a.desc}</span></span>
         ${a.bonus ? `<span class="ach-bonus">+${Math.round((a.bonus.mult-1)*100)}%</span>` : ''}`;
      list.appendChild(card);
    }
    el.panel.appendChild(list);
  }

  /* 퀘스트 목록 패널 */
  function reqText(q) {
    return Object.entries(q.req).map(([k, lv]) => `${SKILLS[k].icon}${SKILLS[k].label} ${GameState.skillLevel(k)}/${lv}`).join(' · ');
  }
  function buildQuest() {
    const st = GameState.get();
    el.panel.appendChild(hint(`🎻 완주 ${st.questIndex} / ${QUESTS.length}`));
    const list = div('card-list');
    for (const q of QUESTS) {
      const phase = api.questPhase(q.n);
      const known = phase === 'cleared' || phase === 'active' || phase === 'ready';
      const icon = phase === 'cleared' ? '✅' : phase === 'active' ? '🎽' : phase === 'ready' ? '▶️' : '🔒';
      const title = known ? `Q${q.n}. ${q.title}` : `Q${q.n}. ???`;
      const row = div('quest-row ' + phase);
      row.innerHTML = `<span class="q-icon">${icon}</span><span class="q-body"><b>${title}</b><span class="q-sub" data-sub></span></span>`;
      const setSub = () => {
        row.querySelector('[data-sub]').textContent =
          phase === 'cleared' ? q.book + ' · 완주' :
          phase === 'active'  ? reqText(q) :
          phase === 'ready'   ? '눌러서 도전 시작 (인트로)' :
          phase === 'locked'  ? '선제조건: ' + api.preText(q) :
                                '이전 곡을 먼저 완주하세요';
      };
      setSub();
      if (phase === 'active') updaters.push(setSub);
      if (phase === 'ready') bindPress(row, () => { unlock(); api.startQuest(); });
      list.appendChild(row);
    }
    el.panel.appendChild(list);
  }

  const div  = (cls) => { const d = document.createElement('div'); d.className = cls; return d; };
  const hint = (t) => { const d = div('panel-hint'); d.textContent = t; return d; };

  /* ---- 사랑 게이지 / 퀘스트 ------------------------------------------- */
  function renderAffection() {
    // 사랑 게이지 값은 엔딩 분기에만 사용하고, 화면에는 표시하지 않는다.
  }
  function renderQuest() {
    const q = api.currentQuest();
    if (!q) {
      el.questTitle.textContent = '🎉 모든 무대를 완주했습니다!';
      el.questBook.textContent = '크레모나 광장 · 엔딩';
      el.questReq.innerHTML = ''; el.questBtn.disabled = true; el.questBtn.textContent = '피날레'; return;
    }
    const phase = api.questPhase(q.n);
    // 선제조건 미충족 → 잠긴(예고) 상태
    if (phase === 'locked') {
      el.questTitle.textContent = `🔒 Q${q.n}. ???`;
      el.questBook.textContent = '다음 곡 예고';
      el.questReq.innerHTML = '';
      const b = document.createElement('span');
      b.className = 'req-badge'; b.textContent = '선제조건 ' + api.preText(q);
      el.questReq.appendChild(b);
      el.questBtn.disabled = true;
      el.questBtn.textContent = '🔒 선제조건을 채우면 공개돼요';
      return;
    }
    // 선제조건 충족, 아직 시작 전 → 눌러서 인트로/도전 시작
    if (phase === 'ready') {
      el.questTitle.textContent = `🎽 Q${q.n}. ${q.title}`;
      el.questBook.textContent = q.book;
      el.questReq.innerHTML = '';
      const b = document.createElement('span');
      b.className = 'req-badge ok'; b.textContent = '선제조건 충족! 도전 준비 완료';
      el.questReq.appendChild(b);
      el.questBtn.disabled = false;
      el.questBtn.textContent = '▶ 이 곡에 도전! (인트로 보기)';
      return;
    }
    // 도전 시작(active)
    el.questTitle.textContent = `Q${q.n}. ${q.title}`;
    el.questBook.textContent = q.book;
    el.questReq.innerHTML = '';
    for (const [key, need] of Object.entries(q.req)) {
      const have = GameState.skillLevel(key), ok = have >= need;
      const badge = document.createElement('span');
      badge.className = 'req-badge' + (ok ? ' ok' : '');
      badge.textContent = `${SKILLS[key].icon}${SKILLS[key].label} ${have}/${need}`;
      el.questReq.appendChild(badge);
    }
    const ready = api.questReady();
    el.questBtn.disabled = !ready;
    el.questBtn.textContent = ready ? '🎵 연주하기!' : '연습이 더 필요해요';
  }

  /* ---- 무대: 3인 캐릭터 ------------------------------------------------ */
  const camelSlot = (w) => w === 'andrea' ? 'castAndrea' : w === 'leon' ? 'castLeon' : 'castViolet';
  // 캐릭터: PNG(표정별) 우선 → neutral PNG → SVG 순으로 대체
  function renderCastSlot(who) {
    const slot = el[camelSlot(who)];
    if (!slot) return;
    const rawExpr = displayExpr(who, castExpr[who]);
    const expr = Portraits.normExpr(rawExpr);
    const img = document.createElement('img');
    img.className = 'portrait-svg char-img'; img.alt = '';
    img.onerror = () => {
      if (img.dataset.fb !== '1' && expr !== 'neutral') { // 표정 파일 없으면 neutral 시도
        img.dataset.fb = '1'; img.src = `assets/img/characters/${who}-neutral.png`;
      } else {                                            // 그것도 없으면 SVG로
        slot.innerHTML = Portraits.svg(who, rawExpr);
      }
    };
    img.src = `assets/img/characters/${who}-${expr}.png`;
    slot.innerHTML = ''; slot.appendChild(img);
  }
  function renderIdleCast() {
    const t = Portraits.tier(GameState.get().affection);
    setCastExpr('violet', t === 'high' ? 'shy' : t === 'mid' ? 'neutral' : 'proud');
    setCastExpr('leon', 'neutral'); setCastExpr('andrea', 'neutral'); clearSpeaking();
  }
  function setCastExpr(who, expr) {
    const next = displayExpr(who, expr);
    if (castExpr[who] !== next) { castExpr[who] = next; renderCastSlot(who); }
  }
  function setSpeaking(who) {
    for (const w of ['andrea', 'leon', 'violet']) {
      const s = el[camelSlot(w)];
      s.classList.toggle('speaking', w === who);
      s.classList.toggle('dim', !!who && w !== who);
    }
  }
  function clearSpeaking() { for (const w of ['andrea', 'leon', 'violet']) el[camelSlot(w)].classList.remove('speaking', 'dim'); }
  function showDialoguePortrait(who, expr) {
    if (!el.dlgPortrait) return;
    if (!CAST[who]) {
      el.dlgPortrait.classList.add('hidden');
      el.dlgPortrait.innerHTML = '';
      return;
    }
    el.dlgPortrait.className = `dialogue-portrait ${who}`;
    if (who === 'leon' || who === 'andrea' || who === 'violet') {
      const neutralSrc = {
        leon: 'assets/img/characters/leon-neutral.png',
        andrea: 'assets/img/characters/andrea-neutral.png',
        violet: 'assets/img/characters/violet-neutral.png',
      };
      const img = document.createElement('img');
      img.className = 'portrait-img';
      img.alt = '';
      img.onerror = () => { el.dlgPortrait.innerHTML = Portraits.svg(who, 'neutral'); };
      img.src = neutralSrc[who];
      el.dlgPortrait.innerHTML = '';
      el.dlgPortrait.appendChild(img);
      return;
    }
    el.dlgPortrait.innerHTML = Portraits.svg(who, displayExpr(who, expr));
  }

  const DEFAULT_BG = 'assets/img/bg/bg-academy-hall.png'; // 파일 없으면 SVG 아카데미로 대체
  function setBackground(url) {
    const img = document.createElement('img'); img.className = 'bg-img'; img.src = url || DEFAULT_BG; img.alt = '';
    img.onerror = () => { el.stageBg.innerHTML = Portraits.academyBG(); };
    el.stageBg.innerHTML = ''; el.stageBg.appendChild(img);
  }
  function showLineImage(url) {
    if (!url) { el.cgLayer.classList.add('hidden'); el.cgLayer.innerHTML = ''; return; }
    const img = document.createElement('img'); img.className = 'cg-img'; img.src = url; img.alt = '';
    img.onerror = () => { el.cgLayer.classList.add('hidden'); el.cgLayer.innerHTML = ''; };
    el.cgLayer.innerHTML = ''; el.cgLayer.appendChild(img); el.cgLayer.classList.remove('hidden');
  }

  /* ---- 피드백: 펄스 / 플로팅 +N / 흔들림 ------------------------------ */
  function pulseTap() { const c = el.castLeon; if (!c) return; c.classList.remove('bounce'); void c.offsetWidth; c.classList.add('bounce'); }
  function floatTap(gain) {
    let x, y;
    if (lastTap) { x = lastTap.x; y = lastTap.y; }
    else { const r = el.stage.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height * 0.4; }
    const s = document.createElement('div');
    s.className = 'float-num'; s.textContent = '+' + fmt(gain);
    s.style.left = (x + (Math.random() * 40 - 20)) + 'px';
    s.style.top  = (y - 12) + 'px';
    document.body.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }
  function flash(elId) { const c = id(elId); if (!c) return; c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); }

  /* ---- 토스트 알림 ----------------------------------------------------- */
  function toast(title, body, dur) {
    const t = div('toast');
    t.innerHTML = `<b>${title}</b>${body ? `<span>${body}</span>` : ''}`;
    el.toastLayer.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, dur || 3500);
  }

  /* ---- 미연시 대사창 --------------------------------------------------- */
  function showDialogue(lines, onDone) {
    dq = (Array.isArray(lines) ? lines : [lines]).slice();
    dqDone = onDone || null; awaitingChoice = false;
    el.dialogue.classList.add('show'); advanceDialogue();
  }
  function advanceDialogue() {
    if (!el.dialogue.classList.contains('show') || awaitingChoice) return;
    if (dq.length === 0) {
      el.dialogue.classList.remove('show');
      showDialoguePortrait(null);
      showLineImage(null); setBackground(null); clearSpeaking();
      const cb = dqDone; dqDone = null; renderIdleCast(); if (cb) cb(); return;
    }
    const line = dq.shift();
    if (line.choice) { renderChoice(line.choice); return; }
    if (line.bg !== undefined) setBackground(line.bg);
    if (line.img !== undefined) showLineImage(line.img); // 지정된 줄에서만 바뀌고 장면 내내 유지
    const ch = CHARACTERS[line.who] || CHARACTERS.narr;
    el.dlgName.textContent = ch.name || '';
    el.dlgName.classList.toggle('has-name', !!ch.name);
    el.dlgName.style.color = ch.color || '#fff';
    el.dlgText.textContent = line.text;
    if (CAST[line.who]) {
      setCastExpr(line.who, line.expr || 'neutral');
      setSpeaking(line.who);
      showDialoguePortrait(line.who, line.expr || 'neutral');
    }
    else { clearSpeaking(); showDialoguePortrait(null); }   // narr, 사장님, 친구 등 무대 밖 화자
    el.dlgNext.style.visibility = 'visible';
  }
  function renderChoice(choice) {
    awaitingChoice = true;
    showDialoguePortrait(null);
    el.dlgName.textContent = ''; el.dlgName.classList.remove('has-name');
    el.dlgText.textContent = choice.prompt || '';
    el.dlgNext.style.visibility = 'hidden';
    el.dlgChoices.innerHTML = ''; el.dlgChoices.classList.add('show');
    choice.options.forEach((opt) => {
      const b = document.createElement('button'); b.className = 'choice-btn'; b.textContent = opt.label;
      bindPress(b, () => {
        unlock(); try { Audio.blip(); } catch (_) {}
        api.addAffection(opt.aff || 0); renderAffection();
        el.dlgChoices.classList.remove('show'); el.dlgChoices.innerHTML = ''; awaitingChoice = false;
        if (opt.reply) dq.unshift(opt.reply);
        advanceDialogue();
      }, { stop: true });
      el.dlgChoices.appendChild(b);
    });
  }

  /* ---- 엔딩 ------------------------------------------------------------ */
  function showEnding(tier) {
    const data = GameData.ENDING[tier] || GameData.ENDING.normal;
    if (data.cgImg) { // 엔딩 CG 이미지가 있으면 사용, 없으면 SVG로 대체
      const img = document.createElement('img'); img.className = 'cg-img'; img.src = data.cgImg; img.alt = '';
      img.onerror = () => { el.cg.innerHTML = Portraits.endingCG(data.cg); };
      el.cg.innerHTML = ''; el.cg.appendChild(img);
    } else el.cg.innerHTML = Portraits.endingCG(data.cg);
    endQueue = data.lines.slice();
    el.endActions.classList.add('hidden'); el.ending.classList.add('show'); advanceEnding();
  }
  function advanceEnding() {
    if (!el.ending.classList.contains('show')) return;
    if (endQueue.length === 0) { el.endActions.classList.remove('hidden'); return; }
    const line = endQueue.shift();
    const ch = CHARACTERS[line.who] || CHARACTERS.narr;
    el.endName.textContent = ch.name || '';
    el.endName.classList.toggle('has-name', !!ch.name);
    el.endName.style.color = ch.color || '#fff';
    el.endText.textContent = line.text;
  }
  function continueAfterEnding() {
    el.ending.classList.remove('show');
    el.endActions.classList.add('hidden');
    endQueue = [];
    render();
    toast('🎻 계속 연습하기', '엔딩 이후에도 탭, 스킬, 조력자 성장을 계속할 수 있어요.', 4500);
  }

  /* ---- 사운드 표시 ----------------------------------------------------- */
  function syncBgm(on) { el.bgmBtn.textContent = on ? '🎵' : '🚫'; el.bgmBtn.classList.toggle('off', !on); }
  function syncSfx(on) { el.sfxBtn.textContent = on ? '🔊' : '🔇'; el.sfxBtn.classList.toggle('off', !on); }

  /* ---- 감정 폭발 버튼(매 프레임 갱신) --------------------------------- */
  function updateEncore() {
    const s = api.encoreState(), b = el.encoreBtn;
    if (s.state === 'active')        { b.className = 'encore-badge active';   b.textContent = `🎭${s.remain.toFixed(0)}`; }
    else if (s.state === 'cooldown') { b.className = 'encore-badge cooldown'; b.textContent = `⌛${Math.ceil(s.remain)}`; }
    else                             { b.className = 'encore-badge ready';    b.textContent = `🎭`; }
    el.perTap.textContent = '탭당 +' + fmt(api.tapValue());
    el.perSec.textContent = '초당 +' + fmt(api.autoPerSec());
  }

  function isDialogueOpen() {
    return el.dialogue.classList.contains('show') || el.ending.classList.contains('show');
  }

  return { init, render, pulseTap, floatTap, flash, toast, showDialogue, showEnding, updateEncore, isDialogueOpen, showTitleScreen };
})();
