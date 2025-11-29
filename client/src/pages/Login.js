import React, { useContext, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Box, Typography, TextField, Button, Link, Alert, Checkbox, FormControlLabel, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { FiEye, FiEyeOff, FiGithub, FiLogIn } from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const { resendVerification } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [unverified, setUnverified] = useState(false);
  const [resendMsg, setResendMsg] = useState(null);
  const navigate = useNavigate();

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
  const [termsChecked, setTermsChecked] = useState(false);
  const [termsError, setTermsError] = useState(null);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setResendMsg(null);
    setTermsError(null);

    // client-side validation for Terms & Conditions
    if (!termsChecked) {
      setTermsError('You must agree to the Terms & Conditions to continue');
      return;
    }
    setLoading(true);
    try {
      await login(formData.email, formData.password, { termsAccepted: true, remember });
      navigate('/');
    } catch (err) {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.msg || 'Invalid credentials';
      if (code === 'EMAIL_NOT_VERIFIED') {
        setUnverified(true);
        setError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg(null);
    try {
      await resendVerification(formData.email);
      setResendMsg('Verification email resent. Check your inbox.');
    } catch (err) {
      setResendMsg(err?.response?.data?.msg || 'Unable to resend verification');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-logo">I</div>
          <div className="brand-title">Investara Clone</div>
          <div className="brand-sub">Fast, simple trading dashboard — demo application</div>
          <div style={{ marginTop: 12 }}>
            <Button size="small" variant="outlined" onClick={toggleTheme} className="social-btn">Toggle {theme === 'dark' ? 'Light' : 'Dark'}</Button>
          </div>
        </div>
        <div className="login-form">
          <h2>Sign in to your account</h2>
          <Box component="form" onSubmit={onSubmit} className="login-fields" noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={onChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={onChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(s => !s)} edge="end">
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} color="primary" />} label="Remember me" />
            <Link component={RouterLink} to="/forgot" variant="body2">Forgot password?</Link>
          </Box>
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  color="primary"
                  inputProps={{ 'aria-label': 'Agree to Terms and Conditions' }}
                />
              }
              label={<span>I agree to the <Link href="/terms" target="_blank" rel="noopener">Terms &amp; Conditions</Link></span>}
            />
          </Box>
          {termsError && <Alert severity="error" sx={{ mt: 1 }}>{termsError}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
          {unverified && (
            <Box sx={{ mt: 2 }}>
              <Button fullWidth variant="outlined" onClick={handleResend} disabled={!formData.email}>
                Resend verification email
              </Button>
              {resendMsg && <Alert sx={{ mt: 1 }} severity="info">{resendMsg}</Alert>}
            </Box>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <FiLogIn />}
          >
            {loading ? 'Signing in…' : 'Login'}
          </Button>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 1 }}>
            <Button variant="outlined" startIcon={<FaGoogle />} size="small">Google</Button>
            <Button variant="outlined" startIcon={<FiGithub />} size="small">GitHub</Button>
          </Box>
          <Link component={RouterLink} to="/register" variant="body2">
            {"Don't have an account? Register"}
          </Link>
        </Box>
      </div>
    </div>
  </div>
  );
};

export default Login;
