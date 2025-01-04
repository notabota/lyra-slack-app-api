"use client";

import { Typography, Select as AntSelect, Space, Card, Row, Col, List, Avatar } from 'antd';
import { Trophy, Medal, Award, MessageSquare, Smile, FileText, Activity, GitBranch, GitCommit, GitPullRequest } from 'lucide-react';
import { useCustom } from "@refinedev/core";
import { useState, useEffect } from "react";

const { Title, Text } = Typography;

type InteractivityData = {
  userId: number;
  userName: string | null;
  messageCount: number;
  reactionCount: number;
  fileCount: number;
  totalCount: number;
  image: string | null;
  timespan: "1d" | "7d" | "14d" | "30d" | "all";
};

type GitHubData = {
  userId: number;
  userName: string | null;
  commits: number;
  pullRequests: number;
  reviews: number;
  totalCount: number;
  timespan: "1d" | "7d" | "14d" | "30d" | "all";
};

export default function ListInteractivity() {
  const [timespan, setTimespan] = useState<"1d" | "7d" | "14d" | "30d" | "all">("7d");

  const { data: slackLeaderboardData, isFetching } = useCustom({
    url: `/api/leaderboard/slack?timespan=${timespan}`,
    method: "get",
  });

  const slackUsers: InteractivityData[] = (slackLeaderboardData?.data as InteractivityData[]) ?? [];
  // TODO: Add GitHub data integration
  const githubUsers: GitHubData[] = [
    { userId: 1, userName: "John Doe", commits: 45, pullRequests: 12, reviews: 28, totalCount: 85, timespan: "7d" },
    { userId: 2, userName: "Jane Smith", commits: 38, pullRequests: 8, reviews: 22, totalCount: 68, timespan: "7d" },
    { userId: 3, userName: "Bob Wilson", commits: 32, pullRequests: 6, reviews: 18, totalCount: 56, timespan: "7d" },
    { userId: 4, userName: "Alice Brown", commits: 25, pullRequests: 5, reviews: 15, totalCount: 45, timespan: "7d" }
  ];

  const getStatColor = (index: number) => {
    const colors = ['#f5222d', '#1677ff', '#52c41a', '#722ed1'];
    return colors[index] || '#666';
  };

  const getMedalColor = (index: number) => {
    const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    return colors[index] || '#666';
  };

  const getBackgroundColor = (index: number) => {
    const colors = ['#fff9e6', '#f0f5ff', '#f6ffed'];
    return colors[index] || '#fff';
  };

  const getBorderColor = (index: number) => {
    const colors = ['#ffd700', '#c0c0c0', '#cd7f32'];
    return colors[index] || '#f0f0f0';
  };

  const getRankIcon = (index: number) => {
    const icons = [
      <Trophy key="trophy" size={28} color="#FFD700" />,
      <Medal key="medal" size={28} color="#C0C0C0" />,
      <Award key="award" size={28} color="#CD7F32" />
    ];
    return icons[index] || null;
  };

  const isGitHubUser = (user: InteractivityData | GitHubData): user is GitHubData => 'commits' in user;

  const LeaderboardSection = ({ title, users, isGitHub = false }: { title: string, users: InteractivityData[] | GitHubData[], isGitHub?: boolean }) => (
    <Col span={12}>
      <Title level={4} style={{ textAlign: 'center', marginBottom: '16px' }}>{title}</Title>
      <Row gutter={[8, 8]}>
        {users.map((user, index) => (
          <Col key={user.userId} span={24}>
            <Card
              size="small"
              style={{ background: getBackgroundColor(index), borderColor: getBorderColor(index) }}
              bodyStyle={{ padding: '12px' }}
              loading={isFetching}
            >
              <Row align="middle" gutter={8}>
                <Col span={3}>
                  {index < 3 ? getRankIcon(index) : (
                    <Avatar size="large" style={{ backgroundColor: '#f0f0f0', color: '#666', fontSize: '16px', width: '40px', height: '40px', lineHeight: '40px' }}>
                      {index + 1}
                    </Avatar>
                  )}
                </Col>
                <Col span={9} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar 
                    size={48}
                    style={{ 
                      border: `2px solid ${getBorderColor(index)}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    src={!isGitHubUser(user) ? user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userName}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userName}`}
                    alt={user.userName || 'User avatar'}
                  />
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>{user.userName}</Text>
                    <div><Text type="secondary" style={{ fontSize: '13px' }}>Total: {user.totalCount}</Text></div>
                  </div>
                </Col>
                <Col span={12}>
                  <Row gutter={[8, 8]}>
                    {isGitHub ? (
                      <>
                        <Col span={8} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><GitCommit size={20} color={getStatColor(1)} /><Text style={{ fontSize: '13px' }}>{isGitHubUser(user) ? user.commits : 0}</Text></Col>
                        <Col span={8} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><GitPullRequest size={20} color={getStatColor(2)} /><Text style={{ fontSize: '13px' }}>{isGitHubUser(user) ? user.pullRequests : 0}</Text></Col>
                        <Col span={8} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><GitBranch size={20} color={getStatColor(3)} /><Text style={{ fontSize: '13px' }}>{isGitHubUser(user) ? user.reviews : 0}</Text></Col>
                      </>
                    ) : (
                      <>
                        <Col span={8} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={20} color={getStatColor(1)} /><Text style={{ fontSize: '13px' }}>{!isGitHubUser(user) ? user.messageCount : 0}</Text></Col>
                        <Col span={8} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Smile size={20} color={getStatColor(2)} /><Text style={{ fontSize: '13px' }}>{!isGitHubUser(user) ? user.reactionCount : 0}</Text></Col>
                        <Col span={8} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} color={getStatColor(3)} /><Text style={{ fontSize: '13px' }}>{!isGitHubUser(user) ? user.fileCount : 0}</Text></Col>
                      </>
                    )}
                  </Row>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>
    </Col>
  );

  return (
    <div style={{ padding: '16px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24} style={{ textAlign: 'center' }}>
          <Title level={3} style={{ marginBottom: '8px' }}>Activity Leaderboards</Title>
          <Space>
            <AntSelect
              value={timespan}
              onChange={(value) => setTimespan(value as typeof timespan)}
              style={{ width: 150 }}
              loading={isFetching}
            >
              <AntSelect.Option value="1d">Last 24 Hours</AntSelect.Option>
              <AntSelect.Option value="7d">Last 7 Days</AntSelect.Option>
              <AntSelect.Option value="14d">Last 14 Days</AntSelect.Option>
              <AntSelect.Option value="30d">Last 30 Days</AntSelect.Option>
              <AntSelect.Option value="all">All Time</AntSelect.Option>
            </AntSelect>
          </Space>
        </Col>
        <LeaderboardSection title="Slack Activity" users={slackUsers} />
        <LeaderboardSection title="GitHub Activity" users={githubUsers} isGitHub />
      </Row>
    </div>
  );
}
