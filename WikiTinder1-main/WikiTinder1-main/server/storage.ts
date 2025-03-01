import { User, InsertUser, Article, Like, Comment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import fetch from 'node-fetch';

const MemoryStore = createMemoryStore(session);

async function fetchWikipediaArticles(language: string): Promise<Article[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'random',
    grnnamespace: '0',
    grnlimit: '20',
    prop: 'extracts|pageimages|info',
    exintro: 'true',
    explaintext: 'true',
    piprop: 'original',
    inprop: 'url',
  });

  const response = await fetch(`https://${language}.wikipedia.org/w/api.php?${params}`);
  const data = await response.json();

  if (!data.query?.pages) return [];

  return Object.values(data.query.pages)
    .filter((page: any) => page.original?.source)
    .map((page: any) => ({
      id: this.currentId.articles++,
      wikiId: page.pageid.toString(),
      title: page.title,
      excerpt: page.extract,
      imageUrl: page.original.source,
      language,
      likeCount: 0,
    }));
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLanguages(userId: number, languages: string[]): Promise<User>;

  getArticles(languages: string[]): Promise<Article[]>;
  getTrendingArticles(): Promise<Article[]>;
  getLikedArticles(userId: number): Promise<Article[]>;

  createLike(userId: number, articleId: number): Promise<Like>;
  removeLike(userId: number, articleId: number): Promise<void>;

  getComments(articleId: number): Promise<Comment[]>;
  createComment(userId: number, articleId: number, content: string): Promise<Comment>;

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private articles: Map<number, Article>;
  private likes: Map<number, Like>;
  private comments: Map<number, Comment>;
  sessionStore: session.SessionStore;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.articles = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.currentId = { users: 1, articles: 1, likes: 1, comments: 1 };
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id, languages: [] };
    this.users.set(id, user);
    return user;
  }

  async updateUserLanguages(userId: number, languages: string[]): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, languages };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getArticles(languages: string[]): Promise<Article[]> {
    // First check if we have enough articles for each language
    for (const language of languages) {
      const languageArticles = Array.from(this.articles.values())
        .filter(article => article.language === language);

      if (languageArticles.length < 10) {
        const newArticles = await fetchWikipediaArticles.call(this, language);
        for (const article of newArticles) {
          this.articles.set(article.id, article);
        }
      }
    }

    return Array.from(this.articles.values())
      .filter(article => languages.includes(article.language))
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);
  }

  async getTrendingArticles(): Promise<Article[]> {
    return Array.from(this.articles.values())
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 10);
  }

  async getLikedArticles(userId: number): Promise<Article[]> {
    const userLikes = Array.from(this.likes.values())
      .filter(like => like.userId === userId);
    return userLikes.map(like => this.articles.get(like.articleId)!)
      .filter(Boolean);
  }

  async createLike(userId: number, articleId: number): Promise<Like> {
    const id = this.currentId.likes++;
    const like: Like = {
      id,
      userId,
      articleId,
      createdAt: new Date(),
    };
    this.likes.set(id, like);

    const article = this.articles.get(articleId);
    if (article) {
      article.likeCount++;
      this.articles.set(articleId, article);
    }

    return like;
  }

  async removeLike(userId: number, articleId: number): Promise<void> {
    const like = Array.from(this.likes.values()).find(
      l => l.userId === userId && l.articleId === articleId
    );
    if (like) {
      this.likes.delete(like.id);

      const article = this.articles.get(articleId);
      if (article) {
        article.likeCount--;
        this.articles.set(articleId, article);
      }
    }
  }

  async getComments(articleId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.articleId === articleId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createComment(
    userId: number,
    articleId: number,
    content: string
  ): Promise<Comment> {
    const id = this.currentId.comments++;
    const comment: Comment = {
      id,
      userId,
      articleId,
      content,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }
}

export const storage = new MemStorage();