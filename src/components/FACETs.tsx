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
import _ from "lodash";

const FACETs = () => {
  const [facetList, setFacetList] = useState<FacetsList>([]);

  useEffect(() => {
    const facetList = async () => {
      try {
        const allFacets = await fetchAllFacets();
        const allHoningRecords = await fetchAllHoningRecord();

        const aggregatedFacets: FacetList = allFacets.map((facet) => {
          const honingRecordForFacet = allHoningRecords.filter((record) => record.honedFacetId === facet.facetId) || [];
          const deduplicatedHoningRecordForFacet = _.uniqWith(honingRecordForFacet, _.isEqual);

          const currentFacetText = `${facet.title} ${facet.content}`.trim();

          const honingFacets = deduplicatedHoningRecordForFacet.map((record) => {
            return allFacets.find((facet) => facet.facetId === record.honingFacetId);
          }); // TODO: comprehend null check, undefined check, and is it meaningfule to sort an array.length === 0?

          if (honingFacets.length > 0) {
            calculateSimilarityAndSort(currentFacetText, honingFacets);
          }

          return { honedFacet: facet, honingFacets: sortedHoingFacets };
        });
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
