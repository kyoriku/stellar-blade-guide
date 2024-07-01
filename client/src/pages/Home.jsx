import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  return (
    <div className=''>
      <div className="banner">
        <img src="/assets/images/stellar_blade_banner.jpg" alt="Stellar Blade Banner" loading="lazy"/>
      </div>
      <div className="content">
        <h1>Stellar Blade Guide</h1>
        <p>Welcome to the ultimate Stellar Blade walkthrough and collectibles guide.</p>
        <p>Explore our meticulously crafted guides and enjoy stunning screenshots taken directly from the game.</p>
        <div className="sections">
          <div className="section">
            <h2>Walkthroughs</h2>
            <ul>
              <li><Link to="/main-story">Main Story</Link></li>
              <li><Link to="/side-quests">Side Quests</Link></li>
            </ul>
          </div>
          <div className="section">
            <h2>Collectibles</h2>
            <ul>
              <li><Link to="/collectibles/eidos-7">Eidos 7</Link></li>
              <li><Link to="/collectibles/xion">Xion</Link></li>
              <li><Link to="/collectibles/wasteland">Wasteland</Link></li>
              <li><Link to="/collectibles/altess-levoire">Altess Levoire</Link></li>
              <li><Link to="/collectibles/matrix-11">Matrix 11</Link></li>
              <li><Link to="/collectibles/great-desert">Great Desert</Link></li>
              <li><Link to="/collectibles/abyss-levoire">Abyss Levoire</Link></li>
              <li><Link to="/collectibles/eidos-9">Eidos 9</Link></li>
              <li><Link to="/collectibles/spire-4">Spire 4</Link></li>
            </ul>
          </div>
          <div className="section">
            <h2>Nano Suits</h2>
            <ul>
              <li><Link to="/nano-suits" className="text-decoration-none">View All Nano Suits</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
