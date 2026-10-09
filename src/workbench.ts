import './style.css'
import './workbench.css'

type Manga = {
  title: string
  image: string
  format: 'Manga' | 'Manhwa' | 'Original'
  genres: string[]
  note?: string
  position?: string
}

// Workbench sample selections. Replace with the catalog feed when integrating.
const topTen: Manga[] = [
  { title: 'Solo Leveling', image: '/assets/solo-leveling.png', format: 'Manhwa', genres: ['Action', 'Fantasy'] },
  { title: 'Kagurabachi', image: '/assets/kagurabachi-fixed.png', format: 'Manga', genres: ['Action', 'Fantasy'] },
  { title: 'Frieren', image: '/assets/frieren-fixed.png', format: 'Manga', genres: ['Fantasy', 'Adventure'] },
  { title: 'My Dress-Up Darling', image: '/assets/sono-bisque.png', format: 'Manga', genres: ['Romance', 'Comedy'] },
  { title: 'Chainsaw Man', image: '/assets/chainsawman.png', format: 'Manga', genres: ['Action', 'Supernatural'] },
  { title: 'One Punch Man', image: '/assets/one-punch-man.webp', format: 'Manga', genres: ['Action', 'Comedy'] },
  { title: 'Blue Lock', image: '/assets/bluelock.png', format: 'Manga', genres: ['Sports', 'Drama'] },
  { title: 'The Apothecary Diaries', image: '/assets/apothecary.png', format: 'Manga', genres: ['Mystery', 'Drama'] },
  { title: 'The Eminence in Shadow', image: '/assets/kage-fixed.png', format: 'Manga', genres: ['Fantasy', 'Adventure'] },
  { title: 'Welcome to Demon School! Iruma-kun', image: '/assets/iruma-kun-fixed.png', format: 'Manga', genres: ['Fantasy', 'Comedy'] },
]

const essentialReads: Manga[] = [
  {
    title: 'Between Two Suns',
    image: '/assets/originals/between-two-suns.webp',
    format: 'Original',
    genres: ['Fantasy', 'Adventure'],
    note: 'Two worlds share one sky.',
  },
  {
    title: 'Ashes of the Forgotten',
    image: '/assets/originals/ashes.webp',
    format: 'Original',
    genres: ['Action', 'Mystery'],
    note: 'Every memory brings a new enemy.',
  },
  {
    title: 'The Demon Faction',
    image: '/assets/originals/demon-faction.webp',
    format: 'Original',
    genres: ['Action', 'Fantasy'],
    note: 'An unlikely heir. An ancient war.',
  },
  {
    title: 'The Villain’s Second Life',
    image: '/assets/originals/villain.webp',
    format: 'Original',
    genres: ['Fantasy', 'Drama'],
    note: 'A second chance to rewrite his fate.',
  },
  {
    title: 'The Last Bloom',
    image: '/assets/originals/last-bloom.webp',
    format: 'Original',
    genres: ['Romance', 'Fantasy'],
    note: 'Some flowers only bloom once.',
    position: 'center 30%',
  },
]

function renderShelf(root: HTMLElement, template: HTMLTemplateElement, manga: Manga[]) {
  const $ = <T extends Element>(parent: ParentNode, selector: string) => parent.querySelector<T>(selector)!
  const track = $<HTMLElement>(root, '[data-track]')

  const cards = manga.map((item, index) => {
    const card = template.content.firstElementChild!.cloneNode(true) as HTMLElement
    const image = $<HTMLImageElement>(card, '[data-img]')
    image.src = item.image
    // The adjacent heading names the cover, avoiding duplicate announcements.
    image.alt = ''
    image.style.objectPosition = item.position ?? 'center'
    $(card, '[data-title]').textContent = item.title

    const rank = card.querySelector('[data-rank]')
    if (rank) {
      rank.textContent = String(index + 1)
      $(card, '[data-format]').textContent = item.format
      card.setAttribute('aria-label', `Number ${index + 1}: ${item.title}`)
      image.loading = index < 6 ? 'eager' : 'lazy'
    } else {
      $(card, '[data-meta]').textContent = `${item.format} · ${item.genres.join(' · ')}`
      $(card, '[data-note]').textContent = item.note ?? ''
    }
    return card
  })

  track.replaceChildren(...cards)
  initShelfControls(root, track)
}

function initShelfControls(root: HTMLElement, track: HTMLElement) {
  const previous = root.querySelector<HTMLButtonElement>('[data-prev]')!
  const next = root.querySelector<HTMLButtonElement>('[data-next]')!
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  function updateControls() {
    previous.disabled = track.scrollLeft <= 1
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1
  }

  function move(direction: number) {
    const card = track.firstElementChild as HTMLElement | null
    if (!card) return
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0
    const step = card.getBoundingClientRect().width + gap
    const visibleCards = Math.max(1, Math.floor(track.clientWidth / step))
    track.scrollBy({ left: direction * visibleCards * step, behavior: reducedMotion.matches ? 'instant' : 'smooth' })
  }

  previous.addEventListener('click', () => move(-1))
  next.addEventListener('click', () => move(1))
  track.addEventListener('scroll', updateControls, { passive: true })
  track.addEventListener('keydown', (event) => {
    if (event.target !== track || event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      move(event.key === 'ArrowLeft' ? -1 : 1)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      track.scrollTo({ left: event.key === 'Home' ? 0 : track.scrollWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' })
    }
  })

  const resizeObserver = new ResizeObserver(updateControls)
  resizeObserver.observe(track)
  updateControls()
}

const shelves = [
  { id: 'top-ten', template: 'ranked-card-template', items: topTen },
  { id: 'essential-reads', template: 'featured-card-template', items: essentialReads },
]

shelves.forEach(({ id, template, items }) => {
  const root = document.getElementById(id)
  const cardTemplate = document.getElementById(template)
  if (root && cardTemplate instanceof HTMLTemplateElement) renderShelf(root, cardTemplate, items)
})
