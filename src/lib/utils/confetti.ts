import confetti from 'canvas-confetti'

export function triggerCelebrationConfetti() {
  // Fire multiple bursts for maximum celebration feel
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#6366f1', '#ec4899', '#10b981'],
  })
  fire(0.2, {
    spread: 60,
    colors: ['#f59e0b', '#3b82f6', '#8b5cf6'],
  })
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

export function triggerSubtleConfetti() {
  confetti({
    particleCount: 50,
    spread: 70,
    origin: { y: 0.6 },
    zIndex: 9999,
    colors: ['#6366f1', '#10b981', '#f59e0b'],
  })
}
