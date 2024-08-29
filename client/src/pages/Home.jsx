import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  return (
    <div className=''>
      <div className="banner">
        <img src="/assets/images/stellar_blade_banner.jpg" alt="Stellar Blade Banner" loading="lazy"/>
      </div>
      <div className="content bg-white border">
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
            <h2>Collectibles</h2>
            <ul>
              <li><Link to="/collectibles/beta-cores" className="text-decoration-none">Beta Cores</Link></li>
              <li><Link to="/collectibles/body-cores" className="text-decoration-none">Body Cores</Link></li>
              <li><Link to="/collectibles/camps" className="text-decoration-none">Camps</Link></li>
              <li><Link to="/collectibles/cans" className="text-decoration-none">Cans</Link></li>
              <li><Link to="/collectibles/documents" className="text-decoration-none">Documents</Link></li>
              <li><Link to="/collectibles/drone-packs" className="text-decoration-none">Drone Packs</Link></li>
              <li><Link to="/collectibles/earrings" className="text-decoration-none">Earrings</Link></li>
              <li><Link to="/collectibles/exospines" className="text-decoration-none">Exospines</Link></li>
              <li><Link to="/collectibles/nano-suits" className="text-decoration-none">Nano Suits</Link></li>
              <li><Link to="/collectibles/memorysticks" className="text-decoration-none">Memorysticks</Link></li>
              <li><Link to="/collectibles/passcodes" className="text-decoration-none">Passcodes</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
