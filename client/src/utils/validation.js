export const emailIsValid = (email) => {
  // Simplified, practical email validation
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  return re.test(String(email).toLowerCase());
};

export const passwordStrength = (password) => {
  let score = 0;
  if (!password) return { score, label: 'Too short' };
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ['Very weak', 'Weak', 'Okay', 'Good', 'Strong', 'Very strong'];
  return { score, label: labels[score] || 'Very weak' };
};

export const phoneIsValid = (phone) => {
  if (!phone) return true; // optional
  const re = /^\+?[0-9]{7,15}$/;
  return re.test(phone);
};
