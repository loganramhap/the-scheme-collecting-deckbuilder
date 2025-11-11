import React, { useMemo, useState, useEffect } from 'react';
import type { DeckCommit, DeckBranch } from '../../types/versioning';

interface VersionTimelineProps {
  commits: DeckCommit[];
  branches?: DeckBranch[];
  currentCommit?: string;
  selectedCommits?: string[];
  onSelectCommit?: (sha: string) => void;
}

interface TimelineNode {
  commit: DeckCommit;
  x: number;
  y: number;
  branch: string;
  isMerge: boolean;
}

interface TimelineLine {
  from: { x: number; y: number };
  to: { x: number; y: number };
  branch: string;
}

const NODE_RADIUS = 8;
const NODE_SPACING_Y = 80;
const BRANCH_SPACING_X = 60;
const PADDING = 40;

/**
 * Visual timeline component that displays commit history as an SVG graph
 * Based on Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */
export const VersionTimeline: React.FC<VersionTimelineProps> = ({
  commits,
  branches = [],
  currentCommit,
  selectedCommits = [],
  onSelectCommit,
}) => {
  const [hoveredCommit, setHoveredCommit] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  // Defer rendering until component is mounted (next tick)
  useEffect(() => {
    const timer = setTimeout(() => setIsRendered(true), 0);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Calculate timeline layout with nodes and connecting lines
   * Only calculate when component is ready to render
   */
  const { nodes, lines, width, height } = useMemo(() => {
    if (!isRendered) {
      return { nodes: [], lines: [], width: 400, height: 200 };
    }
    if (commits.length === 0) {
      return { nodes: [], lines: [], width: 400, height: 200 };
    }

    const timelineNodes: TimelineNode[] = [];
    const timelineLines: TimelineLine[] = [];
    
    // Track branch positions
    const branchPositions = new Map<string, number>();
    let nextBranchX = PADDING;

    // Main branch always at position 0
    branchPositions.set('main', PADDING);

    // Process commits in reverse chronological order (newest first)
    commits.forEach((commit, index) => {
      // Determine branch for this commit
      let branch = 'main';
      
      // Check if this commit belongs to a specific branch
      for (const b of branches) {
        if (b.commit.sha === commit.sha) {
          branch = b.name;
          break;
        }
      }

      // Assign x position based on branch
      if (!branchPositions.has(branch)) {
        nextBranchX += BRANCH_SPACING_X;
        branchPositions.set(branch, nextBranchX);
      }

      const x = branchPositions.get(branch) || PADDING;
      const y = PADDING + index * NODE_SPACING_Y;

      // Check if this is a merge commit (has multiple parents)
      const isMerge = commit.parents.length > 1;

      timelineNodes.push({
        commit,
        x,
        y,
        branch,
        isMerge,
      });

      // Draw line to parent commit(s)
      if (index < commits.length - 1) {
        const nextNode = timelineNodes[index - 1];
        if (nextNode) {
          timelineLines.push({
            from: { x, y },
            to: { x: nextNode.x, y: nextNode.y },
            branch,
          });
        }
      }
    });

    // Calculate SVG dimensions
    const maxX = Math.max(...timelineNodes.map(n => n.x), PADDING);
    const maxY = Math.max(...timelineNodes.map(n => n.y), PADDING);
    
    return {
      nodes: timelineNodes,
      lines: timelineLines,
      width: maxX + PADDING * 2,
      height: maxY + PADDING * 2,
    };
  }, [commits, branches]);

  /**
   * Get color for branch
   */
  const getBranchColor = (branch: string): string => {
    if (branch === 'main') {
      return '#3b82f6'; // Blue
    }
    // Generate color based on branch name hash
    const hash = branch.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
  };

  /**
   * Handle node click
   */
  const handleNodeClick = (sha: string) => {
    if (onSelectCommit) {
      onSelectCommit(sha);
    }
  };

  /**
   * Handle node hover
   */
  const handleNodeMouseEnter = (commit: DeckCommit, x: number, y: number) => {
    setHoveredCommit(commit.sha);
    setTooltipPosition({ x, y });
  };

  /**
   * Handle node hover end
   */
  const handleNodeMouseLeave = () => {
    setHoveredCommit(null);
    setTooltipPosition(null);
  };

  /**
   * Format date for tooltip
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Get short SHA
   */
  const getShortSha = (sha: string): string => {
    return sha.substring(0, 7);
  };

  if (commits.length === 0) {
    return (
      <div className="timeline-empty">
        <p>No commits to display</p>
        <style>{`
          .timeline-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            color: #6b7280;
            font-size: 0.875rem;
          }
        `}</style>
      </div>
    );
  }

  // Show loading state while deferring initial render
  if (!isRendered) {
    return (
      <div className="timeline-loading">
        <p>Preparing timeline...</p>
        <style>{`
          .timeline-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            color: #6b7280;
            font-size: 0.875rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="version-timeline">
      <svg
        width={width}
        height={height}
        className="timeline-svg"
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Draw connecting lines */}
        {lines.map((line, index) => (
          <line
            key={`line-${index}`}
            x1={line.from.x}
            y1={line.from.y}
            x2={line.to.x}
            y2={line.to.y}
            stroke={getBranchColor(line.branch)}
            strokeWidth="2"
            strokeOpacity="0.6"
          />
        ))}

        {/* Draw commit nodes */}
        {nodes.map((node) => {
          const isHovered = hoveredCommit === node.commit.sha;
          const isCurrent = currentCommit === node.commit.sha;
          const isSelected = selectedCommits.includes(node.commit.sha);
          const color = getBranchColor(node.branch);

          return (
            <g
              key={node.commit.sha}
              className="timeline-node"
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => handleNodeClick(node.commit.sha)}
              onMouseEnter={() => handleNodeMouseEnter(node.commit, node.x, node.y)}
              onMouseLeave={handleNodeMouseLeave}
              style={{ cursor: 'pointer' }}
            >
              {/* Highlight ring for current or selected commit */}
              {(isCurrent || isSelected) && (
                <circle
                  r={NODE_RADIUS + 6}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  opacity="0.5"
                />
              )}

              {/* Node circle */}
              <circle
                r={NODE_RADIUS}
                fill={(isCurrent || isSelected) ? color : 'white'}
                stroke={color}
                strokeWidth="2"
                className={isHovered ? 'hovered' : ''}
              />

              {/* Merge commit icon */}
              {node.isMerge && (
                <g transform={`translate(-6, -6)`}>
                  <path
                    d="M 6 2 L 10 6 L 6 10 L 2 6 Z"
                    fill={color}
                    stroke="white"
                    strokeWidth="1"
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredCommit && tooltipPosition && (() => {
        const commit = commits.find(c => c.sha === hoveredCommit);
        if (!commit) return null;

        return (
          <div
            className="timeline-tooltip"
            style={{
              left: tooltipPosition.x + 20,
              top: tooltipPosition.y - 10,
            }}
          >
            <div className="tooltip-header">
              <span className="tooltip-sha">{getShortSha(commit.sha)}</span>
              {commit.isAutoSave && (
                <span className="tooltip-badge">Auto-save</span>
              )}
            </div>
            <div className="tooltip-message">{commit.message}</div>
            <div className="tooltip-meta">
              <span>{commit.author.name}</span>
              <span className="tooltip-separator">•</span>
              <span>{formatDate(commit.author.date)}</span>
            </div>
            {commit.changesSummary && (
              <div className="tooltip-changes">
                {commit.changesSummary.cardsAdded > 0 && (
                  <span className="change-stat added">
                    +{commit.changesSummary.cardsAdded}
                  </span>
                )}
                {commit.changesSummary.cardsRemoved > 0 && (
                  <span className="change-stat removed">
                    -{commit.changesSummary.cardsRemoved}
                  </span>
                )}
                {commit.changesSummary.cardsModified > 0 && (
                  <span className="change-stat modified">
                    ~{commit.changesSummary.cardsModified}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })()}

      <style>{`
        .version-timeline {
          position: relative;
          width: 100%;
          overflow: auto;
          background-color: #f9fafb;
          border-radius: 0.5rem;
          padding: 1rem;
        }

        .timeline-svg {
          display: block;
        }

        .timeline-node circle.hovered {
          filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5));
        }

        .timeline-tooltip {
          position: absolute;
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.75rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 10;
          pointer-events: none;
          min-width: 250px;
          max-width: 350px;
        }

        .tooltip-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .tooltip-sha {
          font-family: 'Courier New', monospace;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
        }

        .tooltip-badge {
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          background-color: #fbbf24;
          color: #78350f;
        }

        .tooltip-message {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .tooltip-meta {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .tooltip-separator {
          color: #d1d5db;
        }

        .tooltip-changes {
          display: flex;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .change-stat {
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
        }

        .change-stat.added {
          background-color: #dcfce7;
          color: #166534;
        }

        .change-stat.removed {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .change-stat.modified {
          background-color: #fef3c7;
          color: #92400e;
        }

        /* Scrollbar styling */
        .version-timeline::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .version-timeline::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }

        .version-timeline::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .version-timeline::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};
