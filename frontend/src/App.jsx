import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Applications from './pages/Applications';
import Skills from './pages/Skills';
import SkillTypes from './pages/SkillTypes';
import SupportStatus from './pages/SupportStatus';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Applications />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/skill-types" element={<SkillTypes />} />
          <Route path="/support-status" element={<SupportStatus />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;