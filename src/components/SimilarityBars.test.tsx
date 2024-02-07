import { render, screen } from "@testing-library/react";
import SimilarityBars from "./SimilarityBars";
import "@testing-library/jest-dom";

describe("SimilarityBars Component", () => {
  it("renders similarity bars with correct opacity and similarity value", () => {
    const similarity = 0.5; // Example similarity value
    render(<SimilarityBars similarity={similarity} />);

    // Check if the component renders the correct number of bars (based on your implementation)
    const bars = screen.getAllByText("▮");
    expect(bars.length).toBe(4);

    // Check if the maximum opacity text is rendered correctly
    const maxOpacity = bars.reduce((max, bar) => Math.max(max, parseFloat(bar.style.opacity)), 0).toFixed(2);
    expect(screen.getByText(new RegExp(`${similarity.toFixed(3)} - ${maxOpacity}`))).toBeInTheDocument();
  });

  // Additional tests can be added here to cover other scenarios
});
