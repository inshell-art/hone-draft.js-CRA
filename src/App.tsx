import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Article from './Article';
import ArticleList from './ArticleList';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<ArticleList />} />
          <Route path="/article/:id" element={<Article />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
