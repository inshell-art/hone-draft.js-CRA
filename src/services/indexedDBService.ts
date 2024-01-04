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

  // save facets if changed
  const dbFacets = await db.facets.where("facetId").startsWith(articleId).toArray();
  const facetsToSave = Object.values(facets).filter((facet) => {
    const correspondingDbFacet = dbFacets.find((dbFacet) => dbFacet.facetId === facet.facetId);

    return !correspondingDbFacet || !isEqual(facet, correspondingDbFacet);
  });
  await db.facets.bulkPut(facetsToSave);

  // save articleFacetLinks if changed
  const dbLinks = await db.articleFacetLinks.where("articleId").equals(articleId).toArray();
  const linksToSave = articleFacetLinks.filter((link) => {
    const correspondingDbLink = dbLinks.find((dbLink) => dbLink.facetId === link.facetId);

    return !correspondingDbLink || !isEqual(link, correspondingDbLink);
  });
  await db.articleFacetLinks.bulkPut(linksToSave);
};

// get more article with offset for MyHone
export const getMoreArticles = async (offset: number) => {
  const articles = await db.articles.offset(offset).limit(PAGE_SIZE).reverse().sortBy("date");

  return articles;
};
