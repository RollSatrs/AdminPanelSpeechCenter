type LessonFormatId = "individual" | "group" | "online"


export type LessonFormat = {
  id:LessonFormatId
  section1: {
    badge: string
    title: string
    cta: string
  }
  section2: {
    badge: string
    overlayText: string
    image: string
  }
  section3: {
    badge: string
    formatTitle: string
    description: string
  }
}
