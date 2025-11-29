import React, { useContext, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { emailIsValid, passwordStrength, phoneIsValid } from '../utils/validation';
import './Register.css';

const Register = () => {
  const { register } = useContext(AuthContext);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [panCard, setPanCard] = useState('');
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState(null);

  // Simple math captcha
  const [captchaA] = useState(() => Math.floor(Math.random() * 9) + 1);
  const [captchaB] = useState(() => Math.floor(Math.random() * 9) + 1);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const fileInputRef = useRef();

  const validate = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = 'First name required';
    if (!lastName.trim()) e.lastName = 'Last name required';
    if (!emailIsValid(email)) e.email = 'Enter a valid email';
    if (password.length < 8) e.password = 'Password must be 8+ characters';
    const pwdScore = passwordStrength(password).score;
    if (pwdScore < 3) e.password = 'Password should include upper/lower case, numbers and symbols';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    if (!phoneIsValid(phone)) e.phone = 'Phone number invalid';
    if (parseInt(captchaAnswer, 10) !== captchaA + captchaB) e.captcha = 'Captcha answer is incorrect';
    return e;
  };

  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    // basic client-side size/type checks
    if (!f.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, profileFile: 'Please upload an image' }));
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, profileFile: 'Image too large (max 2MB)' }));
      return;
    }
    setProfileFile(f);
    const reader = new FileReader();
    reader.onload = () => setProfilePreview(reader.result);
    reader.readAsDataURL(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMsg(null);
    const validation = validate();
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('firstName', firstName.trim());
      form.append('lastName', lastName.trim());
      form.append('email', email.trim());
      form.append('password', password);
      form.append('phone', phone.trim());
      form.append('panCard', panCard.trim());
      if (profileFile) form.append('profilePic', profileFile);

      await register(form);
      setSuccessMsg('Registration successful — check your email to verify your account.');
      // navigate('/') // optionally redirect
    } catch (err) {
      const msg = err?.response?.data?.msg || 'Registration failed';
      setErrors({ submit: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="form-container page-fade" aria-labelledby="register-heading">
      <h1 id="register-heading">Create account</h1>
      <form className="form" onSubmit={submit} noValidate>
        <fieldset>
          <legend>Personal information</legend>
          <div className="grid two">
            <label>
              <span>First name</span>
              <input name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required aria-required="true" />
              {errors.firstName && <small className="form-text" role="alert">{errors.firstName}</small>}
            </label>
            <label>
              <span>Last name</span>
              <input name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required aria-required="true" />
              {errors.lastName && <small className="form-text" role="alert">{errors.lastName}</small>}
            </label>
          </div>

          <label>
            <span>Email</span>
            <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required="true" />
            {errors.email && <small className="form-text" role="alert">{errors.email}</small>}
          </label>
        </fieldset>

        <fieldset>
          <legend>Account security</legend>
          <label>
            <span>Password</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input aria-label="Password" type={showPassword ? 'text' : 'password'} name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-pressed={showPassword} aria-label="Toggle password visibility">{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            <small className="form-text">{passwordStrength(password).label}</small>
            {errors.password && <small className="form-text" role="alert">{errors.password}</small>}
          </label>

          <label>
            <span>Confirm password</span>
            <input type={showPassword ? 'text' : 'password'} name="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {errors.confirm && <small className="form-text" role="alert">{errors.confirm}</small>}
          </label>
        </fieldset>

        <fieldset>
          <legend>Additional info</legend>
          <label>
            <span>Phone (optional)</span>
            <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
            {errors.phone && <small className="form-text" role="alert">{errors.phone}</small>}
          </label>

          <label>
            <span>PAN (optional)</span>
            <input name="panCard" value={panCard} onChange={(e) => setPanCard(e.target.value)} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Profile picture</legend>
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} />
            {errors.profileFile && <small className="form-text" role="alert">{errors.profileFile}</small>}
          </div>
          {profilePreview && <img src={profilePreview} alt="Profile preview" style={{ maxWidth: 120, display: 'block', marginTop: 8 }} />}
        </fieldset>

        <fieldset>
          <legend>Human check</legend>
          <label>
            <span>Solve to prove you're human: {captchaA} + {captchaB} = ?</span>
            <input name="captcha" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} inputMode="numeric" />
            {errors.captcha && <small className="form-text" role="alert">{errors.captcha}</small>}
          </label>
        </fieldset>

        {errors.submit && <div role="alert" style={{ color: 'red' }}>{errors.submit}</div>}
        {successMsg && <div role="status" style={{ color: 'green' }}>{successMsg}</div>}

        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </div>
      </form>

      <p className="form-text">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </section>
  );
};

export default Register;