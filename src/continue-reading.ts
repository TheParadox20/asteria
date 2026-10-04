type ReadingItem = {
  title: string
  image: string
  chapterNumber: number
  chapterTitle: string
  progress: number
  updatedAt: string
  hasNewChapter: boolean
  href: string
}

// Placeholder data, kept in display order. Replace with real reading history and links.
const readingItems: ReadingItem[] = [
  {
    title: 'I am the Fated Villain',
    image: '/assets/villain.png',
    chapterNumber: 482,
    chapterTitle: 'The Ten Directions',
    progress: 72,
    updatedAt: '3h ago',
    hasNewChapter: true,
    href: '#',
  },
  {
    title: 'I am the Fated Villain',
    image: '/assets/demon-faction.png',
    chapterNumber: 482,
    chapterTitle: 'The Ten Directions',
    progress: 72,
    updatedAt: '3h ago',
    hasNewChapter: false,
    href: '#',
  },
  {
    title: 'I am the Fated Villain',
    image: '/assets/glutton-king-fixed.png',
    chapterNumber: 482,
    chapterTitle: 'The Ten Directions',
    progress: 72,
    updatedAt: '3h ago',
    hasNewChapter: false,
    href: '#',
  },
]

function initContinueReading(root: HTMLElement, template: HTMLTemplateElement, items: ReadingItem[]) {
  const $ = <T extends Element>(parent: ParentNode, sel: string) => parent.querySelector<T>(sel)!
  const list = $<HTMLElement>(root, '[data-reading-list]')

  const cards = items.map((item) => {
    const card = template.content.firstElementChild!.cloneNode(true) as HTMLElement
    const image = $<HTMLImageElement>(card, '[data-img]')
    image.src = item.image
    image.alt = item.title
    $(card, '[data-title]').textContent = item.title
    $(card, '[data-chapter]').textContent = `Ch. ${item.chapterNumber} - ${item.chapterTitle}`
    $(card, '[data-updated]').textContent = `Updated ${item.updatedAt}`
    $<HTMLAnchorElement>(card, '[data-link]').href = item.href
    $(card, '[data-new-chapter]').classList.toggle('hidden', !item.hasNewChapter)

    const progress = Math.min(100, Math.max(0, item.progress))
    const progressBar = $(card, '[data-progress]')
    progressBar.setAttribute('aria-valuenow', String(progress))
    progressBar.setAttribute('aria-label', `Reading progress for ${item.title}`)
    $<HTMLElement>(card, '[data-progress-fill]').style.width = `${progress}%`
    $(card, '[data-progress-label]').textContent = `${progress}%`
    return card
  })

  list.replaceChildren(...cards)
}

const continueReadingSection = document.getElementById('continue-reading')
const continueReadingTemplate = document.getElementById('continue-reading-template')
if (continueReadingSection && continueReadingTemplate instanceof HTMLTemplateElement) {
  initContinueReading(continueReadingSection, continueReadingTemplate, readingItems)
}
