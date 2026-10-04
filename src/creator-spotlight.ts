type CreatorWork = {
  title: string
  image: string
  genres: string[]
  views: string
}

type Creator = {
  name: string
  image: string
  tagline: string
  taglineHighlight: string
  bio: string
  workCount: number
  followers: string
  averageViews: string
  works: CreatorWork[]
}

// Placeholder data, keyed by the creator ID used by each spotlight host.
const creators: Record<string, Creator> = {
  'tatsuki-fujimoto': {
    name: 'Tatsuki Fujimoto',
    image: '/assets/tatsuki-fujimoto.png',
    tagline: 'Mind-bending stories.',
    taglineHighlight: 'Unforgettable characters',
    bio: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Eos sit quam ab eveniet architecto, dolores quibusdam, quod totam temporibus expedita sapiente reiciendis tempore perspiciatis natus, cupiditate veli',
    workCount: 6,
    followers: '24.5K',
    averageViews: '4.8',
    works: [
      {
        title: 'chainsaw man',
        image: '/assets/chainsawman.png',
        genres: ['Action', 'Comedy'],
        views: '125.4K',
      },
      {
        title: 'fire punch',
        image: '/assets/fire-punch.png',
        genres: ['Action', 'Comedy'],
        views: '98.7K',
      },
      {
        title: 'look back',
        image: '/assets/look-back-fixed.png',
        genres: ['Action', 'Comedy'],
        views: '76.3K',
      },
    ],
  },
}

function initCreatorSpotlight(host: HTMLElement, template: HTMLTemplateElement, creator: Creator) {
  const $ = <T extends Element>(parent: ParentNode, sel: string) => parent.querySelector<T>(sel)!
  const card = template.content.firstElementChild!.cloneNode(true) as HTMLElement
  $<HTMLImageElement>(card, '[data-creator-image]').src = creator.image
  $(card, '[data-creator-name]').textContent = creator.name
  $(card, '[data-tagline]').textContent = creator.tagline
  $(card, '[data-tagline-highlight]').textContent = creator.taglineHighlight
  $(card, '[data-bio]').textContent = creator.bio
  $(card, '[data-work-count]').textContent = String(creator.workCount)
  $(card, '[data-followers]').textContent = creator.followers
  $(card, '[data-average-views]').textContent = creator.averageViews

  const worksList = $(card, '[data-works]')
  const workTemplate = $<HTMLTemplateElement>(card, '[data-work-template]')
  const dotsList = $(card, '[data-work-dots]')
  const dotTemplate = $<HTMLTemplateElement>(card, '[data-work-dot-template]')
  const nextButton = $<HTMLButtonElement>(card, '[data-next-works]')
  const worksPerPage = 3
  const pageCount = Math.ceil(creator.works.length / worksPerPage)
  let currentPage = 0

  const dots = Array.from({ length: pageCount }, (_, page) => {
    const dot = dotTemplate.content.firstElementChild!.cloneNode(true) as HTMLButtonElement
    dot.type = 'button'
    dot.setAttribute('aria-label', `Show works page ${page + 1}`)
    dot.addEventListener('click', () => {
      currentPage = page
      renderWorks()
    })
    return dot
  })
  dotsList.replaceChildren(...dots)

  function renderWorks() {
    const start = currentPage * worksPerPage
    const works = creator.works.slice(start, start + worksPerPage).map((work) => {
      const workCard = workTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement
      const image = $<HTMLImageElement>(workCard, '[data-img]')
      image.src = work.image
      image.alt = work.title
      $(workCard, '[data-title]').textContent = work.title
      $(workCard, '[data-views]').textContent = work.views

      const genreTemplate = $<HTMLTemplateElement>(workCard, '[data-genre-template]')
      const genres = work.genres.map((genre) => {
        const badge = genreTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement
        badge.textContent = genre
        return badge
      })
      $(workCard, '[data-genres]').replaceChildren(...genres)
      return workCard
    })

    worksList.replaceChildren(...works)
    dots.forEach((dot, page) => {
      dot.setAttribute('aria-pressed', String(page === currentPage))
    })
  }

  nextButton.disabled = pageCount <= 1
  nextButton.addEventListener('click', () => {
    if (pageCount <= 1) return
    currentPage = (currentPage + 1) % pageCount
    renderWorks()
  })

  renderWorks()
  host.replaceChildren(card)
}

const creatorSpotlightTemplate = document.getElementById('creator-spotlight-template')
if (creatorSpotlightTemplate instanceof HTMLTemplateElement) {
  document.querySelectorAll<HTMLElement>('[data-creator-spotlight]').forEach((host) => {
    const creatorId = host.dataset.creatorSpotlight
    if (!creatorId || !Object.hasOwn(creators, creatorId)) return
    initCreatorSpotlight(host, creatorSpotlightTemplate, creators[creatorId])
  })
}
