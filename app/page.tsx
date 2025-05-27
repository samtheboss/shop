"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Package, DollarSign, TrendingUp, ArrowRight, Sparkles } from "lucide-react"

interface Salesperson {
    id: string
    name: string
    phone: string
    totalSales: number
    itemsAllocated: number
}

interface Item {
    id: string
    description: string
    price: number
    stock: number
}

interface Allocation {
    id: string
    salespersonId: string
    itemId: string
    quantity: number
    date: string
    status: "allocated" | "sold" | "returned"
}

export default function Dashboard() {
    const [salespeople, setSalespeople] = useState<Salesperson[]>([])
    const [items, setItems] = useState<Item[]>([])
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    const [allocations, setAllocations] = useState<Allocation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(baseUrl + `/items`)
            .then((res) => res.json())
            .then((data) => {
                setItems(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error("Failed to fetch items:", err)
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        fetch(baseUrl + `/salespeople`)
            .then((res) => res.json())
            .then((data) => {
                setSalespeople(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error("Failed to fetch salespeople:", err)
                setLoading(false)
            })
    }, [])

    const totalSales = salespeople.reduce((sum, person) => sum + person.totalSales, 0)
    const totalStock = items.reduce((sum, item) => sum + item.stock, 0)
    const activeSalespeople = salespeople.length

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
            <div className="container mx-auto p-4 md:p-6 pt-16 md:pt-8">
                {/* Header Section */}
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                Sales Management Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1 text-sm md:text-base">
                                Manage your sales team, inventory, and track performance
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-emerald-100">Total Sales</CardTitle>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg md:text-2xl font-bold">${totalSales.toLocaleString()}</div>
                            <p className="text-xs text-emerald-100">+12% from last month</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-blue-100">Active Salespeople</CardTitle>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Users className="h-3 w-3 md:h-4 md:w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg md:text-2xl font-bold">{activeSalespeople}</div>
                            <p className="text-xs text-blue-100">All active today</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-purple-100">Total Inventory</CardTitle>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Package className="h-3 w-3 md:h-4 md:w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg md:text-2xl font-bold">{totalStock}</div>
                            <p className="text-xs text-purple-100">Items in stock</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-orange-100">Avg. Sales/Person</CardTitle>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg md:text-2xl font-bold">
                                ${Math.round(totalSales / activeSalespeople).toLocaleString()}
                            </div>
                            <p className="text-xs text-orange-100">Per salesperson</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-sm md:text-base">
                                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                    <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                                </div>
                                Manage Salespeople
                            </CardTitle>
                            <CardDescription className="text-xs md:text-sm">Add, edit, or view salesperson details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/salespeople">
                                <Button className="w-full text-xs md:text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                                    Manage Team <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-sm md:text-base">
                                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                                    <Package className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                                </div>
                                Manage Inventory
                            </CardTitle>
                            <CardDescription className="text-xs md:text-sm">Add, edit, and track inventory items</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/inventory">
                                <Button className="w-full text-xs md:text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg">
                                    Manage Items <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-sm md:text-base">
                                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                                    <Package className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                                </div>
                                Allocate Items
                            </CardTitle>
                            <CardDescription className="text-xs md:text-sm">Assign inventory to salespeople</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/allocate">
                                <Button className="w-full text-xs md:text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg">
                                    Allocate Items <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-sm md:text-base">
                                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                                    <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                                </div>
                                End of Day
                            </CardTitle>
                            <CardDescription className="text-xs md:text-sm">Process sales and returns</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/end-of-day">
                                <Button className="w-full text-xs md:text-sm bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg">
                                    Process Sales <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardHeader className="pb-6">
                            <CardTitle className="text-sm md:text-base flex items-center gap-2">
                                <div className="p-1.5 bg-yellow-100 rounded-lg">
                                    <TrendingUp className="h-4 w-4 text-yellow-600" />
                                </div>
                                Top Performers
                            </CardTitle>
                            <CardDescription className="text-xs md:text-sm">
                                Salespeople with highest sales this month
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {salespeople
                                    .sort((a, b) => b.totalSales - a.totalSales)
                                    .slice(0, 3)
                                    .map((person, index) => (
                                        <div
                                            key={person.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-100 hover:to-gray-200/50 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Badge
                                                    variant={index === 0 ? "default" : "secondary"}
                                                    className={`text-xs ${index === 0 ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white" : ""}`}
                                                >
                                                    #{index + 1}
                                                </Badge>
                                                <div>
                                                    <p className="font-semibold text-sm md:text-base">{person.name}</p>
                                                    <p className="text-xs text-muted-foreground">{person.itemsAllocated} items allocated</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm md:text-base text-emerald-600">
                                                    ${person.totalSales.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardHeader className="pb-6">
                            <CardTitle className="text-sm md:text-base flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <Package className="h-4 w-4 text-blue-600" />
                                </div>
                                Inventory Status
                            </CardTitle>
                            <CardDescription className="text-xs md:text-sm">Current stock levels</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {items.slice(0, 4).map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-100 hover:to-gray-200/50 transition-all"
                                    >
                                        <div>
                                            <p className="font-semibold text-sm md:text-base">{item.description}</p>
                                            <p className="text-xs text-muted-foreground font-medium">${item.price}</p>
                                        </div>
                                        <Badge
                                            variant={item.stock > 20 ? "default" : item.stock > 10 ? "secondary" : "destructive"}
                                            className={`text-xs ${
                                                item.stock > 20
                                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                                                    : item.stock > 10
                                                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"
                                                        : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                            }`}
                                        >
                                            {item.stock} in stock
                                        </Badge>
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
