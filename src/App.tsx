import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ArticleEditor from './ArticleEditor';
// import ArticleList from './ArticleList';
// import FACETs from './FACETs';
import { ArticleIdContext, FacetIdContext } from './types';
import { ErrorBoundary } from 'react-error-boundary';// the lib has useErrorBoundary hook and HOC too, check them out when testing environment is ready

function App() {
  const [articleId, setArticleId] = React.useState<string | null>(null);
  const [facetId, setFacetId] = React.useState<string | null>(null);

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <ArticleIdContext.Provider value={{ articleId, setArticleId }}>
        <FacetIdContext.Provider value={{ facetId, setFacetId }}>
          <Router>
            <div>
              <Routes>
                {/* <Route path="/" element={<ArticleList />} />*/}
                <Route path="/article/:id" element={<ArticleEditor />} />
                {/*<Route path="/FACETs" element={<FACETs />} />*/}
              </Routes>
            </div>
          </Router>
        </FacetIdContext.Provider>
      </ArticleIdContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
