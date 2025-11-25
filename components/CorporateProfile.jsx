import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function CorporateProfile({ domain }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!domain) return;

    setLoading(true);
    axios.get(`/api/company-profile?domain=${domain}`)
      .then(res => setProfile(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [domain]);

  if (!domain) return <div style={{ padding: 16 }}>Select a company to see the profile.</div>;

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;

  if (!profile) return <div style={{ padding: 16 }}>No profile found.</div>;

  return (
    <div style={{ padding: 16, borderLeft: '1px solid #E5E7EB', minWidth: 300 }}>
      <h2 style={{ marginBottom: 8 }}>{profile.name}</h2>
      <p>{profile.description}</p>
      <p><strong>Website:</strong> <a href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a></p>
      <p><strong>Industry:</strong> {profile.industry}</p>
      <p><strong>Location:</strong> {profile.location}</p>
    </div>
  );
}
