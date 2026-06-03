// ============================================================
//  CineVibe – Service Worker Registration
// ============================================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[CineVibe] SW registered:', reg.scope);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available — show toast
              setTimeout(() => {
                UI.toast('🎬 Nova versão disponível! Recarregue.', 'success');
              }, 2000);
            }
          });
        });
      })
      .catch(err => console.warn('[CineVibe] SW failed:', err));
  });
}
