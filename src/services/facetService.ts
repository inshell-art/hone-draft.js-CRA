// #region Description
/**
 *
 * Facet Service includes:
 * syncFacets: sync facets from indexedDB to server
 * getFacets: get facets from indexedDB
 * saveFacets: save facets to indexedDB
 * compareFacets: compare facets from indexedDB and server
 * insertFacets: insert facets to editorState
 *
 */
// #endregion

import { Article, Facet } from "../types/types";
import { db } from "./indexedDBService";
import { RawDraftContentBlock } from "draft-js";
import { FACET_TITLE_SYMBOL, NOT_FACET_SYMBOL } from "../utils/constants";
import { is } from "immutable";

const extractFacetsFromArticle = (article: Article): Facet[] => {
  const rawContent = article.rawContent;
  if (!rawContent) return [];

  const blocks = rawContent.blocks;
  const facets: Facet[] = [];
  let currentFacet: Facet | null = null;

  blocks.forEach((block: RawDraftContentBlock) => {
    const isFacetTitle = block.text.startsWith(FACET_TITLE_SYMBOL);
    const isNotFacet = block.text.startsWith(NOT_FACET_SYMBOL);
    const isLastBlock = block.key === blocks[blocks.length - 1].key;

    if (isFacetTitle) {
      if (currentFacet) {
        facets.push(currentFacet);
        currentFacet = null;
      }

      currentFacet = { articleId: article.articleId, titleId: block.key, contentsId: [] };
      facets.push(currentFacet);
    } else if (currentFacet) {
      if (isNotFacet) return;
      currentFacet.contentsId.push(block.key);
    }

    if (isLastBlock && !isFacetTitle) {
      if (currentFacet) {
        facets.push(currentFacet);
        currentFacet = null;
      }
    }
  });

  return facets;
};

const syncFacetsToDB = async (articleId: string, newFacets: Facet[]) => {
  const existingFacets = await db.facets.where("articleId").equals(articleId).toArray();
  const newFacetsId = newFacets.map((facet) => facet.titleId);

  for (const facet of existingFacets) {
    if (!newFacetsId.includes(facet.titleId)) {
      await db.facets.delete([articleId, facet.titleId]);
    }
  }

  for (const facet of newFacets) {
    await db.facets.put(facet);
  }
};

// sync article with articleId to facets in indexedDB
export const syncFacetsFromArticle = async (articleId: string) => {
  const article = await db.articles.get(articleId);
  if (!article) return;
  console.log(article);
  const facets = extractFacetsFromArticle(article);
  console.log(facets);
  await syncFacetsToDB(articleId, facets);
};
