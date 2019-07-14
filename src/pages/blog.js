import React from 'react'
import { graphql, Link } from 'gatsby'

import Layout from '../components/layout'

export default ({ data, location }) => (
  <Layout title={`All posts`} location={location}>
    <h1>{data.allMarkdownRemark.totalCount} Posts</h1>
    <ul>
      {data.allMarkdownRemark.edges.map(({ node }) => (
        <li key={node.fields.permalink}>
          <Link to={node.fields.permalink}>{node.fields.title}</Link>
        </li>
      ))}
    </ul>
  </Layout>
)

export const query = graphql`
  query {
    allMarkdownRemark(
      filter: { fields: { type: { eq: "post" } } }
      sort: { fields: fields___date, order: DESC }
    ) {
      totalCount
      edges {
        node {
          fields {
            title
            permalink
          }
        }
      }
    }
  }
`
