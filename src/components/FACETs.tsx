/**
 * the component for the FACETs page
 */

// list all facets in the database

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchAllFacets, fetchAllHoningRecord, fetchFacet } from "../services/indexedDBService";
import { Facet, FacetWithSimilarity, FacetList, HonedFacetWithHoningFacets } from "../types/types";
import { calculateSimilarityAndSort } from "../utils/utils";
import SimilarityBars from "./SimilarityBars";
import _, { set } from "lodash";

const FACETs = () => {
  const [facetList, setFacetList] = useState<FacetList>([]);

  useEffect(() => {
    (async () => {
      try {
        const allFacets = await fetchAllFacets();
        const allHoningRecords = await fetchAllHoningRecord();

        const aggregatedFacets: FacetList = allFacets.map((facet) => {
          const honingRecordForFacet = allHoningRecords.filter((record) => record.honedFacetId === facet.facetId) || [];
          const currentFacetText = `${facet.title} ${facet.content}`.trim();
          let sortedHoningFacets: FacetWithSimilarity[] = [];

          const honingFacets = honingRecordForFacet
            .map((record) => {
              return allFacets.find((facet) => facet.facetId === record.honingFacetId);
            })
            .filter((facet): facet is Facet => facet !== undefined); // find will get the first one only so don't have to worry about multiple honing facets

          if (honingFacets.length > 0) {
            sortedHoningFacets = calculateSimilarityAndSort(currentFacetText, honingFacets);
          }

          return { honedFacet: facet, honingFacets: sortedHoningFacets };
        });
        // sort the aggregatedFacets by the times of honed
        const sortedAggregatedFacets = _.orderBy(
          aggregatedFacets,
          [(aggregatedFacet) => aggregatedFacet.honingFacets.length, (aggregatedFacet) => aggregatedFacet.honedFacet.title],
          ["desc", "asc"]
        );

        setFacetList(sortedAggregatedFacets);
      } catch (error) {
        console.log("Failed to fetch facets to create facet list:", error);
      }
    })();
  }, []);

  return (
    <div>
      <div className="FACETs">
        {facetList.map((facet) => (
          <div key={facet.honedFacet.facetId} className="honed-facet">
            <Link to={`/article/${facet.honedFacet.articleId}`}>{facet.honedFacet.title}</Link>
            <div className="honing-facet">
              {facet.honingFacets.map((honingFacet) => (
                <div key={honingFacet.facetId}>
                  <SimilarityBars similarity={honingFacet.similarity} />
                  <Link to={`/article/${honingFacet.articleId}`}>{honingFacet.facetTitle}</Link>
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
