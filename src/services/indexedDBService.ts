import Dexie from "dexie";
import { Article, Facet } from "../types/types";
import isEqual from "lodash/isEqual";
import { PAGE_SIZE } from "../utils/constants";
import { EditorState, convertToRaw, convertFromRaw } from "draft-js";

// Initialize database
class HoneDatabase extends Dexie {
  articles: Dexie.Table<Article, string>;
  facets: Dexie.Table<Facet, string>;

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

export const saveArticle = async (article: Article) => {
  await db.articles.put(article);
};

// load article
export const loadArticle = async (articleId: string) => {
  const article = await db.articles.get(articleId);
  return article;
};
