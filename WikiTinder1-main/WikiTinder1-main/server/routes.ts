import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Language preferences
  app.patch("/api/user/languages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const languages = req.body.languages;
    const user = await storage.updateUserLanguages(req.user!.id, languages);
    res.json(user);
  });

  // Articles
  app.get("/api/articles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const articles = await storage.getArticles(req.user!.languages);
    res.json(articles);
  });

  app.get("/api/articles/trending", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const articles = await storage.getTrendingArticles();
    res.json(articles);
  });

  app.get("/api/articles/liked", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const articles = await storage.getLikedArticles(req.user!.id);
    res.json(articles);
  });

  // Likes
  app.post("/api/articles/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const like = await storage.createLike(req.user!.id, parseInt(req.params.id));
    res.json(like);
  });

  app.delete("/api/articles/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.removeLike(req.user!.id, parseInt(req.params.id));
    res.sendStatus(200);
  });

  // Comments
  app.get("/api/articles/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const comments = await storage.getComments(parseInt(req.params.id));
    res.json(comments);
  });

  app.post("/api/articles/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const comment = await storage.createComment(
      req.user!.id,
      parseInt(req.params.id),
      req.body.content
    );
    res.json(comment);
  });

  const httpServer = createServer(app);
  return httpServer;
}
