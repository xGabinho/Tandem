'use client'

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })
    return registration
  } catch (error) {
    console.warn('Error al registrar Service Worker:', error)
    return null
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.warn('Error al solicitar permiso de notificación:', error)
    return 'denied'
  }
}

export async function sendMobileNotification(
  title: string,
  options?: {
    body?: string
    icon?: string
    badge?: string
    tag?: string
    data?: { url?: string }
  }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  if (Notification.permission !== 'granted') {
    const perm = await requestNotificationPermission()
    if (perm !== 'granted') return false
  }

  const notificationOptions = {
    body: options?.body || 'Nueva actualización en Tándem',
    icon: options?.icon || '/icons/icon-192.png',
    badge: options?.badge || '/icons/icon-192.png',
    tag: options?.tag || 'tandem-notification',
    data: options?.data || { url: '/' },
  }

  // Si Service Worker está activo, usarlo para compatibilidad en móviles Android PWA
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions)
        return true
      }
    } catch {
      // Fallback a API nativa
    }
  }

  try {
    new Notification(title, notificationOptions)
    return true
  } catch (err) {
    console.warn('Error al disparar notificación:', err)
    return false
  }
}
