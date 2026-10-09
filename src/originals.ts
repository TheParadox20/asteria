import './style.css'
import './originals.css'

type Genre = 'Fantasy' | 'Romance' | 'Action' | 'Drama' | 'Mystery' | 'Adventure'
type Series = {
  id: string
  title: string
  creator: string
  genres: Genre[]
  description: string
  chapters: number
  likes: number
}

// Demonstration catalog. Replace these records with the published originals feed.
const series: Series[] = [
  {
    id: 'between-two-suns',
    title: 'Between Two Suns',
    creator: 'Elian Voss',
    genres: ['Fantasy', 'Adventure', 'Drama'],
    description: 'Two worlds share one sky. When a forgotten star begins to wake, a young wanderer must choose between the home she knows and the world only she can save.',
    chapters: 24,
    likes: 2400,
  },
  {
    id: 'ashes',
    title: 'Ashes of the Forgotten',
    creator: 'Ren Akari',
    genres: ['Action', 'Mystery', 'Fantasy'],
    description: 'In a city built over its own forgotten history, a survivor discovers that the fires of the past never truly went out. Every memory recovered brings a new enemy closer.',
    chapters: 18,
    likes: 1800,
  },
  {
    id: 'last-bloom',
    title: 'The Last Bloom',
    creator: 'Mira Kade',
    genres: ['Romance', 'Fantasy', 'Drama'],
    description: 'Some flowers only bloom once. In a world slowly losing its color, one girl discovers a garden that remembers everything, including a love she thought she had forgotten.',
    chapters: 12,
    likes: 3200,
  },
  {
    id: 'painters-daughter',
    title: 'The Painter’s Daughter',
    creator: 'Yuna Mori',
    genres: ['Romance', 'Drama'],
    description: 'An unfinished portrait. A summer away from home. As a young artist retraces her father’s footsteps, she discovers a new way to see the world, and someone worth painting into it.',
    chapters: 16,
    likes: 1600,
  },
  {
    id: 'demon-faction',
    title: 'The Demon Faction',
    creator: 'Kai Sora',
    genres: ['Action', 'Fantasy'],
    description: 'Born on the wrong side of an ancient war, an unlikely heir joins the faction everyone fears. To bring the divided kingdoms together, he must first survive his own allies.',
    chapters: 32,
    likes: 2900,
  },
  {
    id: 'glutton-king',
    title: 'The Glutton King',
    creator: 'Theo Park',
    genres: ['Fantasy', 'Adventure', 'Action'],
    description: 'A hungry adventurer inherits a kingdom nobody wants. With an unusual gift and an even stranger group of companions, he sets out to turn a forgotten realm into a place worth calling home.',
    chapters: 21,
    likes: 2100,
  },
  {
    id: 'villain',
    title: 'The Villain’s Second Life',
    creator: 'Sena Moon',
    genres: ['Fantasy', 'Drama', 'Action'],
    description: 'He knows how the story ends. Given one more chance to live it, a fallen villain must decide whether to rewrite his fate or become the hero the world never expected.',
    chapters: 28,
    likes: 2700,
  },
]

const catalog = new Map(series.map((item) => [item.id, item]))
const imagePath = (item: Series) => `/assets/originals/${item.id}.webp`
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const storageKey = 'asteria-originals-library-v1'
const saved = new Set<string>()
const liked = new Set<string>()

function isStoredIds(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === 'string' && catalog.has(id))
}

try {
  const raw = localStorage.getItem(storageKey)
  if (raw) {
    const state: unknown = JSON.parse(raw)
    if (state && typeof state === 'object' && 'saved' in state && 'liked' in state
      && isStoredIds(state.saved) && isStoredIds(state.liked)) {
      state.saved.forEach((id) => saved.add(id))
      state.liked.forEach((id) => liked.add(id))
    }
  }
} catch {
  // Storage can be unavailable in private or restricted browsing contexts.
}

function persist(): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ saved: [...saved], liked: [...liked] }))
    return true
  } catch {
    return false
  }
}

let toastTimer: number | undefined
function announce(message: string) {
  if (dialog?.open) {
    setText('[data-dialog-status]', message, dialog)
    return
  }
  const toast = document.querySelector<HTMLElement>('[data-toast]')
  if (!toast) return
  window.clearTimeout(toastTimer)
  toast.textContent = message
  toast.hidden = false
  toast.dataset.visible = 'true'
  toastTimer = window.setTimeout(() => {
    delete toast.dataset.visible
    toast.hidden = true
  }, 3500)
}

function setText(selector: string, value: string, root: ParentNode = document) {
  const element = root.querySelector(selector)
  if (element) element.textContent = value
}

const likeFormatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

function synchronizeState() {
  document.querySelectorAll<HTMLButtonElement>('[data-save-series]').forEach((button) => {
    const item = catalog.get(button.dataset.saveSeries ?? '')
    if (!item) return
    const active = saved.has(item.id)
    button.setAttribute('aria-pressed', String(active))
    const label = active ? 'In your library' : 'Add to library'
    button.setAttribute('aria-label', button.querySelector('[data-save-label]')
      ? `${label}: ${item.title}${active ? '. Select to remove' : ''}`
      : `${active ? 'Remove' : 'Add'} ${item.title} ${active ? 'from' : 'to'} your library`)
    setText('[data-save-label]', label, button)
  })
  document.querySelectorAll<HTMLButtonElement>('[data-like-series]').forEach((button) => {
    const item = catalog.get(button.dataset.likeSeries ?? '')
    if (!item) return
    const active = liked.has(item.id)
    button.setAttribute('aria-pressed', String(active))
    const total = item.likes + Number(active)
    const formattedTotal = likeFormatter.format(total)
    button.setAttribute('aria-label', `${active ? 'Unlike' : 'Like'} ${item.title}, ${formattedTotal} likes`)
    button.title = `${total.toLocaleString('en')} likes`
    setText('[data-like-count]', formattedTotal, button)
  })
  const count = document.querySelector<HTMLElement>('[data-library-count]')
  if (count) {
    count.textContent = String(saved.size)
    count.hidden = saved.size === 0
  }
  document.querySelector('[data-library-toggle]')?.setAttribute('aria-label', saved.size
    ? `My library, ${saved.size} saved ${saved.size === 1 ? 'story' : 'stories'}`
    : 'My library')
}

const cardTemplate = document.querySelector<HTMLTemplateElement>('#original-series-card-template')!

function createCard(item: Series): HTMLElement {
  const card = cardTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement
  const image = card.querySelector<HTMLImageElement>('[data-img]')!
  image.src = imagePath(item)
  image.alt = item.title

  card.querySelectorAll<HTMLButtonElement>('[data-open-series]').forEach((button) => {
    button.dataset.openSeries = item.id
  })
  card.querySelector('[data-open-series]')!.setAttribute('aria-label', `Explore series: ${item.title}`)
  setText('[data-title]', item.title, card)
  setText('[data-genres]', item.genres.slice(0, 2).join(' · '), card)
  setText('[data-chapters]', `${item.chapters} chapters`, card)
  card.querySelector<HTMLButtonElement>('[data-like-series]')!.dataset.likeSeries = item.id
  return card
}

document.querySelector('[data-popular-track]')?.replaceChildren(...series.map(createCard))
const newOrder = ['last-bloom', 'painters-daughter', 'villain', 'between-two-suns', 'ashes', 'demon-faction', 'glutton-king']
document.querySelector('[data-new-track]')?.replaceChildren(...newOrder.map((id) => createCard(catalog.get(id)!)))

let selectedGenre = 'All'
let libraryOnly = false
const searchInput = document.querySelector<HTMLInputElement>('[data-catalog-search]')

function renderCatalog() {
  const query = searchInput?.value.trim().toLocaleLowerCase() ?? ''
  const results = series.filter((item) => (!libraryOnly || saved.has(item.id))
    && (selectedGenre === 'All' || item.genres.some((genre) => genre === selectedGenre))
    && `${item.title} ${item.creator} ${item.genres.join(' ')}`.toLocaleLowerCase().includes(query))
  document.querySelector('[data-catalog-grid]')?.replaceChildren(...results.map(createCard))
  setText('[data-catalog-count]', `${results.length} ${results.length === 1 ? 'story' : 'stories'}`)
  setText('[data-catalog-title]', libraryOnly ? 'Your library' : 'Find your next favorite')
  const empty = document.querySelector<HTMLElement>('[data-catalog-empty]')
  if (empty) empty.hidden = results.length > 0
  document.querySelector('[data-library-toggle]')?.setAttribute('aria-pressed', String(libraryOnly))
  document.querySelectorAll<HTMLButtonElement>('[data-genre-filters] [data-genre]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.genre === selectedGenre))
  })
  synchronizeState()
}

searchInput?.addEventListener('input', renderCatalog)
document.querySelector('[data-genre-filters]')?.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-genre]')
  if (!button) return
  selectedGenre = button.dataset.genre ?? 'All'
  renderCatalog()
})
document.querySelector('[data-library-toggle]')?.addEventListener('click', () => {
  libraryOnly = !libraryOnly
  selectedGenre = 'All'
  if (searchInput) searchInput.value = ''
  renderCatalog()
  document.getElementById('collection')?.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' })
})
document.querySelector('[data-reset-filters]')?.addEventListener('click', () => {
  libraryOnly = false
  selectedGenre = 'All'
  if (searchInput) searchInput.value = ''
  renderCatalog()
  searchInput?.focus({ preventScroll: true })
})

const dialog = document.querySelector<HTMLDialogElement>('#series-dialog')
let dialogInvoker: HTMLElement | null = null

function openSeries(item: Series, invoker: HTMLElement) {
  if (!dialog) return
  setText('[data-dialog-status]', '', dialog)
  dialogInvoker = invoker
  const image = dialog.querySelector<HTMLImageElement>('[data-dialog-image]')
  if (image) {
    image.src = imagePath(item)
    image.alt = item.title
  }
  setText('#series-dialog-title', item.title, dialog)
  setText('[data-dialog-creator]', `By ${item.creator}`, dialog)
  setText('[data-dialog-genres]', item.genres.join(' · '), dialog)
  setText('[data-dialog-description]', item.description, dialog)
  setText('[data-dialog-chapters]', `${item.chapters} chapters`, dialog)
  const save = dialog.querySelector<HTMLButtonElement>('[data-dialog-save]')
  const like = dialog.querySelector<HTMLButtonElement>('[data-dialog-like]')
  if (save) save.dataset.saveSeries = item.id
  if (like) like.dataset.likeSeries = item.id
  synchronizeState()
  document.body.classList.add('dialog-open')
  if (!dialog.open) dialog.showModal()
}

dialog?.querySelector('[data-dialog-close]')?.addEventListener('click', () => dialog.close())
dialog?.addEventListener('click', (event) => {
  if (event.target !== dialog) return
  const rect = dialog.getBoundingClientRect()
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
    dialog.close()
  }
})
dialog?.addEventListener('close', () => {
  document.body.classList.remove('dialog-open')
  const focusTarget = dialogInvoker?.isConnected
    ? dialogInvoker
    : searchInput ?? document.querySelector<HTMLButtonElement>('[data-library-toggle]')
  focusTarget?.focus({ preventScroll: true })
  dialogInvoker = null
})

document.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const open = target.closest<HTMLElement>('[data-open-series]')
  if (open) {
    const item = catalog.get(open.dataset.openSeries ?? '')
    if (item) openSeries(item, open)
    return
  }
  const save = target.closest<HTMLButtonElement>('[data-save-series]')
  if (save) {
    const item = catalog.get(save.dataset.saveSeries ?? '')
    if (!item) return
    const removing = saved.has(item.id)
    if (removing) saved.delete(item.id)
    else saved.add(item.id)
    const persisted = persist()
    synchronizeState()
    if (libraryOnly) renderCatalog()
    announce(removing
      ? `${item.title} removed${persisted ? ' from your library' : ' for this visit'}.`
      : persisted ? `${item.title} added to your library.` : 'Saved for this visit. Your browser could not store this change.')
    return
  }
  const like = target.closest<HTMLButtonElement>('[data-like-series]')
  if (like) {
    const id = like.dataset.likeSeries ?? ''
    if (!catalog.has(id)) return
    if (liked.has(id)) liked.delete(id)
    else liked.add(id)
    if (!persist()) announce('Preference updated for this visit. Your browser could not store this change.')
    synchronizeState()
  }
})

const hero = document.querySelector<HTMLElement>('[data-hero]')
const heroSlides = ['between-two-suns', 'ashes', 'villain'].map((id) => catalog.get(id)!)
const heroDescriptions: Record<string, string> = {
  'between-two-suns': 'Two worlds. One shared sky. A girl caught between them must decide where she belongs.',
  ashes: 'A city built on secrets. A survivor with no past. Some memories are better left buried.',
  villain: 'He knows how this story ends. This time, the villain is writing his own fate.',
}
const heroDotTemplate = document.querySelector<HTMLTemplateElement>('#original-hero-dot-template')!
let currentSlide = 0
const dots = heroSlides.map((item, index) => {
  const button = heroDotTemplate.content.firstElementChild!.cloneNode(true) as HTMLButtonElement
  button.setAttribute('aria-label', `Show ${item.title}`)
  button.addEventListener('click', () => showHero(index))
  button.addEventListener('keydown', (event) => {
    let next = index
    if (event.key === 'ArrowLeft') next = (index - 1 + heroSlides.length) % heroSlides.length
    else if (event.key === 'ArrowRight') next = (index + 1) % heroSlides.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = heroSlides.length - 1
    else return
    event.preventDefault()
    showHero(next)
    dots[next].focus()
  })
  return button
})
document.querySelector('[data-hero-dots]')?.replaceChildren(...dots)

function showHero(index: number) {
  currentSlide = (index + heroSlides.length) % heroSlides.length
  const item = heroSlides[currentSlide]
  const image = document.querySelector<HTMLImageElement>('[data-hero-image]')
  if (image) {
    image.src = imagePath(item)
    image.alt = `${item.title} artwork`
  }
  setText('[data-hero-title]', item.title)
  setText('[data-hero-genres]', item.genres.join(' · '))
  setText('[data-hero-description]', heroDescriptions[item.id])
  const open = document.querySelector<HTMLElement>('[data-hero-open]')
  const save = document.querySelector<HTMLElement>('[data-hero-save]')
  if (open) open.dataset.openSeries = item.id
  if (save) save.dataset.saveSeries = item.id
  dots.forEach((dot, position) => dot.setAttribute('aria-pressed', String(position === currentSlide)))
  if (hero) hero.dataset.slide = item.id
  synchronizeState()
}

document.querySelector('[data-hero-prev]')?.addEventListener('click', () => showHero(currentSlide - 1))
document.querySelector('[data-hero-next]')?.addEventListener('click', () => showHero(currentSlide + 1))
let swipeStart: { x: number; y: number; pointerId: number } | null = null
hero?.addEventListener('pointerdown', (event) => {
  if ((event.target as Element).closest('button, a, input') || !event.isPrimary) return
  swipeStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
})
hero?.addEventListener('pointerup', (event) => {
  if (!swipeStart || event.pointerId !== swipeStart.pointerId) return
  const x = event.clientX - swipeStart.x
  const y = event.clientY - swipeStart.y
  swipeStart = null
  if (Math.abs(x) > 50 && Math.abs(x) > Math.abs(y) * 1.5) showHero(currentSlide + (x < 0 ? 1 : -1))
})
hero?.addEventListener('pointercancel', () => { swipeStart = null })

document.querySelectorAll<HTMLElement>('[data-shelf]').forEach((shelf) => {
  const track = shelf.querySelector<HTMLElement>('[data-popular-track], [data-new-track]')
  if (!track) return
  const previous = shelf.querySelector<HTMLButtonElement>('[data-shelf-prev]')
  const next = shelf.querySelector<HTMLButtonElement>('[data-shelf-next]')
  const controls = shelf.querySelector<HTMLElement>('[data-shelf-controls]')
  let pending = false
  const update = () => {
    pending = false
    const maximum = track.scrollWidth - track.clientWidth
    const overflowing = maximum > 2
    if (controls) controls.hidden = !overflowing
    if (previous) previous.disabled = !overflowing || track.scrollLeft <= 2
    if (next) next.disabled = !overflowing || track.scrollLeft >= maximum - 2
    if (overflowing) track.tabIndex = 0
    else track.removeAttribute('tabindex')
  }
  const scheduleUpdate = () => {
    if (pending) return
    pending = true
    requestAnimationFrame(update)
  }
  const scroll = (direction: number) => {
    const first = track.firstElementChild
    const second = first?.nextElementSibling
    const stride = first && second ? second.getBoundingClientRect().left - first.getBoundingClientRect().left : track.clientWidth
    const distance = stride > 0 ? Math.max(1, Math.floor(track.clientWidth / stride)) * stride : track.clientWidth
    track.scrollBy({ left: direction * distance, behavior: reducedMotion.matches ? 'instant' : 'smooth' })
  }
  previous?.addEventListener('click', () => scroll(-1))
  next?.addEventListener('click', () => scroll(1))
  track.addEventListener('scroll', scheduleUpdate, { passive: true })
  track.addEventListener('keydown', (event) => {
    if (event.target !== track || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    if (track.scrollWidth - track.clientWidth <= 2) return
    event.preventDefault()
    scroll(event.key === 'ArrowLeft' ? -1 : 1)
  })
  const resizeObserver = new ResizeObserver(scheduleUpdate)
  resizeObserver.observe(track)
  if (track.firstElementChild) resizeObserver.observe(track.firstElementChild)
  update()
})

showHero(0)
renderCatalog()
