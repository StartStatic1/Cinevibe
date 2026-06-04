const AdWall = (() => {

  const ADS = [
    'https://encouragingjawsordinarily.com/mr0hriwwz?key=2fc43bae8f2ea1ec52703103513feafc',
    'https://encouragingjawsordinarily.com/ea4zvhdgd1?key=59377a7a954b9f787981ac1087e65240',
  ];

  const FREE_DURATION = 30 * 60 * 1000;
  const STORAGE_KEY   = 'cv_adwall_unlocked';
  const TOKEN_KEY     = 'cv_adwall_token';

  const OFFICIAL_DOMAINS = [
    'cinevibe-omega.vercel.app',
    'cinevibe.vercel.app',
    'localhost',
    '127.0.0.1'
  ];

  function isOfficialDomain() {
    return OFFICIAL_DOMAINS.some(d => window.location.hostname.includes(d));
  }

  function isUnlocked() {
    const val = localStorage.getItem(STORAGE_KEY);
    if (!val) return false;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || token !== btoa(val + navigator.userAgent.slice(0, 20))) return false;
    return (Date.now() - parseInt(val)) < FREE_DURATION;
  }

  function setUnlocked() {
    const now = Date.now().toString();
    localStorage.setItem(STORAGE_KEY, now);
    localStorage.setItem(TOKEN_KEY, btoa(now + navigator.userAgent.slice(0, 20)));
  }

  function randomAd() {
    return ADS[Math.floor(Math.random() * ADS.length)];
  }

  // ── Testa se window.open está bloqueado (APK deles usa shouldOverrideUrlLoading) ──
  function testPopupBlocked() {
    // Abre about:blank — inofensivo mas detecta se está bloqueado
    const test = window.open('about:blank', '_blank');
    if (!test || test.closed || typeof test.closed === 'undefined') return true;
    test.close();
    return false;
  }

  let clickTimestamp = null;
  let adConfirmed = false;

  function show(onUnlock) {
    document.getElementById('adwallOverlay')?.remove();

    // ── Pré-teste: popup bloqueado + domínio não oficial = APK pirata ──
    if (!isOfficialDomain() && testPopupBlocked()) {
      showPirateBlock();
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'adwallOverlay';
    overlay.innerHTML = `
      <div class="adwall-backdrop"></div>
      <div class="adwall-card">
        <div class="adwall-icon">🎬</div>
        <h2 class="adwall-title">Conteúdo Gratuito</h2>
        <p class="adwall-sub">Veja um breve anúncio para assistir<br>gratuitamente por <strong>30 minutos</strong></p>

        <div class="adwall-steps">
          <div class="adwall-step" id="step1">
            <div class="step-num">1</div>
            <span>Clique em <strong>"Liberar Acesso"</strong></span>
          </div>
          <div class="adwall-step" id="step2">
            <div class="step-num">2</div>
            <span>Aguarde o anúncio abrir</span>
          </div>
          <div class="adwall-step" id="step3">
            <div class="step-num">3</div>
            <span>Volte ao app e assista!</span>
          </div>
        </div>

        <button class="adwall-btn" id="adwallBtn">
          <span id="adwallBtnText">▶ Liberar Acesso Grátis</span>
        </button>

        <div class="adwall-timer hidden" id="adwallTimer">
          <div class="timer-ring">
            <svg viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
              <circle cx="22" cy="22" r="18" fill="none" stroke="#00e5c8" stroke-width="3"
                stroke-dasharray="113" stroke-dashoffset="113" id="timerCircle"
                stroke-linecap="round"
                style="transform:rotate(-90deg);transform-origin:center;transition:stroke-dashoffset 1s linear"/>
            </svg>
            <span id="timerNum">5</span>
          </div>
          <p style="color:var(--text-2);font-size:13px;margin-top:8px">Liberando acesso...</p>
        </div>

        <p class="adwall-note">Sem cadastro · Sem cartão · 100% grátis</p>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('adwall-show'));

    const btn     = document.getElementById('adwallBtn');
    const btnText = document.getElementById('adwallBtnText');
    const timer   = document.getElementById('adwallTimer');
    let clicked   = false;
    adConfirmed   = false;

    btn.addEventListener('click', () => {
      if (clicked) return;

      // Abre o anúncio real
      const newTab = window.open(randomAd(), '_blank');

      // ── Verifica se abriu de verdade ──
      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        // Bloqueado — mostra erro, não inicia contador
        btnText.innerHTML = '🚫 Anúncio bloqueado. Tente no navegador.';
        btn.style.background = 'rgba(255,60,60,0.15)';
        btn.style.border = '1px solid rgba(255,60,60,0.4)';
        btn.style.color = '#ff6060';
        setTimeout(() => {
          btn.style.background = '';
          btn.style.border = '';
          btn.style.color = '';
          btnText.textContent = '▶ Liberar Acesso Grátis';
        }, 3000);
        return;
      }

      // Anúncio abriu!
      adConfirmed = true;
      clicked = true;
      clickTimestamp = Date.now();

      document.getElementById('step1').classList.add('done');
      setTimeout(() => document.getElementById('step2').classList.add('done'), 800);
      setTimeout(() => document.getElementById('step3').classList.add('done'), 2000);

      btn.classList.add('adwall-btn-counting');
      btnText.textContent = '⏳ Aguardando...';
      timer.classList.remove('hidden');

      // ── Contador — só libera se adConfirmed=true E tempo real >= 4s ──
      let secs = 5;
      const circle = document.getElementById('timerCircle');
      const numEl  = document.getElementById('timerNum');
      const total  = 113;

      const tick = setInterval(() => {
        secs--;
        if (numEl) numEl.textContent = secs;
        if (circle) circle.style.strokeDashoffset = total - (total * ((5 - secs) / 5));

        if (secs <= 0) {
          clearInterval(tick);
          const elapsed = Date.now() - (clickTimestamp || 0);

          if (!adConfirmed || elapsed < 4000) {
            // Manipulação detectada — reinicia
            resetBtn(btn, btnText, timer);
            return;
          }

          setUnlocked();
          unlock(onUnlock);
        }
      }, 1000);
    });

    // ── Detecta se usuário voltou ao app após ver anúncio ──
    document.addEventListener('visibilitychange', function onVisible() {
      if (document.visibilityState === 'visible' && adConfirmed) {
        document.getElementById('step3')?.classList.add('done');
        document.removeEventListener('visibilitychange', onVisible);
      }
    });
  }

  function resetBtn(btn, btnText, timer) {
    if (btn) { btn.classList.remove('adwall-btn-counting'); btn.style = ''; }
    if (btnText) btnText.textContent = '▶ Liberar Acesso Grátis';
    if (timer) timer.classList.add('hidden');
    adConfirmed   = false;
    clickTimestamp = null;
    // Remove e recria o botão para evitar que clique anterior persista
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  }

  function showPirateBlock() {
    document.getElementById('adwallOverlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'adwallOverlay';
    overlay.innerHTML = `
      <div class="adwall-backdrop"></div>
      <div class="adwall-card" style="text-align:center;">
        <div class="adwall-icon">⚠️</div>
        <h2 class="adwall-title" style="font-size:22px;">App não oficial</h2>
        <p class="adwall-sub" style="margin-bottom:28px;">
          Este conteúdo só está disponível no<br>
          <strong style="color:#00e5c8;">site oficial do CineVibe</strong>.<br><br>
          Abra pelo navegador para assistir grátis.
        </p>
        <a href="https://cinevibe-omega.vercel.app" target="_blank"
           class="adwall-btn" style="display:block;text-decoration:none;padding:16px;">
          🌐 Abrir site oficial
        </a>
        <p class="adwall-note" style="margin-top:16px;">cinevibe-omega.vercel.app</p>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('adwall-show'));
  }

  function unlock(onUnlock) {
    const overlay = document.getElementById('adwallOverlay');
    if (overlay) {
      overlay.classList.add('adwall-hide');
      setTimeout(() => overlay.remove(), 400);
    }
    onUnlock?.();
  }

  function guard(onUnlock) {
    if (isUnlocked()) { onUnlock(); return; }
    show(onUnlock);
  }

  return { guard, isUnlocked, setUnlocked };
})();
