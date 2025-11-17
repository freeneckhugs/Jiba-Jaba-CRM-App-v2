import React from 'react';

// The logo is embedded as a data URI to avoid needing a separate asset file,
// keeping the entire application self-contained.
const logoDataUri = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3ccircle cx='50' cy='50' r='48' fill='%23007bff'/%3e%3ctext x='50' y='68' font-family='Arial,sans-serif' font-size='50' font-weight='bold' fill='white' text-anchor='middle'%3eJJ%3c/text%3e%3c/svg%3e";

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <img src={logoDataUri} alt="Jiba Jaba Logo" className={className} />
);

export default Logo;