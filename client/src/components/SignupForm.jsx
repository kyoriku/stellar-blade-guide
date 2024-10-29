import { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { createUser } from '../utils/API/user';
import Auth from '../utils/auth';

const SignupForm = ({ handleModalClose }) => {
  const [userFormData, setUserFormData] = useState({ username: '', email: '', password: '' });
  const [validated] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [errorMessages, setErrorMessages] = useState({}); // New state for specific error messages
  const location = useLocation();

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUserFormData({ ...userFormData, [name]: value });
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      const response = await createUser(userFormData);

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrorMessages(errorData.errors); // Set specific field errors
        } else {
          throw new Error('Something went wrong!');
        }
        return;
      }

      const { token, user } = await response.json();
      Auth.login(token, location.pathname); // Pass current path
      handleModalClose(); // Close the modal after successful signup
    } catch (err) {
      console.error(err);
      setShowAlert(true);
    }

    setUserFormData({
      username: '',
      email: '',
      password: '',
    });
  };

  return (
    <>
      <Form noValidate validated={validated} onSubmit={handleFormSubmit}>
        <Alert dismissible onClose={() => setShowAlert(false)} show={showAlert} variant='danger'>
          {showAlert && 'Something went wrong with your signup!'}
        </Alert>

        <Form.Group className='mb-3'>
          <Form.Label htmlFor='username'>Username</Form.Label>
          <Form.Control
            type='text'
            placeholder='Your username'
            name='username'
            onChange={handleInputChange}
            value={userFormData.username}
            required
            isInvalid={!!errorMessages.username}
          />
          <Form.Control.Feedback type='invalid'>
            {errorMessages.username || 'Username is required!'}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className='mb-3'>
          <Form.Label htmlFor='email'>Email</Form.Label>
          <Form.Control
            type='email'
            placeholder='Your email address'
            name='email'
            onChange={handleInputChange}
            value={userFormData.email}
            required
            isInvalid={!!errorMessages.email}
          />
          <Form.Control.Feedback type='invalid'>
            {errorMessages.email || 'Email is required!'}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className='mb-3'>
          <Form.Label htmlFor='password'>Password</Form.Label>
          <Form.Control
            type='password'
            placeholder='Your password'
            name='password'
            onChange={handleInputChange}
            value={userFormData.password}
            required
            isInvalid={!!errorMessages.password}
          />
          <Form.Control.Feedback type='invalid'>
            {errorMessages.password || 'Password is required!'}
          </Form.Control.Feedback>
        </Form.Group>
        <Button
          disabled={!(userFormData.username && userFormData.email && userFormData.password)}
          type='submit'
          variant='success'>
          Submit
        </Button>
      </Form>
    </>
  );
};

export default SignupForm;
