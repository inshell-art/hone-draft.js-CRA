/**
 * This file contains functions that calculate the similarity between facets
 *
 * @facets
 */

import { db, fetchAllFacets } from "./indexedDBService";
import { Facet } from "../types/types";

export const jaccardSimilarity = (a: string, b: string) => {
  const aSet = new Set(a.split(" "));
  const bSet = new Set(b.split(" "));
  const intersection = new Set([...aSet].filter((x) => bSet.has(x)));
  const union = new Set([...aSet, ...bSet]);
  return intersection.size / union.size;
};
