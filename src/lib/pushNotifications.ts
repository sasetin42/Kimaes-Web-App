// Service Worker Push Notification Helper for Order Status Alerts
import { toast } from 'sonner';

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Registers the Service Worker on application startup
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Checks current notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Requests user permission for Push Notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    toast.error('Push notifications are not supported in this browser.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Push notifications enabled! You will receive live alerts for your bilao orders.');
      // Ensure service worker is registered
      await registerServiceWorker();
      return true;
    } else {
      toast.info('Notifications were not enabled. You can enable them anytime in browser settings.');
      return false;
    }
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return false;
  }
}

/**
 * Sends a service worker push notification alerting the customer
 * when order status changes to 'Out for Delivery' or 'Ready for Pickup'
 */
export async function sendOrderStatusPushNotification(
  orderNumber: string,
  newStatus: string,
  deliveryMethod: 'delivery' | 'pickup' = 'delivery'
): Promise<void> {
  const isDelivery = deliveryMethod === 'delivery';

  let title = '';
  let body = '';

  if (newStatus === 'out_for_delivery') {
    title = "🛵 Kimae's Order Out for Delivery!";
    body = `Great news! Your party bilao order #${orderNumber} is now out for delivery. Rider is on the way to your address!`;
  } else if (newStatus === 'ready') {
    if (isDelivery) {
      title = "🍱 Order Cooked & Plated!";
      body = `Your bilao order #${orderNumber} is freshly cooked and packed! Rider will pick it up shortly.`;
    } else {
      title = "🎉 Ready for Pickup at Kimae's!";
      body = `Your party bilao order #${orderNumber} is freshly prepared and ready for pickup at our Dasmariñas, Cavite store!`;
    }
  } else if (newStatus === 'completed') {
    title = "⭐ Order Completed! Maraming Salamat!";
    body = `Order #${orderNumber} has been delivered. Points have been credited to your Salo-Salo Rewards account!`;
  } else {
    // Other statuses don't trigger push notification alert unless configured
    return;
  }

  // 1. Trigger Service Worker Notification
  if ('serviceWorker' in navigator && Notification.permission === 'granted') {
    try {
      const reg = swRegistration || (await navigator.serviceWorker.ready);
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          data: {
            url: `/track?order=${orderNumber}`,
            orderNumber,
          },
        });
      } else if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_ORDER_NOTIFICATION',
          title,
          options: {
            body,
            data: { url: `/track?order=${orderNumber}`, orderNumber },
          },
        });
      }
    } catch (err) {
      console.warn('Failed to send service worker push notification:', err);
    }
  }

  // 2. Also dispatch in-app rich toast alert so user sees it in active window
  if (newStatus === 'out_for_delivery') {
    toast.success(body, {
      duration: 8000,
      description: 'Track your live rider on the order tracking page.',
    });
  } else if (newStatus === 'ready') {
    toast.success(body, {
      duration: 8000,
      description: isDelivery ? 'Dispatched soon!' : 'Present your order number at the counter.',
    });
  }
}
