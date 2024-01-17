import Dexie from "dexie";
import { Article, Facet } from "../types/types";

// Initialize database
class HoneDatabase extends Dexie {
  articles: Dexie.Table<Article, string>;
  facets: Dexie.Table<Facet, string>;

  constructor() {
    super("HoneDatabase");
    this.version(1).stores({
      articles: "articleId, updateAt, title",
      facets: "facetId, articleId, title, contentsId",
    });

    this.version(2).stores({
      articles: "articleId, updateAt, title",
      facets: "facetId, articleId, title, contentsId, updateAt, honingFacetsId, honedFacetsId",
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

export const fetchAllArticles = async () => {
  const articles = await db.articles.toArray();
  return articles;
};

export const fetchAllFacets = async () => {
  const facets = await db.facets.toArray();
  return facets;
};
