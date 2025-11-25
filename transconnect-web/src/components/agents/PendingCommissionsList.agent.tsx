'use client';
import React from 'react';

export default function PendingCommissionsList({ items = [] }: any) {
  if (!items.length) {
    return (
      <div className="p-4 border rounded">
        <h3 className="font-semibold">Recent Commissions</h3>
        <p className="mt-2 text-gray-500 text-sm">No commissions yet. Start referring to earn!</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-3">Recent Commissions</h3>
      <ul className="space-y-2">
        {items.slice(0, 5).map((item: any, index: number) => (
          <li key={item.id || index} className="flex items-center justify-between py-2 border-b last:border-b-0">
            <div className="flex-1">
              <div className="text-sm font-medium">{item.description || 'Commission'}</div>
              <div className="text-xs text-gray-500">
                {item.date ? new Date(item.date).toLocaleDateString() : 'Recent'}
                {item.level && ` • Level ${item.level}`}
              </div>
            </div>
            <div className="font-mono text-green-600 font-semibold">
              +UGX {(item.amount || 0).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
      {items.length > 5 && (
        <p className="text-xs text-gray-500 mt-2">Showing 5 of {items.length} commissions</p>
      )}
    </div>
  );
}