import Dexie from "dexie";
import { Article, Facet } from "../types/types";
import { EditorState } from "draft-js";
import { FACET_TITLE_SYMBOL } from "../utils/constants";
import { getCurrentDate } from "../utils/utils";
import React from "react";

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

export const assembleFacets = async (
  editorState: EditorState,
  articleId: string,
  prevFacetsText: Map<string, string>,
  setPrevFacetsText: React.Dispatch<React.SetStateAction<Map<string, string>>>
): Promise<Facet[]> => {
  const contentBlocks = editorState.getCurrentContent().getBlocksAsArray();
  const facets: Facet[] = [];
  let currentFacet: Facet | null = null;

  for (const block of contentBlocks) {
    const isFacetTitle = block.getText().startsWith(FACET_TITLE_SYMBOL);
    const isLastBlock = block === contentBlocks[contentBlocks.length - 1];
    const facetId = `${articleId}-${block.getKey()}`;

    if (isFacetTitle) {
      if (currentFacet) {
        checkAndUpdateFacet(facetId, currentFacet, prevFacetsText, setPrevFacetsText);
        facets.push(currentFacet);
        currentFacet = null;
      }

      const existingDate = await fetchFadetUpdateAt(facetId);
      currentFacet = {
        facetId,
        title: block.getText(),
        content: "",
        updateAt: existingDate || getCurrentDate(),
      };
      facets.push(currentFacet);
    } else if (currentFacet) {
      currentFacet.content += block.getText() + "\n";
      if (isLastBlock) {
        checkAndUpdateFacet(facetId, currentFacet, prevFacetsText, setPrevFacetsText);
        facets.push(currentFacet);
        currentFacet = null;
      }
    }
  }

  return facets;
};

// submit facets to database
export const submitFacets = async (
  articleId: string,
  editorState: EditorState,
  prevFacetsText: Map<string, string>,
  setPrevFacetsText: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const article = await db.articles.get(articleId);
  if (!article) return;
  const facets = await assembleFacets(editorState, articleId, prevFacetsText, setPrevFacetsText);
  await syncFacetsToDB(articleId, facets);
};

const syncFacetsToDB = async (articleId: string, newFacets: Facet[]) => {
  const existingFacets = await db.facets.where("articleId").equals(articleId).toArray();
  const newFacetsId = newFacets.map((facet) => facet.facetId);

  for (const facet of existingFacets) {
    if (!newFacetsId.includes(facet.facetId)) {
      await db.facets.delete(facet.facetId);
    }
  }

  for (const facet of newFacets) {
    await db.facets.put(facet);
  }
};

const fetchFadetUpdateAt = async (facetId: string) => {
  const facet = await db.facets.get(facetId);
  return facet?.updateAt;
};

const checkAndUpdateFacet = (
  facetId: string,
  currentFacet: Facet,
  prevFacetsText: Map<string, string>,
  setPrevFacetsText: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const facetPlainText = currentFacet.title + "\n" + currentFacet?.content?.trim();
  const prevText = prevFacetsText.get(facetId);

  if (prevText !== facetPlainText) {
    currentFacet.updateAt = getCurrentDate();
    setPrevFacetsText((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.set(facetId, facetPlainText);
      return newMap;
    });
    return currentFacet;
  }
};
