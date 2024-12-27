"use client"

import * as React from "react"
import { Label, Pie, PieChart, Legend } from "recharts"

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
    userId: string
    userName: string
    count: number
  }>
}

export function ReactionPieChart({ data = [] }: PieChartComponentProps) {
  const chartData = React.useMemo(() => {
    const topUsers = data.slice(0, 5)
    const otherUsers = data.slice(5)
    const otherCount = otherUsers.reduce((sum, user) => sum + user.count, 0)

    const mappedData = topUsers.map((item, index) => ({
      user: item.userName || "Unknown User",
      reactions: item.count,
      fill: `hsl(var(--chart-${index + 1}))`
    }))

    if (otherCount > 0) {
      mappedData.push({
        user: "Other",
        reactions: otherCount,
        fill: `hsl(var(--chart-6, 200 10% 50%))`
      })
    }

    return mappedData
  }, [data])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      reactions: {
        label: "Reactions",
      }
    }
    
    chartData.forEach((item, index) => {
      config[item.user] = {
        label: item.user,
        color: item.fill
      }
    })

    return config
  }, [chartData])

  const totalReactions = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.reactions, 0)
  }, [chartData])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Reaction Distribution</CardTitle>
        <CardDescription>Top 5 Users by Reaction Count</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="reactions"
              nameKey="user"
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
                          {totalReactions.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Reactions
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
