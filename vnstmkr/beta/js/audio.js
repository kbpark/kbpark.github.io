/* =========================================================================
 *  바이올리니스트 메이커 — 사운드 엔진 (audio.js)
 *  Web Audio API 로 게임 사운드를 실시간 합성한다. (음원 파일 불필요)
 *   - 타건 SFX : 탭할 때마다 카이저 연습곡 패턴을 한 음씩 연주
 *   - BGM      : 퀘스트별 밝은 오케스트라풍 1분 루프 (또는 AI로 만든 mp3 파일)
 *   - 팡파레   : 퀘스트 클리어 연출음
 *  BGM 과 SFX 를 각각 끄고 켤 수 있다.
 *
 *  ▶ AI 로 만든 오케스트라 BGM(mp3)을 쓰고 싶다면 아래 BGM_FILES 를 채우세요.
 *    파일을 assets/audio/ 에 넣고 퀘스트 번호에 경로를 지정하면
 *    합성음 대신 그 파일이 루프 재생됩니다. (파일이 없으면 자동으로 합성음)
 *    자세한 방법은 ASSETS_GUIDE.md 참고.
 * ========================================================================= */
const Audio = (() => {
  'use strict';

  const BGM_FILES = {
    // 1: 'assets/audio/q1.mp3',
    // 2: 'assets/audio/q2.mp3',
    // ... 10: 'assets/audio/q10.mp3',
  };
  const BGM_VOL = 0.26;
  const SFX_VOL = 0.46;

  let ctx = null, master = null, bgmGain = null, sfxGain = null, reverbInput = null;
  let bgmOn = true, sfxOn = true;
  let unlocked = false;
  let curQuest = 1, tapIdx = 0, bgmTrack = 1;
  let bgmTimer = null, bgmStop = false, bgmRun = 0;
  const bgmNodes = new Set();
  let fileEl = null; // AI mp3 재생용 <audio>

  /* 음이름 → 주파수 (A4 = 440Hz) */
  const SEMI = { C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11 };
  function noteToMidi(note) {
    const m = /^([A-G][#b]?)(\d)$/.exec(note);
    if (!m) return 69;
    return (parseInt(m[2],10) + 1) * 12 + SEMI[m[1]];
  }
  function freq(note) {
    const midi = noteToMidi(note);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function midiFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function transpose(note, semi) {
    return 440 * Math.pow(2, (noteToMidi(note) + semi - 69) / 12);
  }

  const ORCH_TRACKS = {
    1:  { style: 'pizz',     bpm: 96,  root: 60, bass: 36, prog: [0,5,7,0,9,5,7,0],  motif: [0,4,7,12,11,7,4,2,0,5,9,12,9,7,4,0] },
    2:  { style: 'woodwind', bpm: 100, root: 62, bass: 38, prog: [0,7,9,5,0,4,7,0],  motif: [7,9,11,14,12,11,9,7,4,7,9,12,11,9,7,4] },
    3:  { style: 'staccato', bpm: 118, root: 65, bass: 41, prog: [0,5,0,7,9,5,2,7],  motif: [0,2,4,5,7,9,7,5,4,2,0,5,9,12,9,5] },
    4:  { style: 'fanfare',  bpm: 104, root: 67, bass: 43, prog: [0,4,5,7,0,9,5,7],  motif: [12,11,7,4,5,7,9,12,14,12,9,7,5,4,2,0] },
    5:  { style: 'waltz',    bpm: 132, root: 57, bass: 33, prog: [0,5,9,7,0,2,5,7],  motif: [0,4,7,9,12,9,7,4,2,5,9,11,12,11,9,7] },
    6:  { style: 'march',    bpm: 112, root: 59, bass: 35, prog: [0,5,7,9,5,0,7,0],  motif: [0,2,4,7,11,12,11,7,9,7,4,2,0,4,7,12] },
    7:  { style: 'chamber',  bpm: 92,  root: 64, bass: 40, prog: [0,7,0,5,9,7,5,0],  motif: [0,4,7,11,12,14,12,11,7,9,11,12,9,7,4,0] },
    8:  { style: 'festival', bpm: 124, root: 55, bass: 31, prog: [0,5,9,4,5,0,7,0],  motif: [7,12,11,9,7,4,2,0,5,9,12,14,12,9,7,5] },
    9:  { style: 'morning',  bpm: 86,  root: 58, bass: 34, prog: [0,5,7,9,5,2,7,0],  motif: [0,4,7,11,12,11,7,5,4,5,7,12,11,7,5,4] },
    10: { style: 'finale',   bpm: 108, root: 62, bass: 38, prog: [0,5,7,0,9,5,11,7], motif: [12,14,16,19,21,19,16,14,12,11,9,7,9,12,14,19] },
  };
  const TAP_KAYSER = [
    'E5','G5','E5','C5','B4','D5','B4','G4',
    'C5','B4','A4','G4','F4','E4','D4','C4',
    'B3','D4','G4','B4','D5','C5','A4','F#4',
    'G4','A4','B4','C5','D5','E5','F5','G5',
  ];

  /* ---- 초기화 / 언락 --------------------------------------------------- */
  function unlock() {
    initContext();
    resumeAndStartBGM(false);
  }

  function initContext() {
    if (!unlocked) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master  = ctx.createGain(); master.gain.value  = 0.82; master.connect(ctx.destination);
      bgmGain = ctx.createGain(); bgmGain.gain.value = bgmOn ? BGM_VOL : 0; bgmGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = sfxOn ? SFX_VOL : 0; sfxGain.connect(master);
      setupRoom();
      unlocked = true;
    }
    return true;
  }

  function ensureBgm() {
    if (!initContext()) return;
    bgmOn = true;
    if (bgmGain) bgmGain.gain.setValueAtTime(BGM_VOL, ctx.currentTime);
    resumeAndStartBGM(true);
  }

  function resumeAndStartBGM(force) {
    if (!ctx) return;
    const start = () => {
      if (!bgmOn) return;
      if (force) { stopSynthBGM(); stopFileBGM(); }
      if (force || (!bgmTimer && bgmNodes.size === 0)) startBGM();
    };
    if (ctx.state === 'suspended' && ctx.resume) {
      ctx.resume().then(start).catch(start);
    } else {
      start();
    }
  }

  function setupRoom() {
    reverbInput = ctx.createGain();
    reverbInput.gain.value = 0.18;
    const convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse(1.7, 2.8);
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    reverbInput.connect(convolver);
    convolver.connect(wet);
    wet.connect(master);
  }

  function makeImpulse(seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
    }
    return buffer;
  }

  /* ---- 단일 음 합성 ---------------------------------------------------- */
  function playNote(f, when, dur, dest, vol, opt) {
    if (!ctx) return;
    when = when || ctx.currentTime;
    vol = vol == null ? 0.6 : vol;
    opt = opt || {};
    const role = opt.role || 'violin';
    const isBgm = opt.group === 'bgm';
    const isCello = role === 'cello' || role === 'bass';
    const isBright = role === 'woodwind' || role === 'pizz' || role === 'brass' || role === 'pad';

    const o1 = ctx.createOscillator(); o1.type = role === 'woodwind' ? 'sine' : role === 'pizz' ? 'triangle' : role === 'pad' ? 'triangle' : 'sawtooth'; o1.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = role === 'brass' ? 'sawtooth' : 'triangle'; o2.frequency.value = f; o2.detune.value = isCello ? -5 : 5;
    const o3 = ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = f * 2; o3.detune.value = -3;
    const lfo = ctx.createOscillator(); lfo.frequency.value = isCello ? 4.3 : isBright ? 3.4 : 5.8;
    const lfoG = ctx.createGain();
    lfoG.gain.setValueAtTime(0.0001, when);
    lfoG.gain.linearRampToValueAtTime(isCello ? 1.4 : isBright ? 0.7 : 5.2, when + Math.min(0.18, dur * 0.45));
    lfo.connect(lfoG);
    lfoG.connect(o1.frequency); lfoG.connect(o2.frequency); lfoG.connect(o3.frequency);

    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = isCello ? 70 : isBright ? 260 : 180; hp.Q.value = 0.6;
    const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = isCello ? 240 : isBright ? 900 : 520; body.gain.value = isCello ? 3.5 : isBright ? 1.1 : 2.2; body.Q.value = 0.8;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = isCello ? 1500 : role === 'brass' ? 2600 : isBright ? 5200 : 3600; lp.Q.value = 0.8;
    const g = ctx.createGain();
    const a = opt.attack == null ? (role === 'pizz' ? 0.006 : isCello ? 0.075 : isBright ? 0.025 : 0.055) : opt.attack;
    const r = Math.min(opt.release == null ? 0.32 : opt.release, dur * 0.62);
    const sustain = vol * (role === 'pizz' ? 0.12 : isCello ? 0.72 : role === 'pad' ? 0.86 : 0.82);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + a);
    g.gain.linearRampToValueAtTime(sustain, when + Math.max(a + 0.04, dur * 0.45));
    g.gain.setValueAtTime(sustain, when + Math.max(a, dur - r));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    const harm = ctx.createGain(); harm.gain.value = isCello ? 0.08 : isBright ? 0.06 : 0.16;
    o1.connect(hp); o2.connect(hp); o3.connect(harm); harm.connect(hp);
    hp.connect(body); body.connect(lp); lp.connect(g); g.connect(dest || master);
    if (reverbInput) {
      const send = ctx.createGain(); send.gain.value = opt.reverb == null ? 0.55 : opt.reverb;
      g.connect(send); send.connect(reverbInput);
    }
    const nodes = [o1, o2, o3, lfo];
    if (isBgm) nodes.forEach((node) => bgmNodes.add(node));
    const cleanup = () => { if (isBgm) nodes.forEach((node) => bgmNodes.delete(node)); };
    o1.onended = cleanup;
    o1.start(when); o2.start(when); o3.start(when); lfo.start(when);
    o1.stop(when + dur + 0.04); o2.stop(when + dur + 0.04); o3.stop(when + dur + 0.04); lfo.stop(when + dur + 0.04);
  }

  /* ---- 타건 SFX -------------------------------------------------------- */
  function tap() {
    if (!unlocked) unlock();
    if (!ctx) return;
    duckBgm();
    const note = TAP_KAYSER[tapIdx++ % TAP_KAYSER.length];
    playNote(freq(note), ctx.currentTime, 0.24, sfxGain, 0.18, { attack: 0.02, release: 0.1, reverb: 0.16 });
  }

  function duckBgm() {
    if (!ctx || !bgmGain || !bgmOn) return;
    const t = ctx.currentTime;
    bgmGain.gain.cancelScheduledValues(t);
    bgmGain.gain.setValueAtTime(Math.min(bgmGain.gain.value, 0.14), t);
    bgmGain.gain.linearRampToValueAtTime(BGM_VOL, t + 0.42);
  }

  /* ---- BGM: 파일(mp3) 우선, 없으면 합성음 ------------------------------ */
  function startBGM() {
    stopSynthBGM();
    stopFileBGM();
    if (!bgmOn) return;
    bgmTrack = 1;
    const run = ++bgmRun;
    const url = BGM_FILES[bgmTrack];
    if (url) { playFileBGM(url, run); return; }
    if (ctx) { bgmStop = false; scheduleLoop(run); }
  }

  function scheduleLoop(run) {
    if (bgmStop || !ctx || run !== bgmRun) return;
    const trackNo = bgmTrack;
    const track = ORCH_TRACKS[trackNo] || ORCH_TRACKS[1];
    const beat = 60 / track.bpm;
    const t0 = ctx.currentTime + 0.06;
    const unit = track.style === 'waltz' ? 3 : 4;
    const totalBeats = Math.max(unit * 8, Math.round(track.bpm / (unit * 2)) * unit); // 약 30초, 마디 단위 정렬

    const chordAt = (b) => track.prog[(Math.floor(b / unit)) % track.prog.length];
    const rootAt = (b) => track.root + chordAt(b);
    const bassAt = (b) => track.bass + chordAt(b);
    const motifAt = (i, octave) => track.root + (octave || 12) + track.motif[i % track.motif.length];
    const note = (midi, b, dur, vol, role, opt) =>
      playNote(midiFreq(midi), t0 + b * beat, beat * dur, bgmGain, vol, Object.assign({ role, group: 'bgm' }, opt || {}));
    const chordPad = (base, b, dur, vol) => [0, 4, 7].forEach((s, i) =>
      note(base + s, b + i * 0.03, dur, vol, 'pad', { attack: 0.12, release: 0.58, reverb: 0.58 }));

    for (let b = 0; b < totalBeats; b += unit) {
      const base = rootAt(b), bass = bassAt(b);
      if (track.style === 'waltz') {
        note(bass, b, 1.05, 0.17, 'bass', { attack: 0.04, release: 0.22, reverb: 0.34 });
        note(base + 12, b + 1, 0.34, 0.1, 'pizz', { release: 0.11 });
        note(base + 16, b + 2, 0.34, 0.1, 'pizz', { release: 0.11 });
        chordPad(base, b, 2.75, 0.045);
      } else if (track.style === 'march') {
        note(bass, b, 0.55, 0.18, 'bass', { attack: 0.025, release: 0.18 });
        note(bass + 7, b + 2, 0.55, 0.16, 'bass', { attack: 0.025, release: 0.18 });
        note(base + 12, b + 1, 0.35, 0.095, 'brass', { attack: 0.012, release: 0.12 });
        note(base + 19, b + 3, 0.35, 0.095, 'brass', { attack: 0.012, release: 0.12 });
      } else if (track.style === 'fanfare' || track.style === 'finale') {
        note(bass, b, unit * 0.88, 0.16, 'bass', { attack: 0.04, release: 0.36 });
        chordPad(base, b, unit * 0.82, track.style === 'finale' ? 0.085 : 0.06);
        note(base + 19, b, 0.8, 0.13, 'brass', { attack: 0.018, release: 0.18 });
        note(base + 24, b + 2, 0.8, 0.13, 'brass', { attack: 0.018, release: 0.18 });
      } else if (track.style === 'pizz' || track.style === 'festival') {
        note(bass, b, unit * 0.72, 0.13, 'bass', { attack: 0.03, release: 0.26 });
        [0.25, 1.0, 1.75, 2.5, 3.25].forEach((off, i) => {
          if (off < unit) note(base + 12 + [0, 7, 12, 16, 19][i], b + off, 0.24, track.style === 'festival' ? 0.12 : 0.1, 'pizz', { release: 0.1 });
        });
      } else {
        note(bass, b, unit * 0.9, 0.13, 'bass', { attack: 0.07, release: 0.4 });
        chordPad(base, b, unit * 0.86, track.style === 'morning' ? 0.052 : 0.066);
      }
    }

    const step = track.style === 'festival' || track.style === 'staccato' ? 1 : track.style === 'morning' || track.style === 'chamber' ? 3 : 2;
    for (let b = 0, i = 0; b < totalBeats; b += step, i++) {
      const baseRole =
        track.style === 'fanfare' || track.style === 'finale' || track.style === 'march' ? 'brass' :
        track.style === 'pizz' || track.style === 'staccato' || track.style === 'festival' ? 'pizz' : 'woodwind';
      const dur = baseRole === 'pizz' ? 0.32 : track.style === 'morning' ? 2.15 : 1.25;
      const vol = baseRole === 'brass' ? 0.11 : baseRole === 'pizz' ? 0.1 : 0.125;
      note(motifAt(i, track.style === 'morning' ? 19 : 12), b, dur, vol, baseRole, { attack: baseRole === 'pizz' ? 0.006 : 0.025, release: baseRole === 'pizz' ? 0.12 : 0.24, reverb: 0.52 });
      if (track.style === 'chamber' && b + 1.5 < totalBeats) note(motifAt(i + 5, 7), b + 1.5, 1.1, 0.078, 'woodwind', { reverb: 0.6 });
      if (track.style === 'finale' && b % 8 === 4) note(motifAt(i, 24), b + 0.5, 0.9, 0.075, 'woodwind', { reverb: 0.62 });
    }
    bgmTrack = (trackNo % 10) + 1;
    bgmTimer = setTimeout(() => scheduleLoop(run), totalBeats * beat * 1000);
  }
  function stopSynthBGM() {
    bgmStop = true;
    bgmRun++;
    if (bgmTimer) { clearTimeout(bgmTimer); bgmTimer = null; }
    stopBgmNodes();
  }

  function stopBgmNodes() {
    if (!ctx) { bgmNodes.clear(); return; }
    const now = ctx.currentTime;
    bgmNodes.forEach((node) => {
      try { node.stop(now + 0.01); } catch (_) {}
    });
    bgmNodes.clear();
  }

  function playFileBGM(url, run) {
    if (!fileEl) { fileEl = new window.Audio(); }
    fileEl.loop = false;
    fileEl.src = url;
    fileEl.volume = 0.56;
    fileEl.onerror = () => { // 파일이 없으면 합성음으로 대체
      if (run !== bgmRun) return;
      stopFileBGM();
      if (ctx && bgmOn) { bgmStop = false; scheduleLoop(run); }
    };
    fileEl.onended = () => {
      if (run !== bgmRun || !bgmOn) return;
      bgmTrack = (bgmTrack % 10) + 1;
      const nextUrl = BGM_FILES[bgmTrack];
      if (nextUrl) playFileBGM(nextUrl, run);
      else if (ctx) { bgmStop = false; scheduleLoop(run); }
    };
    fileEl.play().catch(() => {});
  }
  function stopFileBGM() {
    if (fileEl) {
      try { fileEl.pause(); fileEl.currentTime = 0; } catch (_) {}
    }
  }

  function setQuest(n) {
    if (n === curQuest) return;
    curQuest = n; tapIdx = 0;
  }

  /* ---- 연출음 ---------------------------------------------------------- */
  function noiseBuffer(dur) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function playNoise(when, dur, vol, opt) {
    if (!ctx) return;
    opt = opt || {};
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(dur);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = opt.hp || 500;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = opt.bp || 1800; bp.Q.value = opt.q || 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(vol, when + (opt.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(hp); hp.connect(bp); bp.connect(g); g.connect(sfxGain || master);
    if (reverbInput) {
      const send = ctx.createGain(); send.gain.value = opt.reverb == null ? 0.45 : opt.reverb;
      g.connect(send); send.connect(reverbInput);
    }
    src.start(when); src.stop(when + dur + 0.02);
  }

  function applause() {
    if (!ctx) return;
    const t = ctx.currentTime;
    duckBgm();

    // Hall-sized applause bed: bright and wide, timed to sit under the outro.
    playNoise(t, 3.0, 0.17, { hp: 650, bp: 1800, q: 0.7, attack: 0.08, reverb: 0.65 });
    playNoise(t + 0.16, 2.75, 0.1, { hp: 350, bp: 900, q: 0.55, attack: 0.16, reverb: 0.7 });

    // Individual clap transients.
    for (let i = 0; i < 64; i++) {
      const when = t + 0.04 + Math.random() * 2.8;
      const dur = 0.025 + Math.random() * 0.055;
      const vol = 0.055 + Math.random() * 0.085;
      playNoise(when, dur, vol, { hp: 900, bp: 2200 + Math.random() * 1200, q: 2.8, attack: 0.002, reverb: 0.38 });
    }

    // Soft crowd cheers layered above the claps.
    ['A4','C5','E5','G5'].forEach((n, i) => {
      playNote(freq(n), t + 0.12 + i * 0.09, 1.8, sfxGain, 0.06, { role: 'woodwind', attack: 0.18, release: 0.75, reverb: 0.75 });
    });
  }

  function fanfare() {
    if (!ctx) return;
    ['D5','F#5','A5','D6'].forEach((n, i) => playNote(freq(n), ctx.currentTime + i * 0.11, 0.55, sfxGain, 0.42, { attack: 0.03, release: 0.25, reverb: 0.45 }));
  }

  function emotionBurst() {
    if (!ctx) return;
    const t = ctx.currentTime;
    duckBgm();

    ['D5','F#5','A5','D6','F#6'].forEach((n, i) => {
      playNote(freq(n), t + i * 0.045, 0.26, sfxGain, 0.2 - i * 0.018, { role: 'pizz', attack: 0.004, release: 0.1, reverb: 0.34 });
    });
  }

  function blip() {
    if (!ctx) return;
    const t = ctx.currentTime;
    playNote(freq('G4'), t, 0.18, sfxGain, 0.18, { role: 'pizz', attack: 0.004, release: 0.08, reverb: 0.18 });
    playNote(freq('D5'), t + 0.035, 0.14, sfxGain, 0.11, { role: 'pizz', attack: 0.004, release: 0.07, reverb: 0.14 });
  }

  /* ---- 온/오프 (BGM · SFX 독립) ---------------------------------------- */
  function setBgm(on) {
    bgmOn = !!on;
    if (bgmGain) {
      const t = ctx ? ctx.currentTime : 0;
      bgmGain.gain.cancelScheduledValues(t);
      bgmGain.gain.setValueAtTime(bgmOn ? BGM_VOL : 0, t);
    }
    if (bgmOn) startBGM(); else { stopSynthBGM(); stopFileBGM(); }
  }
  function setSfx(on) {
    sfxOn = !!on;
    if (sfxGain) sfxGain.gain.value = sfxOn ? SFX_VOL : 0;
  }
  function toggleBgm() { setBgm(!bgmOn); return bgmOn; }
  function toggleSfx() { setSfx(!sfxOn); return sfxOn; }
  const isBgm = () => bgmOn;
  const isSfx = () => sfxOn;

  return { unlock, ensureBgm, tap, setQuest, applause, fanfare, emotionBurst, blip,
           setBgm, setSfx, toggleBgm, toggleSfx, isBgm, isSfx };
})();
