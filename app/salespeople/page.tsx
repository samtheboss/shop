"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  DollarSign,
  Users,
  TrendingUp,
  Package,
  Search,
  UserPlus,
  Activity,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Salesperson {
  id: string
  name: string
  phone: string
  totalSales: number
  itemsAllocated: number
}

export default function SalespeopleManagement() {
  const [salespeople, setSalespeople] = useState<Salesperson[]>([])
  const [filteredSalespeople, setFilteredSalespeople] = useState<Salesperson[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null)
  const [formData, setFormData] = useState({ name: "", phone: "" })
  const [loading, setLoading] = useState(true)
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  useEffect(() => {
    fetch(baseUrl + `/salespeople`)
        .then((res) => res.json())
        .then((data) => {
          setSalespeople(data)
          setFilteredSalespeople(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error("Failed to fetch salespeople:", err)
          setLoading(false)
          toast({
            title: "Error",
            description: "Failed to load salespeople data",
            variant: "destructive",
          })
        })
  }, [])

  useEffect(() => {
    const filtered = salespeople.filter(
        (person) => person.name.toLowerCase().includes(searchTerm.toLowerCase()) || person.phone.includes(searchTerm),
    )
    setFilteredSalespeople(filtered)
  }, [searchTerm, salespeople])

  const handleAddSalesperson = async () => {
    if (formData.name && formData.phone) {
      const newSalesperson = {
        name: formData.name,
        phone: formData.phone,
        totalSales: 0,
        itemsAllocated: 0,
      }

      try {
        const response = await fetch(`${baseUrl}/salespeople`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newSalesperson),
        })

        if (!response.ok) {
          throw new Error("Failed to add salesperson")
        }

        const createdSalesperson = await response.json()
        setSalespeople([...salespeople, createdSalesperson])
        setFormData({ name: "", phone: "" })
        setIsAddDialogOpen(false)

        toast({
          title: "Success",
          description: `${createdSalesperson.name} has been added to your team`,
        })
      } catch (error) {
        console.error("Error adding salesperson:", error)
        toast({
          title: "Error",
          description: "Failed to add salesperson",
          variant: "destructive",
        })
      }
    }
  }

  const handleEditSalesperson = async () => {
    if (editingSalesperson && formData.name && formData.phone) {
      const updatedSalesperson = {
        ...editingSalesperson,
        name: formData.name,
        phone: formData.phone,
      }

      try {
        const response = await fetch(`${baseUrl}/salespeople/${editingSalesperson.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedSalesperson),
        })

        if (!response.ok) {
          throw new Error("Failed to update salesperson")
        }

        const result = await response.json()
        setSalespeople(salespeople.map((person) => (person.id === editingSalesperson.id ? result : person)))
        setEditingSalesperson(null)
        setFormData({ name: "", phone: "" })

        toast({
          title: "Success",
          description: `${result.name}'s information has been updated`,
        })
      } catch (error) {
        console.error("Error updating salesperson:", error)
        toast({
          title: "Error",
          description: "Failed to update salesperson",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteSalesperson = async (id: string, name: string) => {
    try {
      const response = await fetch(`${baseUrl}/salespeople/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete salesperson")
      }

      setSalespeople(salespeople.filter((person) => person.id !== id))
      toast({
        title: "Success",
        description: `${name} has been removed from your team`,
      })
    } catch (error) {
      console.error("Error deleting salesperson:", error)
      toast({
        title: "Error",
        description: "Failed to delete salesperson",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (salesperson: Salesperson) => {
    setEditingSalesperson(salesperson)
    setFormData({ name: salesperson.name, phone: salesperson.phone })
  }

  const getTotalSales = () => {
    return salespeople.reduce((total, person) => total + person.totalSales, 0)
  }

  const getTotalAllocations = () => {
    return salespeople.reduce((total, person) => total + person.itemsAllocated, 0)
  }

  const getTopPerformer = () => {
    return salespeople.reduce(
        (top, person) => (person.totalSales > top.totalSales ? person : top),
        salespeople[0] || { name: "N/A", totalSales: 0 },
    )
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading salespeople...</p>
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
                  Sales Team Management
                </h1>
                <p className="text-slate-600 mt-2 text-lg">Manage your sales team members and track performance</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border shadow-sm">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-slate-700">{salespeople.length} Team Members</span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Users className="h-5 w-5 text-blue-600" />
                    Team Size
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700">{salespeople.length}</div>
                  <p className="text-sm text-blue-600 mt-1">Active salespeople</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    Total Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-700">${getTotalSales().toLocaleString()}</div>
                  <p className="text-sm text-emerald-600 mt-1">Combined revenue</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Package className="h-5 w-5 text-amber-600" />
                    Total Allocations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-700">{getTotalAllocations()}</div>
                  <p className="text-sm text-amber-600 mt-1">Items allocated</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Top Performer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-purple-700 truncate">{getTopPerformer().name}</div>
                  <p className="text-sm text-purple-600 mt-1">${getTopPerformer().totalSales.toLocaleString()} sales</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Add */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                />
              </div>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Team Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-blue-600" />
                      Add New Team Member
                    </DialogTitle>
                    <DialogDescription>Enter the details for the new salesperson.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter full name"
                          className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Enter phone number"
                          className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSalesperson} className="bg-blue-600 hover:bg-blue-700">
                      Add Team Member
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Team Members Grid */}
          {filteredSalespeople.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSalespeople.map((salesperson) => (
                    <Card
                        key={salesperson.id}
                        className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-slate-800 group-hover:text-blue-600 transition-colors">
                              {salesperson.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-600">{salesperson.phone}</span>
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openEditDialog(salesperson)}
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
                                  <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove {salesperson.name} from your team? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                      onClick={() => handleDeleteSalesperson(salesperson.id, salesperson.name)}
                                      className="bg-red-600 hover:bg-red-700"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-emerald-50 rounded-lg">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <DollarSign className="h-4 w-4 text-emerald-600" />
                              <span className="text-xs font-medium text-emerald-700">Sales</span>
                            </div>
                            <div className="text-lg font-bold text-emerald-700">
                              ${salesperson.totalSales.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Package className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-medium text-blue-700">Items</span>
                            </div>
                            <div className="text-lg font-bold text-blue-700">{salesperson.itemsAllocated}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-center">
                          <Badge
                              variant={salesperson.itemsAllocated > 0 ? "default" : "secondary"}
                              className={`${
                                  salesperson.itemsAllocated > 0
                                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                                      : "bg-slate-100 text-slate-600"
                              }`}
                          >
                            <Activity className="h-3 w-3 mr-1" />
                            {salesperson.itemsAllocated > 0 ? "Active" : "Available"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
          ) : (
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {searchTerm ? "No matching team members" : "No team members yet"}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {searchTerm ? "Try adjusting your search terms" : "Add your first team member to get started"}
                  </p>
                  {!searchTerm && (
                      <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Team Member
                      </Button>
                  )}
                </CardContent>
              </Card>
          )}

          {/* Edit Dialog */}
          <Dialog open={!!editingSalesperson} onOpenChange={() => setEditingSalesperson(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-blue-600" />
                  Edit Team Member
                </DialogTitle>
                <DialogDescription>Update the team member's information.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                      id="edit-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingSalesperson(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSalesperson} className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
  )
}
