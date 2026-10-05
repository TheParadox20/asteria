import './style.css'
import './read.css'

type ReadingMode = 'single' | 'scroll'
type PageFit = 'width' | 'page'
type ReadingDirection = 'rtl' | 'ltr'
type ReaderState = {
  page: number
  mode: ReadingMode
  fit: PageFit
  direction: ReadingDirection
  zoom: number
  bookmarks: number[]
}
type ReadingPosition = { page: number; fraction: number }

const storageKey = 'asteria-reader-iruma-preview-v1'
const body = document.body
const viewport = document.querySelector<HTMLElement>('#reader-viewport')!
const pages = Array.from(document.querySelectorAll<HTMLElement>('[data-comic-page]'))
const pageCount = pages.length
const overlay = document.querySelector<HTMLDialogElement>('#reader-overlay')!
const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>('.reader-dialog'))
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const state: ReaderState = {
  page: 0,
  mode: 'single',
  fit: 'page',
  direction: 'rtl',
  zoom: 100,
  bookmarks: [],
}

try {
  const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
  if (stored && typeof stored === 'object') {
    const value = stored as Record<string, unknown>
    if (typeof value.page === 'number' && Number.isFinite(value.page)) {
      state.page = clamp(Math.trunc(value.page), 0, pageCount - 1)
    }
    if (Array.isArray(value.bookmarks)) {
      state.bookmarks = [...new Set(value.bookmarks.filter((page): page is number =>
        typeof page === 'number' && Number.isInteger(page) && page >= 0 && page < pageCount,
      ))].sort((a, b) => a - b)
    }
  }
} catch {
  // A reader should also work with corrupt or unavailable browser storage.
}

let statusTimer: number | undefined
let scrollFrame = 0
let layoutFrame = 0
let unlockFrame = 0
let programmaticScroll = false
const dialogInvokers = new WeakMap<HTMLDialogElement, HTMLElement>()
const prefetchedPages = new Set<number>()

function setText(selector: string, value: string) {
  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    element.textContent = value
  })
}

function announce(message: string) {
  const activeDialog = dialogs.find((dialog) => dialog.open) ?? (overlay.open ? overlay : undefined)
  if (activeDialog) {
    const status = activeDialog.querySelector<HTMLElement>('[data-dialog-status]')
    if (status) status.textContent = message
    return
  }
  const status = document.querySelector<HTMLElement>('[data-reader-status]')
  if (!status) return
  window.clearTimeout(statusTimer)
  status.textContent = message
  status.dataset.visible = 'true'
  statusTimer = window.setTimeout(() => {
    delete status.dataset.visible
  }, 3200)
}

function persist(explicit = false): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ page: state.page, bookmarks: state.bookmarks }))
    return true
  } catch {
    if (explicit) announce('Your changes are temporary. This browser could not save your reading progress.')
    return false
  }
}

function pageTop(page: HTMLElement): number {
  return page.getBoundingClientRect().top - viewport.getBoundingClientRect().top
    + viewport.scrollTop - viewport.clientTop
}

function capturePosition(): ReadingPosition {
  const page = pages[state.page]!
  return {
    page: state.page,
    fraction: (viewport.scrollTop - pageTop(page)) / Math.max(1, page.getBoundingClientRect().height),
  }
}

function scrollReader(top: number) {
  programmaticScroll = true
  window.cancelAnimationFrame(unlockFrame)
  viewport.scrollTo({
    top: Math.max(0, top),
    left: Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2),
    behavior: 'instant',
  })
  // Scroll events are asynchronous, including for instant scrolling. Keep them
  // from selecting a different page while a deliberate jump is being applied.
  unlockFrame = window.requestAnimationFrame(() => {
    unlockFrame = window.requestAnimationFrame(() => { programmaticScroll = false })
  })
}

function restorePosition(position: ReadingPosition) {
  const page = pages[position.page]!
  scrollReader(pageTop(page) + position.fraction * page.getBoundingClientRect().height)
}

function updatePageSize(position: ReadingPosition = capturePosition()) {
  const availableWidth = Math.max(100, viewport.clientWidth - (window.innerWidth < 768 ? 0 : 16))
  const availableHeight = Math.max(100, viewport.clientHeight - 16)
  const baseWidth = state.fit === 'page'
    ? Math.min(availableWidth, availableHeight * 1457 / 2250)
    : Math.min(850, availableWidth)
  body.style.setProperty('--reader-page-width', `${Math.max(100, baseWidth) * state.zoom / 100}px`)
  restorePosition(position)
}

function prefetchNextPage() {
  const index = state.page + 1
  if (index >= pageCount || prefetchedPages.has(index)) return
  const source = pages[index]?.querySelector<HTMLImageElement>('[data-page-image]')
  if (!source) return
  prefetchedPages.add(index)
  const image = new Image()
  image.decoding = 'async'
  image.fetchPriority = 'low'
  image.src = source.src
}

function synchronize() {
  body.dataset.mode = state.mode
  body.dataset.fit = state.fit
  body.dataset.direction = state.direction
  body.style.setProperty('--reader-progress', `${((state.page + 1) / pageCount) * 100}%`)

  pages.forEach((page, index) => {
    page.hidden = state.mode === 'single' && index !== state.page
    page.dataset.current = String(index === state.page)
    if (index === state.page) {
      const image = page.querySelector<HTMLImageElement>('[data-page-image]')
      if (image) image.loading = 'eager'
    }
  })

  setText('[data-current-page]', String(state.page + 1))
  setText('[data-reading-status]', `Page ${state.page + 1} of ${pageCount}`)
  setText('[data-bookmark-count]', String(state.bookmarks.length))
  setText('[data-zoom-value]', `${state.zoom}%`)

  document.querySelectorAll<HTMLButtonElement>('[data-prev-page]').forEach((button) => {
    button.disabled = state.page === 0
  })
  document.querySelectorAll<HTMLButtonElement>('[data-next-page]').forEach((button) => {
    button.disabled = state.page === pageCount - 1
  })
  document.querySelectorAll<HTMLInputElement>('[data-page-range]').forEach((input) => {
    input.value = String(state.page + 1)
    input.setAttribute('aria-valuetext', `Page ${state.page + 1} of ${pageCount}`)
    input.style.setProperty('--range-progress', `${(state.page / Math.max(1, pageCount - 1)) * 100}%`)
  })
  document.querySelectorAll<HTMLElement>('[data-go-page]').forEach((button) => {
    const page = Number(button.dataset.goPage)
    if (page === state.page) button.setAttribute('aria-current', 'page')
    else button.removeAttribute('aria-current')
    const marker = button.querySelector<HTMLElement>('[data-thumbnail-bookmark]')
    if (marker) marker.hidden = !state.bookmarks.includes(page)
  })

  const bookmarked = state.bookmarks.includes(state.page)
  document.querySelectorAll<HTMLButtonElement>('[data-bookmark]').forEach((button) => {
    button.setAttribute('aria-pressed', String(bookmarked))
    const label = button.querySelector<HTMLElement>('[data-bookmark-label]')
    const visibleLabel = bookmarked ? 'Page bookmarked' : 'Bookmark page'
    button.setAttribute('aria-label', label
      ? `${visibleLabel}: ${state.page + 1}${bookmarked ? '. Select to remove bookmark' : ''}`
      : `${bookmarked ? 'Remove bookmark from' : 'Bookmark'} page ${state.page + 1}`)
    if (label) label.textContent = visibleLabel
  })
  document.querySelectorAll<HTMLInputElement>('input[name="reading-mode"]').forEach((input) => {
    input.checked = input.value === state.mode
  })
  document.querySelectorAll<HTMLInputElement>('input[name="page-fit"]').forEach((input) => {
    input.checked = input.value === state.fit
  })
  document.querySelectorAll<HTMLInputElement>('input[name="reading-direction"]').forEach((input) => {
    input.checked = input.value === state.direction
  })
  document.querySelectorAll<HTMLInputElement>('[data-zoom-range]').forEach((input) => {
    input.value = String(state.zoom)
    input.setAttribute('aria-valuetext', `${state.zoom} percent`)
  })
  document.querySelectorAll<HTMLButtonElement>('[data-zoom-out]').forEach((button) => {
    button.disabled = state.zoom <= 75
  })
  document.querySelectorAll<HTMLButtonElement>('[data-zoom-in]').forEach((button) => {
    button.disabled = state.zoom >= 200
  })
  prefetchNextPage()
  updateEdgeCursor()
}

function goToPage(index: number, explicit = true) {
  if (!Number.isFinite(index)) return
  const next = clamp(Math.trunc(index), 0, pageCount - 1)
  state.page = next
  synchronize()
  scrollReader(state.mode === 'single' ? 0 : pageTop(pages[next]!))
  persist(explicit)
}

function changeLayout(change: () => void) {
  const position = capturePosition()
  change()
  synchronize()
  updatePageSize(position)
  return persist(true)
}

function setZoom(zoom: number) {
  if (!Number.isFinite(zoom)) return
  changeLayout(() => { state.zoom = clamp(Math.round(zoom / 25) * 25, 75, 200) })
}

function showControls() {
  if (!overlay.open) overlay.showModal()
  updateEdgeCursor()
}

const mouseAvailable = window.matchMedia('(any-hover: hover) and (any-pointer: fine)')
let mouseX: number | null = null

function edgeDestination(x: number) {
  if (overlay.open || !mouseAvailable.matches) return null
  const bounds = viewport.getBoundingClientRect()
  const edgeWidth = bounds.width * 0.25
  const edge = x < bounds.left + edgeWidth ? 'left'
    : x > bounds.right - edgeWidth ? 'right' : null
  if (!edge) return null
  const forward = (edge === 'left') === (state.direction === 'rtl')
  const page = state.page + (forward ? 1 : -1)
  return page >= 0 && page < pageCount ? { edge, page } : null
}

function updateEdgeCursor() {
  const destination = mouseX === null ? null : edgeDestination(mouseX)
  if (destination) viewport.dataset.edge = destination.edge
  else delete viewport.dataset.edge
}

viewport.addEventListener('pointermove', (event) => {
  mouseX = event.pointerType === 'mouse' ? event.clientX : null
  updateEdgeCursor()
})
viewport.addEventListener('pointerleave', () => {
  mouseX = null
  updateEdgeCursor()
})
mouseAvailable.addEventListener('change', updateEdgeCursor)

overlay.addEventListener('close', () => viewport.focus({ preventScroll: true }))
overlay.addEventListener('click', (event) => {
  if (event.target === overlay) overlay.close()
})

// A drag or touch scroll should never be mistaken for a request for controls.
let pointerStart: { x: number; y: number; scrollTop: number; scrollLeft: number; pointerType: string } | null = null
viewport.addEventListener('pointerdown', (event) => {
  pointerStart = event.isPrimary && event.button === 0
    ? { x: event.clientX, y: event.clientY, scrollTop: viewport.scrollTop, scrollLeft: viewport.scrollLeft, pointerType: event.pointerType }
    : null
})
viewport.addEventListener('pointercancel', () => { pointerStart = null })
viewport.addEventListener('click', (event) => {
  if ((event.target as Element).closest('button, a')) return
  const start = pointerStart
  pointerStart = null
  if (event.detail && (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8
    || Math.abs(viewport.scrollTop - start.scrollTop) > 8
    || Math.abs(viewport.scrollLeft - start.scrollLeft) > 8)) return
  const destination = event.detail && start?.pointerType === 'mouse' ? edgeDestination(event.clientX) : null
  if (destination) {
    goToPage(destination.page)
    return
  }
  showControls()
})

function openDialog(id: string, invoker: HTMLElement) {
  const dialog = dialogs.find((item) => item.id === id)
  if (!dialog || dialog.open) return
  dialogs.filter((item) => item.open).forEach((item) => item.close())
  const status = dialog.querySelector<HTMLElement>('[data-dialog-status]')
  if (status) status.textContent = ''
  dialogInvokers.set(dialog, invoker)
  dialog.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((image) => {
    image.loading = 'eager'
  })
  dialog.showModal()
}

dialogs.forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return
    const box = dialog.getBoundingClientRect()
    if (event.clientX < box.left || event.clientX > box.right
      || event.clientY < box.top || event.clientY > box.bottom) dialog.close()
  })
  dialog.addEventListener('close', () => {
    const invoker = dialogInvokers.get(dialog)
    if (invoker?.isConnected && invoker.getClientRects().length > 0) {
      invoker.focus({ preventScroll: true })
    } else {
      if (overlay.open) overlay.querySelector<HTMLButtonElement>('[data-resume-reading]')?.focus()
      else viewport.focus({ preventScroll: true })
    }
  })
})

function toggleBookmark() {
  const bookmarked = state.bookmarks.includes(state.page)
  state.bookmarks = bookmarked
    ? state.bookmarks.filter((page) => page !== state.page)
    : [...state.bookmarks, state.page].sort((a, b) => a - b)
  synchronize()
  const saved = persist()
  announce(`Page ${state.page + 1} ${bookmarked ? 'bookmark removed' : 'bookmarked'}.${saved ? '' : ' Changes are temporary because browser storage is unavailable.'}`)
}

function synchronizeFullscreen() {
  document.querySelectorAll<HTMLButtonElement>('[data-fullscreen]').forEach((button) => {
    const active = Boolean(document.fullscreenElement)
    button.setAttribute('aria-pressed', String(active))
    button.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen')
    if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) {
      button.disabled = true
      button.title = 'Fullscreen is not available in this browser.'
    } else {
      button.disabled = false
      button.title = active ? 'Exit fullscreen' : 'Fullscreen'
    }
  })
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else if (document.fullscreenEnabled && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen()
    } else {
      announce('Fullscreen is not available in this browser.')
    }
  } catch {
    announce('Fullscreen could not be opened in this browser.')
  }
  synchronizeFullscreen()
}

document.addEventListener('fullscreenchange', synchronizeFullscreen)

pages.forEach((page) => {
  const image = page.querySelector<HTMLImageElement>('[data-page-image]')
  if (!image) return
  const primarySource = image.getAttribute('src')!
  const error = page.querySelector<HTMLElement>('.page-image-error')
  let triedFallback = false

  image.addEventListener('load', () => {
    image.hidden = false
    if (error) error.hidden = true
    delete page.dataset.loadError
  })
  image.addEventListener('error', () => {
    const fallback = image.dataset.fallbackSrc
    if (fallback && !triedFallback) {
      triedFallback = true
      image.src = fallback
      return
    }
    image.hidden = true
    if (error) error.hidden = false
    page.dataset.loadError = 'true'
  })
  page.querySelector<HTMLButtonElement>('[data-retry-page]')?.addEventListener('click', () => {
    triedFallback = false
    image.hidden = false
    if (error) error.hidden = true
    delete page.dataset.loadError
    image.src = `${primarySource}?retry=${Date.now()}`
  })
  // Handle a cached failure that happened before this module attached handlers.
  if (image.complete && image.currentSrc && image.naturalWidth === 0) {
    image.dispatchEvent(new Event('error'))
  }
})

document.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const button = target.closest<HTMLElement>('button')
  if (!button || (button instanceof HTMLButtonElement && button.disabled)) return

  if (button.hasAttribute('data-prev-page')) goToPage(state.page - 1)
  else if (button.hasAttribute('data-next-page')) goToPage(state.page + 1)
  else if (button.hasAttribute('data-page-indicator')) openDialog('pages-dialog', button)
  else if (button.dataset.openDialog) openDialog(button.dataset.openDialog, button)
  else if (button.hasAttribute('data-close-dialog')) button.closest('dialog')?.close()
  else if (button.dataset.goPage !== undefined) {
    button.closest('dialog')?.close()
    goToPage(Number(button.dataset.goPage))
  } else if (button.hasAttribute('data-bookmark')) toggleBookmark()
  else if (button.hasAttribute('data-resume-reading')) overlay.close()
  else if (button.hasAttribute('data-zoom-in')) setZoom(state.zoom + 25)
  else if (button.hasAttribute('data-zoom-out')) setZoom(state.zoom - 25)
  else if (button.hasAttribute('data-fullscreen')) void toggleFullscreen()
  else if (button.hasAttribute('data-reset-settings')) {
    const saved = changeLayout(() => {
      state.mode = 'single'
      state.fit = 'page'
      state.direction = 'rtl'
      state.zoom = 100
    })
    // Avoid replacing a storage error with an inaccurate saved-success notice.
    if (saved) announce('Reading settings reset. Your place and bookmarks are kept.')
  }
})

document.addEventListener('input', (event) => {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  if (input.hasAttribute('data-page-range')) goToPage(Number(input.value) - 1)
  else if (input.hasAttribute('data-zoom-range')) setZoom(Number(input.value))
})

document.addEventListener('change', (event) => {
  const input = event.target
  if (!(input instanceof HTMLInputElement) || !input.checked) return
  if (input.name === 'reading-mode' && (input.value === 'single' || input.value === 'scroll')) {
    changeLayout(() => { state.mode = input.value as ReadingMode })
  } else if (input.name === 'page-fit' && (input.value === 'width' || input.value === 'page')) {
    changeLayout(() => { state.fit = input.value as PageFit })
  } else if (input.name === 'reading-direction' && (input.value === 'rtl' || input.value === 'ltr')) {
    state.direction = input.value
    synchronize()
    persist(true)
  }
})

document.addEventListener('keydown', (event) => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (dialogs.some((dialog) => dialog.open)) return
  const target = event.target
  if (target instanceof HTMLElement
    && (target.isContentEditable || target.closest('input, textarea, select, [role="slider"]'))) return

  const rtl = state.direction === 'rtl'
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    goToPage(state.page + (rtl ? 1 : -1))
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    goToPage(state.page + (rtl ? -1 : 1))
  } else if (event.key === 'PageDown' || event.key === 'PageUp') {
    event.preventDefault()
    goToPage(state.page + (event.key === 'PageDown' ? 1 : -1))
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    goToPage(event.key === 'Home' ? 0 : pageCount - 1)
  } else if ((event.key === 'Enter' || event.key === ' ') && event.target === viewport) {
    event.preventDefault()
    showControls()
  }
})

function updatePageFromScroll() {
  scrollFrame = 0
  if (programmaticScroll || state.mode !== 'scroll') return
  const readingLine = viewport.getBoundingClientRect().top + viewport.clientHeight * 0.25
  let closestPage = state.page
  let closestDistance = Number.POSITIVE_INFINITY
  pages.forEach((page, index) => {
    const rect = page.getBoundingClientRect()
    const distance = readingLine < rect.top ? rect.top - readingLine
      : readingLine > rect.bottom ? readingLine - rect.bottom : 0
    if (distance < closestDistance) {
      closestPage = index
      closestDistance = distance
    }
  })
  if (closestPage !== state.page) {
    state.page = closestPage
    synchronize()
    persist()
  }
}

viewport.addEventListener('scroll', () => {
  if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updatePageFromScroll)
}, { passive: true })

const resizeObserver = new ResizeObserver(() => {
  window.cancelAnimationFrame(layoutFrame)
  layoutFrame = window.requestAnimationFrame(() => updatePageSize())
})

synchronize()
synchronizeFullscreen()
updatePageSize({ page: state.page, fraction: 0 })
if (state.mode === 'single') scrollReader(0)
resizeObserver.observe(viewport)

// Persist on ordinary lifecycle changes without introducing navigation prompts.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persist()
})
window.addEventListener('pagehide', () => persist())
