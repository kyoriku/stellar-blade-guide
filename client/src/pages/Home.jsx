// import React from 'react';
// import { Link } from 'react-router-dom';
// import '../styles/Home.css';

// function Home() {
//   return (
//     <div className=''>
//       <div className="banner">
//         <img src="/assets/images/stellar_blade_banner.jpg" alt="Stellar Blade Banner" loading="lazy"/>
//       </div>
//       <div className="content bg-white border">
//         <h1>Stellar Blade Guide</h1>
//         <p>Welcome to the ultimate Stellar Blade walkthrough and collectibles guide.</p>
//         <p>Explore our meticulously crafted guides and enjoy stunning screenshots taken directly from the game.</p>
//         <div className="sections">
//           <div className="section">
//             <h2>Walkthroughs</h2>
//             <ul>
//               <li><Link to="/main-story">Main Story</Link></li>
//               <li><Link to="/side-quests">Side Quests</Link></li>
//             </ul>
//           </div>
//           <div className="section">
//             <h2>Collectibles</h2>
//             <ul>
//               <li><Link to="/collectibles/eidos-7">Eidos 7</Link></li>
//               <li><Link to="/collectibles/xion">Xion</Link></li>
//               <li><Link to="/collectibles/wasteland">Wasteland</Link></li>
//               <li><Link to="/collectibles/altess-levoire">Altess Levoire</Link></li>
//               <li><Link to="/collectibles/matrix-11">Matrix 11</Link></li>
//               <li><Link to="/collectibles/great-desert">Great Desert</Link></li>
//               <li><Link to="/collectibles/abyss-levoire">Abyss Levoire</Link></li>
//               <li><Link to="/collectibles/eidos-9">Eidos 9</Link></li>
//               <li><Link to="/collectibles/spire-4">Spire 4</Link></li>
//             </ul>
//           </div>
//           <div className="section">
//             <h2>Collectibles</h2>
//             <ul>
//               <li><Link to="/collectibles/beta-cores" className="text-decoration-none">Beta Cores</Link></li>
//               <li><Link to="/collectibles/body-cores" className="text-decoration-none">Body Cores</Link></li>
//               <li><Link to="/collectibles/camps" className="text-decoration-none">Camps</Link></li>
//               <li><Link to="/collectibles/cans" className="text-decoration-none">Cans</Link></li>
//               <li><Link to="/collectibles/documents" className="text-decoration-none">Documents</Link></li>
//               <li><Link to="/collectibles/drone-packs" className="text-decoration-none">Drone Packs</Link></li>
//               <li><Link to="/collectibles/earrings" className="text-decoration-none">Earrings</Link></li>
//               <li><Link to="/collectibles/exospines" className="text-decoration-none">Exospines</Link></li>
//               <li><Link to="/collectibles/nano-suits" className="text-decoration-none">Nano Suits</Link></li>
//               <li><Link to="/collectibles/memorysticks" className="text-decoration-none">Memorysticks</Link></li>
//               <li><Link to="/collectibles/passcodes" className="text-decoration-none">Passcodes</Link></li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Home;

import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Map, Compass } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container mx-3">
          <Link className="navbar-brand" to="/">Stellar Blade Guide</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/main-story">Main Story</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/side-quests">Side Quests</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/collectibles/eidos-7">Collectibles</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav> */}

      <main className="flex-grow-1">
        <div className=" m-4">
          <div className="row mb-4">
            <div className="col">
              <img
                src="/assets/images/stellar_blade_banner.jpg"
                alt="Stellar Blade Banner"
                className="img-fluid rounded shadow"
                height="314"
              />
            </div>
          </div>

          <div className="row mb-4">
            <div className="col">
              <div className="card">
                <div className="card-body">
                  <h2 className="card-title">Welcome to the Ultimate Stellar Blade Guide</h2>
                  <p className="card-text">
                    Explore our meticulously crafted walkthrough and collectibles guide. Enjoy stunning
                    screenshots and detailed information to enhance your Stellar Blade experience.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4 mb-4">
              <Section
                title="Walkthroughs"
                icon={<Book className="text-primary" size={32} />}
                links={[
                  { to: "/main-story", text: "Main Story" },
                  { to: "/side-quests", text: "Side Quests" },
                ]}
              />
            </div>
            <div className="col-md-4 mb-4">
              <Section
                title="Locations"
                icon={<Map className="text-success" size={32} />}
                links={[
                  { to: "/collectibles/eidos-7", text: "Eidos 7" },
                  { to: "/collectibles/xion", text: "Xion" },
                  { to: "/collectibles/wasteland", text: "Wasteland" },
                  { to: "/collectibles/altess-levoire", text: "Altess Levoire" },
                  { to: "/collectibles/matrix-11", text: "Matrix 11" },
                  { to: "/collectibles/great-desert", text: "Great Desert" },
                  { to: "/collectibles/abyss-levoire", text: "Abyss Levoire" },
                  { to: "/collectibles/eidos-9", text: "Eidos 9" },
                  { to: "/collectibles/spire-4", text: "Spire 4" },
                ]}
              />
            </div>
            <div className="col-md-4 mb-4">
              <Section
                title="Collectibles"
                icon={<Compass className="text-info" size={32} />}
                links={[
                  { to: "/collectibles/beta-cores", text: "Beta Cores" },
                  { to: "/collectibles/body-cores", text: "Body Cores" },
                  { to: "/collectibles/camps", text: "Camps" },
                  { to: "/collectibles/cans", text: "Cans" },
                  { to: "/collectibles/documents", text: "Documents" },
                  { to: "/collectibles/drone-packs", text: "Drone Packs" },
                  { to: "/collectibles/earrings", text: "Earrings" },
                  { to: "/collectibles/exospines", text: "Exospines" },
                  { to: "/collectibles/nano-suits", text: "Nano Suits" },
                  { to: "/collectibles/memorysticks", text: "Memorysticks" },
                  { to: "/collectibles/passcodes", text: "Passcodes" },
                ]}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-dark text-white py-3 mt-auto">
        <div className="container text-center">
          <p className="mb-0">&copy; 2024 Stellar Blade Guide. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const Section = ({ title, icon, links }) => (
  <div className="card h-100">
    <div className="card-body">
      <div className="d-flex align-items-center mb-3">
        {icon}
        <h3 className="card-title mb-0 ms-2">{title}</h3>
      </div>
      <ul className="list-unstyled">
        {links.map((link, index) => (
          <li key={index}>
            <Link to={link.to} className="text-decoration-none">
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default Home;