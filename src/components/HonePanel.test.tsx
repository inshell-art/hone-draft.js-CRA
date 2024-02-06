import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HonePanel from "./HonePanel"; // Adjust the import path as necessary
import * as indexedDBService from "../services/indexedDBService";
import * as utils from "../utils/utils";

// Mock the fetchAllFacets and calculateSimilarityAndSort functions
jest.mock("../services/indexedDBService", () => ({
  fetchAllFacets: jest.fn(),
}));
jest.mock("../utils/utils", () => ({
  calculateSimilarityAndSort: jest.fn(),
}));

describe("HonePanel", () => {
  const mockFacets = [
    { facetId: "1", title: "Facet 1", content: "", similarity: 0.9 },
    { facetId: "2", title: "Facet 2", content: "", similarity: 0.8 },
  ];

  beforeEach(() => {
    // Mock implementation to return the mockFacets
    (indexedDBService.fetchAllFacets as jest.Mock).mockResolvedValue(mockFacets);
    (utils.calculateSimilarityAndSort as jest.Mock).mockImplementation(() => mockFacets);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetches facets and displays them sorted by similarity", async () => {
    render(<HonePanel isActive={true} topPosition={100} onSelectFacet={jest.fn()} onClose={jest.fn()} currentFacetId="1" />);

    // Check if the panel is rendered and positioned correctly
    const panel = await screen.findByRole("dialog");
    expect(panel).toHaveStyle("top: 100px");

    // Check for the presence of facets based on the mock data
    expect(screen.getByText("Facet 1")).toBeInTheDocument();
    expect(screen.getByText("Facet 2")).toBeInTheDocument();
  });

  it("closes the panel when the Escape key is pressed", async () => {
    const onClose = jest.fn();
    render(<HonePanel isActive={true} topPosition={100} onSelectFacet={jest.fn()} onClose={onClose} currentFacetId="1" />);

    // Simulate pressing the Escape key
    fireEvent.keyDown(document, { key: "Escape" });

    // Check if onClose was called
    expect(onClose).toHaveBeenCalled();
  });

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

  // Add more tests as needed...
});
