import Dexie from "dexie";
import { EditorState } from "draft-js";
import { ARTICLE_TITLE, FACET_TITLE } from "../utils/constants";
import { Article, Facet, ArticleFacetLink } from "../types/types";

// Initialize database
class HoneDatabase extends Dexie {
  articles: Dexie.Table<Article, string>;
  facets: Dexie.Table<Facet, string>;
  articleFacetLinks: Dexie.Table<ArticleFacetLink, [string, string]>;

  constructor() {
    super("HoneDatabase");
    this.version(1).stores({
      articles: "articleId, date, title",
      facets: "facetId, title",
      articleFacetLinks: "[articleId+facetId], articleId, facetId, orderIndex",
    });

    this.articles = this.table("articles");
    this.facets = this.table("facets");
    this.articleFacetLinks = this.table("articleFacetLinks");
  }
}

const db = new HoneDatabase();

export const saveArticle = async (articleId: string, articleDate: string, articleTitle: string) => {
  try {
    await db.articles.put({
      articleId,
      date: articleDate,
      title: articleTitle,
    });
  } catch (error) {
    console.error(error);
  }
};
