import Dexie from "dexie";
import { Article, Facet } from "../types/types";
import { ContentBlock, EditorState, genKey } from "draft-js";
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
      facets: "facetId, articleId, title, updateAt, honingFacetsId, honedFacetsId",
    }); // TODO: omitting contentsId but didn't upgrade the version, will integrate it later

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

// #region functions to submit facets to database
const fetchFadetUpdateAt = async (facetId: string) => {
  const facet = await db.facets.get(facetId);
  return facet?.updateAt;
};

const updateAtIfFacetIsChanged = (
  facetId: string,
  currentFacet: Facet,
  prevFacetsText: Map<string, string>,
  setPrevFacetsText: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const facetPlainText = currentFacet.title.trim() + "\n" + currentFacet?.content?.trim();
  const prevText = prevFacetsText.get(facetId);

  if (prevText !== facetPlainText) {
    currentFacet.updateAt = getCurrentDate();
    console.log("updateAt is updated:", facetPlainText, currentFacet.updateAt);
    setPrevFacetsText((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.set(facetId, facetPlainText);
      return newMap;
    });
    return currentFacet;
  }
};

const assembleFacets = async (
  editorState: EditorState,
  articleId: string,
  prevFacetsText: Map<string, string>,
  setPrevFacetsText: React.Dispatch<React.SetStateAction<Map<string, string>>>
): Promise<Facet[]> => {
  const contentBlocks = editorState.getCurrentContent().getBlocksAsArray();
  const facets: Facet[] = [];
  let currentFacet: Facet | null = null;

  let index = 0;
  for (const block of contentBlocks) {
    const isFacetTitle = block.getText().startsWith(FACET_TITLE_SYMBOL);
    const isLastBlock = block === contentBlocks[contentBlocks.length - 1];
    const facetId = `${articleId}-${block.getKey()}`;
    const existingDate = await fetchFadetUpdateAt(facetId);
    console.log(`Block ${index}`);
    index++;
    console.log("currentFacet:", currentFacet);
    console.log(block.getText(), "existingDate:", existingDate);

    if (isFacetTitle) {
      if (currentFacet) {
        updateAtIfFacetIsChanged(facetId, currentFacet, prevFacetsText, setPrevFacetsText);
        console.log("AAA", currentFacet.title, currentFacet.updateAt);
        facets.push(currentFacet);
        currentFacet = null;
      }

      currentFacet = {
        facetId,
        articleId,
        title: block.getText(),
        content: "",
        updateAt: existingDate || getCurrentDate(),
      };
      console.log("BBB", currentFacet.title, currentFacet.updateAt);
    } else if (currentFacet) {
      currentFacet.content += block.getText() + "\n";
      if (isLastBlock) {
        updateAtIfFacetIsChanged(facetId, currentFacet, prevFacetsText, setPrevFacetsText);
        console.log("CCC", currentFacet.title, currentFacet.updateAt);
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

export const submitFacets = async (
  articleId: string,
  editorState: EditorState,
  prevFacetsText: Map<string, string>,
  setPrevFacetsText: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const article = await db.articles.get(articleId);
  if (!article) return;
  const facets = await assembleFacets(editorState, articleId, prevFacetsText, setPrevFacetsText);
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
