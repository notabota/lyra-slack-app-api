"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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

type WeeklyCount = {
  week: string
  messageCount: number
  reactionCount: number
  fileCount: number
}

const chartConfig = {
  messageCount: {
    label: "Messages",
    color: "hsl(var(--chart-1))",
  },
  reactionCount: {
    label: "Reactions", 
    color: "hsl(var(--chart-2))",
  },
  fileCount: {
    label: "Files",
    color: "hsl(var(--chart-3))",
  }
} satisfies ChartConfig

export function WeeklyCountBar({weeklyChartData}: {weeklyChartData: WeeklyCount[]}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Activity</CardTitle>
        <CardDescription>Last 7 Days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={weeklyChartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="messageCount" fill="var(--color-messageCount)" radius={4} />
            <Bar dataKey="reactionCount" fill="var(--color-reactionCount)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Activity trends over time <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing messages, reactions and files for the last 7 days
        </div>
      </CardFooter>
    </Card>
  )
}
