"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend, Dot } from "recharts"

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

const chartConfig = {
  messageCount: {
    label: "Messages",
    color: "hsl(var(--chart-1))",
  },
  reactionCount: {
    label: "Reactions", 
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function AreaInteractivity({ data }: { data: { dailyStats: Array<{ date: string, messageCount: number, reactionCount: number }> }}) {
    return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Over Time</CardTitle>
        <CardDescription>
          Showing messages and reactions over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data.dailyStats}
            margin={{
              left: -20,
              right: 12,
              top: 20,
              bottom: 20
            }}
            height={400}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={3}
              domain={[0, 'auto']}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              dataKey="reactionCount"
              type="monotone"
              fill={chartConfig.reactionCount.color}
              fillOpacity={0.4}
              stroke={chartConfig.reactionCount.color}
              stackId="a"
              baseValue={0}
              dot={<Dot r={2} fill={chartConfig.reactionCount.color} />}
              name={chartConfig.reactionCount.label}
            />
            <Area
              dataKey="messageCount"
              type="monotone"
              fill={chartConfig.messageCount.color}
              fillOpacity={0.4}
              stroke={chartConfig.messageCount.color}
              stackId="a"
              baseValue={0}
              dot={<Dot r={2} fill={chartConfig.messageCount.color} />}
              name={chartConfig.messageCount.label}
            />
            <Legend />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Activity Trends <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {data.dailyStats[0]?.date ? new Date(data.dailyStats[0]!.date).toLocaleDateString() : 'N/A'} - {data.dailyStats[data.dailyStats.length-1]?.date ? new Date(data.dailyStats[data.dailyStats.length-1]!.date).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
