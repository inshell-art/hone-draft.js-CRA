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

import { Facet } from "../types/types";
import { db } from "./indexedDBService";

// get facets from all articles in indexedDB
export const getFacets = async () => {
  const facets = await db.facets.toArray();
  return facets;
};
