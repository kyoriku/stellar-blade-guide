import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import SignUpForm from './SignupForm';
import LoginForm from './LoginForm';
import Auth from '../utils/auth';
import AuthModal from './AuthModal';

const AppNavbar = () => {
  const [showModal, setShowModal] = useState(false);

  const handleNavLinkClick = () => {
    if (window.innerWidth < 767) {
      const navbarToggler = document.querySelector('.navbar-toggler');
      if (navbarToggler) {
        navbarToggler.click();
      }
    }
  };

  const user = Auth.loggedIn() ? Auth.getProfile()?.data : null;
  const isAdmin = user?.isAdmin;
  
  console.log('Current user:', user);
  console.log('Is admin:', isAdmin);

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="navbar-dark">
        <Container fluid className="mx-3">
          <Navbar.Brand as={Link} to="/">
            Stellar Blade Guide
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarNav" />
          <Navbar.Collapse id="navbarNav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/main-story" className="ms-4" onClick={handleNavLinkClick}>
                Main Story
              </Nav.Link>
              <Nav.Link as={Link} to="/side-quests" className="ms-4" onClick={handleNavLinkClick}>
                Side Quests
              </Nav.Link>
              <Nav.Link as={Link} to="/collectibles/eidos-7" className="ms-4" onClick={handleNavLinkClick}>
                Collectibles
              </Nav.Link>
              {isAdmin && (
                <Nav.Link as={Link} to="/admin" className="ms-4" onClick={handleNavLinkClick}>
                  Admin Dashboard
                </Nav.Link>
              )}
            </Nav>
            <Nav className="ms-auto">
              {Auth.loggedIn() ? (
                <div className="d-flex align-items-center">
                  {user && (
                    <span className="text-light me-3">
                      Welcome, {user.username}
                      {user.isModerator && ' (MOD)'}
                    </span>
                  )}
                  <Button variant="outline-light" onClick={Auth.logout} className="ms-4">
                    Logout
                  </Button>
                </div>
              ) : (
                <Button variant="outline-light" onClick={() => setShowModal(true)} className="ms-4">
                  Login
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <AuthModal 
        show={showModal}
        handleClose={() => setShowModal(false)}
      />
    </>
  );
};

export default AppNavbar;