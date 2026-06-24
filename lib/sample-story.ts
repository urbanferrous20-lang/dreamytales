export const SAMPLE_STORY = {
  title: "Morne and the Paper Plane Over Table Mountain",
  childName: "Morne",
  location: "Cape Town",
  theme: "Flying & adventure",
  teaser:
    "A personalised bedtime short story set beneath Table Mountain — with custom illustrations, local details, and a gentle ending ready for 6pm.",
  pages: [
    {
      src: "/samples/story-page-1.png",
      alt: "Sample story opening page — Morne in a Cape Town garden at sunset",
      caption: "Opens in your child's hometown",
    },
    {
      src: "/samples/story-page-7.png",
      alt: "Sample story illustration — Morne flying on a paper plane",
      caption: "Fully illustrated every page",
    },
    {
      src: "/samples/story-page-9.png",
      alt: "Sample story ending — gentle landing back in the garden",
      caption: "Calm endings for bedtime",
    },
  ] as const,
  heroPage: "/samples/story-page-1.png",
};
