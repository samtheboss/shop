"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  BarChart3,
  DollarSign,
  Filter,
  X,
  FileText,
  TrendingUp,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Salesperson {
  id: string
  name: string
  phone: string
  totalSales: number
  itemsAllocated: number
}

interface Allocation {
  id: string
  salespersonId: string
  salespersonName: string
  itemId: string
  itemName: string
  itemPrice: number
  quantity: number
  soldQuantity: number
  allocationDate: string
  status: "ALLOCATED" | "SOLD" | "RETURNED"
}

export default function Reports() {
  const [salespeople, setSalespeople] = useState<Salesperson[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [salespersonFilter, setSalespersonFilter] = useState("")

  // Set today's date as default
  const today = new Date().toISOString().split("T")[0]
  const [dateFilter, setDateFilter] = useState({
    startDate: today,
    endDate: today,
    isActive: true,
  })
  const [loading, setLoading] = useState(true)
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salespeopleRes, allocationsRes] = await Promise.all([
          fetch(baseUrl + `/salespeople`),
          fetch(baseUrl + `/allocations`),
        ])

        if (!salespeopleRes.ok || !allocationsRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const [salespeopleData, allocationsData] = await Promise.all([salespeopleRes.json(), allocationsRes.json()])

        setSalespeople(salespeopleData)
        setAllocations(allocationsData)
        setLoading(false)
      } catch (err) {
        console.error("Failed to fetch data:", err)
        setLoading(false)
        toast({
          title: "Error",
          description: "Failed to load data from server",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [])

  const handleDateFilter = () => {
    if (dateFilter.startDate && dateFilter.endDate) {
      setDateFilter((prev) => ({ ...prev, isActive: true }))
    }
  }

  const clearDateFilter = () => {
    setDateFilter({
      startDate: "",
      endDate: "",
      isActive: false,
    })
  }

  const setTodayFilter = () => {
    const today = new Date().toISOString().split("T")[0]
    setDateFilter({
      startDate: today,
      endDate: today,
      isActive: true,
    })
  }

  const clearAllFilters = () => {
    setDateFilter({
      startDate: "",
      endDate: "",
      isActive: false,
    })
    setSalespersonFilter("")
  }

  const getFilteredAllocations = () => {
    let filteredAllocations = allocations

    // Apply date filter if active
    if (dateFilter.isActive && dateFilter.startDate && dateFilter.endDate) {
      const startDate = new Date(dateFilter.startDate)
      const endDate = new Date(dateFilter.endDate)
      endDate.setHours(23, 59, 59, 999) // Include the entire end date

      filteredAllocations = allocations.filter((allocation) => {
        const allocationDate = new Date(allocation.allocationDate)
        return allocationDate >= startDate && allocationDate <= endDate
      })
    }

    // Apply salesperson filter if selected
    if (salespersonFilter) {
      filteredAllocations = filteredAllocations.filter((allocation) => allocation.salespersonId === salespersonFilter)
    }

    // Sort by date (newest first) and return ALL results without limiting
    return filteredAllocations.sort(
        (a, b) => new Date(b.allocationDate).getTime() - new Date(a.allocationDate).getTime(),
    )
  }

  const isToday = () => {
    const today = new Date().toISOString().split("T")[0]
    return dateFilter.startDate === today && dateFilter.endDate === today && dateFilter.isActive
  }

  const getFilteredAllocationTotals = () => {
    const filtered = getFilteredAllocations()
    const totalQuantity = filtered.reduce((total, allocation) => total + allocation.soldQuantity, 0)
    const totalValue = filtered.reduce((total, allocation) => total + allocation.soldQuantity * allocation.itemPrice, 0)
    const totalAllocations = filtered.length

    return {
      totalQuantity,
      totalValue,
      totalAllocations,
    }
  }

  const getTotalAllocatedValue = () => {
    return allocations.reduce((total, allocation) => total + allocation.quantity * allocation.itemPrice, 0)
  }

  const getTotalAllocatedItems = () => {
    return allocations.reduce((total, allocation) => total + allocation.quantity, 0)
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading reports data...</p>
          </div>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/">
                <Button variant="outline" size="icon" className="shadow-sm hover:shadow-md transition-shadow">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Sales Reports
                </h1>
                <p className="text-slate-600 mt-2 text-lg">View and analyze allocation and sales data</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border shadow-sm">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-slate-700">{getFilteredAllocations().length} Records</span>
                {isToday() && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      Today
                    </Badge>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Package className="h-5 w-5 text-blue-600" />
                    Total Allocated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700">{getTotalAllocatedItems()}</div>
                  <p className="text-sm text-blue-600 mt-1">Items assigned</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    Total Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-700">
                    KES {getTotalAllocatedValue().toLocaleString()}
                  </div>
                  <p className="text-sm text-emerald-600 mt-1">Allocated value</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <User className="h-5 w-5 text-amber-600" />
                    Active Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-700">{salespeople.length}</div>
                  <p className="text-sm text-amber-600 mt-1">Salespeople</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Filtered Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-700">{getFilteredAllocations().length}</div>
                  <p className="text-sm text-purple-600 mt-1">Current view</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Allocations Report */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="border-b border-slate-100">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  {isToday() ? "Today's Allocations" : "Allocations Report"}
                  <Badge variant="outline" className="ml-2">
                    {getFilteredAllocations().length} total
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {isToday() && !salespersonFilter
                      ? "All allocations made today - no limit applied"
                      : salespersonFilter && isToday()
                          ? `Today's allocations for ${salespeople.find((s) => s.id === salespersonFilter)?.name}`
                          : salespersonFilter && !isToday()
                              ? `Allocations for ${salespeople.find((s) => s.id === salespersonFilter)?.name} in selected period`
                              : "Filtered allocations for selected date range"}
                </CardDescription>
              </div>

              {/* Filter Controls */}
              <div className="mt-4 bg-slate-50/70 rounded-lg p-4 border border-slate-200">
                {/* Active Filters Display */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-sm font-medium text-slate-700 mr-1">Active Filters:</span>
                  <Button
                      onClick={setTodayFilter}
                      variant={isToday() ? "default" : "outline"}
                      size="sm"
                      className={isToday() ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Today
                  </Button>

                  {dateFilter.isActive && !isToday() && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <Calendar className="h-3 w-3 mr-1" />
                        Custom Range
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1 hover:bg-blue-200"
                            onClick={() => setDateFilter({ startDate: "", endDate: "", isActive: false })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                  )}

                  {salespersonFilter && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        <User className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">
                      {salespeople.find((s) => s.id === salespersonFilter)?.name}
                    </span>
                        <span className="sm:hidden">
                      {salespeople.find((s) => s.id === salespersonFilter)?.name?.split(" ")[0]}
                    </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1 hover:bg-purple-200"
                            onClick={() => setSalespersonFilter("")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                  )}

                  {(dateFilter.isActive || salespersonFilter) && (
                      <Button
                          onClick={clearAllFilters}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Clear All
                      </Button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Salesperson Filter */}
                  <div>
                    <Label htmlFor="salesperson-filter" className="text-sm font-medium text-slate-700 mb-1.5 block">
                      Filter by Salesperson
                    </Label>
                    <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
                      <SelectTrigger
                          id="salesperson-filter"
                          className="w-full text-sm border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                      >
                        <SelectValue placeholder="Select salesperson" />
                      </SelectTrigger>
                      <SelectContent>
                        {salespeople.map((salesperson) => (
                            <SelectItem key={salesperson.id} value={salesperson.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span>{salesperson.name}</span>
                                <Badge variant="outline" className="ml-auto text-xs">
                                  {allocations.filter((a) => a.salespersonId === salesperson.id).length}
                                </Badge>
                              </div>
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filters */}
                  <div>
                    <Label htmlFor="date-filter" className="text-sm font-medium text-slate-700 mb-1.5 block">
                      Filter by Date Range
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                          id="date-filter"
                          type="date"
                          value={dateFilter.startDate}
                          onChange={(e) => setDateFilter((prev) => ({ ...prev, startDate: e.target.value }))}
                          className="text-xs sm:text-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500 flex-1 min-w-0"
                          placeholder="Start date"
                      />
                      <span className="text-slate-500 text-xs sm:text-sm px-1">to</span>
                      <Input
                          type="date"
                          value={dateFilter.endDate}
                          onChange={(e) => setDateFilter((prev) => ({ ...prev, endDate: e.target.value }))}
                          className="text-xs sm:text-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500 flex-1 min-w-0"
                          placeholder="End date"
                      />
                      <Button
                          onClick={handleDateFilter}
                          disabled={!dateFilter.startDate || !dateFilter.endDate}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden xs:inline">Filter</span>
                        <span className="xs:hidden">Go</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Stats for Filtered Allocations */}
              {getFilteredAllocations().length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Total Items</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-800">
                        {getFilteredAllocationTotals().totalQuantity.toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {getFilteredAllocationTotals().totalAllocations} allocations
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Total Sales Value</span>
                      </div>
                      <div className="text-2xl font-bold text-emerald-800">
                        KES {getFilteredAllocationTotals().totalValue.toLocaleString()}
                      </div>
                      <div className="text-xs text-emerald-600 mt-1">{isToday() ? "Today's sales" : "Selected period"}</div>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">Average per Allocation</span>
                      </div>
                      <div className="text-2xl font-bold text-amber-800">
                        KES{" "}
                        {getFilteredAllocationTotals().totalAllocations > 0
                            ? (
                                getFilteredAllocationTotals().totalValue / getFilteredAllocationTotals().totalAllocations
                            ).toFixed(0)
                            : "0"}
                      </div>
                      <div className="text-xs text-amber-600 mt-1">Per transaction</div>
                    </div>
                  </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile Card Layout */}
              <div className="block md:hidden">
                <div className="p-4 space-y-4">
                  {getFilteredAllocations().map((allocation, index) => (
                      <div
                          key={allocation.id}
                          className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Header with date and status */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="text-sm text-slate-600">
                            {new Date(allocation.allocationDate).toLocaleDateString()}
                          </div>
                          <Badge
                              variant={
                                allocation.status === "ALLOCATED"
                                    ? "default"
                                    : allocation.status === "SOLD"
                                        ? "default"
                                        : "secondary"
                              }
                              className={
                                allocation.status === "ALLOCATED"
                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    : allocation.status === "SOLD"
                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              }
                          >
                            {allocation.status}
                          </Badge>
                        </div>

                        {/* Salesperson and Item */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-slate-800">{allocation.salespersonName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-slate-800">{allocation.itemName}</span>
                          </div>
                        </div>

                        {/* Quantity and Pricing */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-600 block mb-1">Quantity</span>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {allocation.soldQuantity}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-slate-600 block mb-1">Unit Price</span>
                            <span className="font-semibold text-emerald-600">${allocation.itemPrice}</span>
                          </div>
                        </div>

                        {/* Total Value */}
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 font-medium">Total Value</span>
                            <span className="text-lg font-bold text-slate-800">
                          ${(allocation.soldQuantity * allocation.itemPrice).toFixed(2)}
                        </span>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Salesperson</TableHead>
                      <TableHead className="font-semibold text-slate-700">Item</TableHead>
                      <TableHead className="font-semibold text-slate-700">Quantity</TableHead>
                      <TableHead className="font-semibold text-slate-700">Unit Price</TableHead>
                      <TableHead className="font-semibold text-slate-700">Total Value</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredAllocations().map((allocation, index) => (
                        <TableRow
                            key={allocation.id}
                            className={`hover:bg-slate-50/50 transition-colors ${
                                index % 2 === 0 ? "bg-white" : "bg-slate-25"
                            }`}
                        >
                          <TableCell className="text-slate-600">
                            {new Date(allocation.allocationDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium text-slate-800">{allocation.salespersonName}</TableCell>
                          <TableCell className="font-medium text-slate-800">{allocation.itemName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {allocation.soldQuantity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-600">${allocation.itemPrice}</TableCell>
                          <TableCell className="font-semibold text-slate-700">
                            ${(allocation.soldQuantity * allocation.itemPrice).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                                variant={
                                  allocation.status === "ALLOCATED"
                                      ? "default"
                                      : allocation.status === "SOLD"
                                          ? "default"
                                          : "secondary"
                                }
                                className={
                                  allocation.status === "ALLOCATED"
                                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                      : allocation.status === "SOLD"
                                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                }
                            >
                              {allocation.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {getFilteredAllocations().length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                      {isToday() ? "No allocations made today" : "No allocations found for selected date range"}
                    </h3>
                    <p className="text-slate-600">
                      {isToday()
                          ? "Start by allocating items to your sales team"
                          : "Try adjusting your date filter or select today's transactions"}
                    </p>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
