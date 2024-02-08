import { render, screen } from "@testing-library/react";
import SimilarityBars from "./SimilarityBars";
import "@testing-library/jest-dom";

describe("SimilarityBars Component", () => {
  it("renders similarity bars with correct amount of bars", () => {
    const similarity = 0.5; // Example similarity value
    render(<SimilarityBars similarity={similarity} />);

    const bars = screen.getAllByText("▮");
    expect(bars.length).toBe(4);
  });
});
