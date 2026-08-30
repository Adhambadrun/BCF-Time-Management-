// Browser-based Web Push Notifications Engine for Break Management

let lastNotificationTimestamps: Record<string, number> = {};

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

export interface BreakNotificationPayload {
  agentName: string;
  agentEmail: string;
  teamName?: string;
  breakType: string;
  durationMinutes: number;
  allowedMinutes: number;
  reason?: string;
}

export function sendBreakExceededNotification(payload: BreakNotificationPayload): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const now = Date.now();
  const throttleKey = `${payload.agentEmail}_exceeded`;
  const lastTime = lastNotificationTimestamps[throttleKey] || 0;

  // Throttle notification per agent to once every 2 minutes
  if (now - lastTime < 120_000) {
    return false;
  }

  lastNotificationTimestamps[throttleKey] = now;

  try {
    const title = `🚨 OVERDUE BREAK: ${payload.agentName}`;
    const options: NotificationOptions = {
      body: `${payload.agentName} has been on ${payload.breakType.toUpperCase()} for ${payload.durationMinutes}m (Limit: ${payload.allowedMinutes}m). Immediate supervisor attention required.`,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: `break-overrun-${payload.agentEmail}`,
      requireInteraction: true,
      silent: false,
    };

    const notification = new Notification(title, options);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('Failed to dispatch browser notification:', err);
    return false;
  }
}

export function sendUrgentFloorNotification(title: string, message: string): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const notification = new Notification(title, {
      body: message,
      icon: '/logo.png',
      tag: `floor-alert-${Date.now()}`,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('Failed to send urgent floor notification:', err);
    return false;
  }
}
