import { HonePanelProps } from "../types/types";
import { fetchAllFacets } from "../services/indexedDBService";
import { Facet } from "../types/types";
import React, { useState, useEffect } from "react";
import { on } from "events";
import { is } from "immutable";

const HonePanel = ({ isActive, topPosition, onSelectFacet, onClose }: HonePanelProps) => {
  const [facets, setFacets] = useState<Facet[]>([]);
  const [highlightedFacetIndex, setHighlightedFacetIndex] = useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  // fetch all facets
  useEffect(() => {
    fetchAllFacets().then((facets) => {
      setFacets(facets);
    });
  }, []);

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
      <div className="hone-panel-title">Select a facet to insert:</div>
      <div className="hone-panel-content">
        {facets.map((facet, index) => (
          <div
            key={index}
            className={`facet-item ${index === highlightedFacetIndex ? "highlighted" : ""}`}
            onMouseOver={() => handleMouseOver(index)}
            onClick={() => onSelectFacet(facet.facetId)}
          >
            {facet.title}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HonePanel;
