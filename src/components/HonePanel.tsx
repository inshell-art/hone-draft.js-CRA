import { HonePanelProps, Facet } from "../types/types";
import { fetchAllFacets, fetchFacet } from "../services/indexedDBService";
import React, { useState, useEffect } from "react";
import { calculateSimilarityAndSort, jaccardSimilarity, similarityBar } from "../utils/utils";
import { INSERT_PROMPT } from "../utils/constants";
import { set } from "lodash";
import SimilarityBars from "./SimilarityBars";

const HonePanel = ({ isActive, topPosition, onSelectFacet, onClose, currentFacetId }: HonePanelProps) => {
  const [facets, setFacets] = useState<(Facet & { similarity: number })[]>([]);
  const [highlightedFacetIndex, setHighlightedFacetIndex] = useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  // fetch all facets and calculate the similarity
  useEffect(() => {
    const fetchAndCalculateSimilarity = async () => {
      try {
        const allFacets = await fetchAllFacets();
        const otherFacets = allFacets.filter((facet) => facet.facetId !== currentFacetId);
        const currentFacet = allFacets.find((facet) => facet.facetId === currentFacetId);
        const currentFacetText = currentFacet ? `${currentFacet.title} ${currentFacet.content}`.trim() : null;

        if (!currentFacetText) return;

        const facetsWithSimilarity = calculateSimilarityAndSort(currentFacetText, otherFacets);
        setFacets(facetsWithSimilarity);
      } catch (error) {
        console.log("Failed to fetch and calculate similarity:", error);
      }
    };
    fetchAndCalculateSimilarity();
  }, [currentFacetId]);

  // Close panel when click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [onClose]);

  // Close panel when press Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // highlight the facet when press up or down
  useEffect(() => {
    let isKeyHandled = false;

    const activeKeyHandler = () => {
      isKeyHandled = true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isActive && isKeyHandled) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault(); // prevent the scroll of the page
          setHighlightedFacetIndex((prevIndex) => {
            let newIndex: number;
            if (e.key === "ArrowDown") {
              newIndex = Math.min(prevIndex + 1, facets.length - 1);
            } else {
              // e.key === "ArrowUp"
              newIndex = Math.max(prevIndex - 1, 0);
            }

            // Scroll the newly highlighted facet into view
            setTimeout(() => {
              const highlightedElement = document.querySelector(`.facet-item:nth-child(${newIndex + 1})`);
              highlightedElement?.scrollIntoView({ block: "nearest" });
            }, 0);

            return newIndex;
          });
        } else if (e.key === "Enter") {
          onSelectFacet(facets[highlightedFacetIndex].facetId);
        }
      }
    };

    if (isActive) {
      setTimeout(activeKeyHandler, 100);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, highlightedFacetIndex, facets.length, onSelectFacet, facets]);

  if (!isActive) return null;

  // when mouse over the facet, set the highlightedFacetIndex
  const handleMouseOver = (index: number) => {
    setHighlightedFacetIndex(index);
  };

  const passPosition: React.CSSProperties = {
    top: `${topPosition}px`,
  };

  return (
    <div ref={ref} style={passPosition} className="hone-panel">
      <div className="hone-panel-title">{INSERT_PROMPT}</div>
      <div className="hone-panel-content">
        {facets.map((facet, index) => {
          return (
            <div
              key={index}
              className={`facet-item ${index === highlightedFacetIndex ? "highlighted" : ""}`}
              onMouseOver={() => handleMouseOver(index)}
              onClick={() => onSelectFacet(facet.facetId)}
            >
              <SimilarityBars similarity={facet.similarity} />
              <span className="facet-title">{facet.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HonePanel;
