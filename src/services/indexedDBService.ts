import Dexie from "dexie";
import { EditorState } from "draft-js";
import { ARTICLE_TITLE, FACET_TITLE } from "../utils/constants";
import { Article, Facet, ArticleFacetLink } from "../types/types";
import { PAGE_SIZE } from "../utils/constants";

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

// upsert article with put
export const upsertArticle = async (article: Article) => {
  await db.articles.put(article);
};

// upsert facet with put
export const upsertFacet = async (facet: Facet) => {
  await db.facets.put(facet);
};

// upsert articleFacetLink with put
export const upsertArticleFacetLink = async (articleFacetLink: ArticleFacetLink) => {
  await db.articleFacetLinks.put(articleFacetLink);
};

// get more article with offset
export const getMoreArticles = async (offset: number) => {
  const articles = await db.articles.offset(offset).limit(PAGE_SIZE).reverse().sortBy("date");

  return articles;
};
