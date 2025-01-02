"use client";

import { useCustom } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { Typography, Select } from "antd";
import { AreaInteractivity } from "~/components/ui/interactivity/area";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function ShowInteractivity() {
    const { id } = useParams();
    const [timespan, setTimespan] = useState<"7d" | "14d" | "30d">("7d");
    const {
        data,
        isLoading,
    } = useCustom({
        url: `/api/interactivity/${id}?timespan=${timespan}`,
        method: "get",
    });
    
    return (
        <Show isLoading={isLoading}>
            <Typography.Title level={5}>User Name</Typography.Title>
            <Typography.Text>{data?.data?.userName}</Typography.Text>

            <div className="mt-6">
                <div className="mb-4">
                    <Select
                        value={timespan}
                        onChange={(value) => setTimespan(value)}
                        options={[
                            { label: "Last 7 days", value: "7d" },
                            { label: "Last 14 days", value: "14d" },
                            { label: "Last 30 days", value: "30d" },
                        ]}
                    />
                </div>
                <AreaInteractivity data={data?.data as { dailyStats: Array<{ date: string, messageCount: number, reactionCount: number }> } ?? { dailyStats: [] }} />
            </div>
        </Show>
    );
};