import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Article from './Article';
import List from './List';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<List />} />
          <Route path="/article/:id" element={<Article />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
