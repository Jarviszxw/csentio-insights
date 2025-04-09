import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BarChartCustom } from "./ui/bar-chart-custom"

export function GMVByMetrics() {
  return (
    <div className="flex w-full gap-4 overflow-x-auto px-4 lg:px-6 [&>*]:min-w-[280px] [&>*]:flex-1">
      <BarChartCustom />
      <BarChartCustom />
      <BarChartCustom />
    </div>
  )
}
