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
    AlertCircle,
    CheckCircle,
    Search,
    BarChart3,
    DollarSign,
    Filter,
    X,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

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
    price: number
    stock: number
    category?: string
    sku?: string
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

export default function AllocateItems() {
    const [salespeople, setSalespeople] = useState<Salesperson[]>([])
    const [items, setItems] = useState<Item[]>([])
    const [allocations, setAllocations] = useState<Allocation[]>([])
    const [selectedSalesperson, setSelectedSalesperson] = useState("")
    const [selectedItem, setSelectedItem] = useState("")
    const [quantity, setQuantity] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
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
                const [salespeopleRes, itemsRes, allocationsRes] = await Promise.all([
                    fetch(baseUrl + `/salespeople`),
                    fetch(baseUrl + `/items`),
                    fetch(baseUrl + `/allocations`),
                ])
                console.log(baseUrl + `/salespeople`)
                if (!salespeopleRes.ok || !itemsRes.ok || !allocationsRes.ok) {
                    throw new Error("Failed to fetch data")
                }

                const [salespeopleData, itemsData, allocationsData] = await Promise.all([
                    salespeopleRes.json(),
                    itemsRes.json(),
                    allocationsRes.json(),
                ])

                setSalespeople(salespeopleData)
                setItems(itemsData)
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

    const handleAllocate = async () => {
        if (selectedSalesperson && selectedItem && quantity) {
            const salesperson = salespeople.find((s) => s.id === selectedSalesperson)
            const item = items.find((i) => i.id === selectedItem)
            const qty = Number.parseInt(quantity)

            if (salesperson && item && qty > 0 && qty <= item.stock) {
                const newAllocation = {
                    salespersonId: selectedSalesperson,
                    itemId: selectedItem,
                    quantity: qty,
                    allocationDate: new Date().toISOString(),
                }

                try {
                    const response = await fetch(`${baseUrl}/allocations`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(newAllocation),
                    })

                    if (!response.ok) {
                        throw new Error("Failed to allocate item")
                    }

                    const savedAllocation = await response.json()

                    // Update local UI with returned data
                    setAllocations([
                        ...allocations,
                        {
                            ...savedAllocation,
                            salespersonName: salesperson.name,
                            itemName: item.name,
                            itemPrice: item.price,
                            quantity: newAllocation.quantity,
                            date: newAllocation.allocationDate,
                            status: "ALLOCATED" as const,
                        },
                    ])

                    setItems(items.map((i) => (i.id === selectedItem ? { ...i, stock: i.stock - qty } : i)))

                    setSalespeople(
                        salespeople.map((s) =>
                            s.id === selectedSalesperson ? { ...s, itemsAllocated: s.itemsAllocated + qty } : s,
                        ),
                    )

                    // Reset form
                    setSelectedSalesperson("")
                    setSelectedItem("")
                    setQuantity("")

                    toast({
                        title: "Success",
                        description: `${qty} ${item.name}(s) allocated to ${salesperson.name}`,
                    })
                } catch (error) {
                    console.error("Error allocating item:", error)
                    toast({
                        title: "Error",
                        description: "Failed to allocate item",
                        variant: "destructive",
                    })
                }
            }
        }
    }

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

    const selectedItemData = items.find((item) => item.id === selectedItem)
    const selectedSalespersonData = salespeople.find((person) => person.id === selectedSalesperson)

    const filteredItems = items.filter(
        (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    const getTotalAllocatedValue = () => {
        return allocations.reduce((total, allocation) => total + allocation.quantity * allocation.itemPrice, 0)
    }

    const getTotalAllocatedItems = () => {
        return allocations.reduce((total, allocation) => total + allocation.quantity, 0)
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading allocation data...</p>
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
                                Item Allocation
                            </h1>
                            <p className="text-slate-600 mt-2 text-lg">Assign inventory items to your sales team</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border shadow-sm">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-slate-700">{getFilteredAllocations().length} Allocations</span>
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
                                    <BarChart3 className="h-5 w-5 text-purple-600" />
                                    Available Items
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-700">{items.filter((i) => i.stock > 0).length}</div>
                                <p className="text-sm text-purple-600 mt-1">In stock</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                    {/* Allocation Form */}
                    <Card className="xl:col-span-1 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                        <CardHeader className="border-b border-slate-100">
                            <CardTitle className="flex items-center gap-2 text-slate-800">
                                <Package className="h-5 w-5 text-blue-600" />
                                New Allocation
                            </CardTitle>
                            <CardDescription>Select a salesperson and items to allocate</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid gap-3">
                                <Label htmlFor="salesperson" className="text-slate-700 font-medium">
                                    Salesperson
                                </Label>
                                <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                                    <SelectTrigger className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                                        <SelectValue placeholder="Select a salesperson" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {salespeople.map((salesperson) => (
                                            <SelectItem key={salesperson.id} value={salesperson.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span>{salesperson.name}</span>
                                                    <Badge variant="outline" className="ml-auto text-xs">
                                                        {salesperson.itemsAllocated} items
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedSalespersonData && (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-blue-700">Current allocations:</span>
                                            <Badge className="bg-blue-100 text-blue-700">{selectedSalespersonData.itemsAllocated}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center text-sm mt-1">
                                            <span className="text-blue-700">Total sales:</span>
                                            <span className="font-semibold text-blue-800">${selectedSalespersonData.totalSales}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="item" className="text-slate-700 font-medium">
                                    Item
                                </Label>
                                <Select value={selectedItem} onValueChange={setSelectedItem}>
                                    <SelectTrigger className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                                        <SelectValue placeholder="Select an item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {items
                                            .filter((item) => item.stock > 0)
                                            .map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{item.name}</span>
                                                            <span className="text-xs text-slate-500">${item.price}</span>
                                                        </div>
                                                        <Badge
                                                            variant={item.stock > 20 ? "default" : item.stock > 10 ? "secondary" : "destructive"}
                                                            className="ml-2 text-xs"
                                                        >
                                                            {item.stock} in stock
                                                        </Badge>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                {selectedItemData && (
                                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-emerald-700 font-medium">Price per unit:</span>
                                                <div className="text-lg font-bold text-emerald-800">${selectedItemData.price}</div>
                                            </div>
                                            <div>
                                                <span className="text-emerald-700 font-medium">Available stock:</span>
                                                <div className="text-lg font-bold text-emerald-800">{selectedItemData.stock} units</div>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-emerald-600 mb-1">
                                                <span>Stock Level</span>
                                                <span>{Math.round((selectedItemData.stock / 100) * 100)}%</span>
                                            </div>
                                            <Progress value={Math.min((selectedItemData.stock / 50) * 100, 100)} className="h-2" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="quantity" className="text-slate-700 font-medium">
                                    Quantity
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="Enter quantity"
                                    min="1"
                                    max={selectedItemData?.stock || 0}
                                    className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                                {quantity && selectedItemData && (
                                    <div className="p-3 bg-slate-50 rounded-lg border">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600">Total value:</span>
                                            <span className="font-bold text-slate-800">
                        KES {(Number.parseInt(quantity) * selectedItemData.price).toFixed(2)}
                      </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleAllocate}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                disabled={!selectedSalesperson || !selectedItem || !quantity}
                                size="lg"
                            >
                                <CheckCircle className="mr-2 h-5 w-5" />
                                Allocate Items
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Current Inventory */}
                    <Card className="xl:col-span-2 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                        <CardHeader className="border-b border-slate-100">
                            <CardTitle className="text-slate-800">Available Inventory</CardTitle>
                            <CardDescription>Items ready for allocation</CardDescription>
                            <div className="pt-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search items..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-96 overflow-y-auto">
                                <div className="p-6 space-y-3">
                                    {filteredItems
                                        .filter((item) => item.stock > 0)
                                        .map((item) => (
                                            <div
                                                key={item.id}
                                                className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer ${
                                                    selectedItem === item.id
                                                        ? "border-blue-300 bg-blue-50 shadow-md"
                                                        : "border-slate-200 hover:border-slate-300"
                                                }`}
                                                onClick={() => setSelectedItem(item.id)}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                        <div>
                                                            <p className="font-medium text-slate-800">{item.name}</p>
                                                            <div className="flex items-center gap-4 mt-1">
                                                                <p className="text-sm text-emerald-600 font-semibold">${item.price}</p>
                                                                {item.sku && (
                                                                    <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                                        {item.sku}
                                                                    </code>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <Badge
                                                            variant={item.stock > 20 ? "default" : item.stock > 10 ? "secondary" : "destructive"}
                                                            className="text-xs"
                                                        >
                                                            {item.stock} in stock
                                                        </Badge>
                                                        <div className="mt-1">
                                                            <Progress value={Math.min((item.stock / 50) * 100, 100)} className="h-1 w-16" />
                                                        </div>
                                                    </div>
                                                    {item.stock <= 10 && <AlertCircle className="h-4 w-4 text-orange-500" />}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* All Allocations */}
                {/*<Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">*/}
                {/*    <CardHeader className="border-b border-slate-100">*/}
                {/*        <div>*/}
                {/*            <CardTitle className="flex items-center gap-2 text-slate-800">*/}
                {/*                <Calendar className="h-5 w-5 text-blue-600" />*/}
                {/*                {isToday() ? "Today's Allocations" : "Allocations"}*/}
                {/*                <Badge variant="outline" className="ml-2">*/}
                {/*                    {getFilteredAllocations().length} total*/}
                {/*                </Badge>*/}
                {/*            </CardTitle>*/}
                {/*            <CardDescription>*/}
                {/*                {isToday() && !salespersonFilter*/}
                {/*                    ? "All allocations made today - no limit applied"*/}
                {/*                    : salespersonFilter && isToday()*/}
                {/*                        ? `Today's allocations for ${salespeople.find((s) => s.id === salespersonFilter)?.name}`*/}
                {/*                        : salespersonFilter && !isToday()*/}
                {/*                            ? `Allocations for ${salespeople.find((s) => s.id === salespersonFilter)?.name} in selected period`*/}
                {/*                            : "Filtered allocations for selected date range"}*/}
                {/*            </CardDescription>*/}
                {/*        </div>*/}

                {/*        /!* Filter Controls - Now below title for both mobile and desktop *!/*/}
                {/*        <div className="mt-4 bg-slate-50/70 rounded-lg p-4 border border-slate-200">*/}
                {/*            /!* Active Filters Display *!/*/}
                {/*            <div className="flex flex-wrap items-center gap-2 mb-4">*/}
                {/*                <span className="text-sm font-medium text-slate-700 mr-1">Active Filters:</span>*/}
                {/*                <Button*/}
                {/*                    onClick={setTodayFilter}*/}
                {/*                    variant={isToday() ? "default" : "outline"}*/}
                {/*                    size="sm"*/}
                {/*                    className={isToday() ? "bg-green-600 hover:bg-green-700 text-white" : ""}*/}
                {/*                >*/}
                {/*                    <Calendar className="h-4 w-4 mr-1" />*/}
                {/*                    Today*/}
                {/*                </Button>*/}

                {/*                {dateFilter.isActive && !isToday() && (*/}
                {/*                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">*/}
                {/*                        <Calendar className="h-3 w-3 mr-1" />*/}
                {/*                        Custom Range*/}
                {/*                        <Button*/}
                {/*                            variant="ghost"*/}
                {/*                            size="sm"*/}
                {/*                            className="h-4 w-4 p-0 ml-1 hover:bg-blue-200"*/}
                {/*                            onClick={() => setDateFilter({ startDate: "", endDate: "", isActive: false })}*/}
                {/*                        >*/}
                {/*                            <X className="h-3 w-3" />*/}
                {/*                        </Button>*/}
                {/*                    </Badge>*/}
                {/*                )}*/}

                {/*                {salespersonFilter && (*/}
                {/*                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">*/}
                {/*                        <User className="h-3 w-3 mr-1" />*/}
                {/*                        <span className="hidden sm:inline">*/}
                {/*      {salespeople.find((s) => s.id === salespersonFilter)?.name}*/}
                {/*    </span>*/}
                {/*                        <span className="sm:hidden">*/}
                {/*      {salespeople.find((s) => s.id === salespersonFilter)?.name?.split(" ")[0]}*/}
                {/*    </span>*/}
                {/*                        <Button*/}
                {/*                            variant="ghost"*/}
                {/*                            size="sm"*/}
                {/*                            className="h-4 w-4 p-0 ml-1 hover:bg-purple-200"*/}
                {/*                            onClick={() => setSalespersonFilter("")}*/}
                {/*                        >*/}
                {/*                            <X className="h-3 w-3" />*/}
                {/*                        </Button>*/}
                {/*                    </Badge>*/}
                {/*                )}*/}

                {/*                {(dateFilter.isActive || salespersonFilter) && (*/}
                {/*                    <Button*/}
                {/*                        onClick={clearAllFilters}*/}
                {/*                        variant="outline"*/}
                {/*                        size="sm"*/}
                {/*                        className="text-red-600 border-red-200 hover:bg-red-50"*/}
                {/*                    >*/}
                {/*                        Clear All*/}
                {/*                    </Button>*/}
                {/*                )}*/}
                {/*            </div>*/}

                {/*            /!* Filter Controls *!/*/}
                {/*            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">*/}
                {/*                /!* Salesperson Filter *!/*/}
                {/*                <div>*/}
                {/*                    <Label htmlFor="salesperson-filter" className="text-sm font-medium text-slate-700 mb-1.5 block">*/}
                {/*                        Filter by Salesperson*/}
                {/*                    </Label>*/}
                {/*                    <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>*/}
                {/*                        <SelectTrigger*/}
                {/*                            id="salesperson-filter"*/}
                {/*                            className="w-full text-sm border-slate-200 focus:border-purple-500 focus:ring-purple-500"*/}
                {/*                        >*/}
                {/*                            <SelectValue placeholder="Select salesperson" />*/}
                {/*                        </SelectTrigger>*/}
                {/*                        <SelectContent>*/}
                {/*                            {salespeople.map((salesperson) => (*/}
                {/*                                <SelectItem key={salesperson.id} value={salesperson.id}>*/}
                {/*                                    <div className="flex items-center gap-2">*/}
                {/*                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>*/}
                {/*                                        <span>{salesperson.name}</span>*/}
                {/*                                        <Badge variant="outline" className="ml-auto text-xs">*/}
                {/*                                            {allocations.filter((a) => a.salespersonId === salesperson.id).length}*/}
                {/*                                        </Badge>*/}
                {/*                                    </div>*/}
                {/*                                </SelectItem>*/}
                {/*                            ))}*/}
                {/*                        </SelectContent>*/}
                {/*                    </Select>*/}
                {/*                </div>*/}

                {/*                /!* Date Range Filters *!/*/}
                {/*                <div>*/}
                {/*                    <Label htmlFor="date-filter" className="text-sm font-medium text-slate-700 mb-1.5 block">*/}
                {/*                        Filter by Date Range*/}
                {/*                    </Label>*/}
                {/*                    <div className="flex items-center gap-2">*/}
                {/*                        <Input*/}
                {/*                            id="date-filter"*/}
                {/*                            type="date"*/}
                {/*                            value={dateFilter.startDate}*/}
                {/*                            onChange={(e) => setDateFilter((prev) => ({ ...prev, startDate: e.target.value }))}*/}
                {/*                            className="text-xs sm:text-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500 flex-1 min-w-0"*/}
                {/*                            placeholder="Start date"*/}
                {/*                        />*/}
                {/*                        <span className="text-slate-500 text-xs sm:text-sm px-1">to</span>*/}
                {/*                        <Input*/}
                {/*                            type="date"*/}
                {/*                            value={dateFilter.endDate}*/}
                {/*                            onChange={(e) => setDateFilter((prev) => ({ ...prev, endDate: e.target.value }))}*/}
                {/*                            className="text-xs sm:text-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500 flex-1 min-w-0"*/}
                {/*                            placeholder="End date"*/}
                {/*                        />*/}
                {/*                        <Button*/}
                {/*                            onClick={handleDateFilter}*/}
                {/*                            disabled={!dateFilter.startDate || !dateFilter.endDate}*/}
                {/*                            size="sm"*/}
                {/*                            className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"*/}
                {/*                        >*/}
                {/*                            <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />*/}
                {/*                            <span className="hidden xs:inline">Filter</span>*/}
                {/*                            <span className="xs:hidden">Go</span>*/}
                {/*                        </Button>*/}
                {/*                    </div>*/}
                {/*                </div>*/}
                {/*            </div>*/}
                {/*        </div>*/}

                {/*        /!* Summary Stats for Filtered Allocations *!/*/}
                {/*        {getFilteredAllocations().length > 0 && (*/}


                {/*                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">*/}
                {/*                    <div className="flex items-center gap-2 mb-2">*/}
                {/*                        <DollarSign className="h-4 w-4 text-emerald-600" />*/}
                {/*                        <span className="text-sm font-medium text-emerald-700">Total Sales Value</span>*/}
                {/*                    </div>*/}
                {/*                    <div className="text-2xl font-bold text-emerald-800">*/}
                {/*                        KES {getFilteredAllocationTotals().totalValue.toLocaleString()}*/}
                {/*                    </div>*/}
                {/*                    <div className="text-xs text-emerald-600 mt-1">{isToday() ? "Today's sales" : "Selected period"}</div>*/}
                {/*                </div>*/}


                {/*        )}*/}
                {/*    </CardHeader>*/}
                {/*    <CardContent className="p-0">*/}
                {/*        /!* Mobile Card Layout *!/*/}
                {/*        <div className="block md:hidden">*/}
                {/*            <div className="p-4 space-y-4">*/}
                {/*                {getFilteredAllocations().map((allocation, index) => (*/}
                {/*                    <div*/}
                {/*                        key={allocation.id}*/}
                {/*                        className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"*/}
                {/*                    >*/}
                {/*                        /!* Header with date and status *!/*/}
                {/*                        <div className="flex justify-between items-start mb-3">*/}
                {/*                            <div className="text-sm text-slate-600">*/}
                {/*                                {new Date(allocation.allocationDate).toLocaleDateString()}*/}
                {/*                            </div>*/}
                {/*                            <Badge*/}
                {/*                                variant={*/}
                {/*                                    allocation.status === "ALLOCATED"*/}
                {/*                                        ? "default"*/}
                {/*                                        : allocation.status === "SOLD"*/}
                {/*                                            ? "default"*/}
                {/*                                            : "secondary"*/}
                {/*                                }*/}
                {/*                                className={*/}
                {/*                                    allocation.status === "ALLOCATED"*/}
                {/*                                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"*/}
                {/*                                        : allocation.status === "SOLD"*/}
                {/*                                            ? "bg-green-100 text-green-700 hover:bg-green-200"*/}
                {/*                                            : "bg-amber-100 text-amber-700 hover:bg-amber-200"*/}
                {/*                                }*/}
                {/*                            >*/}
                {/*                                {allocation.status}*/}
                {/*                            </Badge>*/}
                {/*                        </div>*/}

                {/*                        /!* Salesperson and Item *!/*/}
                {/*                        <div className="mb-3">*/}
                {/*                            <div className="flex items-center gap-2 mb-2">*/}
                {/*                                <User className="h-4 w-4 text-purple-600" />*/}
                {/*                                <span className="font-medium text-slate-800">{allocation.salespersonName}</span>*/}
                {/*                            </div>*/}
                {/*                            <div className="flex items-center gap-2">*/}
                {/*                                <Package className="h-4 w-4 text-blue-600" />*/}
                {/*                                <span className="font-medium text-slate-800">{allocation.itemName}</span>*/}
                {/*                            </div>*/}
                {/*                        </div>*/}

                {/*                        /!* Quantity and Pricing *!/*/}
                {/*                        <div className="grid grid-cols-2 gap-4 text-sm">*/}
                {/*                            <div>*/}
                {/*                                <span className="text-slate-600 block mb-1">Quantity</span>*/}
                {/*                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">*/}
                {/*                                    {allocation.soldQuantity}*/}
                {/*                                </Badge>*/}
                {/*                            </div>*/}
                {/*                            <div>*/}
                {/*                                <span className="text-slate-600 block mb-1">Unit Price</span>*/}
                {/*                                <span className="font-semibold text-emerald-600">${allocation.itemPrice}</span>*/}
                {/*                            </div>*/}
                {/*                        </div>*/}

                {/*                        /!* Total Value *!/*/}
                {/*                        <div className="mt-3 pt-3 border-t border-slate-100">*/}
                {/*                            <div className="flex justify-between items-center">*/}
                {/*                                <span className="text-slate-600 font-medium">Total Value</span>*/}
                {/*                                <span className="text-lg font-bold text-slate-800">*/}
                {/*          ${(allocation.soldQuantity * allocation.itemPrice).toFixed(2)}*/}
                {/*        </span>*/}
                {/*                            </div>*/}
                {/*                        </div>*/}
                {/*                    </div>*/}
                {/*                ))}*/}
                {/*            </div>*/}
                {/*        </div>*/}

                {/*        /!* Desktop Table Layout *!/*/}
                {/*        <div className="hidden md:block overflow-x-auto">*/}
                {/*            <Table>*/}
                {/*                <TableHeader>*/}
                {/*                    <TableRow className="bg-slate-50/80">*/}
                {/*                        <TableHead className="font-semibold text-slate-700">Date</TableHead>*/}
                {/*                        <TableHead className="font-semibold text-slate-700">Salesperson</TableHead>*/}
                {/*                        <TableHead className="font-semibold text-slate-700">Item</TableHead>*/}
                {/*                        <TableHead className="font-semibold text-slate-700">Quantity</TableHead>*/}
                {/*                        <TableHead className="font-semibold text-slate-700">Unit Price</TableHead>*/}
                {/*                        <TableHead className="font-semibold text-slate-700">Total Value</TableHead>*/}
                {/*                        <TableHead className="font-semibold text-slate-700">Status</TableHead>*/}
                {/*                    </TableRow>*/}
                {/*                </TableHeader>*/}
                {/*                <TableBody>*/}
                {/*                    {getFilteredAllocations().map((allocation, index) => (*/}
                {/*                        <TableRow*/}
                {/*                            key={allocation.id}*/}
                {/*                            className={`hover:bg-slate-50/50 transition-colors ${*/}
                {/*                                index % 2 === 0 ? "bg-white" : "bg-slate-25"*/}
                {/*                            }`}*/}
                {/*                        >*/}
                {/*                            <TableCell className="text-slate-600">*/}
                {/*                                {new Date(allocation.allocationDate).toLocaleDateString()}*/}
                {/*                            </TableCell>*/}
                {/*                            <TableCell className="font-medium text-slate-800">{allocation.salespersonName}</TableCell>*/}
                {/*                            <TableCell className="font-medium text-slate-800">{allocation.itemName}</TableCell>*/}
                {/*                            <TableCell>*/}
                {/*                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">*/}
                {/*                                    {allocation.soldQuantity}*/}
                {/*                                </Badge>*/}
                {/*                            </TableCell>*/}
                {/*                            <TableCell className="font-semibold text-emerald-600">${allocation.itemPrice}</TableCell>*/}
                {/*                            <TableCell className="font-semibold text-slate-700">*/}
                {/*                                ${(allocation.soldQuantity * allocation.itemPrice).toFixed(2)}*/}
                {/*                            </TableCell>*/}
                {/*                            <TableCell>*/}
                {/*                                <Badge*/}
                {/*                                    variant={*/}
                {/*                                        allocation.status === "ALLOCATED"*/}
                {/*                                            ? "default"*/}
                {/*                                            : allocation.status === "SOLD"*/}
                {/*                                                ? "default"*/}
                {/*                                                : "secondary"*/}
                {/*                                    }*/}
                {/*                                    className={*/}
                {/*                                        allocation.status === "ALLOCATED"*/}
                {/*                                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"*/}
                {/*                                            : allocation.status === "SOLD"*/}
                {/*                                                ? "bg-green-100 text-green-700 hover:bg-green-200"*/}
                {/*                                                : "bg-amber-100 text-amber-700 hover:bg-amber-200"*/}
                {/*                                    }*/}
                {/*                                >*/}
                {/*                                    {allocation.status}*/}
                {/*                                </Badge>*/}
                {/*                            </TableCell>*/}
                {/*                        </TableRow>*/}
                {/*                    ))}*/}
                {/*                </TableBody>*/}
                {/*            </Table>*/}
                {/*        </div>*/}

                {/*        {getFilteredAllocations().length === 0 && (*/}
                {/*            <div className="text-center py-12">*/}
                {/*                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">*/}
                {/*                    <Package className="h-10 w-10 text-slate-400" />*/}
                {/*                </div>*/}
                {/*                <h3 className="text-lg font-semibold text-slate-800 mb-2">*/}
                {/*                    {isToday() ? "No allocations made today" : "No allocations found for selected date range"}*/}
                {/*                </h3>*/}
                {/*                <p className="text-slate-600">*/}
                {/*                    {isToday()*/}
                {/*                        ? "Start by allocating items to your sales team"*/}
                {/*                        : "Try adjusting your date filter or select today's transactions"}*/}
                {/*                </p>*/}
                {/*            </div>*/}
                {/*        )}*/}
                {/*    </CardContent>*/}
                {/*</Card>*/}
            </div>
        </div>
    )
}
