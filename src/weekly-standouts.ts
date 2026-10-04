type WeeklyStandout = {
  title: string
  image: string
  description: string
  genres: string[]
  chapterNumber: number
  readersToday: string
  href: string
}

// Placeholder data, kept in ranking order. Replace with real weekly standouts and links.
const weeklyStandouts: WeeklyStandout[] = [
  {
    title: 'Na Honjaman Level-Up',
    image: '/assets/solo-leveling.png',
    description: 'The weak become the strongest. His shadow is just the beginning.',
    genres: ['Action', 'Fantasy', 'Adventure', 'System', 'Martial Arts'],
    chapterNumber: 200,
    readersToday: '12K',
    href: '#',
  },
  {
    title: 'Sono Bisque Doll wa Koi o Suru',
    image: '/assets/sono-bisque.png',
    description: 'A story about hobbies, handmade drams, and growing closer',
    genres: ['Romance', 'Comedy', 'Slice of Life', 'School', 'Drama'],
    chapterNumber: 115,
    readersToday: '15.8K',
    href: '#',
  },
  {
    title: 'Kage no Jitsuryokusha ni Naritakute',
    image: '/assets/kage-fixed.png',
    description: 'In the shadows, he plays a different role. A fantasy of hiden power and a greater stage',
    genres: ['Fantasy', 'Adventure', 'Action', 'Comedy', 'Isekai'],
    chapterNumber: 576,
    readersToday: '9.4K',
    href: '#',
  },
]

function initWeeklyStandouts(root: HTMLElement, template: HTMLTemplateElement, standouts: WeeklyStandout[]) {
  const $ = <T extends Element>(parent: ParentNode, sel: string) => parent.querySelector<T>(sel)!
  const list = $<HTMLElement>(root, '[data-standouts-list]')

  const cards = standouts.map((standout, index) => {
    const card = template.content.firstElementChild!.cloneNode(true) as HTMLElement
    const image = $<HTMLImageElement>(card, '[data-img]')
    image.src = standout.image
    image.alt = standout.title
    $(card, '[data-rank]').textContent = String(index + 1)
    $(card, '[data-title]').textContent = standout.title
    $(card, '[data-description]').textContent = standout.description
    $(card, '[data-chapter]').textContent = `Ch. ${standout.chapterNumber}`
    $(card, '[data-readers]').textContent = `${standout.readersToday} readers today`

    const link = $<HTMLAnchorElement>(card, '[data-link]')
    link.href = standout.href
    link.setAttribute('aria-label', `Read ${standout.title}`)

    const genreTemplate = $<HTMLTemplateElement>(card, '[data-genre-template]')
    const genres = standout.genres.map((genre) => {
      const badge = genreTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement
      badge.textContent = genre
      return badge
    })
    $(card, '[data-genres]').replaceChildren(...genres)
    return card
  })

  list.replaceChildren(...cards)
}

const weeklyStandoutsSection = document.getElementById('weekly-standouts')
const weeklyStandoutTemplate = document.getElementById('weekly-standout-template')
if (weeklyStandoutsSection && weeklyStandoutTemplate instanceof HTMLTemplateElement) {
  initWeeklyStandouts(weeklyStandoutsSection, weeklyStandoutTemplate, weeklyStandouts)
}
