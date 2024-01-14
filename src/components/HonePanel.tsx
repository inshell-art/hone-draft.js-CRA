import { HonePanelProps } from "../types/types";
import { fetchAllFacets } from "../services/indexedDBService";
import { Facet } from "../types/types";
import React, { useState, useEffect } from "react";

const HonePanel = React.forwardRef<HTMLDivElement, HonePanelProps>(({ isActive, topPosition }: HonePanelProps, ref) => {
  const [facets, setFacets] = useState<Facet[]>([]);
  const [highlightedFacetIndex, setHighlightedFacetIndex] = useState(0);

  useEffect(() => {
    fetchAllFacets().then((facets) => {
      setFacets(facets);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        setHighlightedFacetIndex(highlightedFacetIndex + 1);
      } else if (e.key === "ArrowUp") {
        setHighlightedFacetIndex(highlightedFacetIndex - 1);
      } else if (e.key === "Enter") {
        // insert the facet
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [highlightedFacetIndex]);

  // when mouse over the facet, set the highlightedFacetIndex
  const handleMouseOver = (index: number) => {
    setHighlightedFacetIndex(index);
  };

  if (!isActive) return null;

  const passPosition: React.CSSProperties = {
    top: `${topPosition}px`,
  };

  return (
    <div ref={ref} style={passPosition} className="hone-panel">
      <div className="hone-panel-title">Select a facet to insert by enter</div>
      <div className="hone-panel-content">
        {facets.map((facet, index) => (
          <div
            key={index}
            className={`facet-item ${index === highlightedFacetIndex ? "highlighted" : ""}`}
            onMouseOver={() => handleMouseOver(index)}
          >
            {facet.title}
          </div>
        ))}
      </div>
    </div>
  );
});

export default HonePanel;
