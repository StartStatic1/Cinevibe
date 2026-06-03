// ============================================================
//  CineVibe – Service Worker Registration
//  v2: força limpeza de cache antigo e reload automático
// ============================================================

const SW_VERSION = '2.0.0';

async function nukeCacheAndReload() {
  // Apaga TODOS os caches
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  console.log('[CineVibe] Caches limpos. Recarregando...');
  window.location.reload(true);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {

    // ── 1. Detecta se está rodando versão velha (sem play button etc) ──
    const savedVersion = localStorage.getItem('cv_sw_version');
    if (savedVersion !== SW_VERSION) {
      console.log(`[CineVibe] Versão nova (${SW_VERSION}). Limpando cache antigo...`);
      localStorage.setItem('cv_sw_version', SW_VERSION);

      // Desregistra SW antigo
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));

      // Limpa todos os caches
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));

      // Registra SW novo e recarrega
      await navigator.serviceWorker.register('/sw.js');
      window.location.reload(true);
      return;
    }

    // ── 2. Registro normal ──
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('[CineVibe] SW registrado:', reg.scope);

      // Detecta update disponível
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', async () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Força update silencioso: limpa cache e recarrega
            await nukeCacheAndReload();
          }
        });
      });

      // Checa update a cada vez que o app volta ao foco
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          reg.update();
        }
      });

    } catch (err) {
      console.warn('[CineVibe] SW falhou:', err);
    }
  });
}
