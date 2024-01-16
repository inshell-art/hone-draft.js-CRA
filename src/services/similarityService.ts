import { db } from "./indexedDBService";
import { Facet } from "../types/types";
import { extractFacet } from "./facetService";

const jaccardSimilarity = (a: string, b: string) => {
  const aSet = new Set(a.split(" "));
  const bSet = new Set(b.split(" "));
  const intersection = new Set([...aSet].filter((x) => bSet.has(x)));
  const union = new Set([...aSet, ...bSet]);
  return intersection.size / union.size;
};

// extract the title string and content strings in all facets from all articles as string[]

const representFacetAsSet = (facet: Facet): Set<string> => {
  const facetSet = new Set<string>();
  //

  return facetSet;
};
