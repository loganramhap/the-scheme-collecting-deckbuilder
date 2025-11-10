import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { giteaService } from '../services/gitea';
import type { GiteaPullRequest, GiteaBranch } from '../types/gitea';

export default function PullRequests() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const [prs, setPrs] = useState<GiteaPullRequest[]>([]);
  const [branches, setBranches] = useState<GiteaBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePR, setShowCreatePR] = useState(false);
  const [prTitle, setPrTitle] = useState('');
  const [prBody, setPrBody] = useState('');
  const [headBranch, setHeadBranch] = useState('');
  const [baseBranch, setBaseBranch] = useState('main');

  useEffect(() => {
    const loadData = async () => {
      if (!owner || !repo) return;

      try {
        const [pullRequests, repoBranches] = await Promise.all([
          giteaService.getPullRequests(owner, repo, 'all'),
          giteaService.getBranches(owner, repo),
        ]);
        setPrs(pullRequests);
        setBranches(repoBranches);
      } catch (error) {
        console.error('Failed to load PRs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [owner, repo]);

  const handleCreatePR = async () => {
    if (!owner || !repo || !prTitle.trim() || !headBranch) return;

    try {
      await giteaService.createPullRequest(owner, repo, prTitle, headBranch, baseBranch, prBody);
      const pullRequests = await giteaService.getPullRequests(owner, repo, 'all');
      setPrs(pullRequests);
      setShowCreatePR(false);
      setPrTitle('');
      setPrBody('');
      setHeadBranch('');
    } catch (error) {
      console.error('Failed to create PR:', error);
      alert('Failed to create pull request');
    }
  };

  const handleMergePR = async (index: number) => {
    if (!owner || !repo) return;

    try {
      await giteaService.mergePullRequest(owner, repo, index);
      const pullRequests = await giteaService.getPullRequests(owner, repo, 'all');
      setPrs(pullRequests);
      alert('Pull request merged successfully!');
    } catch (error) {
      console.error('Failed to merge PR:', error);
      alert('Failed to merge pull request');
    }
  };

  if (loading) {
    return <div className="container"><p>Loading pull requests...</p></div>;
  }

  return (
    <div className="container">
      <header style={{ marginBottom: '30px' }}>
        <Link to="/" style={{ color: '#0066cc', textDecoration: 'none' }}>← Back to Dashboard</Link>
        <h1 style={{ marginTop: '10px' }}>Pull Requests - {owner}/{repo}</h1>
      </header>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Pull Requests</h2>
          <button className="btn btn-primary" onClick={() => setShowCreatePR(!showCreatePR)}>
            {showCreatePR ? 'Cancel' : 'New Pull Request'}
          </button>
        </div>

        {showCreatePR && (
          <div className="card" style={{ marginBottom: '20px', background: '#333' }}>
            <h3>Create Pull Request</h3>
            <input
              type="text"
              placeholder="PR Title"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              style={{ width: '100%', marginTop: '10px' }}
            />
            <textarea
              placeholder="Description (optional)"
              value={prBody}
              onChange={(e) => setPrBody(e.target.value)}
              style={{ width: '100%', marginTop: '10px', minHeight: '80px' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>From Branch:</label>
                <select
                  value={headBranch}
                  onChange={(e) => setHeadBranch(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">Select branch...</option>
                  {branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>To Branch:</label>
                <select
                  value={baseBranch}
                  onChange={(e) => setBaseBranch(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleCreatePR}
              disabled={!prTitle.trim() || !headBranch}
              style={{ marginTop: '15px', width: '100%' }}
            >
              Create Pull Request
            </button>
          </div>
        )}

        {prs.length === 0 ? (
          <p>No pull requests found.</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {prs.map((pr) => (
              <div key={pr.id} className="card" style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3>#{pr.number} {pr.title}</h3>
                    <p style={{ color: '#999', fontSize: '14px', marginTop: '5px' }}>
                      {pr.user.username} wants to merge {pr.head.ref} into {pr.base.ref}
                    </p>
                    {pr.body && (
                      <p style={{ marginTop: '10px', fontSize: '14px' }}>{pr.body}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: pr.state === 'open' ? '#4caf50' : pr.state === 'merged' ? '#9c27b0' : '#666',
                      }}
                    >
                      {pr.state}
                    </span>
                    {pr.state === 'open' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleMergePR(pr.number)}
                        style={{ padding: '5px 15px' }}
                      >
                        Merge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
