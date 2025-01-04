"use client";

import { useCustom, useApiUrl } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { Typography, Select, Row, Col, Card } from "antd";
import { AreaInteractivity } from "~/components/ui/interactivity/area";
import { ChannelMessagePieChart } from "~/components/ui/interactivity/pie";
import { useState } from "react";
import { useParams } from "next/navigation";

export function ShowInteractivityContent({ id }: { id: string }) {
    const [timespan, setTimespan] = useState<"7d" | "14d" | "30d">("7d");
    const apiUrl = useApiUrl();
    const {
        data,
        isLoading,
        isFetching,
    } = useCustom({
        url: `${apiUrl}/interactivity/${id}?timespan=${timespan}`,
        method: "get",
    });
    
    return (
        <Show isLoading={isLoading}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card>
                        <Typography.Title level={5}>User Name</Typography.Title>
                        <Typography.Text>{data?.data?.userName}</Typography.Text>
                    </Card>
                </Col>
                
                <Col span={24}>
                    <Card>
                        <Select
                            value={timespan}
                            onChange={setTimespan}
                            options={[
                                { label: "Last 7 days", value: "7d" },
                                { label: "Last 14 days", value: "14d" },
                                { label: "Last 30 days", value: "30d" },
                            ]}
                        />
                    </Card>
                </Col>
                
                <Col span={12}>
                    <Card>
                        <AreaInteractivity isLoading={isFetching} data={data?.data as { dailyStats: Array<{ date: string, messageCount: number, reactionCount: number }> } ?? { dailyStats: [] }} />
                    </Card>
                </Col>

                <Col span={12}>
                    <ChannelMessagePieChart isLoading={isFetching} data={data?.data?.channelStats ?? []} />
                </Col>
            </Row>
        </Show>
    );
}

export default function ShowInteractivity() {
    const { id } = useParams();
    return <ShowInteractivityContent id={id as string} />;
}