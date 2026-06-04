const AdWall = (() => {

  const ADS = [
    'https://encouragingjawsordinarily.com/mr0hriwwz?key=2fc43bae8f2ea1ec52703103513feafc',
    'https://encouragingjawsordinarily.com/ea4zvhdgd1?key=59377a7a954b9f787981ac1087e65240',
  ];

  const FREE_DURATION = 30 * 60 * 1000;
  const STORAGE_KEY   = 'cv_adwall_unlocked';
  const TOKEN_KEY     = 'cv_adwall_token';

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

  // ── Teste real: tenta abrir about:blank ──
  // No navegador normal: retorna objeto válido
  // No APK deles (shouldOverrideUrlLoading): retorna null
  function popupAllowed() {
    try {
      const test = window.open('about:blank', '_blank');
      if (!test || test.closed || typeof test.closed === 'undefined') return false;
      test.close();
      return true;
    } catch(e) {
      return false;
    }
  }

  let clickTimestamp = null;
  let adConfirmed    = false;

  function show(onUnlock) {
    document.getElementById('adwallOverlay')?.remove();

    // ── Pré-teste: já de cara testa se popup funciona ──
    if (!popupAllowed()) {
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
        <p class="adwall-sub">Veja um breve anúncio para assistir<br>
        gratuitamente por <strong>30 minutos</strong></p>

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
              <circle cx="22" cy="22" r="18" fill="none"
                stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
              <circle cx="22" cy="22" r="18" fill="none"
                stroke="#00e5c8" stroke-width="3"
                stroke-dasharray="113" stroke-dashoffset="113"
                id="timerCircle" stroke-linecap="round"
                style="transform:rotate(-90deg);transform-origin:center;
                       transition:stroke-dashoffset 1s linear"/>
            </svg>
            <span id="timerNum">5</span>
          </div>
          <p style="color:var(--text-2);font-size:13px;margin-top:8px">
            Liberando acesso...
          </p>
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

      // Abre anúncio real
      const newTab = window.open(randomAd(), '_blank');

      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        // Popup bloqueado — mostra bloqueio e não inicia contador
        showPirateBlock();
        return;
      }

      adConfirmed    = true;
      clicked        = true;
      clickTimestamp = Date.now();

      document.getElementById('step1').classList.add('done');
      setTimeout(() => document.getElementById('step2')?.classList.add('done'), 800);
      setTimeout(() => document.getElementById('step3')?.classList.add('done'), 2000);

      btn.classList.add('adwall-btn-counting');
      btnText.textContent = '⏳ Aguardando...';
      timer.classList.remove('hidden');

      // Contador
      let secs   = 5;
      const circle = document.getElementById('timerCircle');
      const numEl  = document.getElementById('timerNum');
      const total  = 113;

      const tick = setInterval(() => {
        secs--;
        if (numEl)   numEl.textContent = secs;
        if (circle)  circle.style.strokeDashoffset = total - (total * ((5 - secs) / 5));

        if (secs <= 0) {
          clearInterval(tick);
          const elapsed = Date.now() - (clickTimestamp || 0);
          // Só libera se anúncio abriu E tempo real passou
          if (!adConfirmed || elapsed < 4000) {
            resetBtn(btn, btnText, timer);
            return;
          }
          setUnlocked();
          unlock(onUnlock);
        }
      }, 1000);
    });
  }

  function showPirateBlock() {
    document.getElementById('adwallOverlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'adwallOverlay';
    overlay.innerHTML = `
      <div class="adwall-backdrop"></div>
      <div class="adwall-card" style="text-align:center;">
        <div class="adwall-icon">⚠️</div>
        <h2 class="adwall-title" style="font-size:22px;">Acesso bloqueado</h2>
        <p class="adwall-sub" style="margin-bottom:28px;">
          Este app não tem permissão para<br>
          exibir o conteúdo do <strong style="color:#00e5c8;">CineVibe</strong>.<br><br>
          Acesse pelo navegador para assistir grátis.
        </p>
        <a href="https://cinevibe-omega.vercel.app"
           target="_blank" rel="noopener"
           class="adwall-btn"
           style="display:block;text-decoration:none;padding:16px;">
          🌐 Abrir no navegador
        </a>
        <p class="adwall-note" style="margin-top:16px;">
          cinevibe-omega.vercel.app
        </p>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('adwall-show'));
  }

  function resetBtn(btn, btnText, timer) {
    if (btn)    { btn.classList.remove('adwall-btn-counting'); }
    if (btnText)  btnText.textContent = '▶ Liberar Acesso Grátis';
    if (timer)    timer.classList.add('hidden');
    adConfirmed    = false;
    clickTimestamp = null;
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
