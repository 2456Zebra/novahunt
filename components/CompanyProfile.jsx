import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CorporateProfile = ({ domain }) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!domain) return;

    const fetchProfile = async () => {
      try {
        // Fetch company info from Wikipedia (free, public API)
        const wikiRes = await axios.get(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(domain)}`
        );

        setProfile({
          logo: `https://logo.clearbit.com/${domain}`, // free logo API
          name: wikiRes.data.title || domain,
          description: wikiRes.data.extract || 'No description available.',
        });
      } catch (err) {
        console.error('CorporateProfile fetch error:', err);
        setProfile({
          logo: `https://logo.clearbit.com/${domain}`,
          name: domain,
          description: 'No description available.',
        });
      }
    };

    fetchProfile();
  }, [domain]);

  if (!domain || !profile) return null;

  return (
    <div className="corporate-profile">
      <div className="profile-card">
        <img src={profile.logo} alt={profile.name} className="company-logo" />
        <h2 className="company-name">{profile.name}</h2>
        <p className="company-description">{profile.description}</p>
      </div>
      <style jsx>{`
        .corporate-profile {
          position: sticky;
          top: 20px;
          width: 350px;
          margin-left: 20px;
        }
        .profile-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(15px);
          border-radius: 20px;
          padding: 20px;
          color: #fff;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .company-logo {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: contain;
          margin-bottom: 15px;
        }
        .company-name {
          font-size: 1.5rem;
          margin: 0 0 10px;
        }
        .company-description {
          font-size: 0.95rem;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default CorporateProfile;
