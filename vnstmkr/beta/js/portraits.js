/* =========================================================================
 *  바이올리니스트 메이커 — 캐릭터 일러스트 (portraits.js)
 *  실제 이미지 파일 대신 인라인 SVG 로 도트/웹툰풍 초상을 생성한다.
 *  Portraits.svg(charKey, expression) → SVG 문자열
 *  Portraits.endingCG(tier)          → 엔딩 CG SVG 문자열
 * ========================================================================= */
const Portraits = (() => {
  'use strict';

  /* 캐릭터별 외형 정의 (머리/눈 색, 의상, 액세서리) */
  const LOOK = {
    leon: {
      skin: '#ffe0c4', hair: '#c8925a', hairDark: '#9c6c3c', eye: '#4a90d9',
      outfit: '#3a5a8c', outfit2: '#2c4368', accent: '#8ecbff',
      backHair: 'M46 96 Q40 40 100 34 Q160 40 154 96 L154 150 Q100 140 46 150 Z',
      bangs: 'M56 92 Q60 56 100 52 Q140 56 144 92 Q128 74 112 84 Q104 66 92 84 Q78 74 56 92 Z',
      extras: '',
    },
    violet: {
      skin: '#ffe3d2', hair: '#c79aff', hairDark: '#7650b8', eye: '#8f54d9',
      outfit: '#6a3f91', outfit2: '#34214f', accent: '#ffd166',
      backHair: 'M39 99 C30 55 56 25 100 25 C145 25 171 56 161 101 C174 143 160 191 145 214 C140 184 134 162 124 151 C108 158 92 158 76 151 C66 162 60 184 55 214 C40 191 26 143 39 99 Z',
      bangs: 'M50 91 C55 56 79 44 101 45 C127 46 146 59 150 91 C135 70 120 74 111 86 C108 67 101 61 96 87 C88 70 74 70 64 89 C60 91 55 92 50 91 Z',
      // 얇은 티아라 + 귀걸이
      extras:
        '<path d="M78 58 L90 46 L100 58 L110 46 L122 58" fill="none" stroke="#ffd166" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<circle cx="100" cy="54" r="3.2" fill="#fff2b6"/>' +
        '<circle cx="57" cy="125" r="3" fill="#ffd166"/><circle cx="143" cy="125" r="3" fill="#ffd166"/>',
    },
    andrea: {
      skin: '#f2d5b8', hair: '#f0f0f6', hairDark: '#8f929d', eye: '#566070',
      outfit: '#46382c', outfit2: '#201915', accent: '#ffd166',
      backHair: 'M49 104 C40 74 56 45 83 40 C91 30 113 30 122 40 C149 45 160 74 151 104 C145 88 136 72 120 65 C110 60 91 60 80 65 C64 72 55 88 49 104 Z',
      bangs: 'M57 95 C62 75 79 66 96 74 C88 66 101 58 116 70 C128 68 140 78 143 96 C128 86 117 86 106 92 C96 82 80 82 57 95 Z',
      // 정돈된 콧수염 + 모노클 + 짧은 턱수염
      extras:
        '<path d="M80 146 C88 138 96 140 100 146 C104 140 112 138 120 146 C113 153 106 154 100 149 C94 154 87 153 80 146 Z" fill="#d8d8df"/>' +
        '<path d="M93 160 Q100 168 107 160 Q103 173 100 178 Q97 173 93 160 Z" fill="#d8d8df" opacity=".9"/>' +
        '<circle cx="122" cy="111" r="15" fill="none" stroke="#ffd166" stroke-width="2.2"/>' +
        '<circle cx="122" cy="111" r="11" fill="#ffffff" opacity=".08"/>' +
        '<path d="M135 121 C147 130 151 143 148 157" stroke="#ffd166" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
    },
  };

  const tier = (aff) => (aff >= 66 ? 'high' : aff >= 33 ? 'mid' : 'low');

  /* 확장 표정 → 기본 8종 표정으로 매핑 (없는 표정은 가장 가까운 것으로) */
  const EXPR_ALIAS = {
    soft: 'shy', warm: 'happy', friendly: 'happy',
    frustrated: 'angry', strict: 'angry', determined: 'proud',
    panting: 'surprised',
  };

  /* ---- 표정: 눈썹 / 눈 / 입 / 볼터치 ----------------------------------- */
  const LX = 79, RX = 121, EY = 110, BY = 92, MY = 150;

  function brows(expr) {
    switch (expr) {
      case 'angry':    return line(LX-11,BY+2, LX+9,BY+8) + line(RX-9,BY+8, RX+11,BY+2);
      case 'sad':      return line(LX-10,BY+7, LX+10,BY+1) + line(RX-10,BY+1, RX+10,BY+7);
      case 'surprised':return line(LX-10,BY-4, LX+10,BY-6) + line(RX-10,BY-6, RX+10,BY-4);
      case 'happy':    return arc(LX,BY-1,18,-4) + arc(RX,BY-1,18,-4);
      default:         return line(LX-10,BY+2, LX+10,BY) + line(RX-10,BY, RX+10,BY+2);
    }
  }

  function eye(cx, expr, iris) {
    // 감은 눈 계열
    if (expr === 'happy')  return arc(cx, EY+2, 24, -13, '#2a1a12', 3);      // ^_^
    if (expr === 'proud')  return arc(cx, EY,   22,  10, '#2a1a12', 3);      // 새침(내리깐)
    // 뜬 눈
    const sy = expr === 'surprised' ? 1.15 : expr === 'shy' || expr === 'blush' ? 0.72 : 1;
    const irisR = expr === 'surprised' ? 8 : 9;
    const pupR  = expr === 'surprised' ? 3.5 : 5;
    let s = '';
    s += `<ellipse cx="${cx}" cy="${EY}" rx="12" ry="${(14*sy).toFixed(1)}" fill="#fff"/>`;
    s += `<circle cx="${cx}" cy="${EY+2}" r="${irisR}" fill="${iris}"/>`;
    s += `<circle cx="${cx}" cy="${EY+2}" r="${pupR}" fill="#20140f"/>`;
    s += `<circle cx="${cx-3}" cy="${EY-3}" r="3" fill="#fff"/>`;
    s += `<circle cx="${cx+3}" cy="${EY+4}" r="1.4" fill="#fff" opacity=".7"/>`;
    // 윗눈꺼풀
    s += `<path d="M ${cx-12} ${EY-7} q 12 ${expr==='angry'?-2:-7} 24 0" stroke="#2a1a12" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    if (expr === 'sad') s += `<path d="M ${cx+8} ${EY+8} q 3 8 -1 14" stroke="#9ad0ff" stroke-width="2.5" fill="none"/>`; // 눈물
    return s;
  }

  function mouth(expr) {
    switch (expr) {
      case 'happy':    return `<path d="M88 148 Q100 164 112 148 Q100 156 88 148 Z" fill="#a8324a"/>`;
      case 'surprised':return `<ellipse cx="100" cy="152" rx="7" ry="9" fill="#a8324a"/>`;
      case 'angry':    return `<path d="M88 152 Q100 146 112 152" stroke="#8a2a3c" stroke-width="3" fill="none"/>`;
      case 'sad':      return `<path d="M89 156 Q100 148 111 156" stroke="#8a2a3c" stroke-width="2.6" fill="none"/>`;
      case 'blush':
      case 'shy':      return `<path d="M92 151 Q100 157 108 151" stroke="#a8324a" stroke-width="2.6" fill="none"/>`;
      case 'proud':    return `<path d="M90 152 L110 150" stroke="#8a2a3c" stroke-width="2.6" fill="none"/>`;
      default:         return `<path d="M91 150 Q100 155 109 150" stroke="#a8324a" stroke-width="2.4" fill="none"/>`;
    }
  }

  function blush(expr) {
    if (expr !== 'blush' && expr !== 'shy') return '';
    const c = '#ff9db0';
    return `<ellipse cx="66" cy="128" rx="10" ry="5.5" fill="${c}" opacity=".7"/>` +
           `<ellipse cx="134" cy="128" rx="10" ry="5.5" fill="${c}" opacity=".7"/>`;
  }

  function outfitDetails(charKey, L) {
    const trim = L.accent || '#ffd166';
    if (charKey === 'andrea') {
      return `
  <path d="M74 164 L100 198 L126 164" fill="#f5e8c9" opacity=".95"/>
  <path d="M86 162 L100 182 L114 162 L109 206 H91 Z" fill="#8f2445"/>
  <path d="M61 168 C76 185 88 203 91 214 L65 214 C62 196 58 180 61 168 Z" fill="#16110f" opacity=".35"/>
  <path d="M139 168 C124 185 112 203 109 214 L135 214 C138 196 142 180 139 168 Z" fill="#16110f" opacity=".35"/>
  <path d="M65 171 Q100 188 135 171" stroke="${trim}" stroke-width="2.4" opacity=".75" fill="none"/>
  <path d="M78 177 L91 190 M122 177 L109 190" stroke="#fff4d0" stroke-width="1.4" opacity=".55"/>
  <circle cx="100" cy="193" r="3" fill="${trim}"/>
  <path d="M143 168 L168 132" stroke="${trim}" stroke-width="3" stroke-linecap="round"/>
  <path d="M166 130 L174 122" stroke="#fff4c2" stroke-width="1.4" stroke-linecap="round"/>`;
    }
    if (charKey === 'violet') {
      return `
  <path d="M65 214 C72 184 83 166 100 160 C117 166 128 184 135 214 Z" fill="#f2d7ff" opacity=".18"/>
  <path d="M73 164 C82 177 91 183 100 184 C109 183 118 177 127 164 L118 214 H82 Z" fill="#fff0c8" opacity=".92"/>
  <path d="M70 171 C82 185 91 193 100 194 C109 193 118 185 130 171" stroke="${trim}" stroke-width="2.5" opacity=".9" fill="none"/>
  <path d="M85 168 C89 180 94 188 100 194 C106 188 111 180 115 168" stroke="#ffffff" stroke-width="1.2" opacity=".38" fill="none"/>
  <path d="M140 170 L170 138" stroke="#7a4a2a" stroke-width="4.8" stroke-linecap="round"/>
  <path d="M151 157 L177 142" stroke="#3a2418" stroke-width="1.4"/>
  <path d="M136 174 Q150 162 164 174" fill="#8a4b2a"/>`;
    }
    return `
  <path d="M78 164 L100 190 L122 164" fill="#e9f3ff" opacity=".92"/>
  <path d="M92 166 L100 183 L108 166" fill="#315f9b"/>
  <path d="M66 172 Q100 188 134 172" stroke="${trim}" stroke-width="2" opacity=".65" fill="none"/>
  <path d="M136 171 L166 143" stroke="#7a4a2a" stroke-width="5" stroke-linecap="round"/>
  <path d="M148 157 L174 143" stroke="#3a2418" stroke-width="1.4"/>
  <path d="M132 176 Q148 163 162 176" fill="#8a4b2a"/>`;
  }

  function hairHighlights(charKey, L) {
    if (charKey === 'violet') {
      return `<path d="M62 75 C80 50 105 42 124 55" stroke="#ead8ff" stroke-width="5" opacity=".38" fill="none" stroke-linecap="round"/>
              <path d="M139 78 C151 111 149 157 141 193" stroke="#ead8ff" stroke-width="4" opacity=".25" fill="none" stroke-linecap="round"/>
              <path d="M56 96 C46 126 48 165 57 194" stroke="#b987ff" stroke-width="3" opacity=".22" fill="none" stroke-linecap="round"/>`;
    }
    if (charKey === 'andrea') {
      return `<path d="M61 84 C74 68 91 65 104 73" stroke="#ffffff" stroke-width="4" opacity=".55" fill="none" stroke-linecap="round"/>
              <path d="M116 70 C132 67 145 78 147 93" stroke="#ffffff" stroke-width="4" opacity=".45" fill="none" stroke-linecap="round"/>
              <path d="M55 101 C50 86 54 68 68 56" stroke="#d9d9e0" stroke-width="3" opacity=".35" fill="none" stroke-linecap="round"/>`;
    }
    return `<path d="M64 78 Q88 55 116 60" stroke="#edc28a" stroke-width="4" opacity=".45" fill="none" stroke-linecap="round"/>`;
  }

  /* 작은 SVG 헬퍼 */
  function line(x1,y1,x2,y2){ return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#7a5a3a" stroke-width="3" stroke-linecap="round"/>`; }
  function arc(cx,cy,w,h,color,sw){ // 위/아래로 휜 호 (h<0 위로)
    color=color||'#7a5a3a'; sw=sw||3;
    return `<path d="M${cx-w/2} ${cy} q ${w/2} ${h} ${w} 0" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
  }

  /* ---- 초상 조립 -------------------------------------------------------- */
  function svg(charKey, expression) {
    const L = LOOK[charKey];
    if (!L) return '';
    let expr = expression || 'neutral';
    expr = EXPR_ALIAS[expr] || expr;
    return `
<svg viewBox="0 0 200 214" xmlns="http://www.w3.org/2000/svg" class="portrait-svg" aria-hidden="true">
  <defs>
    <linearGradient id="of-${charKey}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${L.outfit}"/><stop offset="1" stop-color="${L.outfit2}"/>
    </linearGradient>
    <radialGradient id="skin-${charKey}" cx="45%" cy="28%" r="72%">
      <stop offset="0" stop-color="#fff0dd"/><stop offset=".72" stop-color="${L.skin}"/><stop offset="1" stop-color="#e8ad91"/>
    </radialGradient>
    <linearGradient id="hair-${charKey}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${L.hair}"/><stop offset="1" stop-color="${L.hairDark}"/>
    </linearGradient>
  </defs>
  <ellipse cx="100" cy="210" rx="62" ry="9" fill="#000" opacity=".18"/>
  <path d="${L.backHair}" fill="${L.hairDark}"/>
  ${hairHighlights(charKey, L)}
  <path d="M28 214 Q34 168 72 158 L128 158 Q166 168 172 214 Z" fill="url(#of-${charKey})"/>
  <path d="M42 214 Q52 180 78 162" stroke="#fff" stroke-width="8" opacity=".08" fill="none"/>
  ${outfitDetails(charKey, L)}
  <rect x="90" y="146" width="20" height="20" rx="7" fill="${L.skin}"/>
  <ellipse cx="100" cy="108" rx="46" ry="52" fill="url(#skin-${charKey})"/>
  <path d="M61 101 Q65 60 100 53 Q136 61 140 101 Q128 86 115 90 Q105 76 93 90 Q78 82 61 101 Z" fill="#000" opacity=".06"/>
  <ellipse cx="55" cy="114" rx="7" ry="10" fill="${L.skin}"/>
  <ellipse cx="145" cy="114" rx="7" ry="10" fill="${L.skin}"/>
  <path d="${L.bangs}" fill="url(#hair-${charKey})"/>
  ${hairHighlights(charKey, L)}
  ${blush(expr)}
  ${brows(expr)}
  ${eye(LX, expr, L.eye)}
  ${eye(RX, expr, L.eye)}
  <path d="M98 124 Q100 130 103 126" stroke="#e0a884" stroke-width="2" fill="none" stroke-linecap="round"/>
  ${mouth(expr)}
  ${L.extras}
</svg>`.trim();
  }

  /* ---- 엔딩 CG: 크레모나 광장의 두 사람 -------------------------------- */
  function endingCG(t) {
    const heart = t === 'high'
      ? '<g opacity=".9"><path d="M300 120 c-8-16-34-10-34 8 0 14 22 28 34 40 12-12 34-26 34-40 0-18-26-24-34-8Z" fill="#ff6b8a"><animate attributeName="opacity" values="0;1;0.6" dur="2.2s" repeatCount="indefinite"/></path></g>'
      : '';
    return `
<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" class="cg-svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f9c8a0"/><stop offset="0.55" stop-color="#e79bb0"/><stop offset="1" stop-color="#6b4a7a"/>
    </linearGradient>
    <radialGradient id="sun" cx="50%" cy="30%" r="60%">
      <stop offset="0" stop-color="#fff3d6"/><stop offset="1" stop-color="#f9c8a0" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="400" fill="url(#sky)"/>
  <rect width="600" height="400" fill="url(#sun)"/>
  <circle cx="300" cy="120" r="46" fill="#fff6e0" opacity=".9"/>
  <!-- 크레모나 대성당 실루엣 -->
  <g fill="#4a3560" opacity=".9">
    <rect x="60" y="150" width="70" height="150"/><polygon points="60,150 95,110 130,150"/>
    <rect x="470" y="140" width="80" height="160"/><polygon points="470,140 510,95 550,140"/>
    <rect x="150" y="200" width="300" height="100"/>
    <polygon points="150,200 300,150 450,200"/>
    <rect x="290" y="120" width="20" height="90"/><polygon points="285,120 300,95 315,120"/>
  </g>
  <!-- 광장 바닥 -->
  <rect y="300" width="600" height="100" fill="#3a2a4a"/>
  <g stroke="#54406a" stroke-width="1.5">
    <path d="M0 330 L600 330"/><path d="M150 300 L100 400"/><path d="M300 300 L300 400"/><path d="M450 300 L500 400"/>
  </g>
  <!-- 두 사람 (레온 & 바이올렛) -->
  <g>
    <!-- 레온 -->
    <ellipse cx="255" cy="300" rx="26" ry="7" fill="#000" opacity=".25"/>
    <path d="M240 300 Q238 258 255 254 Q272 258 270 300 Z" fill="#3a5a8c"/>
    <circle cx="255" cy="240" r="16" fill="#ffe0c4"/><path d="M241 236 Q246 220 255 222 Q264 220 269 236 Q260 228 255 232 Q250 228 241 236Z" fill="#c8925a"/>
    <path d="M270 275 L300 255" stroke="#7a4a2a" stroke-width="3"/> <!-- 활 -->
    <path d="M258 268 L292 250" stroke="#5a3a1a" stroke-width="6"/> <!-- 바이올린 -->
    <!-- 바이올렛 -->
    <ellipse cx="345" cy="300" rx="26" ry="7" fill="#000" opacity=".25"/>
    <path d="M330 300 Q328 256 345 252 Q362 256 360 300 Z" fill="#5b3f7a"/>
    <circle cx="345" cy="238" r="16" fill="#ffe3d2"/>
    <path d="M330 236 Q334 216 345 216 Q356 216 360 236 L362 270 Q350 258 345 262 Q340 258 328 270 Z" fill="#b483e8"/>
    <path d="M341 214 L345 206 L349 214Z" fill="#ffd166"/>
  </g>
  ${heart}
  <!-- 흩날리는 꽃잎 -->
  <g fill="#ffd9e2" opacity=".85">
    <circle cx="120" cy="90" r="4"><animate attributeName="cy" values="60;360" dur="7s" repeatCount="indefinite"/></circle>
    <circle cx="420" cy="40" r="3"><animate attributeName="cy" values="40;360" dur="9s" repeatCount="indefinite"/></circle>
    <circle cx="510" cy="120" r="4"><animate attributeName="cy" values="80;360" dur="6s" repeatCount="indefinite"/></circle>
    <circle cx="220" cy="30" r="3"><animate attributeName="cy" values="30;360" dur="8s" repeatCount="indefinite"/></circle>
  </g>
</svg>`.trim();
  }

  /* ---- 세브지크 바이올린 아카데미 배경 -------------------------------- */
  function academyBG() {
    return `
<svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" class="bg-svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="hall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a2c56"/><stop offset="1" stop-color="#1c1530"/>
    </linearGradient>
    <linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd98a"/><stop offset="1" stop-color="#c47a3a"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="70%" r="60%">
      <stop offset="0" stop-color="#5a4483" stop-opacity=".8"/><stop offset="1" stop-color="#5a4483" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="480" height="300" fill="url(#hall)"/>
  <rect width="480" height="300" fill="url(#glow)"/>
  <!-- 뒷벽 아치 창 (스테인드글라스) -->
  <g>
    <path d="M210 40 h60 v90 h-60 z M240 26 a30 30 0 0 1 30 14 h-60 a30 30 0 0 1 30 -14 z" fill="url(#win)" opacity=".9"/>
    <line x1="240" y1="26" x2="240" y2="130" stroke="#7a4a2a" stroke-width="2"/>
    <line x1="210" y1="80" x2="270" y2="80" stroke="#7a4a2a" stroke-width="2"/>
  </g>
  <!-- 좌우 기둥 -->
  <g fill="#2a2040">
    <rect x="40" y="30" width="26" height="200"/><rect x="34" y="24" width="38" height="12"/><rect x="34" y="224" width="38" height="12"/>
    <rect x="414" y="30" width="26" height="200"/><rect x="408" y="24" width="38" height="12"/><rect x="408" y="224" width="38" height="12"/>
    <rect x="120" y="60" width="18" height="170" opacity=".7"/>
    <rect x="342" y="60" width="18" height="170" opacity=".7"/>
  </g>
  <!-- 현수막 배너 -->
  <path d="M150 24 h180 l-12 22 h-156 z" fill="#7a2740"/>
  <text x="240" y="41" text-anchor="middle" font-size="13" font-family="Georgia, serif" fill="#ffd98a" font-weight="bold">SEVZIK ACADEMY</text>
  <!-- 마루 무대 -->
  <rect y="230" width="480" height="70" fill="#241a30"/>
  <g stroke="#3a2c50" stroke-width="1.5">
    <path d="M0 250 H480"/><path d="M140 230 L90 300"/><path d="M240 230 V300"/><path d="M340 230 L390 300"/>
  </g>
  <ellipse cx="240" cy="252" rx="150" ry="18" fill="#ffdca0" opacity=".08"/>
</svg>`.trim();
  }

  /* 확장 표정을 기본 8종으로 정규화 (이미지 파일명·SVG 공용) */
  const normExpr = (e) => EXPR_ALIAS[e] || e || 'neutral';

  return { svg, endingCG, academyBG, tier, normExpr };
})();
