"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ArrowLeft,
    TrendingUp,
    DollarSign,
    Package,
    Users,
    Calendar,
    BarChart3,
    ShoppingCart,
    UserCheck,
    Filter,
    Download,
    RefreshCw,
    Eye,
    Star,
    Award,
    Target,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Salesperson {
    id: string
    name: string
    phone: string
    totalSales: number
    itemsAllocated: number
}

interface Item {
    id: string
    name: string
    description: string
    price: number
    stock: number
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

interface ItemSalesReport {
    itemId: string
    itemName: string
    itemPrice: number
    totalAllocated: number
    totalSold: number
    totalRevenue: number
    conversionRate: number
}

interface SalespersonDetailReport {
    salespersonId: string
    salespersonName: string
    itemsSold: Array<{
        itemId: string
        itemName: string
        quantity: number
        revenue: number
    }>
    totalRevenue: number
    totalItemsSold: number
}

interface Allocation {
    id: string
    salespersonId: string
    itemId: string
    quantity: number
    status: "ALLOCATED" | "SOLD" | "RETURNED"
    soldQuantity?: number
    paymentReceived?: number
    itemPrice: number
}

export default function Reports() {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    const [loading, setLoading] = useState(true)
    const [salespeople, setSalespeople] = useState<Salesperson[]>([])
    const [items, setItems] = useState<Item[]>([])
    const [salesReports, setSalesReports] = useState<SalesReport[]>([])
    const [itemSalesReports, setItemSalesReports] = useState<ItemSalesReport[]>([])
    const [salespersonDetailReports, setSalespersonDetailReports] = useState<SalespersonDetailReport[]>([])
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
    const [startDate, setStartDate] = useState<string>(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    )
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0])
    const [selectedItem, setSelectedItem] = useState<string>("")
    const [selectedSalesperson, setSelectedSalesperson] = useState<string>("")
    const [dailySales, setDailySales] = useState<any[]>([])
    const [dateRangeSales, setDateRangeSales] = useState<any[]>([])
    const [itemSalesData, setItemSalesData] = useState<any>(null)
    const [salespersonSalesData, setSalespersonSalesData] = useState<any>(null)
    const [activeTab, setActiveTab] = useState("overview")

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                if (!baseUrl) {
                    console.error("API base URL not configured")
                    setLoading(false)
                    return
                }

                // Fetch salespeople, items, and allocations data
                const [salespeopleRes, itemsRes, allocationsRes] = await Promise.all([
                    fetch(`${baseUrl}/salespeople`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }),
                    fetch(`${baseUrl}/items`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }),
                    fetch(`${baseUrl}/allocations`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }),
                ])

                if (!salespeopleRes.ok) {
                    throw new Error(`Salespeople API error: ${salespeopleRes.status} ${salespeopleRes.statusText}`)
                }

                if (!itemsRes.ok) {
                    throw new Error(`Items API error: ${itemsRes.status} ${itemsRes.statusText}`)
                }

                if (!allocationsRes.ok) {
                    throw new Error(`Allocations API error: ${allocationsRes.status} ${allocationsRes.statusText}`)
                }

                const [salespeopleData, itemsData, allocationsData] = await Promise.all([
                    salespeopleRes.json(),
                    itemsRes.json(),
                    allocationsRes.json(),
                ])

                setSalespeople(salespeopleData)
                setItems(itemsData)

                // Generate sales reports from allocations data
                const reportsMap = new Map<string, SalesReport>()
                const itemReportsMap = new Map<string, ItemSalesReport>()
                const salespersonDetailMap = new Map<string, SalespersonDetailReport>()

                // Initialize reports for all salespeople
                salespeopleData.forEach((person: Salesperson) => {
                    reportsMap.set(person.id, {
                        salespersonId: person.id,
                        salespersonName: person.name,
                        totalAllocated: 0,
                        totalSold: 0,
                        totalReturned: 0,
                        totalRevenue: 0,
                        conversionRate: 0,
                    })

                    salespersonDetailMap.set(person.id, {
                        salespersonId: person.id,
                        salespersonName: person.name,
                        itemsSold: [],
                        totalRevenue: 0,
                        totalItemsSold: 0,
                    })
                })

                // Initialize reports for all items
                itemsData.forEach((item: Item) => {
                    itemReportsMap.set(item.id, {
                        itemId: item.id,
                        itemName: item.name,
                        itemPrice: item.price,
                        totalAllocated: 0,
                        totalSold: 0,
                        totalRevenue: 0,
                        conversionRate: 0,
                    })
                })

                // Process allocations to build reports
                allocationsData.forEach((allocation: any) => {
                    const report = reportsMap.get(allocation.salespersonId)
                    const itemReport = itemReportsMap.get(allocation.itemId)
                    const salespersonDetail = salespersonDetailMap.get(allocation.salespersonId)

                    if (report) {
                        report.totalAllocated += allocation.quantity

                        if (allocation.status === "SOLD") {
                            const soldQty = allocation.soldQuantity || allocation.quantity
                            const revenue = allocation.paymentReceived || soldQty * allocation.itemPrice
                            report.totalSold += soldQty
                            report.totalRevenue += revenue

                            // Update salesperson detail report
                            if (salespersonDetail) {
                                const existingItem = salespersonDetail.itemsSold.find((item) => item.itemId === allocation.itemId)
                                if (existingItem) {
                                    existingItem.quantity += soldQty
                                    existingItem.revenue += revenue
                                } else {
                                    const item = itemsData.find((i: Item) => i.id === allocation.itemId)
                                    salespersonDetail.itemsSold.push({
                                        itemId: allocation.itemId,
                                        itemName: item?.name || "Unknown Item",
                                        quantity: soldQty,
                                        revenue: revenue,
                                    })
                                }
                                salespersonDetail.totalRevenue += revenue
                                salespersonDetail.totalItemsSold += soldQty
                            }
                        } else if (allocation.status === "RETURNED") {
                            report.totalReturned += allocation.quantity
                        }
                    }

                    if (itemReport) {
                        itemReport.totalAllocated += allocation.quantity

                        if (allocation.status === "SOLD") {
                            const soldQty = allocation.soldQuantity || allocation.quantity
                            itemReport.totalSold += soldQty
                            itemReport.totalRevenue += allocation.paymentReceived || soldQty * allocation.itemPrice
                        }
                    }
                })

                // Calculate conversion rates
                const reports = Array.from(reportsMap.values()).map((report) => ({
                    ...report,
                    conversionRate: report.totalAllocated > 0 ? (report.totalSold / report.totalAllocated) * 100 : 0,
                }))

                const itemReports = Array.from(itemReportsMap.values()).map((report) => ({
                    ...report,
                    conversionRate: report.totalAllocated > 0 ? (report.totalSold / report.totalAllocated) * 100 : 0,
                }))

                const salespersonDetailReports = Array.from(salespersonDetailMap.values())

                setSalesReports(reports)
                setItemSalesReports(itemReports)
                setSalespersonDetailReports(salespersonDetailReports)
                setLoading(false)
            } catch (error) {
                console.error("Failed to fetch reports data:", error)
                setLoading(false)
            }
        }

        fetchData()
    }, [baseUrl])

    const fetchDailySales = async (date: string) => {
        try {
            if (!baseUrl) return

            try {
                const response = await fetch(`${baseUrl}/allocations/summary/date/${date}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                })

                if (response.ok) {
                    const data = await response.json()
                    setDailySales([data])
                    return
                }
            } catch (apiError) {
                console.log("Daily sales API endpoint not available")
            }

            // If API fails, set empty data
            setDailySales([])
        } catch (error) {
            console.error("Failed to fetch daily sales:", error)
            setDailySales([])
        }
    }

    const fetchDateRangeSales = async () => {
        try {
            if (!baseUrl) return

            try {
                const response = await fetch(
                    `${baseUrl}/allocations/summary/date-range?startDate=${startDate}&endDate=${endDate}`,
                    {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                    },
                )

                if (response.ok) {
                    const data = await response.json()
                    setDateRangeSales(data)
                    return
                }
            } catch (apiError) {
                console.log("Date range API endpoint not available")
            }

            // If API fails, set empty data
            setDateRangeSales([])
        } catch (error) {
            console.error("Failed to fetch date range sales:", error)
            setDateRangeSales([])
        }
    }

    const fetchItemSales = async (itemId: string) => {
        try {
            if (!baseUrl) return

            // First try to use the API endpoint
            try {
                const response = await fetch(`${baseUrl}/allocations/analytics/quantity-sold/item/${itemId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                })

                if (response.ok) {
                    const data = await response.json()
                    setItemSalesData(data)
                    return
                }
            } catch (apiError) {
                console.log("API endpoint not available, using fallback data")
            }

            // Fallback: Use the already processed item data
            const itemReport = itemSalesReports.find((report) => report.itemId === itemId)
            if (itemReport) {
                setItemSalesData({
                    itemId: itemReport.itemId,
                    itemName: itemReport.itemName,
                    quantitySold: itemReport.totalSold,
                    totalAllocated: itemReport.totalAllocated,
                    revenue: itemReport.totalRevenue,
                })
            }
        } catch (error) {
            console.error("Failed to fetch item sales:", error)
            // Still use fallback data even if the main try block fails
            const itemReport = itemSalesReports.find((report) => report.itemId === itemId)
            if (itemReport) {
                setItemSalesData({
                    itemId: itemReport.itemId,
                    itemName: itemReport.itemName,
                    quantitySold: itemReport.totalSold,
                    totalAllocated: itemReport.totalAllocated,
                    revenue: itemReport.totalRevenue,
                })
            }
        }
    }

    const fetchSalespersonSales = async (salespersonId: string) => {
        try {
            if (!baseUrl) return

            // First try to use the API endpoint with date range
            try {
                const dateRangeParam = `startDate=${startDate}&endDate=${endDate}`
                const response = await fetch(
                    `${baseUrl}/allocations/analytics/revenue/salesperson/${salespersonId}?${dateRangeParam}`,
                    {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                    },
                )

                if (response.ok) {
                    const data = await response.json()
                    setSalespersonSalesData(data)
                    return
                }
            } catch (apiError) {
                console.log("API endpoint not available, using fallback data")
            }

            // Fallback: Use the already processed salesperson data
            // In a real implementation, we would filter this data by date range
            const salespersonReport = salespersonDetailReports.find((report) => report.salespersonId === salespersonId)
            if (salespersonReport) {
                setSalespersonSalesData({
                    salespersonId: salespersonReport.salespersonId,
                    salespersonName: salespersonReport.salespersonName,
                    revenue: salespersonReport.totalRevenue,
                    itemsSold: salespersonReport.totalItemsSold,
                    dateRange: {
                        startDate,
                        endDate,
                    },
                })
            }
        } catch (error) {
            console.error("Failed to fetch salesperson sales:", error)
            // Still use fallback data even if the main try block fails
            const salespersonReport = salespersonDetailReports.find((report) => report.salespersonId === salespersonId)
            if (salespersonReport) {
                setSalespersonSalesData({
                    salespersonId: salespersonReport.salespersonId,
                    salespersonName: salespersonReport.salespersonName,
                    revenue: salespersonReport.totalRevenue,
                    itemsSold: salespersonReport.totalItemsSold,
                    dateRange: {
                        startDate,
                        endDate,
                    },
                })
            }
        }
    }

    const fetchAllSalespeopleData = async () => {
        try {
            if (!baseUrl) return

            // First try to use the API endpoint with date range
            try {
                const dateRangeParam = `startDate=${startDate}&endDate=${endDate}`
                const response = await fetch(`${baseUrl}/allocations/analytics/revenue/all-salespeople?${dateRangeParam}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                })

                if (response.ok) {
                    const data = await response.json()
                    // If API returns data, we would use it here
                    return
                }
            } catch (apiError) {
                console.log("API endpoint not available, using existing data")
            }

            // For now, we'll just trigger the date range fetch to update the UI
            handleDateRangeChange()
        } catch (error) {
            console.error("Failed to fetch all salespeople data:", error)
        }
    }

    const handleDateChange = (date: string) => {
        setSelectedDate(date)
        fetchDailySales(date)
    }

    const handleDateRangeChange = () => {
        fetchDateRangeSales()
    }

    const handleItemChange = (itemId: string) => {
        setSelectedItem(itemId)
        fetchItemSales(itemId)
    }

    const handleSalespersonChange = (salespersonId: string) => {
        setSelectedSalesperson(salespersonId)
        if (salespersonId !== "all") {
            fetchSalespersonSales(salespersonId)
        } else {
            fetchAllSalespeopleData()
        }
    }

    const totalRevenue = salesReports.reduce((sum, report) => sum + report.totalRevenue, 0)
    const totalItemsAllocated = salesReports.reduce((sum, report) => sum + report.totalAllocated, 0)
    const totalItemsSold = salesReports.reduce((sum, report) => sum + report.totalSold, 0)
    const totalItemsReturned = salesReports.reduce((sum, report) => sum + report.totalReturned, 0)
    const overallConversionRate = totalItemsAllocated > 0 ? (totalItemsSold / totalItemsAllocated) * 100 : 0

    const selectedItemReport = itemSalesReports.find((report) => report.itemId === selectedItem)
    const selectedSalespersonReport = salespersonDetailReports.find(
        (report) => report.salespersonId === selectedSalesperson,
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-spin mx-auto animation-delay-150"></div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-lg font-semibold text-slate-700">Loading Reports</p>
                        <p className="text-sm text-slate-500">Analyzing your sales data...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                        <Link href="/">
                            <Button variant="outline" size="icon" className="shrink-0 shadow-sm hover:shadow-md transition-shadow">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                Sales Analytics
                            </h1>
                            <p className="text-slate-600 mt-2 text-sm sm:text-base">
                                Comprehensive insights into your sales performance and team metrics
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Export
                            </Button>
                            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Total Revenue</CardTitle>
                            <DollarSign className="h-8 w-8 opacity-80 absolute top-4 right-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl sm:text-3xl font-bold">${totalRevenue.toLocaleString()}</div>
                            <p className="text-xs opacity-80 mt-1">All salespeople combined</p>
                        </CardContent>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Items Sold</CardTitle>
                            <Package className="h-8 w-8 opacity-80 absolute top-4 right-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl sm:text-3xl font-bold">{totalItemsSold}</div>
                            <p className="text-xs opacity-80 mt-1">Out of {totalItemsAllocated} allocated</p>
                        </CardContent>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Items Returned</CardTitle>
                            <Package className="h-8 w-8 opacity-80 absolute top-4 right-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl sm:text-3xl font-bold">{totalItemsReturned}</div>
                            <p className="text-xs opacity-80 mt-1">Returned to stock</p>
                        </CardContent>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Conversion Rate</CardTitle>
                            <TrendingUp className="h-8 w-8 opacity-80 absolute top-4 right-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl sm:text-3xl font-bold">{overallConversionRate.toFixed(1)}%</div>
                            <p className="text-xs opacity-80 mt-1">Overall sales conversion</p>
                        </CardContent>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                    </Card>
                </div>

                {/* Tabs Navigation */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="border-b border-slate-200 bg-white rounded-lg shadow-sm p-1">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-transparent gap-1">
                            <TabsTrigger
                                value="overview"
                                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Overview</span>
                                <span className="sm:hidden">Overview</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="performance"
                                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                            >
                                <Award className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Performance</span>
                                <span className="sm:hidden">Perf</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="analytics"
                                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                            >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Analytics</span>
                                <span className="sm:hidden">Analytics</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="detailed"
                                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                            >
                                <Target className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Detailed</span>
                                <span className="sm:hidden">Detail</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Performance Insights */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Star className="h-5 w-5 text-yellow-500" />
                                        Top Performers
                                    </CardTitle>
                                    <CardDescription>Salespeople with highest conversion rates</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {salesReports
                                            .sort((a, b) => b.conversionRate - a.conversionRate)
                                            .slice(0, 3)
                                            .map((report, index) => (
                                                <div
                                                    key={report.salespersonId}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 hover:from-blue-50 hover:to-blue-100 transition-all duration-200"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                                index === 0
                                                                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                                                                    : index === 1
                                                                        ? "bg-gradient-to-r from-gray-400 to-gray-500"
                                                                        : "bg-gradient-to-r from-amber-600 to-amber-700"
                                                            }`}
                                                        >
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900">{report.salespersonName}</p>
                                                            <p className="text-sm text-slate-600">
                                                                {report.totalSold}/{report.totalAllocated} items sold
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-lg text-slate-900">{report.conversionRate.toFixed(1)}%</p>
                                                        <p className="text-sm text-slate-600">${report.totalRevenue.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <DollarSign className="h-5 w-5 text-green-500" />
                                        Revenue Leaders
                                    </CardTitle>
                                    <CardDescription>Salespeople with highest total revenue</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {salesReports
                                            .sort((a, b) => b.totalRevenue - a.totalRevenue)
                                            .slice(0, 3)
                                            .map((report, index) => (
                                                <div
                                                    key={report.salespersonId}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 hover:from-green-50 hover:to-green-100 transition-all duration-200"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                                index === 0
                                                                    ? "bg-gradient-to-r from-green-400 to-green-500"
                                                                    : index === 1
                                                                        ? "bg-gradient-to-r from-blue-400 to-blue-500"
                                                                        : "bg-gradient-to-r from-purple-400 to-purple-500"
                                                            }`}
                                                        >
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900">{report.salespersonName}</p>
                                                            <p className="text-sm text-slate-600">
                                                                {report.conversionRate.toFixed(1)}% conversion rate
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-lg text-slate-900">${report.totalRevenue.toLocaleString()}</p>
                                                        <p className="text-sm text-slate-600">{report.totalSold} items sold</p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Performance Tab */}
                    <TabsContent value="performance" className="space-y-6">
                        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    Salesperson Performance
                                </CardTitle>
                                <CardDescription>Detailed breakdown of each salesperson's performance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-slate-200">
                                                <TableHead className="font-semibold text-slate-700">Salesperson</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Allocated</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Sold</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Returned</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Revenue</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Conversion</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Performance</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {salesReports
                                                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                                                .map((report, index) => (
                                                    <TableRow key={report.salespersonId} className="border-slate-100 hover:bg-slate-50/50">
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                                                                        index === 0 ? "bg-yellow-500" : "bg-slate-400"
                                                                    }`}
                                                                >
                                                                    {index + 1}
                                                                </div>
                                                                <span className="text-slate-900">{report.salespersonName}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-slate-700">{report.totalAllocated}</TableCell>
                                                        <TableCell className="text-slate-700">{report.totalSold}</TableCell>
                                                        <TableCell className="text-slate-700">{report.totalReturned}</TableCell>
                                                        <TableCell className="font-semibold text-slate-900">
                                                            ${report.totalRevenue.toLocaleString()}
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
                                                                className="font-medium"
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
                                                                className="font-medium"
                                                            >
                                                                {report.conversionRate >= 80
                                                                    ? "Excellent"
                                                                    : report.conversionRate >= 60
                                                                        ? "Good"
                                                                        : "Poor"}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Daily Sales */}
                            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Calendar className="h-5 w-5 text-blue-500" />
                                        Daily Sales
                                    </CardTitle>
                                    <CardDescription>View sales data for a specific date</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="date" className="text-sm font-medium text-slate-700">
                                            Select Date
                                        </Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => handleDateChange(e.target.value)}
                                            className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>

                                    {dailySales.length > 0 && dailySales[0] ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                                                <p className="text-xs font-medium text-blue-700">Items Allocated</p>
                                                <p className="text-lg font-bold text-blue-900">{dailySales[0].totalAllocated || 0}</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                                                <p className="text-xs font-medium text-green-700">Items Sold</p>
                                                <p className="text-lg font-bold text-green-900">{dailySales[0].totalSold || 0}</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
                                                <p className="text-xs font-medium text-yellow-700">Revenue</p>
                                                <p className="text-lg font-bold text-yellow-900">
                                                    ${(dailySales[0].totalRevenue || 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                                                <p className="text-xs font-medium text-purple-700">Conversion Rate</p>
                                                <p className="text-lg font-bold text-purple-900">
                                                    {(dailySales[0].conversionRate || 0).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>No data available for selected date</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Date Range Sales */}
                            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <BarChart3 className="h-5 w-5 text-green-500" />
                                        Date Range Analysis
                                    </CardTitle>
                                    <CardDescription>Compare sales across multiple days</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label htmlFor="startDate" className="text-sm font-medium text-slate-700">
                                                Start Date
                                            </Label>
                                            <Input
                                                id="startDate"
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="endDate" className="text-sm font-medium text-slate-700">
                                                End Date
                                            </Label>
                                            <Input
                                                id="endDate"
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <Button onClick={handleDateRangeChange} className="w-full bg-blue-600 hover:bg-blue-700">
                                        <Filter className="h-4 w-4 mr-2" />
                                        Apply Date Range
                                    </Button>

                                    {dateRangeSales.length > 0 ? (
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {dateRangeSales.map((day, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 hover:from-blue-50 hover:to-blue-100 transition-all duration-200"
                                                >
                                                    <div>
                                                        <p className="font-medium text-slate-900">{new Date(day.date).toLocaleDateString()}</p>
                                                        <p className="text-sm text-slate-600">
                                                            {day.totalSold}/{day.totalAllocated} items sold
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-slate-900">${(day.totalRevenue || 0).toLocaleString()}</p>
                                                        <p className="text-sm text-slate-600">{(day.conversionRate || 0).toFixed(1)}% conversion</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>No data available for selected range</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Detailed Tab */}
                    <TabsContent value="detailed" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Sales by Item */}
                            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <ShoppingCart className="h-5 w-5 text-orange-500" />
                                        Sales by Item
                                    </CardTitle>
                                    <CardDescription>Analyze performance of individual items</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="item" className="text-sm font-medium text-slate-700">
                                            Select Item
                                        </Label>
                                        <Select value={selectedItem} onValueChange={handleItemChange}>
                                            <SelectTrigger className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                                                <SelectValue placeholder="Choose an item" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {items.map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.name} - ${item.price}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedItemReport ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                                                    <p className="text-xs font-medium text-blue-700">Total Allocated</p>
                                                    <p className="text-lg font-bold text-blue-900">{selectedItemReport.totalAllocated}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                                                    <p className="text-xs font-medium text-green-700">Total Sold</p>
                                                    <p className="text-lg font-bold text-green-900">{selectedItemReport.totalSold}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
                                                    <p className="text-xs font-medium text-yellow-700">Total Revenue</p>
                                                    <p className="text-lg font-bold text-yellow-900">
                                                        ${selectedItemReport.totalRevenue.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                                                    <p className="text-xs font-medium text-purple-700">Conversion Rate</p>
                                                    <p className="text-lg font-bold text-purple-900">
                                                        {selectedItemReport.conversionRate.toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
                                                <h4 className="font-semibold mb-2 text-slate-900">Item Performance</h4>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                    <Badge
                                                        variant={
                                                            selectedItemReport.conversionRate >= 80
                                                                ? "default"
                                                                : selectedItemReport.conversionRate >= 60
                                                                    ? "secondary"
                                                                    : "destructive"
                                                        }
                                                        className="font-medium w-fit"
                                                    >
                                                        {selectedItemReport.conversionRate >= 80
                                                            ? "High Performer"
                                                            : selectedItemReport.conversionRate >= 60
                                                                ? "Good Performer"
                                                                : "Needs Attention"}
                                                    </Badge>
                                                    <span className="text-sm text-slate-600">
                            Average revenue per unit: $
                                                        {(selectedItemReport.totalRevenue / Math.max(selectedItemReport.totalSold, 1)).toFixed(2)}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : selectedItem ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                            <p>Loading item data...</p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>Select an item to view its sales performance</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Sales by Salesperson */}
                            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <UserCheck className="h-5 w-5 text-blue-500" />
                                        Sales by Salesperson
                                    </CardTitle>
                                    <CardDescription>Detailed breakdown of individual or all salesperson performance</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Date Filter */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label htmlFor="salesperson-start-date" className="text-sm font-medium text-slate-700">
                                                Start Date
                                            </Label>
                                            <Input
                                                id="salesperson-start-date"
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="salesperson-end-date" className="text-sm font-medium text-slate-700">
                                                End Date
                                            </Label>
                                            <Input
                                                id="salesperson-end-date"
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <Button onClick={handleDateRangeChange} className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                                        <Filter className="h-4 w-4 mr-2" />
                                        Apply Date Range
                                    </Button>

                                    {/* Salesperson Selection */}
                                    <div>
                                        <Label htmlFor="salesperson" className="text-sm font-medium text-slate-700">
                                            Select Salesperson
                                        </Label>
                                        <Select value={selectedSalesperson} onValueChange={handleSalespersonChange}>
                                            <SelectTrigger className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                                                <SelectValue placeholder="Choose a salesperson or view all" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4" />
                                                        All Salespeople
                                                    </div>
                                                </SelectItem>
                                                {salespeople.map((person) => (
                                                    <SelectItem key={person.id} value={person.id}>
                                                        <div className="flex items-center gap-2">
                                                            <UserCheck className="h-4 w-4" />
                                                            {person.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Results Display */}
                                    {selectedSalesperson === "all" ? (
                                        // All Salespeople View
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-slate-900">All Salespeople Performance</h4>
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        {salesReports.length} salespeople
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Summary Cards for All */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                                                    <p className="text-xs font-medium text-blue-700">Total Items Sold</p>
                                                    <p className="text-lg font-bold text-blue-900">{totalItemsSold}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                                                    <p className="text-xs font-medium text-green-700">Total Revenue</p>
                                                    <p className="text-lg font-bold text-green-900">${totalRevenue.toLocaleString()}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                                                    <p className="text-xs font-medium text-purple-700">Avg Conversion</p>
                                                    <p className="text-lg font-bold text-purple-900">{overallConversionRate.toFixed(1)}%</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
                                                    <p className="text-xs font-medium text-amber-700">Items Returned</p>
                                                    <p className="text-lg font-bold text-amber-900">{totalItemsReturned}</p>
                                                </div>
                                            </div>

                                            {/* Individual Salesperson Cards */}
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {salesReports
                                                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                                                    .map((report, index) => (
                                                        <div
                                                            key={report.salespersonId}
                                                            className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 hover:from-blue-50 hover:to-blue-100 transition-all duration-200 border border-slate-200"
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                                            index === 0
                                                                                ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                                                                                : index === 1
                                                                                    ? "bg-gradient-to-r from-gray-400 to-gray-500"
                                                                                    : index === 2
                                                                                        ? "bg-gradient-to-r from-amber-600 to-amber-700"
                                                                                        : "bg-gradient-to-r from-slate-400 to-slate-500"
                                                                        }`}
                                                                    >
                                                                        {index + 1}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-slate-900">{report.salespersonName}</p>
                                                                        <p className="text-sm text-slate-600">
                                                                            {report.totalSold}/{report.totalAllocated} items sold
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-lg text-slate-900">
                                                                        ${report.totalRevenue.toLocaleString()}
                                                                    </p>
                                                                    <Badge
                                                                        variant={
                                                                            report.conversionRate >= 80
                                                                                ? "default"
                                                                                : report.conversionRate >= 60
                                                                                    ? "secondary"
                                                                                    : "destructive"
                                                                        }
                                                                        className="text-xs"
                                                                    >
                                                                        {report.conversionRate.toFixed(1)}%
                                                                    </Badge>
                                                                </div>
                                                            </div>

                                                            {/* Performance Metrics */}
                                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                                <div className="p-2 rounded bg-white/50">
                                                                    <p className="text-xs text-slate-600">Allocated</p>
                                                                    <p className="font-semibold text-slate-900">{report.totalAllocated}</p>
                                                                </div>
                                                                <div className="p-2 rounded bg-white/50">
                                                                    <p className="text-xs text-slate-600">Sold</p>
                                                                    <p className="font-semibold text-green-700">{report.totalSold}</p>
                                                                </div>
                                                                <div className="p-2 rounded bg-white/50">
                                                                    <p className="text-xs text-slate-600">Returned</p>
                                                                    <p className="font-semibold text-amber-700">{report.totalReturned}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ) : selectedSalespersonReport ? (
                                        // Individual Salesperson View
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-slate-900">{selectedSalespersonReport.salespersonName}</h4>
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        Individual Performance
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                                                    <p className="text-xs font-medium text-blue-700">Total Items Sold</p>
                                                    <p className="text-lg font-bold text-blue-900">{selectedSalespersonReport.totalItemsSold}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                                                    <p className="text-xs font-medium text-green-700">Total Revenue</p>
                                                    <p className="text-lg font-bold text-green-900">
                                                        ${selectedSalespersonReport.totalRevenue.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <h4 className="font-semibold text-slate-900">Items Sold Breakdown</h4>
                                                <div className="max-h-48 overflow-y-auto space-y-2">
                                                    {selectedSalespersonReport.itemsSold.map((item, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 hover:from-blue-50 hover:to-blue-100 transition-all duration-200"
                                                        >
                                                            <div>
                                                                <p className="font-medium text-sm text-slate-900">{item.itemName}</p>
                                                                <p className="text-xs text-slate-600">Quantity: {item.quantity}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-sm text-slate-900">${item.revenue.toLocaleString()}</p>
                                                                <p className="text-xs text-slate-600">
                                                                    ${(item.revenue / item.quantity).toFixed(2)}/unit
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : selectedSalesperson ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                            <p>Loading salesperson data...</p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>Select a salesperson or view all to see detailed performance</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Top Items Performance */}
                            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Package className="h-5 w-5 text-purple-500" />
                                        Top Items Performance
                                    </CardTitle>
                                    <CardDescription>Best and worst performing items by conversion rate</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-slate-200">
                                                    <TableHead className="font-semibold text-slate-700">Item</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Price</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Allocated</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Sold</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Revenue</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Conversion</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Performance</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {itemSalesReports
                                                    .sort((a, b) => b.conversionRate - a.conversionRate)
                                                    .map((report, index) => (
                                                        <TableRow key={report.itemId} className="border-slate-100 hover:bg-slate-50/50">
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                                                                            index < 3 ? "bg-gradient-to-r from-purple-400 to-purple-500" : "bg-slate-400"
                                                                        }`}
                                                                    >
                                                                        {index + 1}
                                                                    </div>
                                                                    <span className="text-slate-900">{report.itemName}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-slate-700">${report.itemPrice.toFixed(2)}</TableCell>
                                                            <TableCell className="text-slate-700">{report.totalAllocated}</TableCell>
                                                            <TableCell className="text-slate-700">{report.totalSold}</TableCell>
                                                            <TableCell className="font-semibold text-slate-900">
                                                                ${report.totalRevenue.toLocaleString()}
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
                                                                    className="font-medium"
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
                                                                    className="font-medium"
                                                                >
                                                                    {report.conversionRate >= 80
                                                                        ? "Excellent"
                                                                        : report.conversionRate >= 60
                                                                            ? "Good"
                                                                            : "Poor"}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
