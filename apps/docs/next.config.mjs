import nextra from 'nextra'

/*
 * Brand-tuned Shiki themes for the code blocks the docs will grow. The theme's
 * defaults are github-light / github-dark: the first ``` fence would ship a
 * pure-white plate in light mode (pure white is out of bounds) and zinc tokens
 * in dark. Every hue below is the identity palette (or a documented lift of
 * one), kept quiet and mode-appropriate — no purple keywords, no neon, and no
 * jade (docs has no live states, so the One Pulse Rule leaves it nothing to do).
 *
 *   light  — tokens on the elevated bone plate: ink body, inkMuted comments,
 *            the focus mark #1F6E78 for keywords (brand teal #2A8C97 reads
 *            3.2:1 on bone, under AA), petrolSoft strings, petrol functions
 *   dark   — tokens on the petrol-deep plate: bone body, petrolTint comments
 *            and constants, tealBright keywords, #6FC4CD strings (tealBright
 *            lifted one step so strings and keywords don't share a hue)
 *
 * Both plates are re-declared as surfaces in app/globals.css §4, because the
 * theme's `keepBackground: false` strips Shiki's background from the `pre` and
 * leaves the theme's own `bg-white` / `bg-black` utilities standing.
 */
const shikiLight = {
  name: 'nanisoft-light',
  type: 'light',
  fg: '#102A30', /* color.ink */
  bg: '#FBF7EF', /* color.boneElev */
  colors: { 'editor.background': '#FBF7EF', 'editor.foreground': '#102A30' },
  settings: [
    { settings: { foreground: '#102A30' } }, /* ink — body, variables */
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#4A5E64', fontStyle: 'italic' }, /* inkMuted */
    },
    {
      scope: ['keyword', 'keyword.operator', 'storage.type', 'storage.modifier'],
      settings: { foreground: '#1F6E78' }, /* color.focus */
    },
    {
      scope: ['string', 'punctuation.definition.string'],
      settings: { foreground: '#3C6770' }, /* color.petrolSoft */
    },
    {
      scope: ['entity.name.tag'],
      settings: { foreground: '#1F6E78' }, /* color.focus */
    },
    {
      scope: ['entity.other.attribute-name'],
      settings: { foreground: '#3C6770' }, /* color.petrolSoft */
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: '#0C2A33' }, /* color.petrol */
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character', 'variable.other.constant'],
      settings: { foreground: '#4A5E64' }, /* inkMuted */
    },
  ],
}

const shikiDark = {
  name: 'nanisoft-dark',
  type: 'dark',
  fg: '#F4EFE6', /* color.bone */
  bg: '#08222A', /* color.petrolDeep */
  colors: { 'editor.background': '#08222A', 'editor.foreground': '#F4EFE6' },
  settings: [
    { settings: { foreground: '#F4EFE6' } }, /* bone — body, variables */
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#8FB0B6', fontStyle: 'italic' }, /* color.petrolTint */
    },
    {
      scope: ['keyword', 'keyword.operator', 'storage.type', 'storage.modifier'],
      settings: { foreground: '#4DB0BB' }, /* color.tealBright */
    },
    {
      scope: ['string', 'punctuation.definition.string'],
      settings: { foreground: '#6FC4CD' }, /* tealBright lifted — derived */
    },
    {
      scope: ['entity.name.tag'],
      settings: { foreground: '#4DB0BB' }, /* color.tealBright */
    },
    {
      scope: ['entity.other.attribute-name'],
      settings: { foreground: '#6FC4CD' }, /* derived */
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: '#F4EFE6' }, /* color.bone */
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character', 'variable.other.constant'],
      settings: { foreground: '#8FB0B6' }, /* color.petrolTint */
    },
  ],
}

const withNextra = nextra({
  search: { codeblocks: false },
  mdxOptions: {
    rehypePrettyCodeOptions: {
      // Replaces the default { light: 'github-light', dark: 'github-dark' } pair
      // wholesale (nextra shallow-merges its defaults around this). The key
      // names are what Shiki emits as --shiki-light / --shiki-dark, which the
      // theme's stylesheet already consumes per mode.
      theme: { light: shikiLight, dark: shikiDark },
    },
  },
})

export default withNextra({
  output: 'export',
  images: { unoptimized: true },
})
