import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom"; // Use MemoryRouter for testing
import App from "./App";
import { ErrorBoundary } from "react-error-boundary";

describe("App Routing", () => {
  test("renders FACETs component on root route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    // Assuming FACETs component renders specific text or elements you can query
    expect(screen.getByText(/specific text from FACETs component/i)).toBeInTheDocument();
  });

  test("renders Articles component on /Articles route", () => {
    render(
      <MemoryRouter initialEntries={["/Articles"]}>
        <App />
      </MemoryRouter>
    );

    // Assuming Articles component renders specific text or elements you can query
    expect(screen.getByText(/specific text from Articles component/i)).toBeInTheDocument();
  });

  test("renders HoneEditor component on /article/:articleId route", () => {
    render(
      <MemoryRouter initialEntries={["/article/123"]}>
        <App />
      </MemoryRouter>
    );

    // Assuming HoneEditor component renders specific text or elements you can query
    expect(screen.getByText(/specific text from HoneEditor component/i)).toBeInTheDocument();
  });
});

describe("ErrorBoundary", () => {
  test("renders fallback UI when there is an error in child components", () => {
    // Mock a Child Component to throw an error
    const ProblematicComponent = () => {
      throw new Error("Test error");
    };

    render(
      <MemoryRouter>
        <ErrorBoundary fallback={<div>Something went wrong, please refresh or come back later.</div>}>
          <ProblematicComponent />
        </ErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.getByText(/something went wrong, please refresh or come back later\./i)).toBeInTheDocument();
  });
});
