import { Modal, Tab, Nav } from 'react-bootstrap';
import LoginForm from './LoginForm';
import SignUpForm from './SignupForm';

const AuthModal = ({ show, handleClose }) => {
  return (
    <Modal
      size='md'
      show={show}
      onHide={handleClose}
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
              <LoginForm handleModalClose={handleClose} />
            </Tab.Pane>
            <Tab.Pane eventKey='signup'>
              <SignUpForm handleModalClose={handleClose} />
            </Tab.Pane>
          </Tab.Content>
        </Modal.Body>
      </Tab.Container>
    </Modal>
  );
};

export default AuthModal;