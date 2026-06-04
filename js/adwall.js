const AdWall = (() => {

  const ADS = [
    'https://encouragingjawsordinarily.com/mr0hriwwz?key=2fc43bae8f2ea1ec52703103513feafc',
    'https://encouragingjawsordinarily.com/ea4zvhdgd1?key=59377a7a954b9f787981ac1087e65240',
  ];

  const FREE_DURATION = 30 * 60 * 1000;
  const STORAGE_KEY   = 'cv_adwall_unlocked';
  const TOKEN_KEY     = 'cv_adwall_token';

  // ── Domínios oficiais — nunca bloqueados ──
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
    // Valida token também
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || token !== btoa(val + navigator.userAgent.slice(0, 20))) return false;
    return (Date.now() - parseInt(val)) < FREE_DURATION;
  }

  function setUnlocked() {
    const now = Date.now().toString();
    localStorage.setItem(STORAGE_KEY, now);
    // Token vinculado ao dispositivo — dificulta copiar o localStorage
    localStorage.setItem(TOKEN_KEY, btoa(now + navigator.userAgent.slice(0, 20)));
  }

  function randomAd() {
    return ADS[Math.floor(Math.random() * ADS.length)];
  }

  // ── Camada 1: Detecta APK pirata (só bloqueia fora do domínio oficial) ──
  function isPirateApp() {
    if (isOfficialDomain()) return false; // seu WebView passa livre
    const ua = navigator.userAgent || '';
    return (
      /wv\)/.test(ua) ||
      /; wv/.test(ua) ||
      typeof window.Android !== 'undefined' ||
      typeof window.ReactNativeWebView !== 'undefined'
    );
  }

  // ── Camada 2: Verifica se popup abriu ──
  function tryOpenAd() {
    const url = randomAd();
    const w = window.open(url, '_blank');
    if (!w || w.closed || typeof w.closed === 'undefined') return false;
    return true;
  }

  // ── Camada 3: Prova de clique humano com timing ──
  // Guarda o timestamp do clique — se liberar sem passar tempo real, é bot/bypass
  let clickTimestamp = null;

  function show(onUnlock) {
    document.getElementById('adwallOverlay')?.remove();

    // Camada 1: APK pirata
    if (isPirateApp()) {
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

    btn.addEventListener('click', () => {
      if (clicked) return;

      // Camada 2: tenta abrir popup
      const adOpened = tryOpenAd();

      if (!adOpened) {
        // Popup bloqueado — fallback: abre na mesma aba por 3s depois volta
        showFallbackAd(onUnlock, btn, btnText, timer);
        return;
      }

      clicked = true;
      clickTimestamp = Date.now(); // Camada 3: marca tempo real

      document.getElementById('step1').classList.add('done');
      setTimeout(() => document.getElementById('step2').classList.add('done'), 800);
      setTimeout(() => document.getElementById('step3').classList.add('done'), 2000);

      btn.classList.add('adwall-btn-counting');
      btnText.textContent = '⏳ Aguardando...';
      timer.classList.remove('hidden');

      startCountdown(onUnlock);
    });
  }

  function startCountdown(onUnlock) {
    let secs = 5;
    const circle = document.getElementById('timerCircle');
    const numEl  = document.getElementById('timerNum');
    const total  = 113;

    const tick = setInterval(() => {
      secs--;
      if (numEl) numEl.textContent = secs;
      if (circle) {
        circle.style.strokeDashoffset = total - (total * ((5 - secs) / 5));
      }
      if (secs <= 0) {
        clearInterval(tick);

        // Camada 3: valida timing real (mínimo 4s reais devem ter passado)
        const elapsed = Date.now() - (clickTimestamp || 0);
        if (elapsed < 4000) {
          // Passou rápido demais — não libera, reinicia
          resetAdwall();
          return;
        }

        setUnlocked();
        unlock(onUnlock);
      }
    }, 1000);
  }

  // Fallback: quando popup é bloqueado, redireciona brevemente
  function showFallbackAd(onUnlock, btn, btnText, timer) {
    btnText.innerHTML = '🔄 Carregando anúncio...';
    btn.classList.add('adwall-btn-counting');

    // Abre em iframe oculto como fallback (alguns bloqueadores deixam passar)
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0.01;top:0;left:0;border:none;z-index:-1;';
    iframe.src = randomAd();
    document.body.appendChild(iframe);

    // Também tenta via location após delay — usuário percebe que carregou algo
    clickTimestamp = Date.now();
    timer.classList.remove('hidden');

    setTimeout(() => {
      document.getElementById('step1')?.classList.add('done');
    }, 500);
    setTimeout(() => {
      document.getElementById('step2')?.classList.add('done');
    }, 1500);
    setTimeout(() => {
      document.getElementById('step3')?.classList.add('done');
      iframe.remove();
    }, 3000);

    startCountdown(onUnlock);
  }

  function resetAdwall() {
    const btn     = document.getElementById('adwallBtn');
    const btnText = document.getElementById('adwallBtnText');
    const timer   = document.getElementById('adwallTimer');
    const steps   = document.querySelectorAll('.adwall-step');

    if (btn) btn.classList.remove('adwall-btn-counting');
    if (btnText) btnText.textContent = '▶ Liberar Acesso Grátis';
    if (timer) timer.classList.add('hidden');
    steps.forEach(s => s.classList.remove('done'));
    clickTimestamp = null;
  }

  // Tela APK pirata
  function showPirateBlock() {
    document.getElementById('adwallOverlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'adwallOverlay';
    overlay.innerHTML = `
      <div class="adwall-backdrop"></div>
      <div class="adwall-card" style="text-align:center;">
        <div class="adwall-icon">⚠️</div>
        <h2 class="adwall-title" style="font-size:22px;">Versão não oficial</h2>
        <p class="adwall-sub" style="margin-bottom:28px;">
          Este conteúdo só está disponível no<br>
          <strong style="color:#00e5c8;">site oficial do CineVibe</strong>.<br><br>
          Abra pelo navegador para assistir gratuitamente.
        </p>
        <a href="https://cinevibe-omega.vercel.app"
           target="_blank"
           class="adwall-btn"
           style="display:block;text-decoration:none;padding:16px;">
          🌐 Abrir site oficial
        </a>
        <p class="adwall-note" style="margin-top:16px;">
          cinevibe-omega.vercel.app
        </p>
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
