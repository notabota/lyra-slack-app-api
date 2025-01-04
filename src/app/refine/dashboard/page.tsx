"use client";

import { useList } from "@refinedev/core";
import { Layout, Row, Col, Card, Spin } from "antd";
import { MessagePieChart } from "~/components/ui/messages-count/pie";
import { ReactionPieChart } from "~/components/ui/reactions-count/pie";
import { FilePieChart } from "~/components/ui/files-count/pie";
import { WeeklyCountBar } from "~/components/ui/weekly-count/bar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [timespan, setTimespan] = useState("7d");

  const { data: messageData, isFetching: messageFetching } = useList({
    resource: "messages-count", 
    filters: [{ field: "timespan", operator: "eq", value: timespan }],
    meta: {
      select: ["userId", "userName", "count", "timespan"]
    },
    queryOptions: {
      keepPreviousData: false
    }
  });

  const { data: reactionData, isFetching: reactionFetching } = useList({
    resource: "reactions-count",
    filters: [{ field: "timespan", operator: "eq", value: timespan }],
    meta: {
      select: ["userId", "userName", "count", "timespan"]
    },
    queryOptions: {
      keepPreviousData: false
    }
  });

  const { data: fileData, isFetching: fileFetching } = useList({
    resource: "files-count",
    filters: [{ field: "timespan", operator: "eq", value: timespan }],
    meta: {
      select: ["userId", "userName", "count", "timespan"]
    }
  });

  const { data: weeklyData, isFetching: weeklyFetching } = useList({
    resource: "weekly-count",
    filters: [{ field: "timespan", operator: "eq", value: timespan }],
    meta: {
      select: ["week", "messageCount", "reactionCount", "fileCount"]
    }
  });

  const messageChartData = messageData?.data?.map((item) => ({
    userId: item?.userId,
    userName: item?.userName || `User ${item?.userId}`,
    count: item?.count
  })) ?? [];

  const reactionChartData = reactionData?.data?.map((item) => ({
    userId: item?.userId,
    userName: item?.userName || `User ${item?.userId}`,
    count: item?.count
  })) ?? [];

  const fileChartData = fileData?.data?.map((item) => ({
    userId: item?.userId,
    userName: item?.userName || `User ${item?.userId}`,
    count: item?.count
  })) ?? [];

  const weeklyChartData = weeklyData?.data?.map((item) => ({
    week: item?.week,
    messageCount: item?.messageCount,
    reactionCount: item?.reactionCount,
    fileCount: item?.fileCount
  })) ?? [];

  return (
    <Layout>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Select defaultValue="7d" onValueChange={setTimespan}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timespan" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="1d">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="14d">Last 14 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Col>
        <Col span={8}>
          <Card title="Message Count Distribution">
            <Spin spinning={messageFetching} tip="Loading chart...">
              <div className={messageFetching ? "h-[300px] flex items-center justify-center" : ""}>
                {!messageFetching && <MessagePieChart data={messageChartData} />}
              </div>
            </Spin>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Reaction Count Distribution">
            <Spin spinning={reactionFetching} tip="Loading chart...">
              <div className={reactionFetching ? "h-[300px] flex items-center justify-center" : ""}>
                {!reactionFetching && <ReactionPieChart data={reactionChartData} />}
              </div>
            </Spin>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="File Count Distribution">
            <Spin spinning={fileFetching} tip="Loading chart...">
              <div className={fileFetching ? "h-[300px] flex items-center justify-center" : ""}>
                {!fileFetching && <FilePieChart data={fileChartData} />}
              </div>
            </Spin>
          </Card>
        </Col>
        <Col span={24}>
          <Card title="Weekly Activity">
            <Spin spinning={weeklyFetching} tip="Loading chart...">
              <div className={weeklyFetching ? "h-[300px] flex items-center justify-center" : ""}>
                {!weeklyFetching && <WeeklyCountBar weeklyChartData={weeklyChartData} />}
              </div>
            </Spin>
          </Card>
        </Col>
      </Row>
    </Layout>
  )
};
