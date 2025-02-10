import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  languages: text("languages").array().default([]).notNull(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  wikiId: text("wiki_id").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  imageUrl: text("image_url").notNull(),
  language: text("language").notNull(),
  likeCount: integer("like_count").default(0).notNull(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  articleId: integer("article_id").notNull().references(() => articles.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  articleId: integer("article_id").notNull().references(() => articles.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertArticleSchema = createInsertSchema(articles);
export const insertLikeSchema = createInsertSchema(likes);
export const insertCommentSchema = createInsertSchema(comments);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Comment = typeof comments.$inferSelect;
