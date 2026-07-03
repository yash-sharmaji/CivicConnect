'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge as StatusBadge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { getLeaderboard, getStoredUser } from '@/lib/mockData';
import { 
  Trophy, 
  Award, 
  Eye, 
  CheckCircle, 
  Zap, 
  ShieldAlert, 
  Flame, 
  Star,
  Users,
  Lock
} from 'lucide-react';

export default function LeaderboardPage() {
  const [user, setUser] = useState(null);
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    getStoredUser().then(setUser);
    getLeaderboard().then(setStandings);
  }, []);

  // Standard unlockable badges list
  const BADGES_GALLERY = [
    {
      id: 'badge-1',
      name: 'Eagle Eye',
      desc: 'Reported your first 5 verified community issues.',
      points: '+50 XP',
      icon: <Eye className="w-5 h-5 text-indigo-400" />,
      requirement: '5 Verified Reports'
    },
    {
      id: 'badge-2',
      name: 'Truth Seeker',
      desc: 'Performed 20 community verifications.',
      points: '+100 XP',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      requirement: '20 Verifications'
    },
    {
      id: 'badge-3',
      name: 'First Responder',
      desc: 'Reported a critical issue within minutes of occurrence.',
      points: '+150 XP',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      requirement: 'Emergency Log'
    },
    {
      id: 'badge-4',
      name: 'Street Builder',
      desc: 'Have 5 of your reported issues fully fixed and resolved.',
      points: '+200 XP',
      icon: <Flame className="w-5 h-5 text-red-400" />,
      requirement: '5 Resolved Issues'
    },
    {
      id: 'badge-5',
      name: 'Pothole Specialist',
      desc: 'Verify or log 10 road damage incidents.',
      points: '+75 XP',
      icon: <ShieldAlert className="w-5 h-5 text-orange-400" />,
      requirement: '10 Road Logs'
    },
    {
      id: 'badge-6',
      name: 'Town Ambassador',
      desc: 'Reach top 3 standings on the local community board.',
      points: '+500 XP',
      icon: <Star className="w-5 h-5 text-yellow-400" />,
      requirement: 'Rank #1 - #3',
      locked: true
    }
  ];

  const nextTierPoints = 600;
  const userProgress = user ? Math.min(100, (user.points / nextTierPoints) * 100) : 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Trophy className="w-8 h-8 text-amber-400" />
          Community Leaderboard
        </h1>
        <p className="text-sm text-gray-400 mt-1">Get recognized for reporting hazards, verifying concerns, and helping keep Metro City safe.</p>
      </div>

      {/* User Tier Standing Card */}
      {user && (
        <Card glow className="bg-gradient-to-r from-[#0b0b0e]/90 to-indigo-950/15 border-indigo-500/20">
          <CardContent className="pt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-indigo-500 bg-[#0f0f13] flex-shrink-0">
                <img src={user.avatar} alt="Avatar" className="w-full h-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{user.name}</h3>
                  <StatusBadge variant="glass" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                    Rank #4
                  </StatusBadge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{user.rank} • {user.points} Total Points</p>
              </div>
            </div>

            <div className="flex-1 max-w-md space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-400">Next Rank: Neighborhood Marshal</span>
                <span className="text-indigo-400">{user.points} / {nextTierPoints} XP</span>
              </div>
              <Progress value={userProgress} color="primary" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Rankings List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Top Citizens Standing
            </h3>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Updated 1m ago</span>
          </div>

          <Card className="bg-[#0b0b0e]/70 border-white/5 p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-4.5 px-6 w-16 text-center">Rank</th>
                    <th className="py-4.5 px-6">Citizen</th>
                    <th className="py-4.5 px-6 text-center">Reports</th>
                    <th className="py-4.5 px-6 text-center">Verifications</th>
                    <th className="py-4.5 px-6 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                  {standings.map((stand) => (
                    <tr key={stand.rank} className={`hover:bg-white/2 transition-colors ${stand.name === user?.name ? 'bg-indigo-500/5' : ''}`}>
                      <td className="py-4 px-6 text-center">
                        <span className={`
                          inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold
                          ${stand.rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            stand.rank === 2 ? 'bg-gray-300/20 text-gray-300 border border-gray-300/30' :
                            stand.rank === 3 ? 'bg-amber-700/20 text-amber-600 border border-amber-600/30' :
                            'text-gray-500'
                          }
                        `}>
                          {stand.rank}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full overflow-hidden border border-white/5 bg-[#0f0f13] flex-shrink-0">
                            <img src={stand.avatar} alt={stand.name} className="w-full h-full" />
                          </div>
                          <div>
                            <span className="font-bold text-white">{stand.name}</span>
                            {stand.name === user?.name && (
                              <span className="ml-1.5 text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1 py-0.5 rounded uppercase font-extrabold tracking-wide">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-gray-400">{stand.reports}</td>
                      <td className="py-4 px-6 text-center text-gray-400">{stand.verifications}</td>
                      <td className="py-4 px-6 text-right font-bold text-indigo-400">{stand.points} XP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Achievements & Badges */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            Badges Gallery
          </h3>

          <div className="grid gap-3.5">
            {BADGES_GALLERY.map((badge) => {
              // Check if user has earned badge
              const isEarned = user?.badges.some(b => b.name === badge.name) || !badge.locked;

              return (
                <Card 
                  key={badge.id} 
                  className={`
                    transition-all border p-4
                    ${isEarned 
                      ? 'bg-[#0b0b0e]/70 border-white/5' 
                      : 'bg-black/40 border-white/2 opacity-60'
                    }
                  `}
                >
                  <div className="flex gap-4">
                    <div className={`
                      h-11 w-11 rounded-xl flex items-center justify-center border flex-shrink-0
                      ${isEarned 
                        ? 'bg-indigo-500/10 border-indigo-500/25' 
                        : 'bg-white/2 border-white/5 text-gray-600'
                      }
                    `}>
                      {isEarned ? badge.icon : <Lock className="w-4 h-4 text-gray-600" />}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-white">{badge.name}</h4>
                          <span className="text-[9px] font-black text-indigo-400 tracking-wide uppercase">
                            {badge.points}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 leading-normal">{badge.desc}</p>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-gray-500 mt-2.5 pt-2 border-t border-white/2">
                        <span>Target: {badge.requirement}</span>
                        {isEarned ? (
                          <span className="text-emerald-400 font-bold uppercase tracking-wider">Unlocked</span>
                        ) : (
                          <span className="text-gray-500 font-bold uppercase tracking-wider">Locked</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
