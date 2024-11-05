import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Container, Table, Button, Badge, Card, Alert, Spinner } from 'react-bootstrap';
import { PersonFill, ShieldFill, ShieldSlashFill } from 'react-bootstrap-icons';
import Auth from '../utils/auth';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [processingUsers, setProcessingUsers] = useState(new Set());

  // Check if current user is kyoriku
  const currentUser = Auth.loggedIn() ? Auth.getProfile()?.data?.username : null;
  if (currentUser !== 'kyoriku') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${Auth.getToken()}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setInitialLoading(false);
    }
  };

  // const toggleModeratorStatus = async (userId) => {
  //   try {
  //     setProcessingUsers(prev => new Set([...prev, userId]));
  //     const response = await fetch(`/api/admin/users/${userId}/toggle-moderator`, {
  //       method: 'PATCH',
  //       headers: {
  //         'Authorization': `Bearer ${Auth.getToken()}`,
  //         'Content-Type': 'application/json'
  //       },
  //     });
      
  //     if (!response.ok) {
  //       const error = await response.json();
  //       throw new Error(error.message || 'Failed to update moderator status');
  //     }
      
  //     const data = await response.json();
      
  //     setUsers(users.map(user => 
  //       user._id === userId 
  //         ? { ...user, isModerator: data.isModerator }
  //         : user
  //     ));
  //   } catch (err) {
  //     console.error('Error toggling moderator status:', err);
  //     setError(err.message || 'Failed to update moderator status');
  //   } finally {
  //     setProcessingUsers(prev => {
  //       const newSet = new Set(prev);
  //       newSet.delete(userId);
  //       return newSet;
  //     });
  //   }
  // };
  const toggleModeratorStatus = async (userId) => {
    try {
      setProcessingUsers(prev => new Set([...prev, userId]));
      const response = await fetch(`/api/admin/users/${userId}/toggle-moderator`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${Auth.getToken()}`,
          'Content-Type': 'application/json'
        },
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update moderator status');
      }
  
      const data = await response.json();
  
      // Update users state with the new moderator status immediately
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, isModerator: data.isModerator }
          : user
      ));
  
      // Update the logged-in user’s profile if their status is changed
      if (userId === Auth.getProfile().data._id) {
        Auth.updateProfile({ ...Auth.getProfile().data, isModerator: data.isModerator });
      }
  
    } catch (err) {
      console.error('Error toggling moderator status:', err);
      setError(err.message || 'Failed to update moderator status');
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };
  

  if (initialLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <ShieldFill className="me-2" size={24} />
            <h4 className="mb-0">User Management Dashboard</h4>
          </div>
          <Badge bg="light" text="dark">
            Admin: {currentUser}
          </Badge>
        </Card.Header>
        
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
              <Button 
                variant="outline-danger" 
                size="sm" 
                className="float-end"
                onClick={() => setError('')}
              >
                Dismiss
              </Button>
            </Alert>
          )}

          <Table responsive hover className="align-middle">
            <thead className="bg-light">
              <tr>
                <th>User</th>
                <th>Email</th>
                <th className="text-center">Moderator Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <PersonFill className="me-2" size={20} />
                      {user.username}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td className="text-center">
                    <Badge bg={user.isModerator ? 'success' : 'secondary'}>
                      {user.isModerator ? (
                        <><ShieldFill className="me-1" />Moderator</>
                      ) : (
                        <><ShieldSlashFill className="me-1" />Regular User</>
                      )}
                    </Badge>
                  </td>
                  <td className="text-center">
                    <Button
                      variant={user.isModerator ? 'outline-danger' : 'outline-success'}
                      size="sm"
                      onClick={() => toggleModeratorStatus(user._id)}
                      disabled={processingUsers.has(user._id)}
                    >
                      {user.isModerator ? (
                        <><ShieldSlashFill className="me-1" />Remove Moderator</>
                      ) : (
                        <><ShieldFill className="me-1" />Make Moderator</>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {users.length === 0 && (
            <Alert variant="info" className="text-center mb-0">
              No users found in the database.
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminPage;