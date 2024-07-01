import React from 'react';
import { Outlet } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <main className='bg-light'>
      <Outlet />
    </main>
  );
}

export default App