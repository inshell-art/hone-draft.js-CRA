/**
 * the component for the FACETs page
 */

// list all facets in the database

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchAllFacets, fetchFacet } from "../services/indexedDBService";
import { Facet, FacetWithSimilarity, FacetsList, HonedFacetWithHoningFacets } from "../types/types";
import { calculateSimilarityAndSort } from "../utils/utils";
import SimilarityBars from "./SimilarityBars";

const FACETs = () => {
  const [facetList, setFacetList] = useState<FacetsList>([]);

  useEffect(() => {
    const facetList = async () => {
      try {
        const allFacets = await fetchAllFacets();

        const facetList: FacetsList = await Promise.all(
          allFacets.map(async (facet) => {
            const currentFacetText = `${facet.title} ${facet.content}`.trim();

            if (facet.honedByArray && facet.honedByArray.length > 0) {
              const honingFacets = (
                await Promise.all(
                  facet.honedByArray.map(async (honedBy) => {
                    const fetchedFacet = await fetchFacet(honedBy.honingFacetId);
                    return fetchedFacet ? fetchedFacet : null;
                  })
                )
              ).filter((facet) => facet !== undefined) as Facet[];

              const sortedHoningFacets = calculateSimilarityAndSort(currentFacetText, honingFacets);

              return {
                honedFacet: facet,
                honingFacets: sortedHoningFacets,
              };
            } else {
              return {
                honedFacet: facet,
                honingFacets: [],
              };
            }
          })
        );

        const sortedFacetList = facetList.sort((a, b) => {
          const aCount = a?.honedFacet.honedByArray?.length ?? 0;
          const bCount = b?.honedFacet.honedByArray?.length ?? 0;
          return bCount - aCount;
        });

        return sortedFacetList;
      } catch (error) {
        console.log("Failed to fetch facets to create facet list:", error);
      }
    };

    facetList().then((facetList) => {
      if (facetList) {
        setFacetList(facetList);
      }
    });
  }, []);

  return (
    <div>
      <div className="FACETs">
        {facetList.map((honedFacetWithHoningFacets) => (
          <div key={honedFacetWithHoningFacets.honedFacet.facetId} className="honed-facet">
            <Link to={`/article/${honedFacetWithHoningFacets.honedFacet.articleId}`}>
              {honedFacetWithHoningFacets.honedFacet.title}
            </Link>
            <div className="honing-facet">
              {honedFacetWithHoningFacets.honingFacets.map((honingFacet) => (
                <div key={honingFacet.facetId}>
                  <SimilarityBars similarity={honingFacet.similarity} />
                  <Link to={`/article/${honingFacet.articleId}`}>{honingFacet.title}</Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FACETs;
