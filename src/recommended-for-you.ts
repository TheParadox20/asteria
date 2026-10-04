type Recommendation = {
  title: string
  image: string
  chapterNumber?: number
  isNew: boolean
}

const recommendations: Recommendation[] = [
  {
    title: 'Kagurabachi',
    image: '/assets/kagurabachi-fixed.png',
    chapterNumber: 10,
    isNew: true,
  },
  {
    title: 'The Apothecary Diaries',
    image: '/assets/apothecary.png',
    chapterNumber: 72,
    isNew: true,
  },
  {
    title: 'Bluelock',
    image: '/assets/bluelock.png',
    chapterNumber: 101,
    isNew: true,
  },
  {
    title: 'Kaiju No. 8',
    image: '/assets/kaiju-no-8-fixed.png',
    chapterNumber: 34,
    isNew: true,
  },
]

function initRecommendations(root: HTMLElement, template: HTMLTemplateElement, recommendations: Recommendation[]) {
  const $ = <T extends Element>(parent: ParentNode, sel: string) => parent.querySelector<T>(sel)!
  const list = $<HTMLElement>(root, '[data-recommendations-list]')

  const cards = recommendations.map((recommendation) => {
    const card = template.content.firstElementChild!.cloneNode(true) as HTMLElement
    const image = $<HTMLImageElement>(card, '[data-img]')
    image.src = recommendation.image
    image.alt = recommendation.title
    $(card, '[data-title]').textContent = recommendation.title
    const chapter = $<HTMLElement>(card, '[data-chapter]')
    chapter.hidden = recommendation.chapterNumber === undefined
    chapter.textContent = chapter.hidden ? '' : `Ch. ${recommendation.chapterNumber}`
    $(card, '[data-new]').classList.toggle('hidden', !recommendation.isNew)
    return card
  })

  list.replaceChildren(...cards)
}

const recommendationsSection = document.getElementById('recommended-for-you')
const recommendationTemplate = document.getElementById('recommendation-template')
if (recommendationsSection && recommendationTemplate instanceof HTMLTemplateElement) {
  initRecommendations(recommendationsSection, recommendationTemplate, recommendations)
}
