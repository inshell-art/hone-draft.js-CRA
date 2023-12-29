import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const FACETs = () => {
  const facets = useSelector((state: RootState) => state.hone.articles);

  return (
    <div>
      <h2>Component B</h2>
      <ul>{Object.values(facets).map((facet, index) => (facet.title ? <li key={index}>{facet.title}</li> : null))}</ul>
    </div>
  );
};

export default FACETs;
