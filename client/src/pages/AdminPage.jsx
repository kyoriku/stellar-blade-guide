import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Container, Table, Button, Badge, Card, Alert, Spinner } from 'react-bootstrap';
import { User, Shield, ShieldOff } from 'lucide-react';
import Auth from '../utils/auth';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [processingUsers, setProcessingUsers] = useState(new Set());

  // Check if current user is admin
  const user = Auth.loggedIn() ? Auth.getProfile()?.data : null;
  if (!user?.isAdmin) {
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

      setUsers(users.map(user =>
        user._id === userId
          ? { ...user, isModerator: data.isModerator }
          : user
      ));

      const currentUser = Auth.getProfile()?.data;
      if (currentUser && currentUser._id === userId) {
        const updatedUserProfile = {
          _id: data.userId,
          username: data.username,
          isModerator: data.isModerator
        };
        Auth.updateProfile(updatedUserProfile);
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
            <Shield className="me-2" size={24} fill="white" />
            <h4 className="mb-0">User Management Dashboard</h4>
          </div>
          <Badge bg="light" text="dark">
            Admin: {user.username}
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
                      <User className="me-2" size={20} />
                      {user.username}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td className="text-center">
                    <Badge bg={user.isModerator ? 'success' : 'secondary'}>
                      {user.isModerator ? (
                        <><Shield className="me-1" size={20} />Moderator</>
                      ) : (
                        <><ShieldOff className="me-1" size={20} />Regular User</>
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
                        <><ShieldOff className="me-1" size={20} />Remove Moderator</>
                      ) : (
                        <><Shield className="me-1" size={20} />Make Moderator</>
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