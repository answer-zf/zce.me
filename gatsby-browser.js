/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/browser-apis/
 */

// Global Styles
import './src/styles/normalize.css'

// https://www.gatsbyjs.org/docs/browser-apis/#wrapRootElement
// https://www.gatsbyjs.org/blog/2019-01-31-using-react-context-api-with-gatsby/
export const wrapRootElement = ({ element }) => element

// https://www.gatsbyjs.org/docs/browser-apis/#wrapPageElement
export const wrapPageElement = ({ element }) => element
