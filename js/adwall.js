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

  let userLeftApp = false;   // usuário realmente saiu para ver o anúncio
  let clickTimestamp = null;
  let countdownInterval = null;

  function show(onUnlock) {
    document.getElementById('adwallOverlay')?.remove();
    userLeftApp    = false;
    clickTimestamp = null;

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

    // ── Detecta se usuário saiu do app (foi ver o anúncio) ──
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        // App foi para background — usuário saiu
        userLeftApp = true;
        document.getElementById('step2')?.classList.add('done');
      }
      if (document.visibilityState === 'visible' && userLeftApp) {
        // Voltou ao app
        document.getElementById('step3')?.classList.add('done');
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    btn.addEventListener('click', () => {
      if (clicked) return;

      // Abre o anúncio
      const newTab = window.open(randomAd(), '_blank');

      // Popup bloqueado completamente
      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        btnText.innerHTML = '🚫 Bloqueado. Tente no navegador.';
        btn.style.cssText = 'background:rgba(255,60,60,0.15);border:1px solid rgba(255,60,60,0.4);color:#ff6060;';
        setTimeout(() => {
          btn.style.cssText = '';
          btnText.textContent = '▶ Liberar Acesso Grátis';
        }, 3000);
        return;
      }

      clicked        = true;
      clickTimestamp = Date.now();

      document.getElementById('step1').classList.add('done');
      btn.classList.add('adwall-btn-counting');
      btnText.textContent = '⏳ Aguardando...';
      timer.classList.remove('hidden');

      // Contador — PAUSADO até usuário sair do app
      let secs   = 5;
      let paused = true; // começa pausado
      const circle = document.getElementById('timerCircle');
      const numEl  = document.getElementById('timerNum');
      const total  = 113;

      // Só inicia o contador quando usuário voltar ao app
      // (prova que ele saiu e viu o anúncio)
      function onReturn() {
        if (document.visibilityState === 'visible' && userLeftApp && paused) {
          paused = false; // despausa o contador
          document.removeEventListener('visibilitychange', onReturn);
        }
      }
      document.addEventListener('visibilitychange', onReturn);

      countdownInterval = setInterval(() => {
        if (paused) return; // espera usuário voltar

        secs--;
        if (numEl)  numEl.textContent = secs;
        if (circle) circle.style.strokeDashoffset = total - (total * ((5 - secs) / 5));

        if (secs <= 0) {
          clearInterval(countdownInterval);

          // Validações finais
          const elapsed = Date.now() - (clickTimestamp || 0);
          if (!userLeftApp || elapsed < 3000) {
            // Não saiu do app — reinicia
            resetBtn(btn, btnText, timer);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            return;
          }

          document.removeEventListener('visibilitychange', onVisibilityChange);
          setUnlocked();
          unlock(onUnlock);
        }
      }, 1000);
    });
  }

  function resetBtn(btn, btnText, timer) {
    if (btn)    btn.classList.remove('adwall-btn-counting');
    if (btnText) btnText.textContent = '▶ Liberar Acesso Grátis';
    if (timer)   timer.classList.add('hidden');
    userLeftApp    = false;
    clickTimestamp = null;
    if (countdownInterval) clearInterval(countdownInterval);
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
