// ============================================================
//  CineVibe – AdWall (Desbloqueio por Anúncio)
//  Adsterra Direct Links
// ============================================================

const AdWall = (() => {

  // ── Seus links Adsterra ──
  const ADS = [
    'https://encouragingjawsordinarily.com/mr0hriwwz?key=2fc43bae8f2ea1ec52703103513feafc',
    'https://encouragingjawsordinarily.com/ea4zvhdgd1?key=59377a7a954b9f787981ac1087e65240',
  ];

  // Tempo livre após ver anúncio (ms) — 30 min
  const FREE_DURATION = 30 * 60 * 1000;
  const STORAGE_KEY   = 'cv_adwall_unlocked';

  function isUnlocked() {
    const val = localStorage.getItem(STORAGE_KEY);
    if (!val) return false;
    return (Date.now() - parseInt(val)) < FREE_DURATION;
  }

  function setUnlocked() {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  }

  function randomAd() {
    return ADS[Math.floor(Math.random() * ADS.length)];
  }

  // ── Tela de desbloqueio ──
  function show(onUnlock) {
    // Remove se já existir
    document.getElementById('adwallOverlay')?.remove();

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
                stroke-dasharray="113" stroke-dashoffset="113"
                id="timerCircle" stroke-linecap="round"
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

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('adwall-show'));

    const btn     = document.getElementById('adwallBtn');
    const btnText = document.getElementById('adwallBtnText');
    const timer   = document.getElementById('adwallTimer');
    let clicked   = false;

    btn.addEventListener('click', () => {
      if (clicked) return;
      clicked = true;

      // Abre anúncio
      window.open(randomAd(), '_blank');

      // Ativa steps
      document.getElementById('step1').classList.add('done');
      setTimeout(() => document.getElementById('step2').classList.add('done'), 800);
      setTimeout(() => document.getElementById('step3').classList.add('done'), 2000);

      // Mostra contador
      btn.classList.add('adwall-btn-counting');
      btnText.textContent = '⏳ Aguardando...';
      timer.classList.remove('hidden');

      // Countdown 5s
      let secs = 5;
      const circle = document.getElementById('timerCircle');
      const numEl  = document.getElementById('timerNum');
      const total  = 113; // 2πr

      const tick = setInterval(() => {
        secs--;
        numEl.textContent = secs;
        circle.style.strokeDashoffset = total - (total * ((5 - secs) / 5));

        if (secs <= 0) {
          clearInterval(tick);
          setUnlocked();
          unlock(onUnlock);
        }
      }, 1000);
    });
  }

  function unlock(onUnlock) {
    const overlay = document.getElementById('adwallOverlay');
    if (overlay) {
      overlay.classList.add('adwall-hide');
      setTimeout(() => overlay.remove(), 400);
    }
    onUnlock?.();
  }

  // ── API pública ──
  // Chame antes de abrir o player:
  // AdWall.guard(() => Player.open(...))
  function guard(onUnlock) {
    if (isUnlocked()) {
      onUnlock();
      return;
    }
    show(onUnlock);
  }

  return { guard, isUnlocked, setUnlocked };
})();

