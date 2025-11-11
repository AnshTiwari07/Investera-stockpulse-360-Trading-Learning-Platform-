import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const { register } = useContext(AuthContext);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', panCard: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError('Registration failed');
    }
  };

  return (
    <section className="form-container">
      <h1>Register</h1>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-group">
          <input type="text" placeholder="Name" name="name" value={formData.name} onChange={onChange} required />
        </div>
        <div className="form-group">
          <input type="email" placeholder="Email" name="email" value={formData.email} onChange={onChange} required />
        </div>
        <div className="form-group">
          <input type="password" placeholder="Password" name="password" value={formData.password} onChange={onChange} required />
        </div>
        <div className="form-group">
          <input type="text" placeholder="Phone" name="phone" value={formData.phone} onChange={onChange} />
        </div>
        <div className="form-group">
          <input type="text" placeholder="PAN" name="panCard" value={formData.panCard} onChange={onChange} />
        </div>
        {error && <small className="form-text" style={{ color: 'red' }}>{error}</small>}
        <input type="submit" className="btn btn-primary" value="Create account" />
      </form>
      <p className="form-text">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </section>
  );
};

export default Register;