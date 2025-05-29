"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Package,
  DollarSign,
  AlertTriangle,
  Search,
  BarChart3,
  RefreshCwIcon
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

interface Item {
  id: string
  name: string
  description: string
  price: number
  stock: number
  minStock: number
  category: string
  sku: string
  createdAt: string
  updatedAt: string
}

export default function InventoryManagement() {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    minStock: "",
    category: "",
    sku: "",
  })

  const fetchItems = () => {
    setLoading(true)
    fetch(baseUrl + `/items`)
        .then((res) => res.json())
        .then((data) => {
          setItems(data)
          setFilteredItems(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error("Failed to fetch items:", err)
          setLoading(false)
          toast({
            title: "Error",
            description: "Failed to load inventory data",
            variant: "destructive",
          })
        })
  }

  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    let filtered = items.filter(
        (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    if (stockFilter === "low") {
      filtered = filtered.filter((item) => item.stock <= item.minStock)
    } else if (stockFilter === "out") {
      filtered = filtered.filter((item) => item.stock === 0)
    } else if (stockFilter === "good") {
      filtered = filtered.filter((item) => item.stock > item.minStock)
    }

    setFilteredItems(filtered)
  }, [searchTerm, categoryFilter, stockFilter, items])

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      minStock: "",
      category: "",
      sku: "",
    })
  }

  const handleAddItem = async () => {
    if (formData.name && formData.price && formData.stock && formData.sku) {
      const now = new Date().toISOString()
      const newItem = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        stock: Number.parseInt(formData.stock),
        minStock: Number.parseInt(formData.minStock) || 0,
        category: formData.category,
        sku: formData.sku,
        createdAt: now,
        updatedAt: now,
      }

      try {
        const response = await fetch(`${baseUrl}/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newItem),
        })

        if (!response.ok) {
          throw new Error("Failed to add item")
        }

        const createdItem = await response.json()
        setItems([...items, createdItem])
        resetForm()
        setIsAddDialogOpen(false)

        toast({
          title: "Success",
          description: `${createdItem.name} has been added to inventory`,
        })
      } catch (error) {
        console.error("Error adding item:", error)
        toast({
          title: "Error",
          description: "Failed to add item",
          variant: "destructive",
        })
      }
    }
  }

  const handleEditItem = async () => {
    if (editingItem && formData.name && formData.price && formData.stock && formData.sku) {
      const updatedItem = {
        ...editingItem,
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        stock: Number.parseInt(formData.stock),
        minStock: Number.parseInt(formData.minStock) || 0,
        category: formData.category,
        sku: formData.sku,
        updatedAt: new Date().toISOString(),
      }

      try {
        const response = await fetch(`${baseUrl}/items/${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedItem),
        })

        if (!response.ok) {
          throw new Error("Failed to update item")
        }

        const result = await response.json()
        setItems(items.map((item) => (item.id === editingItem.id ? result : item)))
        setEditingItem(null)
        resetForm()

        toast({
          title: "Success",
          description: `${result.name} has been updated`,
        })
      } catch (error) {
        console.error("Error updating item:", error)
        toast({
          title: "Error",
          description: "Failed to update item",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteItem = async (id: string, name: string) => {
    try {
      const response = await fetch(`${baseUrl}/items/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete item")
      }else{
        toast({
          title: "Success",
          description: `${name} has been removed from inventory`,
        })

      }

      setItems(items.filter((item) => item.id !== id))

    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (item: Item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      stock: item.stock.toString(),
      minStock: item.minStock.toString(),
      category: item.category,
      sku: item.sku,
    })
  }

  const handleStockUpdate = async (itemId: string, newStock: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const updatedItem = {
      ...item,
      stock: newStock,
      updatedAt: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${baseUrl}/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedItem),
      })

      if (!response.ok) {
        throw new Error("Failed to update stock")
      }

      setItems(items.map((item) => (item.id === itemId ? { ...item, stock: newStock } : item)))
    } catch (error) {
      console.error("Error updating stock:", error)
      toast({
        title: "Error",
        description: "Failed to update stock level",
        variant: "destructive",
      })
    }
  }

  const lowStockItems = items.filter((item) => item.stock <= item.minStock && item.stock > 0)
  const outOfStockItems = items.filter((item) => item.stock === 0)
  const totalValue = items.reduce((sum, item) => sum + item.price * item.stock, 0)
  const totalItems = items.reduce((sum, item) => sum + item.stock, 0)
  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean)))

  const getStockStatus = (item: Item) => {
    if (item.stock === 0) return { variant: "destructive" as const, label: "Out of Stock", color: "bg-red-500" }
    if (item.stock <= item.minStock)
      return { variant: "destructive" as const, label: "Low Stock", color: "bg-orange-500" }
    if (item.stock <= item.minStock * 2)
      return { variant: "secondary" as const, label: "Medium Stock", color: "bg-yellow-500" }
    return { variant: "default" as const, label: "In Stock", color: "bg-green-500" }
  }

  const getStockPercentage = (item: Item) => {
    if (item.minStock === 0) return 100
    return Math.min((item.stock / (item.minStock * 3)) * 100, 100)
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading inventory...</p>
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
                  Inventory Management
                </h1>
                <p className="text-slate-600 mt-2 text-lg">Manage your product inventory and stock levels</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border shadow-sm">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-slate-700">{items.length} Products</span>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                      placeholder="Search by name, SKU, or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm border-slate-200">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger className="w-32 bg-white/80 backdrop-blur-sm border-slate-200">
                      <SelectValue placeholder="Stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock</SelectItem>
                      <SelectItem value="good">In Stock</SelectItem>
                      <SelectItem value="low">Low Stock</SelectItem>
                      <SelectItem value="out">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={fetchItems} className ="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <RefreshCwIcon className="h-2 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Add New Product
                    </DialogTitle>
                    <DialogDescription>Enter the details for the new inventory item.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter product name"
                          className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Enter product description"
                          className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="price">Price *</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="0.00"
                            className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="stock">Initial Stock *</Label>
                        <Input
                            id="stock"
                            type="number"
                            min="0"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            placeholder="0"
                            className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="minStock">Minimum Stock</Label>
                        <Input
                            id="minStock"
                            type="number"
                            min="0"
                            value={formData.minStock}
                            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                            placeholder="0"
                            className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                            id="sku"
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            placeholder="SKU-001"
                            className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="Enter category"
                          className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700">
                      Add Product
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Package className="h-5 w-5 text-blue-600" />
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">{items.length}</div>
                <p className="text-sm text-blue-600 mt-1">Unique items</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Total Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-700">{totalItems.toLocaleString()}</div>
                <p className="text-sm text-emerald-600 mt-1">Units in inventory</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                  Inventory Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-700">${totalValue.toLocaleString()}</div>
                <p className="text-sm text-amber-600 mt-1">Total value</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700">{lowStockItems.length + outOfStockItems.length}</div>
                <p className="text-sm text-red-600 mt-1">Need attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Stock Alerts */}
          {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
              <Card className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    Stock Alerts
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    {outOfStockItems.length > 0 && `${outOfStockItems.length} items out of stock`}
                    {outOfStockItems.length > 0 && lowStockItems.length > 0 && ", "}
                    {lowStockItems.length > 0 && `${lowStockItems.length} items low on stock`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...outOfStockItems, ...lowStockItems].map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.sku}</p>
                          </div>
                          <Badge variant={item.stock === 0 ? "destructive" : "secondary"} className="text-xs">
                            {item.stock === 0 ? "Out" : `${item.stock} left`}
                          </Badge>
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
          )}

          {/* Inventory Table */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl text-slate-800">Inventory Items</CardTitle>
              <CardDescription className="text-base">
                Showing {filteredItems.length} of {items.length} products
                {searchTerm && ` matching "${searchTerm}"`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="font-semibold text-slate-700">Product</TableHead>
                      <TableHead className="font-semibold text-slate-700">SKU</TableHead>
                      <TableHead className="font-semibold text-slate-700">Category</TableHead>
                      <TableHead className="font-semibold text-slate-700">Price</TableHead>
                      <TableHead className="font-semibold text-slate-700">Stock Level</TableHead>
                      <TableHead className="font-semibold text-slate-700">Min Stock</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Value</TableHead>
                      <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item, index) => {
                      const stockStatus = getStockStatus(item)
                      const stockPercentage = getStockPercentage(item)
                      return (
                          <TableRow
                              key={item.id}
                              className={`hover:bg-slate-50/50 transition-colors ${
                                  index % 2 === 0 ? "bg-white" : "bg-slate-25"
                              }`}
                          >
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="font-medium text-slate-800 truncate">{item.name}</p>
                                {item.description && (
                                    <p className="text-xs text-slate-500 truncate mt-1">{item.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded">{item.sku}</code>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {item.category || "Uncategorized"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-emerald-600">${item.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                      type="number"
                                      min="0"
                                      value={item.stock}
                                      onChange={(e) => handleStockUpdate(item.id, Number.parseInt(e.target.value) || 0)}
                                      className="w-20 h-8 text-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-slate-500">units</span>
                                </div>
                                <div className="w-full">
                                  <Progress value={stockPercentage} className="h-1" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">{item.minStock}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${stockStatus.color}`}></div>
                                <Badge variant={stockStatus.variant} className="text-xs">
                                  {stockStatus.label}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-slate-700">
                              ${(item.price * item.stock).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => openEditDialog(item)}
                                    className="h-8 w-8 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-red-50 hover:border-red-300 transition-colors"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{item.name}"? This action cannot be undone and will
                                        remove all associated data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                          onClick={() => handleDeleteItem(item.id, item.name)}
                                          className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete Product
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredItems.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                      {searchTerm || categoryFilter !== "all" || stockFilter !== "all"
                          ? "No matching products"
                          : "No products yet"}
                    </h3>
                    <p className="text-slate-600 mb-4">
                      {searchTerm || categoryFilter !== "all" || stockFilter !== "all"
                          ? "Try adjusting your search or filters"
                          : "Add your first product to get started"}
                    </p>
                    {!searchTerm && categoryFilter === "all" && stockFilter === "all" && (
                        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Product
                        </Button>
                    )}
                  </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-blue-600" />
                  Edit Product
                </DialogTitle>
                <DialogDescription>Update the product details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Product Name *</Label>
                  <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter product description"
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Price *</Label>
                    <Input
                        id="edit-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-stock">Stock *</Label>
                    <Input
                        id="edit-stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        placeholder="0"
                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-minStock">Minimum Stock</Label>
                    <Input
                        id="edit-minStock"
                        type="number"
                        min="0"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                        placeholder="0"
                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-sku">SKU *</Label>
                    <Input
                        id="edit-sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="SKU-001"
                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                      id="edit-category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Enter category"
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEditItem} className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
  )
}
