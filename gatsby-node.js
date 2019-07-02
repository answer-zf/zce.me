/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const path = require('path')
const slugify = require('slugify')

const collections = {
  posts: {
    type: 'post',
    // {slug} - the post slug, eg. my-post
    // {year} - publication year, eg. 2019
    // {month} - publication month, eg. 04
    // {day} - publication day, eg. 29
    // {author} - slug of first author, eg. cameron
    // {category} - slug of first category, eg. tutorial
    // {tag} - slug of first tag listed in the post, eg. news
    permalink: '/posts/{year}/{month}/{slug}/',
    template: 'post'
  },
  pages: {
    type: 'page',
    permalink: '/{slug}/',
    template: 'page'
  }
}

const taxonomies = {
  authors: {
    type: 'author',
    // {slug} - the author slug, eg. tom-jerry
    permalink: '/authors/{slug}/',
    template: 'author'
  },
  categories: {
    type: 'category',
    permalink: '/categories/{slug}/',
    template: 'category'
  },
  tags: {
    type: 'tag',
    permalink: '/tags/{slug}/',
    template: 'tag'
  }
}

const generatePermalink = (permalink, context) => {
  // // replacement
  // for (const key in context) {
  //   permalink = permalink.replace(`{${key}}`, context[key])
  // }
  // return permalink
  return permalink.replace(/{([a-z_]+)}/g, (_, prop) => {
    if (context.hasOwnProperty(prop)) return context[prop]
    throw new Error(`Permalink template does not support {${prop}} Tags`)
  })
}

const createMarkdownField = ({ node, getNode, actions }) => {
  const { createNodeField } = actions

  // ignore markdown dirname or filename, use frontmatter slug instead
  // const permalink = createFilePath({ node, getNode, basePath: `posts` })

  const file = getNode(node.parent)
  //
  const config = collections[path.dirname(file.relativeDirectory)]
  if (!config) return

  const template = node.frontmatter.template || config.template

  const getPermalink = () => {
    if (node.frontmatter.permalink) {
      return node.frontmatter.permalink
    }

    // generate permalink if permalink not defined in frontmatter
    const {
      title,
      slug,
      date,
      authors: [authorId] = [],
      categories: [categoryId] = [],
      tags: [tagId] = []
    } = node.frontmatter

    const datetime = new Date(date)
    const author = getNode(authorId ? authorId : 'Gatsby').slug
    const category = getNode(categoryId ? categoryId : 'Uncategorized').slug
    const tag = getNode(tagId ? tagId : 'Untagged').slug

    const context = {
      slug: slug || slugify(title, { lower: true }),
      year: datetime.getFullYear(),
      month: ('0' + (datetime.getMonth() + 1)).substr(-2),
      day: ('0' + datetime.getDate()).substr(-2),
      author: author,
      category: category,
      tag: tag
    }

    return generatePermalink(config.permalink, context)
  }

  createNodeField({ node, name: `type`, value: config.type })
  createNodeField({ node, name: `template`, value: template })
  createNodeField({ node, name: `permalink`, value: getPermalink() })
}

const createYamlField = ({ node, getNode, actions }) => {
  const { createNodeField } = actions

  const file = getNode(node.parent)
  const config = taxonomies[path.basename(file.base, file.ext)]
  if (!config) return

  const template = node.template || config.template

  const getPermalink = () => {
    if (node.permalink) {
      return node.permalink
    }

    // generate permalink if permalink not defined in frontmatter
    const context = {
      slug: node.slug || slugify(node.name, { lower: true })
    }

    return generatePermalink(config.permalink, context)
  }

  createNodeField({ node, name: `type`, value: config.type })
  createNodeField({ node, name: `template`, value: template })
  createNodeField({ node, name: `permalink`, value: getPermalink() })
}

exports.onCreateNode = args => {
  switch (args.node.internal.type) {
    case `MarkdownRemark`:
      return createMarkdownField(args)
    case `AuthorsYaml`:
    case `CategoriesYaml`:
    case `TagsYaml`:
      return createYamlField(args)
  }
}

// https://www.gatsbyjs.org/docs/creating-and-modifying-pages/
exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const result = await graphql(`
    query {
      allMarkdownRemark {
        edges {
          node {
            id
            fields {
              type
              template
              permalink
            }
            frontmatter {
              title
              date
            }
          }
        }
      }
      allAuthorsYaml {
        edges {
          node {
            slug
            fields {
              type
              template
              permalink
            }
          }
        }
      }
      allCategoriesYaml {
        edges {
          node {
            slug
            fields {
              type
              template
              permalink
            }
          }
        }
      }
      allTagsYaml {
        edges {
          node {
            slug
            fields {
              type
              template
              permalink
            }
          }
        }
      }
    }
  `)

  if (result.errors) {
    throw result.errors
  }

  const { edges: posts } = result.data.allMarkdownRemark

  // https://www.gatsbyjs.org/docs/adding-pagination/
  // Create pages based on different content types
  posts.forEach(item => {
    const { id, fields } = item.node

    const items = posts
      // current type posts
      .filter(e => e.node.fields.type === fields.type)
      // // TODO: sort by posted date
      // .sort((post1, post2) => {
      //   console.log(new Date(post1.node.frontmatter.date))
      //   return 0
      // })

    const index = items.indexOf(item)
    const prev = index === items.length - 1 ? null : items[index + 1].node
    const next = index === 0 ? null : items[index - 1].node

    const template = `./src/templates/${fields.template}.js`

    createPage({
      path: fields.permalink,
      component: require.resolve(template),
      context: { id, prev, next }
    })
  })

  // https://www.gatsbyjs.org/docs/adding-tags-and-categories-to-blog-posts/
  const { edges: authors } = result.data.allAuthorsYaml
  const { edges: categories } = result.data.allCategoriesYaml
  const { edges: tags } = result.data.allTagsYaml
  const meta = [].concat(authors, categories, tags)

  // Create taxonomies pages
  meta.forEach(item  => {
    const { slug, fields } = item.node
    const template = `./src/templates/${fields.template}.js`
    createPage({
      path: fields.permalink,
      component: require.resolve(template),
      context: { slug }
    })
  })
}
