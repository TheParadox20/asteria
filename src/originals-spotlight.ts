type OriginalSpotlight = {
  title: string
  image: string
  genres: string[]
  chapterNumber: number
  updatedAt: string
  isFeatured: boolean
}

// Placeholder data, kept in display order. Replace with real originals.
const originalsSpotlight: OriginalSpotlight[] = [
  {
    title: 'The Last Bloom',
    image: '/assets/last-bloom-fixed.png',
    genres: ['Romance', 'Fantasy', 'Drama'],
    chapterNumber: 12,
    updatedAt: '2d ago',
    isFeatured: true,
  },
  {
    title: 'Ashes of the Forgotten',
    image: '/assets/ashes.png',
    genres: ['Action', 'Mystery', 'Supernatural'],
    chapterNumber: 12,
    updatedAt: '2d ago',
    isFeatured: false,
  },
  {
    title: "The Painter's Daughter",
    image: '/assets/sono-bisque.png',
    genres: ['Slice of Life', 'Romance', 'Drama'],
    chapterNumber: 12,
    updatedAt: '2d ago',
    isFeatured: false,
  },
  {
    title: 'Between Two Suns',
    image: '/assets/between-two-suns.png',
    genres: ['Fantasy', 'Adventure', 'Drama'],
    chapterNumber: 12,
    updatedAt: '2d ago',
    isFeatured: false,
  },
]

function initOriginalsSpotlight(root: HTMLElement, template: HTMLTemplateElement, originals: OriginalSpotlight[]) {
  const $ = <T extends Element>(parent: ParentNode, sel: string) => parent.querySelector<T>(sel)!
  const list = $<HTMLElement>(root, '[data-originals-list]')

  const cards = originals.map((original) => {
    const card = template.content.firstElementChild!.cloneNode(true) as HTMLElement
    const image = $<HTMLImageElement>(card, '[data-img]')
    image.src = original.image
    image.alt = original.title
    $(card, '[data-title]').textContent = original.title
    $(card, '[data-chapter]').textContent = `Ch. ${original.chapterNumber}`
    $(card, '[data-updated]').textContent = original.updatedAt
    $<HTMLElement>(card, '[data-featured-badge]').hidden = !original.isFeatured
    card.classList.toggle('border', original.isFeatured)
    card.classList.toggle('border-gold/70', original.isFeatured)
    card.classList.toggle('rounded-xl', original.isFeatured)

    const genreTemplate = $<HTMLTemplateElement>(card, '[data-genre-template]')
    const genres = original.genres.map((genre) => {
      const badge = genreTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement
      badge.textContent = genre
      return badge
    })
    $(card, '[data-genres]').replaceChildren(...genres)
    return card
  })

  list.replaceChildren(...cards)
}

const originalsSpotlightSection = document.getElementById('originals-spotlight')
const originalSpotlightTemplate = document.getElementById('original-spotlight-template')
if (originalsSpotlightSection && originalSpotlightTemplate instanceof HTMLTemplateElement) {
  initOriginalsSpotlight(originalsSpotlightSection, originalSpotlightTemplate, originalsSpotlight)
}
