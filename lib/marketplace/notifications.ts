// Notification sound + Browser Notification API utilities

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

let audioCache: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audioCache) {
    audioCache = new Audio(NOTIFICATION_SOUND_URL);
    audioCache.volume = 0.5;
  }
  return audioCache;
}

export function playNotificationSound() {
  try {
    const audio = getAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Browser blocked autoplay — ignore silently
    });
  } catch {
    // Audio not supported
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showBrowserNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    setTimeout(() => n.close(), 8000);
  } catch {
    // Notification API failed
  }
}

/** Play sound + show browser notification together */
export function notify(title: string, body: string) {
  playNotificationSound();
  showBrowserNotification(title, body);
}
