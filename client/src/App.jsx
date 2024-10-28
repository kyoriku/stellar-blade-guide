import React from 'react';
import { Outlet } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { NavLink } from 'react-router-dom';
import Navbar from './components/Navbar';

function App() {
  return (
    <main className='bg-light'>
      <Navbar />
      <Outlet />
    </main>
  );
}

export default App;