"use client";

import { Card, Avatar, Typography, Row, Col } from "antd";
import { List } from "@refinedev/antd";
import { useCustom, useApiUrl } from "@refinedev/core";

const { Title, Paragraph } = Typography;

interface TriviaItem {
  userId: string;
  userName?: string;
  profileImage: string;
  messageCount: number;
}

export default function ListTrivia() {
  const apiUrl = useApiUrl();
  
  const { data, isLoading } = useCustom({
    url: `${apiUrl}/trivia`,
    method: "get",
  });

  if (isLoading) return <div>Loading...</div>;

  const formatTimestamp = (timestamp: string) => timestamp.replace('.', '');

  return (
    <List>
      <Row gutter={16} justify="center">
        <Col span={12}>
          <Card
            key={`${data?.data.bro.userId}-1`}
            style={{
              width: 300,
              margin: '20px auto',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Avatar
                size={100}
                src={data?.data.bro.profileImage}
                style={{ border: '4px solid #1890ff' }}
              />
            </div>
            <Title level={3} style={{ textAlign: 'center', margin: '16px 0' }}>
              {data?.data.bro.userName || `User ${data?.data.bro.userId}`}
            </Title>
            <Paragraph style={{ textAlign: 'center' }}>
              Sent {data?.data.bro.messageCount} messages containing "bro" in the last 7 days
            </Paragraph>
            <Paragraph italic style={{ textAlign: 'center', color: '#666' }}>
              <a href={`https://lyra-technologies.slack.com/archives/${data?.data.bro.randomLineChannelId}/p${formatTimestamp(data?.data.bro.randomLineTimestamp)}`} target="_blank" rel="noopener noreferrer">
                "{data?.data.bro.randomLine}"
              </a>
              <br />
              <small>in #{data?.data.bro.randomLineChannelName}</small>
            </Paragraph>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            key={`${data?.data.sorry.userId}-2`}
            style={{
              width: 300,
              margin: '20px auto',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Avatar
                size={100}
                src={data?.data.sorry.profileImage}
                style={{ border: '4px solid #1890ff' }}
              />
            </div>
            <Title level={3} style={{ textAlign: 'center', margin: '16px 0' }}>
              {data?.data.sorry.userName || `User ${data?.data.sorry.userId}`}
            </Title>
            <Paragraph style={{ textAlign: 'center' }}>
              Sent {data?.data.sorry.messageCount} messages containing "sorry" in the last 7 days
            </Paragraph>
            <Paragraph italic style={{ textAlign: 'center', color: '#666' }}>
              <a href={`https://lyra-technologies.slack.com/archives/${data?.data.sorry.randomLineChannelId}/p${formatTimestamp(data?.data.sorry.randomLineTimestamp)}`} target="_blank" rel="noopener noreferrer">
                "{data?.data.sorry.randomLine}"
              </a>
              <br />
              <small>in #{data?.data.sorry.randomLineChannelName}</small>
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </List>
  );
}
