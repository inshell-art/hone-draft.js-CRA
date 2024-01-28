import Dexie from "dexie";
import { Article, Facet, HoningRecord } from "../types/types";
import { ContentBlock, EditorState, genKey } from "draft-js";
import { FACET_TITLE_SYMBOL } from "../utils/constants";

// Initialize database
class HoneDatabase extends Dexie {
  articles: Dexie.Table<Article, string>;
  facets: Dexie.Table<Facet, string>;
  hongingRecords: Dexie.Table<HoningRecord, number>;

  constructor() {
    super("HoneDatabase");
    this.version(1).stores({
      articles: "articleId",
      facets: "facetId, articleId",
      hongingRecords: "++id, honedFacetId, honingFacetId",
    });

    this.articles = this.table("articles");
    this.facets = this.table("facets");
    this.hongingRecords = this.table("hongingRecords");
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

export const fetchFacet = async (facetId: string) => {
  const facet = await db.facets.get(facetId);
  return facet;
};

export const fetchAllArticles = async () => {
  const articles = await db.articles.toArray();
  return articles;
};

export const fetchAllFacets = async () => {
  const facets = await db.facets.toArray();
  return facets;
};

// #region functions to submit facets to database
const assembleFacets = (editorState: EditorState, articleId: string): Facet[] => {
  const contentBlocks = editorState.getCurrentContent().getBlocksAsArray();
  const facets: Facet[] = [];
  let currentFacet: Facet | null = null;

  for (const block of contentBlocks) {
    const isFacetTitle = block.getText().startsWith(FACET_TITLE_SYMBOL);
    const isLastBlock = block === contentBlocks[contentBlocks.length - 1];
    const facetId = `${articleId}-${block.getKey()}`;

    if (isFacetTitle) {
      if (currentFacet) {
        facets.push(currentFacet);
        currentFacet = null;
      }

      currentFacet = {
        facetId,
        articleId,
        title: block.getText(),
        content: "",
      };
    } else if (currentFacet) {
      currentFacet.content += block.getText() + "\n";
      if (isLastBlock) {
        facets.push(currentFacet);
        currentFacet = null;
      }
    }
  }

  return facets;
};

const updateFacetsToDb = async (articleId: string, newFacets: Facet[]) => {
  const existingFacets = await db.facets.where("articleId").equals(articleId).toArray();
  const newFacetsId = newFacets.map((facet) => facet.facetId);

  for (const facet of existingFacets) {
    if (!newFacetsId.includes(facet.facetId)) {
      await db.facets.delete(facet.facetId);
    }
  }

  for (const facet of newFacets) {
    const existingFacet = existingFacets.find((f) => f.facetId === facet.facetId);
    if (!existingFacet || JSON.stringify(existingFacet) !== JSON.stringify(facet)) {
      await db.facets.put(facet);
    }
  }
};

export const submitFacets = async (articleId: string, editorState: EditorState) => {
  const article = await db.articles.get(articleId);
  if (!article) return;
  const facets = assembleFacets(editorState, articleId);
  await updateFacetsToDb(articleId, facets);
};
// #endregion

// Extract a facet as content blocks from indexedDB by facetId
export const extractFacet = async (facetId: string): Promise<ContentBlock[]> => {
  const facet = await db.facets.get(facetId);
  if (!facet) {
    throw new Error("Error: retrieve facet from indexedDB failed.");
  }

  const titleBlock = new ContentBlock({
    key: genKey(),
    text: facet.title || "",
    type: "unstyled",
  });

  const contentBlocks =
    facet?.content?.split("\n").map((text) => {
      return new ContentBlock({
        key: genKey(),
        text: text,
        type: "unstyled",
      });
    }) || [];

  const facetBlocks = [titleBlock, ...contentBlocks];

  return facetBlocks;
};

/**
 * submit honing record to indexedDB:
 *
 * Honing operation adheres two characteristics:
 * 1. hoing is the relationship could be transitive, and values are equal in different heirarchies
 * 2. Honing is a conscious operation.
 *
 * So, the rules are:
 * Honing is a transitive relation: if A is honedBy B, and B is honedBy C, then A is honedBy C
 * Honing records the intentional insertion/honing only, not the effeictive honing like editing
 * Honing is duplicative: if A honing B twice, then there are two honing records
 *
 *  */
export const submitHoningRecord = async (currentFacetId: string, insertedFacetId: string) => {
  try {
    await db.hongingRecords.put({ honedFacetId: currentFacetId, honingFacetId: insertedFacetId });

    // pass transitive relation to current facet
    const honingFacetsOfInsertedFacet = await db.hongingRecords.where("honedFacetId").equals(insertedFacetId).toArray();

    for (const honingFacet of honingFacetsOfInsertedFacet) {
      await db.hongingRecords.put({ honedFacetId: currentFacetId, honingFacetId: honingFacet.honingFacetId });
    }
  } catch (error) {
    console.log(error);
  }
};

export const fetchAllHoningRecord = async () => {
  const honingRecords = await db.hongingRecords.toArray();
  return honingRecords;
};
