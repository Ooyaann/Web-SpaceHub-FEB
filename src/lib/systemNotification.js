/**
 * Helper Notifikasi Sistem OS (Android Notification Shade, Desktop OS, & iOS PWA)
 * Menggunakan ServiceWorkerRegistration.showNotification() agar tembus ke bar atas HP Android.
 */

let swRegistrationPromise = null;
let deferredInstallPrompt = null;
const installListeners = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installListeners.forEach((cb) => cb(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installListeners.forEach((cb) => cb(false));
  });
}

export function subscribeInstallPrompt(callback) {
  installListeners.add(callback);
  callback(Boolean(deferredInstallPrompt));
  return () => installListeners.delete(callback);
}

export async function promptInstallPwa() {
  if (!deferredInstallPrompt) return false;
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  if (choice?.outcome === 'accepted') {
    deferredInstallPrompt = null;
    installListeners.forEach((cb) => cb(false));
    return true;
  }
  return false;
}

export function isSystemNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getSystemNotificationPermission() {
  if (!isSystemNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function registerSpaceHubServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(() => null);
  }
  return swRegistrationPromise;
}

export async function requestSystemNotificationPermission() {
  if (!isSystemNotificationSupported()) return 'unsupported';
  try {
    // Pastikan Service Worker sudah terdaftar lebih dulu untuk Chrome Android
    await registerSpaceHubServiceWorker();
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return getSystemNotificationPermission();
  }
}

/**
 * Mengirim notifikasi asli ke Panel Notifikasi Sistem HP Android / Desktop OS.
 */
export async function sendSystemNotification({
  title,
  body,
  tag,
  view = 'mine',
} = {}) {
  if (!isSystemNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const safeTag = tag || `spacehub-${Date.now()}`;
  const data = {
    url: `/?view=${encodeURIComponent(view)}`,
    view,
  };

  // Jalur utama: Service Worker (Wajib di Chrome Android agar muncul di Notification Shade HP)
  if ('serviceWorker' in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await registerSpaceHubServiceWorker();
      }
      if (reg && !reg.active && (reg.installing || reg.waiting)) {
        const readyReg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((resolve) => setTimeout(() => resolve(reg), 2000)),
        ]);
        if (readyReg) reg = readyReg;
      }

      if (reg && typeof reg.showNotification === 'function') {
        try {
          await reg.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/badge-96.png',
            vibrate: [120, 60, 120],
            tag: safeTag,
            renotify: true,
            timestamp: Date.now(),
            data,
          });
        } catch {
          await reg.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/badge-96.png',
            tag: safeTag,
            data,
          });
        }
        return true;
      }
    } catch {
      // Lanjut ke fallback Notification konstruktor untuk desktop lama
    }
  }

  // Fallback untuk browser desktop non-SW
  try {
    new Notification(title, {
      body,
      icon: '/icon-192.png',
      tag: safeTag,
    });
    return true;
  } catch {
    return false;
  }
}
