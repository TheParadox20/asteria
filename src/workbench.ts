import './main'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

document.querySelectorAll<HTMLElement>('[data-shelf]').forEach((shelf) => {
  const track = shelf.querySelector<HTMLElement>('[data-shelf-track]')
  if (!track) return

  const previous = shelf.querySelector<HTMLButtonElement>('[data-shelf-prev]')
  const next = shelf.querySelector<HTMLButtonElement>('[data-shelf-next]')
  const controls = shelf.querySelector<HTMLElement>('[data-shelf-controls]')
  let pendingFrame = 0

  const update = () => {
    pendingFrame = 0
    const maximum = Math.max(0, track.scrollWidth - track.clientWidth)
    const overflowing = maximum > 2

    if (controls) controls.hidden = !overflowing
    if (previous) previous.disabled = !overflowing || track.scrollLeft <= 2
    if (next) next.disabled = !overflowing || track.scrollLeft >= maximum - 2
    if (overflowing) track.tabIndex = 0
    else track.removeAttribute('tabindex')
  }

  const scheduleUpdate = () => {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(update)
  }

  const scroll = (direction: number) => {
    const first = track.firstElementChild
    const second = first?.nextElementSibling
    const stride = first && second
      ? second.getBoundingClientRect().left - first.getBoundingClientRect().left
      : track.clientWidth
    const distance = stride > 0
      ? Math.max(1, Math.floor(track.clientWidth / stride)) * stride
      : track.clientWidth

    track.scrollBy({
      left: direction * distance,
      behavior: reducedMotion.matches ? 'instant' : 'smooth',
    })
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
  Array.from(track.children).forEach((card) => resizeObserver.observe(card))
  update()
})
