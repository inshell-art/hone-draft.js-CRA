import Dexie from "dexie";
import { Article, Facet } from "../types/types";

// Initialize database
class HoneDatabase extends Dexie {
  articles: Dexie.Table<Article, string>;
  facets: Dexie.Table<Facet, [string, string]>;

  constructor() {
    super("HoneDatabase");
    this.version(1).stores({
      articles: "articleId, updateAt, title",
      facets: "[articleId+titleId], contentsId",
    });

    this.articles = this.table("articles");
    this.facets = this.table("facets");
  }
}

export const db = new HoneDatabase();

export const submitArticle = async (article: Article) => {
  await db.articles.put(article);
};

export const fetchArticle = async (articleId: string) => {
  const article = await db.articles.get(articleId);
  return article;
};
