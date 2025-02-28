// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import session from "express-session";
import createMemoryStore from "memorystore";
import fetch from "node-fetch";
var MemoryStore = createMemoryStore(session);
async function fetchWikipediaArticles(language) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "random",
    grnnamespace: "0",
    grnlimit: "20",
    prop: "extracts|pageimages|info",
    exintro: "true",
    explaintext: "true",
    piprop: "original",
    inprop: "url"
  });
  const response = await fetch(`https://${language}.wikipedia.org/w/api.php?${params}`);
  const data = await response.json();
  if (!data.query?.pages) return [];
  return Object.values(data.query.pages).filter((page) => page.original?.source).map((page) => ({
    id: this.currentId.articles++,
    wikiId: page.pageid.toString(),
    title: page.title,
    excerpt: page.extract,
    imageUrl: page.original.source,
    language,
    likeCount: 0
  }));
}
var MemStorage = class {
  users;
  articles;
  likes;
  comments;
  sessionStore;
  currentId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.articles = /* @__PURE__ */ new Map();
    this.likes = /* @__PURE__ */ new Map();
    this.comments = /* @__PURE__ */ new Map();
    this.currentId = { users: 1, articles: 1, likes: 1, comments: 1 };
    this.sessionStore = new MemoryStore({ checkPeriod: 864e5 });
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentId.users++;
    const user = { ...insertUser, id, languages: [] };
    this.users.set(id, user);
    return user;
  }
  async updateUserLanguages(userId, languages) {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, languages };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  async getArticles(languages) {
    for (const language of languages) {
      const languageArticles = Array.from(this.articles.values()).filter((article) => article.language === language);
      if (languageArticles.length < 10) {
        const newArticles = await fetchWikipediaArticles.call(this, language);
        for (const article of newArticles) {
          this.articles.set(article.id, article);
        }
      }
    }
    return Array.from(this.articles.values()).filter((article) => languages.includes(article.language)).sort(() => Math.random() - 0.5).slice(0, 20);
  }
  async getTrendingArticles() {
    return Array.from(this.articles.values()).sort((a, b) => b.likeCount - a.likeCount).slice(0, 10);
  }
  async getLikedArticles(userId) {
    const userLikes = Array.from(this.likes.values()).filter((like) => like.userId === userId);
    return userLikes.map((like) => this.articles.get(like.articleId)).filter(Boolean);
  }
  async createLike(userId, articleId) {
    const id = this.currentId.likes++;
    const like = {
      id,
      userId,
      articleId,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.likes.set(id, like);
    const article = this.articles.get(articleId);
    if (article) {
      article.likeCount++;
      this.articles.set(articleId, article);
    }
    return like;
  }
  async removeLike(userId, articleId) {
    const like = Array.from(this.likes.values()).find(
      (l) => l.userId === userId && l.articleId === articleId
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
  async getComments(articleId) {
    return Array.from(this.comments.values()).filter((comment) => comment.articleId === articleId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async createComment(userId, articleId, content) {
    const id = this.currentId.comments++;
    const comment = {
      id,
      userId,
      articleId,
      content,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }
};
var storage = new MemStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import dotenv from "dotenv";
dotenv.config();
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.REPL_ID,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore
  };
  if (app2.get("env") === "production") {
    app2.set("trust proxy", 1);
  }
  console.log("Session Settings:", sessionSettings);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }
    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password)
    });
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// server/routes.ts
function registerRoutes(app2) {
  setupAuth(app2);
  app2.patch("/api/user/languages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const languages = req.body.languages;
    const user = await storage.updateUserLanguages(req.user.id, languages);
    res.json(user);
  });
  app2.get("/api/articles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const articles = await storage.getArticles(req.user.languages);
    res.json(articles);
  });
  app2.get("/api/articles/trending", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const articles = await storage.getTrendingArticles();
    res.json(articles);
  });
  app2.get("/api/articles/liked", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const articles = await storage.getLikedArticles(req.user.id);
    res.json(articles);
  });
  app2.post("/api/articles/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const like = await storage.createLike(req.user.id, parseInt(req.params.id));
    res.json(like);
  });
  app2.delete("/api/articles/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.removeLike(req.user.id, parseInt(req.params.id));
    res.sendStatus(200);
  });
  app2.get("/api/articles/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const comments = await storage.getComments(parseInt(req.params.id));
    res.json(comments);
  });
  app2.post("/api/articles/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const comment = await storage.createComment(
      req.user.id,
      parseInt(req.params.id),
      req.body.content
    );
    res.json(comment);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  base: "/WikiTinder1/",
  // Указываем имя репозитория
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import dotenv2 from "dotenv";
dotenv2.config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT = 5e3;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
