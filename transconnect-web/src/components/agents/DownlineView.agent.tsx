'use client';
import React from 'react';

export default function DownlineView({ downline = [] }: any) {
  if (!downline.length) {
    return (
      <div className="p-4 border rounded">
        <h3 className="font-semibold">Your Network</h3>
        <p className="mt-2 text-gray-500 text-sm">No referrals yet. Share your link to build your network!</p>
      </div>
    );
  }

  // Group by level
  const byLevel = downline.reduce((acc: any, item: any) => {
    const level = item.level || 1;
    if (!acc[level]) acc[level] = [];
    acc[level].push(item);
    return acc;
  }, {});

  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-3">Your Network</h3>
      <div className="space-y-3">
        {Object.entries(byLevel).map(([level, agents]: [string, any]) => (
          <div key={level} className="border-l-4 border-blue-200 pl-3">
            <div className="text-sm font-medium text-blue-800 mb-1">
              Level {level} ({agents.length} {agents.length === 1 ? 'agent' : 'agents'})
            </div>
            <div className="space-y-1">
              {agents.slice(0, 3).map((agent: any, idx: number) => (
                <div key={idx} className="text-sm text-gray-600 flex justify-between">
                  <span>{agent.name || agent.agent || `Agent ${idx + 1}`}</span>
                  <span className="text-xs text-gray-400">
                    {agent.joinDate ? new Date(agent.joinDate).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              ))}
              {agents.length > 3 && (
                <div className="text-xs text-gray-400">
                  +{agents.length - 3} more agents
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
        <div className="font-medium text-blue-800">Commission Rates:</div>
        <div className="text-blue-700 text-xs mt-1">
          Level 1: 10% • Level 2: 5% • Level 3: 2%
        </div>
      </div>
    </div>
  );
}