type LatestUpdate = {
  title: string
  image: string
  updatedAt: string
  description: string
  href: string
}

// Placeholder data, kept in display order. Replace with real updates and links.
const latestUpdates: LatestUpdate[] = [
  {
    title: 'One Punch Man',
    image: '/assets/one-punch-man.webp',
    updatedAt: '5 Jun',
    description: 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.',
    href: '#',
  },
  {
    title: 'Marimashita! Iruma-Kun',
    image: '/assets/iruma-kun-fixed.png',
    updatedAt: '5 Jun',
    description: 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.',
    href: '/read.html',
  },
  {
    title: 'D-Frag!',
    image: '/assets/D-Frag.png',
    updatedAt: '5 Jun',
    description: 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.',
    href: '#',
  },
  {
    title: 'One Punch Man',
    image: '/assets/one-punch-man.webp',
    updatedAt: '5 Jun',
    description: 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.',
    href: '#',
  },
  {
    title: 'Marimashita! Iruma-Kun',
    image: '/assets/iruma-kun-fixed.png',
    updatedAt: '5 Jun',
    description: 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.',
    href: '/read.html',
  },
  {
    title: 'D-Frag!',
    image: '/assets/D-Frag.png',
    updatedAt: '5 Jun',
    description: 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.',
    href: '#',
  },
]

function initLatestUpdates(root: HTMLElement, template: HTMLTemplateElement, updates: LatestUpdate[]) {
  const $ = <T extends Element>(parent: ParentNode, sel: string) => parent.querySelector<T>(sel)!
  const grid = $<HTMLElement>(root, '[data-updates-grid]')

  const cards = updates.map((update) => {
    const card = template.content.firstElementChild!.cloneNode(true) as HTMLElement
    const image = $<HTMLImageElement>(card, '[data-img]')
    image.src = update.image
    image.alt = update.title
    $(card, '[data-title]').textContent = update.title
    $(card, '[data-updated]').textContent = `Updated ${update.updatedAt}`
    $(card, '[data-description]').textContent = update.description
    $<HTMLAnchorElement>(card, '[data-link]').href = update.href
    return card
  })

  grid.replaceChildren(...cards)
}

const latestUpdatesSection = document.getElementById('latest-updates')
const latestUpdateTemplate = document.getElementById('latest-update-template')
if (latestUpdatesSection && latestUpdateTemplate instanceof HTMLTemplateElement) {
  initLatestUpdates(latestUpdatesSection, latestUpdateTemplate, latestUpdates)
}
