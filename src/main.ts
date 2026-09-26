import './style.css'

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

function initCarousel(root: HTMLElement, template: HTMLTemplateElement, slides: Slide[]) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const $ = <T extends Element>(parent: ParentNode, sel: string) => parent.querySelector<T>(sel)!

  const track = $<HTMLElement>(root, '[data-track]')
  const dotsEl = $<HTMLElement>(root, '[data-dots]')

  // --- render ---------------------------------------------------------------
  // Infinite loop: a copy of the last slide sits before the first and a copy of
  // the first after the last, so both ends always have a neighbour peeking in.
  // Landing on a copy instantly jumps to its real twin (see `settle`).
  //   [ copy of n-1 ] [ 0 ] [ 1 ] … [ n-1 ] [ copy of 0 ]
  const n = slides.length

  function renderSlide(s: Slide, i: number, isClone = false) {
    const el = template.content.firstElementChild!.cloneNode(true) as HTMLElement
    $<HTMLImageElement>(el, '[data-img]').src = s.image
    $(el, '[data-eyebrow]').textContent = s.eyebrow
    $(el, '[data-title]').textContent = s.title
    $(el, '[data-tagline]').textContent = s.tagline
    $<HTMLAnchorElement>(el, '[data-link]').href = s.href
    el.dataset.index = String(i)
    if (isClone) el.setAttribute('aria-hidden', 'true')
    else el.setAttribute('aria-label', `${i + 1} of ${n}: ${s.title}`)
    // clicking a peeking slide brings it to the centre
    el.addEventListener('click', () => el !== slideEls[centred] && scrollToSlide(el))
    track.append(el)
    return el
  }

  const slideEls = [
    renderSlide(slides[n - 1], n - 1, true),
    ...slides.map((s, i) => renderSlide(s, i)),
    renderSlide(slides[0], 0, true),
  ]

  const dotEls = slides.map((s, i) => {
    const dot = document.createElement('button')
    dot.type = 'button'
    dot.setAttribute('role', 'tab')
    dot.setAttribute('aria-label', `Go to ${s.title}`)
    dot.className =
      'h-1.5 w-6 rounded-full bg-white/20 transition-all duration-300 hover:bg-white/40 aria-selected:w-8 aria-selected:bg-gold'
    dot.addEventListener('click', () => goTo(i))
    dotsEl.append(dot)
    return dot
  })

  // --- state ----------------------------------------------------------------
  let current = -1 // real slide index (0…n-1): drives dots and styling
  let centred = 1 // position in slideEls of the slide in the middle (copies included)

  // Marks every element showing slide `i` — a copy and its twin look identical,
  // so the jump between them is invisible (no opacity/scale transition).
  function setActive(i: number) {
    if (i === current) return
    current = i
    slideEls.forEach((el) => {
      const active = Number(el.dataset.index) === i
      el.toggleAttribute('data-active', active)
      // keeps keyboard/screen-reader users out of the peeking slides' buttons
      // (and out of the copies entirely), while the slide itself stays clickable
      $<HTMLElement>(el, '[data-content]').inert = !active || el.hasAttribute('aria-hidden')
    })
    dotEls.forEach((d, j) => d.setAttribute('aria-selected', String(j === i)))
  }

  function scrollToSlide(el: HTMLElement, behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth') {
    track.scrollTo({ left: el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2, behavior })
  }

  // Arrows/keys/autoplay step from whatever is centred, so "next" on the last
  // slide goes to the copy of the first rather than rewinding across the track.
  const step = (delta: number) => scrollToSlide(slideEls[Math.max(0, Math.min(n + 1, centred + delta))])
  // Dots jump straight to a real slide.
  const goTo = (i: number) => scrollToSlide(slideEls[i + 1])

  // Whichever slide is closest to the track's centre is the active one.
  // Driven by scroll so swipes, trackpads, arrows and dots all stay in sync.
  function syncFromScroll() {
    const centre = track.scrollLeft + track.clientWidth / 2
    let bestDist = Infinity
    slideEls.forEach((el, j) => {
      const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - centre)
      if (dist < bestDist) [centred, bestDist] = [j, dist]
    })
    setActive(Number(slideEls[centred].dataset.index))
  }

  // Once scrolling stops on a copy, swap to its real twin without animating.
  function settle() {
    syncFromScroll()
    if (centred === 0) scrollToSlide(slideEls[n], 'instant')
    else if (centred === n + 1) scrollToSlide(slideEls[1], 'instant')
  }

  let ticking = false
  let settleTimer: number | undefined
  track.addEventListener(
    'scroll',
    () => {
      if (!('onscrollend' in window)) {
        // older Safari has no `scrollend`: settle once scrolling goes quiet
        clearTimeout(settleTimer)
        settleTimer = setTimeout(settle, 120)
      }
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        syncFromScroll()
        ticking = false
      })
    },
    { passive: true },
  )
  track.addEventListener('scrollend', settle)
  addEventListener('resize', () => scrollToSlide(slideEls[current + 1], 'instant'))

  // --- controls -------------------------------------------------------------
  $(root, '[data-prev]').addEventListener('click', () => step(-1))
  $(root, '[data-next]').addEventListener('click', () => step(1))

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') step(-1)
    if (e.key === 'ArrowRight') step(1)
  })

  // --- autoplay (pauses on hover/focus, off for reduced motion) --------------
  let timer: number | undefined
  const play = () => {
    if (reduceMotion) return
    clearInterval(timer)
    timer = setInterval(() => step(1), AUTOPLAY_MS)
  }
  const pause = () => clearInterval(timer)
  root.addEventListener('mouseenter', pause)
  root.addEventListener('mouseleave', play)
  root.addEventListener('focusin', pause)
  root.addEventListener('focusout', play)
  track.addEventListener('pointerdown', pause)

  // start on the real first slide, with the copy of the last peeking on the left
  scrollToSlide(slideEls[1], 'instant')
  syncFromScroll()
  play()
}

const carousel = document.getElementById('hero-carousel')
const slideTemplate = document.getElementById('slide-template')
if (carousel && slideTemplate instanceof HTMLTemplateElement) {
  initCarousel(carousel, slideTemplate, slides)
}
