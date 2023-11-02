import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Article from './Article';
import ArticleList from './ArticleList';
import FACETs from './FACETs';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<ArticleList />} />
          <Route path="/article/:id" element={<Article />} />
          <Route path="/FACETs" element={<FACETs />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
