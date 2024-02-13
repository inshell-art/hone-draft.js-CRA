import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HonePanel from "./HonePanel";
import { HonePanelProps } from "../types/types";
import * as indexedDBService from "../services/indexedDBService";
import * as utils from "../utils/utils";
import { on } from "events";
import { INSERT_PROMPT } from "../utils/constants";

// Mock the fetchAllFacets and calculateSimilarityAndSort functions
jest.mock("../services/indexedDBService", () => ({
  fetchAllFacets: jest.fn(),
}));
jest.mock("../utils/utils", () => ({
  calculateSimilarityAndSort: jest.fn(),
}));

describe("HonePanel", () => {
  const mockFacets = [
    { facetId: "1", articleId: "article1", title: "Facet1", content: "Content 1" },
    { facetId: "2", articleId: "article2", title: "Facet2", content: "Content 2" },
  ];

  const mockFacetsWithSimilarity = [
    { facetId: "1", articleId: "article1", title: "Facet1", similarity: 0.9 },
    { facetId: "2", articleId: "article2", title: "Facet2", similarity: 0.8 },
  ];

  beforeEach(() => {
    (indexedDBService.fetchAllFacets as jest.Mock).mockResolvedValue(mockFacets);
    (utils.calculateSimilarityAndSort as jest.Mock).mockReturnValue(mockFacetsWithSimilarity);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders when isActive is true", () => {
    render(<HonePanel isActive={true} topPosition={100} onSelectFacet={jest.fn()} onClose={jest.fn()} currentFacetId="1" />);
    expect(screen.getByText(INSERT_PROMPT));
  });

  it("does not render when isActive is false", () => {
    render(<HonePanel isActive={false} topPosition={100} onSelectFacet={jest.fn()} onClose={jest.fn()} currentFacetId="1" />);
    expect(screen.queryByText(INSERT_PROMPT)).toBeNull();
  });

  it("display the facets with similarity", async () => {
    render(<HonePanel isActive={true} topPosition={100} onSelectFacet={jest.fn()} onClose={jest.fn()} currentFacetId="1" />);

    // Wait for the facets to be loaded and displayed
    const facet1 = await screen.findByText("Facet1");
    const facet2 = screen.getByText("Facet2");
    expect(facet1).toBeInTheDocument();
    expect(facet2).toBeInTheDocument();
  });

  it("closes the panel when the Escape key is pressed", async () => {
    const onClose = jest.fn();
    render(<HonePanel isActive={true} topPosition={100} onSelectFacet={jest.fn()} onClose={onClose} currentFacetId="1" />);

    // Simulate pressing the Escape key
    fireEvent.keyDown(document, { key: "Escape" });

    // Check if onClose was called
    expect(onClose).toHaveBeenCalled();
  });

  //todo add test case for rapid key press
  it("highlights the next facet on ArrowDown key press", async () => {
    render(<HonePanel isActive={true} topPosition={100} onSelectFacet={jest.fn()} onClose={jest.fn()} currentFacetId="1" />);

    // Wait for the facets to be loaded and displayed
    const firstFacet = await screen.findByText("Facet 1");

    // Simulate ArrowDown key press to move the highlight to the next facet
    userEvent.type(firstFacet, "{arrowdown}");

    // Check if the next facet is highlighted
    const secondFacet = screen.getByText("Facet 2");
    expect(secondFacet).toHaveClass("highlighted");
  });

  //todo it highlights the facet index when mouse hovers over it
});
