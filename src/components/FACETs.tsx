/**
 * the component for the FACETs page
 */

// list all facets in the database

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchAllFacets } from "../services/indexedDBService";
import { Facet } from "../types/types";

const FACETs = () => {
  const [facets, setFacets] = useState<Facet[]>([]);
  useEffect(() => {
    fetchAllFacets().then((facets) => {
      setFacets(facets);
    });
  }, []);

  return (
    <div>
      <div className="FACETs">
        {facets.map((facet) => (
          <div key={facet.facetId} className="honed-facet">
            <Link to={`/article/${facet.articleId}`}>{facet.title}</Link>
            <span className="facet-updateAt"> - {facet.updateAt || "undefined"}</span>
            <div className="honing-facet">
              <Link to={`/article/${facet.articleId}`}>[0.712] {facet.title}</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FACETs;
