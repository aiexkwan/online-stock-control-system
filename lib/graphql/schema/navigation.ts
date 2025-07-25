/**
 * Navigation Card GraphQL Schema
 * Defines the schema for navigation functionality
 */

export const navigationCardSchema = `
# Navigation Card Types and Enums

enum NavigationType {
  SIDEBAR
  BREADCRUMB
  MENU
  QUICK_ACCESS
}

type NavigationItem {
  id: ID!
  label: String!
  icon: String
  path: String
  children: [NavigationItem!]
  permissions: [String!]
  badge: Int
  external: Boolean
  description: String
  metadata: JSON
}

type NavigationMenu {
  id: ID!
  items: [NavigationItem!]!
  permissions: [String!]!
  metadata: JSON
}

input NavigationMenuInput {
  navigationType: NavigationType!
  permissions: [String!]
  currentPath: String
}

input BookmarkInput {
  itemId: ID!
  action: BookmarkAction!
}

enum BookmarkAction {
  ADD
  REMOVE
}

type BookmarkResult {
  success: Boolean!
  message: String
  bookmarks: [String!]
}

extend type Query {
  navigationMenu(input: NavigationMenuInput!): NavigationMenu
    @auth(requires: "user")
    @cache(ttl: 300, scope: "user")
}

extend type Mutation {
  updateNavigationBookmark(input: BookmarkInput!): BookmarkResult
    @auth(requires: "user")
    @rateLimit(max: 10, window: "1m")
}
`;
