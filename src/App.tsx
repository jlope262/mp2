import React from 'react';
import ListView from './pages/ListView';
import GalleryView from './pages/GalleryView';
import DetailView from './pages/DetailView';
import './App.css';
import { Route, Routes, NavLink } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <header className="navbar">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          List
        </NavLink>
        <NavLink to="/gallery" className={({ isActive }) => (isActive ? 'active' : '')}>
          Gallery
        </NavLink>
      </header>

{/* switching happens here */}
      <main className="App-main">
        <Routes>
          <Route path="/" element={<ListView />} />
          <Route path="/gallery" element={<GalleryView />} />
          <Route path="/detail/:date" element={<DetailView />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
