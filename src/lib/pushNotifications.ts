// Desktop / Laptop OS Native Push Notification Utility using Web Notifications API & Service Worker

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export async function sendDesktopPushNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    onClick?: () => void;
  }
): Promise<Notification | boolean | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;

  // If permission is not granted, skip dispatch (user has to grant via prompt)
  if (Notification.permission !== 'granted') return null;

  const notifOptions: NotificationOptions = {
    body: options?.body || '',
    icon: options?.icon || '/icons/icon-192.png',
    badge: options?.badge || '/icons/icon-192.png',
    tag: options?.tag || 'quickslogx-chat-notice',
    silent: false,
    requireInteraction: false,
    data: options?.data || {}
  };

  // 1. Try ServiceWorkerRegistration.showNotification first
  // This is vital for backgrounded/minimized tabs and PWA installed instances
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, notifOptions);
        return true;
      }
    } catch {
      // Fall through to standard window Notification
    }
  }

  // 2. Fallback to classic desktop window Notification
  try {
    const notif = new Notification(title, notifOptions);
    notif.onclick = () => {
      try {
        window.focus();
      } catch {}
      if (options?.onClick) options.onClick();
      notif.close();
    };
    return notif;
  } catch (err) {
    console.warn('Desktop Notification dispatch failed:', err);
    return null;
  }
}
