import Dexie from "dexie";
import { Article, Facet, ArticleFacetLink, HoneState } from "../types/types";
import isEqual from "lodash/isEqual";
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

// save honeState to db
export const saveHoneState = async (honeState: HoneState, articleId: string) => {
  const { articles, facets, articleFacetLinks } = honeState;

  // save the article with articleId if changed
  const article = articles[articleId];
  const dbArticle = await db.articles.get(articleId);
  if (!isEqual(article, dbArticle)) {
    await db.articles.put(article);
  }

  // get facets in the article with articleId
  const dbArticleFacetLinks = await db.articleFacetLinks.where({ articleId }).toArray();
  const dbFacets = await db.facets.bulkGet(dbArticleFacetLinks.map((link) => link.facetId));

  // get facetId of facets in the article with articleId, if any changed by isEqual, update it

  // save articleFacetLinks
  await db.articleFacetLinks.bulkPut(articleFacetLinks);
};

// get more article with offset for MyHone
export const getMoreArticles = async (offset: number) => {
  const articles = await db.articles.offset(offset).limit(PAGE_SIZE).reverse().sortBy("date");

  return articles;
};
