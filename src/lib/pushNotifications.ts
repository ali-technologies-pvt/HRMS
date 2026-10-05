// Desktop / Laptop OS Native Push Notification Utility using Web Notifications API

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

export function sendDesktopPushNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notif = new Notification(title, {
      body: options?.body || '',
      icon: options?.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: options?.tag,
      silent: false
    });

    notif.onclick = () => {
      window.focus();
      if (options?.onClick) options.onClick();
      notif.close();
    };

    return notif;
  } catch (err) {
    console.error('Error dispatching desktop push notification:', err);
    return null;
  }
}
