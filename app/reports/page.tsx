"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, TrendingUp, DollarSign, Package, Users } from "lucide-react"

interface Salesperson {
  id: string
  name: string
  phone: string
  totalSales: number
  itemsAllocated: number
}

interface SalesReport {
  salespersonId: string
  salespersonName: string
  totalAllocated: number
  totalSold: number
  totalReturned: number
  totalRevenue: number
  conversionRate: number
}

export default function Reports() {
  const [salespeople, setSalespeople] = useState<Salesperson[]>([])
  const [salesReports, setSalesReports] = useState<SalesReport[]>([])

  useEffect(() => {
    // Load sample data
    const sampleSalespeople: Salesperson[] = [
      { id: "1", name: "John Doe", phone: "+1234567890", totalSales: 1250, itemsAllocated: 15 },
      { id: "2", name: "Jane Smith", phone: "+1234567891", totalSales: 980, itemsAllocated: 12 },
      { id: "3", name: "Mike Johnson", phone: "+1234567892", totalSales: 1450, itemsAllocated: 18 },
    ]

    // Generate sample sales reports
    const sampleReports: SalesReport[] = [
      {
        salespersonId: "1",
        salespersonName: "John Doe",
        totalAllocated: 15,
        totalSold: 12,
        totalReturned: 3,
        totalRevenue: 1250,
        conversionRate: 80,
      },
      {
        salespersonId: "2",
        salespersonName: "Jane Smith",
        totalAllocated: 12,
        totalSold: 9,
        totalReturned: 3,
        totalRevenue: 980,
        conversionRate: 75,
      },
      {
        salespersonId: "3",
        salespersonName: "Mike Johnson",
        totalAllocated: 18,
        totalSold: 16,
        totalReturned: 2,
        totalRevenue: 1450,
        conversionRate: 89,
      },
    ]

    setSalespeople(sampleSalespeople)
    setSalesReports(sampleReports)
  }, [])

  const totalRevenue = salesReports.reduce((sum, report) => sum + report.totalRevenue, 0)
  const totalItemsAllocated = salesReports.reduce((sum, report) => sum + report.totalAllocated, 0)
  const totalItemsSold = salesReports.reduce((sum, report) => sum + report.totalSold, 0)
  const totalItemsReturned = salesReports.reduce((sum, report) => sum + report.totalReturned, 0)
  const overallConversionRate = totalItemsAllocated > 0 ? (totalItemsSold / totalItemsAllocated) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales Reports</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Track performance and analyze sales data
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All salespeople combined</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItemsSold}</div>
              <p className="text-xs text-muted-foreground">Out of {totalItemsAllocated} allocated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Returned</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItemsReturned}</div>
              <p className="text-xs text-muted-foreground">Returned to stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallConversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Overall sales conversion</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sales Report */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Salesperson Performance
            </CardTitle>
            <CardDescription>Detailed breakdown of each salesperson's performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salesperson</TableHead>
                    <TableHead>Items Allocated</TableHead>
                    <TableHead>Items Sold</TableHead>
                    <TableHead>Items Returned</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReports
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .map((report, index) => (
                      <TableRow key={report.salespersonId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                            {report.salespersonName}
                          </div>
                        </TableCell>
                        <TableCell>{report.totalAllocated}</TableCell>
                        <TableCell>{report.totalSold}</TableCell>
                        <TableCell>{report.totalReturned}</TableCell>
                        <TableCell className="font-semibold">${report.totalRevenue.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              report.conversionRate >= 80
                                ? "default"
                                : report.conversionRate >= 60
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {report.conversionRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              report.conversionRate >= 80
                                ? "default"
                                : report.conversionRate >= 60
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {report.conversionRate >= 80
                              ? "Excellent"
                              : report.conversionRate >= 60
                                ? "Good"
                                : "Needs Improvement"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Salespeople with highest conversion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesReports
                  .sort((a, b) => b.conversionRate - a.conversionRate)
                  .slice(0, 3)
                  .map((report, index) => (
                    <div key={report.salespersonId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{report.salespersonName}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.totalSold}/{report.totalAllocated} items sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{report.conversionRate.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">${report.totalRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Leaders</CardTitle>
              <CardDescription>Salespeople with highest total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesReports
                  .sort((a, b) => b.totalRevenue - a.totalRevenue)
                  .slice(0, 3)
                  .map((report, index) => (
                    <div key={report.salespersonId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{report.salespersonName}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.conversionRate.toFixed(1)}% conversion rate
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${report.totalRevenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{report.totalSold} items sold</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
