import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = ({ handleLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send a POST request to the backend for user registration
      await axios.post('http://localhost:5000/register', { username, password });

      // Automatically log in the user after registration
      const response = await axios.post('http://localhost:5000/login', { username, password });
      const { token, userId } = response.data;
      localStorage.setItem('token', token);
      handleLogin({ userId, username }); // Pass user data to parent
      navigate('/'); // Redirect to notebook list
    } catch (error) {
      console.error('Registration failed:', error.response.data.message);
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn-register" type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
