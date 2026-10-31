
import React from 'react';
import { Link } from 'react-router-dom';

export const About = () => {
  return (
    <div
      className="about-page container"
      style={{
        paddingTop: '30px',
        paddingBottom: '70px',
        maxWidth: '860px',
      }}
    >
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="separator">&gt;</span>
        <span className="current">About Us</span>
      </nav>

      <div style={{ margin: '30px 0' }}>
        <h1
          style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            marginBottom: '12px',
          }}
        >
          About Sales Savvy
        </h1>

        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.65',
          }}
        >
          Sales Savvy is an e-commerce project designed to make it easy to
          explore and shop for products across different categories in one place.
        </p>
      </div>
    </div>
  );
};

export default About;
