/**
 * Notification Card GraphQL Schema
 * Defines the schema for notification functionality
 */

export const notificationCardSchema = `
# Notification Card Types and Enums

enum NotificationType {
  SYSTEM
  ORDER
  INVENTORY
  USER
  ALERT
}

enum NotificationPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum NotificationStatus {
  UNREAD
  READ
  ARCHIVED
}

type NotificationItem {
  id: ID!
  type: NotificationType!
  priority: NotificationPriority!
  status: NotificationStatus!
  title: String!
  message: String!
  timestamp: DateTime!
  actionUrl: String
  actionLabel: String
  data: JSON
  expiresAt: DateTime
  readAt: DateTime
  userId: String
}

type NotificationStats {
  total: Int!
  unread: Int!
  byType: JSON!
  byPriority: JSON!
}

type NotificationsResult {
  items: [NotificationItem!]!
  stats: NotificationStats!
  hasMore: Boolean!
}

input NotificationsInput {
  userId: String!
  limit: Int = 20
  offset: Int = 0
  types: [NotificationType!]
  priorities: [NotificationPriority!]
  statuses: [NotificationStatus!]
  startDate: DateTime
  endDate: DateTime
}

input MarkNotificationInput {
  notificationId: ID!
}

type MarkNotificationResult {
  success: Boolean!
  message: String
}

input BulkNotificationActionInput {
  notificationIds: [ID!]!
  action: BulkNotificationAction!
}

enum BulkNotificationAction {
  READ
  UNREAD
  DELETE
  ARCHIVE
}

type BulkNotificationResult {
  success: Boolean!
  affectedCount: Int!
  message: String
}

type NotificationUpdateEvent {
  type: NotificationEventType!
  notification: NotificationItem!
}

enum NotificationEventType {
  CREATED
  UPDATED
  DELETED
  READ
  UNREAD
}

extend type Query {
  notifications(input: NotificationsInput!): NotificationsResult
    @auth(requires: "user")
    @cache(ttl: 60, scope: "user")
}

extend type Mutation {
  markNotificationRead(input: MarkNotificationInput!): MarkNotificationResult
    @auth(requires: "user")
    @rateLimit(max: 30, window: "1m")
    
  bulkNotificationAction(input: BulkNotificationActionInput!): BulkNotificationResult
    @auth(requires: "user")
    @rateLimit(max: 10, window: "1m")
}

extend type Subscription {
  notificationUpdates(userId: String!): NotificationUpdateEvent
    @auth(requires: "user")
}
`;