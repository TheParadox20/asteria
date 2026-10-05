// --- hero carousel ----------------------------------------------------------

type Slide = {
  eyebrow: string
  title: string
  tagline: string
  image: string
  href: string
}

// Placeholder data: swap in real copy/links.
const slides: Slide[] = [
  {
    eyebrow: '#1 trending this week',
    title: 'Solo Leveling',
    tagline: 'The weak became the strongest. His shadow is just the beginning.',
    image: '/assets/solo_leveling_banner.png',
    href: '#',
  },
  {
    eyebrow: '#2 trending this week',
    title: 'Chainsaw Man',
    tagline: 'A boy, a devil dog and a debt that only blood can pay.',
    image: '/assets/chainsawman.png',
    href: '#',
  },
  {
    eyebrow: 'New chapter',
    title: 'Fire Punch',
    tagline: 'A flame that never goes out and a grudge that burns hotter.',
    image: '/assets/fire-punch.png',
    href: '#',
  },
  {
    eyebrow: 'Asteria original',
    title: 'Between Two Suns',
    tagline: 'Two worlds, one sky, and a choice nobody should have to make.',
    image: '/assets/between-two-suns.png',
    href: '#',
  },
  {
    eyebrow: 'Staff pick',
    title: 'Ashes',
    tagline: 'What survives the fire decides what comes next.',
    image: '/assets/ashes.png',
    href: '#',
  },
]

const AUTOPLAY_MS = 6000
const SWIPE_PX = 40

function initCarousel(root: HTMLElement, template: HTMLTemplateElement, slides: Slide[]) {
  if (!slides.length) return

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const $ = <T extends Element>(parent: ParentNode, sel: string) => parent.querySelector<T>(sel)!
  const track = $<HTMLElement>(root, '[data-track]')
  const dotsEl = $<HTMLElement>(root, '[data-dots]')
  const count = slides.length
  let current = 0
  let hovered = false
  let timer: number | undefined
  let suppressClickUntil = 0
  let gesture: { id: number; x: number; y: number; dragging: boolean } | null = null

  root.tabIndex = 0

  // Each series has one card. Position changes animate together, including
  // wrapping from the last series to the first, without scrolling or clones.
  const slideEls = slides.map((slide, index) => {
    const el = template.content.firstElementChild!.cloneNode(true) as HTMLElement
    const image = $<HTMLImageElement>(el, '[data-img]')
    image.src = slide.image
    image.draggable = false
    $(el, '[data-eyebrow]').textContent = slide.eyebrow
    $(el, '[data-title]').textContent = slide.title
    $(el, '[data-tagline]').textContent = slide.tagline
    $<HTMLAnchorElement>(el, '[data-link]').href = slide.href
    el.dataset.index = String(index)
    el.setAttribute('role', 'group')
    el.setAttribute('aria-label', `${index + 1} of ${count}: ${slide.title}`)
    el.addEventListener('click', () => {
      if (index !== current) goTo(index)
    })
    track.append(el)
    return el
  })

  const dotEls = slides.map((slide, index) => {
    const dot = document.createElement('button')
    dot.type = 'button'
    dot.setAttribute('aria-label', `Go to ${slide.title}`)
    dot.className =
      'h-1.5 w-6 lg:h-0.75 lg:w-4 2xl:h-1.5 2xl:w-6 rounded-full bg-white/20 transition-all duration-300 hover:bg-white/40 aria-pressed:w-8 aria-pressed:lg:w-6 aria-pressed:2xl:w-8 aria-pressed:bg-gold'
    dot.addEventListener('click', () => goTo(index))
    dotsEl.append(dot)
    return dot
  })

  function render() {
    slideEls.forEach((el, index) => {
      let offset = (index - current + count) % count
      if (offset > count / 2) offset -= count
      el.dataset.position = offset === 0 ? 'active'
        : offset === -1 ? 'prev'
        : offset === 1 ? 'next'
        : offset < 0 ? 'before' : 'after'
      el.toggleAttribute('data-active', offset === 0)
      el.setAttribute('aria-hidden', String(offset !== 0))
      $<HTMLElement>(el, '[data-content]').inert = offset !== 0
    })
    dotEls.forEach((dot, index) => dot.setAttribute('aria-pressed', String(index === current)))
  }

  // All pause conditions are checked together, so leaving with the mouse
  // cannot restart playback while keyboard focus is still inside the hero.
  function scheduleAutoplay() {
    clearTimeout(timer)
    const paused = reducedMotion.matches || hovered || root.matches(':focus-within')
      || gesture !== null || document.hidden || count < 2
    track.setAttribute('aria-live', paused ? 'polite' : 'off')
    if (!paused) timer = window.setTimeout(() => goTo(current + 1), AUTOPLAY_MS)
  }

  function goTo(index: number) {
    const next = (index + count) % count
    if (next !== current) {
      // Move focus before hiding a card that contains the focused control.
      if (slideEls[current].contains(document.activeElement)) root.focus({ preventScroll: true })
      current = next
      render()
    }
    scheduleAutoplay()
  }

  $(root, '[data-prev]').addEventListener('click', () => goTo(current - 1))
  $(root, '[data-next]').addEventListener('click', () => goTo(current + 1))
  root.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const target = event.target as HTMLElement
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return
    let next: number
    if (event.key === 'ArrowLeft') next = current - 1
    else if (event.key === 'ArrowRight') next = current + 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = count - 1
    else return
    event.preventDefault()
    goTo(next)
    if (dotsEl.contains(target)) dotEls[current].focus({ preventScroll: true })
  })

  // Horizontal swipes and mouse drags change cards on release. CSS preserves
  // native vertical scrolling and pinch zoom over the hero.
  track.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false }
    scheduleAutoplay()
  })
  window.addEventListener('pointermove', (event) => {
    if (!gesture || event.pointerId !== gesture.id) return
    const dx = event.clientX - gesture.x
    const dy = event.clientY - gesture.y
    if (!gesture.dragging && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
      gesture = null
      scheduleAutoplay()
      return
    }
    if (!gesture.dragging && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      gesture.dragging = true
      track.setPointerCapture(event.pointerId)
      root.setAttribute('data-dragging', '')
    }
  })

  function finishGesture(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.id) return
    const dx = event.clientX - gesture.x
    const dragged = gesture.dragging
    gesture = null
    root.removeAttribute('data-dragging')
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId)
    if (dragged) suppressClickUntil = performance.now() + 500
    if (event.type === 'pointerup' && dragged && Math.abs(dx) >= SWIPE_PX) {
      goTo(current + (dx < 0 ? 1 : -1))
    } else scheduleAutoplay()
  }
  window.addEventListener('pointerup', finishGesture)
  window.addEventListener('pointercancel', finishGesture)
  track.addEventListener('lostpointercapture', (event) => {
    // Touch initially captures the child under the finger; transferring that
    // capture to the track must not cancel the gesture as the event bubbles.
    if (event.target === track) finishGesture(event)
  })
  track.addEventListener('dragstart', (event) => event.preventDefault())
  track.addEventListener('click', (event) => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault()
      event.stopPropagation()
    }
  }, true)

  // A trackpad gesture selects one card, rather than racing through the
  // carousel with every momentum event. Vertical wheel scrolling passes through.
  let wheelDistance = 0
  let wheelHandled = false
  let wheelTimer: number | undefined
  track.addEventListener('wheel', (event) => {
    const dx = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX
    if (!dx || (!event.shiftKey && Math.abs(dx) <= Math.abs(event.deltaY))) return
    event.preventDefault()
    clearTimeout(wheelTimer)
    wheelTimer = window.setTimeout(() => {
      wheelDistance = 0
      wheelHandled = false
    }, 200)
    if (wheelHandled) return
    wheelDistance += dx * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientWidth : 1)
    if (Math.abs(wheelDistance) >= SWIPE_PX) {
      wheelHandled = true
      goTo(current + (wheelDistance > 0 ? 1 : -1))
    }
  }, { passive: false })

  root.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
      hovered = true
      scheduleAutoplay()
    }
  })
  root.addEventListener('pointerleave', () => {
    hovered = false
    scheduleAutoplay()
  })
  root.addEventListener('focusin', scheduleAutoplay)
  root.addEventListener('focusout', () => queueMicrotask(scheduleAutoplay))
  document.addEventListener('visibilitychange', scheduleAutoplay)
  reducedMotion.addEventListener('change', scheduleAutoplay)

  render()
  // Commit the initial layout before enabling transitions to avoid an entrance flash.
  track.getBoundingClientRect()
  root.setAttribute('data-ready', '')
  scheduleAutoplay()
}

const carousel = document.getElementById('hero-carousel')
const slideTemplate = document.getElementById('slide-template')
if (carousel && slideTemplate instanceof HTMLTemplateElement) {
  initCarousel(carousel, slideTemplate, slides)
}
