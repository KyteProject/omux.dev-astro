import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import svelte from "@astrojs/svelte"
import tailwind from "@astrojs/tailwind"
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers"
import rehypeFigure from "@microflash/rehype-figure"
import remarkCalloutDirectives from "@microflash/remark-callout-directives"
import githubCalloutOptions from "@microflash/remark-callout-directives/config/github"
import compress from "astro-compress"
import expressiveCode from "astro-expressive-code"
import pagefind from "astro-pagefind"
import { defineConfig } from "astro/config"
import rehypeExternalLinks from "rehype-external-links"
import rehypeKatex from "rehype-katex"
import remarkDirective from "remark-directive"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import smartypants from "remark-smartypants"
import remarkUnwrapImages from "remark-unwrap-images"
import { visit } from "unist-util-visit"

const hasExternalScripts = false
const whenExternalScripts = (items = []) =>
  hasExternalScripts
    ? Array.isArray(items)
      ? items.map(item => item())
      : [items()]
    : []

const expressiveCodePlugin = () =>
  expressiveCode({
    themes: ["dracula", "rose-pine-dawn"],
    useDarkModeMediaQuery: true,
    themeCssRoot: ":root",
    themeCssSelector: theme => {
      let themeSelector
      switch (theme.type) {
        case "light":
          themeSelector = '[class=""]'
          break
        case "dark":
          themeSelector = '[class="dark"]'
          break
        default:
          themeSelector = '[class=""]'
          break
      }
      return themeSelector
    },
    showLineNumbers: true,
    padding: 16,
    borderRadius: 8,
    tabWidth: 2,
    plugins: [pluginLineNumbers()]
  })

// Tooltip plugin
function abbrPlugin() {
  return (tree, file) => {
    visit(tree, ["textDirective"], _node => {
      const node = _node
      if (node.name !== "abbr") return
      if (
        !node.children ||
        node.children.length !== 1 ||
        node.children[0].type !== "text"
      )
        file.fail(
          "Abbr directive must have exactly one text child." +
            JSON.stringify(node)
        )
      if (!node.attributes || !("value" in node.attributes))
        file.fail(
          "Abbr directive must have a `value` attribute." + JSON.stringify(node)
        )
      const title = node.attributes.value
      const data = node.data || (node.data = {})
      data.hName = "abbr"
      data.hProperties = {
        title
      }
    })
  }
}

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://omux.dev",
  redirects: {
    "/posts/[...slug]": "/blog/[...slug]"
  },
  trailingSlash: "ignore",
  integrations: [
    svelte(),
    react(),
    sitemap(),
    pagefind(),
    expressiveCodePlugin(),
    mdx(),
    tailwind({
      applyBaseStyles: false
    }),
    ...whenExternalScripts(() =>
      partytown({
        config: {
          forward: ["dataLayer.push"]
        }
      })
    ),
    compress({
      CSS: true,
      HTML: {
        "html-minifier-terser": {
          removeAttributeQuotes: false
        }
      },
      Image: true,
      JavaScript: true,
      SVG: false,
      Logger: 1
    })
  ],
  markdown: {
    syntaxHighlight: false,
    remarkPlugins: [
      remarkDirective,
      abbrPlugin,
      remarkGfm,
      [remarkCalloutDirectives, githubCalloutOptions],
      [
        smartypants,
        {
          dashes: "oldschool"
        }
      ],
      remarkMath,
      remarkUnwrapImages
    ],
    rehypePlugins: [
      rehypeFigure,
      rehypeKatex,
      [
        rehypeExternalLinks,
        {
          rel: ["external"],
          target: "_blank"
        }
      ]
    ]
  }
})
