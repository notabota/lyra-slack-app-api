"use client"

import * as React from "react"
import { Label, Pie, PieChart, Legend } from "recharts"
import { Spin } from "antd"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"

interface PieChartComponentProps {
  data?: Array<{
    channelId: string
    channelName: string
    messageCount: number
  }>
  isLoading?: boolean
}

export function ChannelMessagePieChart({ data = [], isLoading }: PieChartComponentProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="flex h-[450px] items-center justify-center">
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  const chartData = React.useMemo(() => {
    const topChannels = data.slice(0, 5)
    const otherChannels = data.slice(5)
    const otherCount = otherChannels.reduce((sum, channel) => sum + channel.messageCount, 0)

    const mappedData = topChannels.map((item, index) => ({
      channel: item.channelName || "Unknown Channel",
      messages: item.messageCount,
      fill: `hsl(var(--chart-${index + 1}))`
    }))

    if (otherCount > 0) {
      mappedData.push({
        channel: "Other Channels",
        messages: otherCount,
        fill: `hsl(var(--chart-6, 200 10% 50%))`
      })
    }

    return mappedData
  }, [data])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      messages: {
        label: "Messages",
      }
    }
    
    chartData.forEach((item) => {
      config[item.channel] = {
        label: item.channel,
        color: item.fill
      }
    })

    return config
  }, [chartData])

  const totalMessages = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.messages, 0)
  }, [chartData])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Activity</CardTitle>
        <CardDescription>Top 5 Channels by Message Count</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-[450px] w-full"
        >
          <PieChart
            margin={{
              top: 20,
              right: 12,
              bottom: 20,
              left: -20
            }}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="messages"
              nameKey="channel"
              innerRadius={80}
              outerRadius={120}
              strokeWidth={5}
              startAngle={90}
              endAngle={450}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalMessages.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Messages
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
            <Legend 
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              iconSize={8}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
