import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import HonePanel from "./HonePanel";
import * as indexedDBService from "../services/indexedDBService";
import * as utils from "../utils/utils";
import { INSERT_PROMPT } from "../utils/constants";
import { Facet, FacetWithSimilarity } from "../types/types";

// Mock necessary imports
jest.mock("../services/indexedDBService", () => ({
  fetchAllFacets: jest.fn(),
}));

jest.spyOn(utils, "calculateSimilarityAndSort");

describe("HonePanel", () => {
  // Setup mock data
  const mockFacets: Facet[] = [
    { facetId: "1", articleId: "article1", title: "Facet1" },
    { facetId: "2", articleId: "article2", title: "Facet2" },
  ];

  const mockFacetsWithSimilarity: FacetWithSimilarity[] = [
    { facetId: "1", articleId: "article1", facetTitle: "Facet1", similarity: 0.9 },
    { facetId: "2", articleId: "article2", facetTitle: "Facet2", similarity: 0.8 },
  ];

  beforeEach(() => {
    // Mock implementation to return the test data
    (indexedDBService.fetchAllFacets as jest.Mock).mockResolvedValue(mockFacets);
    (utils.calculateSimilarityAndSort as jest.Mock).mockReturnValue(mockFacetsWithSimilarity);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders facets correctly when isActive is true and simulate interactions", async () => {
    const onSelectFacet = jest.fn();
    const onClose = jest.fn();

    render(<HonePanel isActive={true} topPosition={100} onSelectFacet={onSelectFacet} onClose={onClose} currentFacetId="1" />);

    // Verify that the panel renders with the expected prompt
    expect(screen.getByText(INSERT_PROMPT)).toBeInTheDocument();

    // Wait for the facets to be fetched and displayed
    await waitFor(() => {
      expect(screen.getByText("Facet1"));
      expect(screen.getByText("Facet2"));
    });

    // Simulate selecting the first facet
    fireEvent.click(screen.getByText("Facet1"));
    expect(onSelectFacet).toHaveBeenCalledWith("1");

    // Simulate closing panel when click outside
    fireEvent.click(document);
    expect(onClose).toHaveBeenCalled();

    // Simulate closing panel when press Esc
    fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render when isActive is false", () => {
    const onSelectFacet = jest.fn();
    const onClose = jest.fn();

    render(<HonePanel isActive={false} topPosition={100} onSelectFacet={onSelectFacet} onClose={onClose} currentFacetId="1" />);
    expect(screen.queryByText(INSERT_PROMPT)).not.toBeInTheDocument();
  });
});
