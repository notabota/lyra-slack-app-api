"use client";

import {
  Typography,
  Select as AntSelect,
  Space,
  Card,
  Row,
  Col,
  List,
  Avatar,
  Modal,
  Form,
  Dropdown,
  Input,
} from "antd";
import {
  Trophy,
  Medal,
  Award,
  MessageSquare,
  Smile,
  FileText,
  Activity,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Info,
  CheckCircle,
  ShieldAlert,
  Loader,
} from "lucide-react";
import { useCustom } from "@refinedev/core";
import { useState, useEffect } from "react";
import router from "next/router";
import { MenuProps } from "antd";
import { ItemType } from "antd/es/menu/interface";
import { api } from "~/trpc/react";

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
  userId: bigint;
  userName: string | null;
  commits: bigint;
  pullRequests: bigint | null;
  reviews: bigint | null;
  commitPoints: bigint;
  image: string | null;
};
type FormMsg = {
  type: "success" | "error" | "loading" | "waiting";
  message: string;
};
export default function ListInteractivity() {
  const [timespan, setTimespan] = useState<"1d" | "7d" | "14d" | "30d" | "all">(
    "7d",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [formMsg, setFormMsg] = useState<FormMsg>({
    type: "waiting",
    message:
      "Authentication will be added later, this is temporary. You have to have a contribution to a repository that is being tracked to show up on the leaderboard.",
  });

  const addUserMutation = api.github.addUser.useMutation();
  api.github.getUserCommits.useQuery({
    slackUserId: 1,
  });
  
  const { data: slackLeaderboardData, isFetching } = useCustom({
    url: `/api/leaderboard/slack?timespan=${timespan}`,
    method: "get",
  });
  const { data: githubLeaderboardData } = useCustom({
    url: `/api/leaderboard/github?timespan=${timespan}`,
    method: "get",
  });

  const slackUsers: InteractivityData[] =
    (slackLeaderboardData?.data as InteractivityData[]) ?? [];
  const githubUsers: GitHubData[] =
    (githubLeaderboardData?.data as GitHubData[]) ?? [];

  const getStatColor = (index: number) => {
    const colors = ["#f5222d", "#1677ff", "#52c41a", "#722ed1"];
    return colors[index] || "#666";
  };

  const getMedalColor = (index: number) => {
    const colors = ["#FFD700", "#C0C0C0", "#CD7F32"];
    return colors[index] || "#666";
  };

  const getBackgroundColor = (index: number) => {
    const colors = ["#fff9e6", "#f0f5ff", "#f6ffed"];
    return colors[index] || "#fff";
  };

  const getBorderColor = (index: number) => {
    const colors = ["#ffd700", "#c0c0c0", "#cd7f32"];
    return colors[index] || "#f0f0f0";
  };

  const getRankIcon = (index: number) => {
    const icons = [
      <Trophy key="trophy" size={28} color="#FFD700" />,
      <Medal key="medal" size={28} color="#C0C0C0" />,
      <Award key="award" size={28} color="#CD7F32" />,
    ];
    return icons[index] || null;
  };

  const slackUsersNamesAndIds = slackUsers
    .map((user) => {
      return {
        slackUserId: user.userId,
        userName: user.userName,
      };
    })
    .sort((a, b) => (a.userName || "").localeCompare(b.userName || ""));

  const isGitHubUser = (
    user: InteractivityData | GitHubData,
  ): user is GitHubData => "commits" in user;

  const LeaderboardSection = ({
    title,
    users,
    isGitHub = false,
  }: {
    title: string;
    users: InteractivityData[] | GitHubData[];
    isGitHub?: boolean;
  }) => (
    <Col span={12}>
      <Title level={4} style={{ textAlign: "center", marginBottom: "16px" }}>
        {title}
      </Title>
      <Row gutter={[8, 8]}>
        {users.map((user, index) => (
          <Col key={user.userId} span={24}>
            <Card
              size="small"
              style={{
                background: getBackgroundColor(index),
                borderColor: getBorderColor(index),
              }}
              bodyStyle={{ padding: "12px" }}
              loading={isFetching}
            >
              <Row align="middle" gutter={8}>
                <Col span={3}>
                  {index < 3 ? (
                    getRankIcon(index)
                  ) : (
                    <Avatar
                      size="large"
                      style={{
                        backgroundColor: "#f0f0f0",
                        color: "#666",
                        fontSize: "16px",
                        width: "40px",
                        height: "40px",
                        lineHeight: "40px",
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  )}
                </Col>
                <Col
                  span={9}
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <Avatar
                    size={48}
                    style={{
                      border: `2px solid ${getBorderColor(index)}`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                    src={
                      user.image
                        ? user.image
                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userName}`
                    }
                    alt={user.userName || "User avatar"}
                  />
                  <div>
                    <Text strong style={{ fontSize: "14px" }}>
                      {user.userName}
                    </Text>
                    {isGitHubUser(user) ? (
                      <div>
                        <Text type="secondary" style={{ fontSize: "13px" }}>
                          Commits: {user.commits}
                        </Text>
                      </div>
                    ) : (
                      <div>
                        <Text type="secondary" style={{ fontSize: "13px" }}>
                          Total: {user.totalCount}
                        </Text>
                      </div>
                    )}
                  </div>
                </Col>
                <Col span={12}>
                  <Row gutter={[8, 8]}>
                    {isGitHub ? (
                      <>
                        <Col
                          span={8}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <GitCommit size={20} color={getStatColor(1)} />
                          <Text className="flex" style={{ fontSize: "13px" }}>
                            {isGitHubUser(user) ? user.commitPoints : 0}
                          </Text>
                        </Col>
                        <Col>
                          <span>Commits points</span>
                        </Col>
                        {/* <Col span={8} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><GitPullRequest size={20} color={getStatColor(2)} /><Text style={{ fontSize: '13px' }}>{isGitHubUser(user) ? user.pullRequests : 0}</Text></Col>
                        <Col span={8} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><GitBranch size={20} color={getStatColor(3)} /><Text style={{ fontSize: '13px' }}>{isGitHubUser(user) ? user.reviews : 0}</Text></Col> */}
                      </>
                    ) : (
                      <>
                        <Col
                          span={8}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <MessageSquare size={20} color={getStatColor(1)} />
                          <Text style={{ fontSize: "13px" }}>
                            {!isGitHubUser(user) ? user.messageCount : 0}
                          </Text>
                        </Col>
                        <Col
                          span={8}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Smile size={20} color={getStatColor(2)} />
                          <Text style={{ fontSize: "13px" }}>
                            {!isGitHubUser(user) ? user.reactionCount : 0}
                          </Text>
                        </Col>
                        <Col
                          span={8}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <FileText size={20} color={getStatColor(3)} />
                          <Text style={{ fontSize: "13px" }}>
                            {!isGitHubUser(user) ? user.fileCount : 0}
                          </Text>
                        </Col>
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
    <div style={{ padding: "16px" }}>
      <button
        className="rounded-md bg-blue-500 p-2 text-white"
        onClick={() => {
          setModalOpen(true);
        }}
      >
        Link your Slack with GitHub
      </button>
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => {
          form.validateFields().then((values) => {
            if (values.slackUserId && values.githubUsername) {
              setFormMsg({
                type: "loading",
                message: "Adding user...",
            });
            addUserMutation.mutate(
              {
                slackUserId: values.slackUserId,
                GitHubUsername: values.githubUsername,
              },
              {
                onSuccess: (result) => {
                  setFormMsg({
                    type: "success",
                    message: "User added successfully!",
                  });
                },
                onError: (error) => {
                  setFormMsg({
                    type: "error",
                    message: error.message,
                  });
                },
              },
            );
          } else {
            setFormMsg({
              type: "error",
              message: "Please fill in all fields",
              });
            }
          }).catch((error) => {
            setFormMsg({
              type: "error",
              message: "Please fill in all fields",
            });
          });
        }}
        okText="Submit"
      >
        <Form form={form} className="my-8 px-6">
          <Form.Item key="slackUserId" required className="min-w-[200px]" name="slackUserId">
            <AntSelect placeholder="Slack Username">
              {slackUsersNamesAndIds.map(
                (user) =>
                  user && (
                    <AntSelect.Option key={user.slackUserId} value={user.slackUserId}>
                      {user.userName}
                    </AntSelect.Option>
                  ),
              )}
            </AntSelect>
          </Form.Item>
          <Form.Item key="githubUsername" required name="githubUsername">
            <Input placeholder="GitHub Username" />
          </Form.Item>

          <label
            className={`flex items-center gap-2 text-sm ${formMsg.type === "error" ? "text-red-500" : formMsg.type === "success" ? "text-green-500" : formMsg.type === "waiting" ? "text-blue-500" : "text-gray-500"}`}
          >
            {formMsg.type === "error" && (
              <ShieldAlert className="flex-shrink-0" size={24} />
            )}
            {formMsg.type === "success" && (
              <CheckCircle className="flex-shrink-0" size={24} />
            )}
            {formMsg.type === "waiting" && (
              <Info className="flex-shrink-0" size={24} />
            )}
            {formMsg.type === "loading" && (
              <Loader className="flex-shrink-0 animate-spin" size={24} />
            )}
            {formMsg.type === "error" && <span>{formMsg.message}</span>}
            {formMsg.type === "success" && <span>{formMsg.message}</span>}
            {formMsg.type === "waiting" && <span>{formMsg.message}</span>}
            {formMsg.type === "loading" && <span>{formMsg.message}</span>}
          </label>
        </Form>
      </Modal>
      <Row gutter={[16, 16]}>
        <Col span={24} style={{ textAlign: "center" }}>
          <Title level={3} style={{ marginBottom: "8px" }}>
            Activity Leaderboards
          </Title>
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
        <LeaderboardSection
          title="GitHub Activity"
          users={githubUsers}
          isGitHub
        />
      </Row>
    </div>
  );
}
