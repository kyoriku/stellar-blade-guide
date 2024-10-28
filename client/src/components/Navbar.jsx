import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Nav, Container, Modal, Tab, Button } from 'react-bootstrap';
import SignUpForm from './SignupForm';
import LoginForm from './LoginForm';
import Auth from '../utils/auth';

const AppNavbar = () => {
  // set modal display state
  const [showModal, setShowModal] = useState(false);

  const handleNavLinkClick = () => {
    if (window.innerWidth < 767) { // Close navbar if screen size is less than to 768px (Bootstrap md breakpoint)
      const navbarToggler = document.querySelector('.navbar-toggler'); // Select the navbar toggler button
      if (navbarToggler) { // If the navbar toggler button is found
        navbarToggler.click(); // Simulate click on navbar toggler button
      }
    }
  };

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
            </Nav>
            <Nav className="ms-auto">
              {Auth.loggedIn() ? (
                <Button variant="outline-light" onClick={Auth.logout} className="ms-4">
                  Logout
                </Button>
              ) : (
                <Button variant="outline-light" onClick={() => setShowModal(true)} className="ms-4">
                  Login
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Modal
        size='md'
        show={showModal}
        onHide={() => setShowModal(false)}
        aria-labelledby='signup-modal'>
        <Tab.Container defaultActiveKey='login'>
          <Modal.Header closeButton>
            <Modal.Title id='signup-modal'>
              <Nav variant='pills'>
                <Nav.Item>
                  <Nav.Link eventKey='login'>Login</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey='signup'>Sign Up</Nav.Link>
                </Nav.Item>
              </Nav>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Tab.Content>
              <Tab.Pane eventKey='login'>
                <LoginForm handleModalClose={() => setShowModal(false)} />
              </Tab.Pane>
              <Tab.Pane eventKey='signup'>
                <SignUpForm handleModalClose={() => setShowModal(false)} />
              </Tab.Pane>
            </Tab.Content>
          </Modal.Body>
        </Tab.Container>
      </Modal>
    </>
  );
};

export default AppNavbar;