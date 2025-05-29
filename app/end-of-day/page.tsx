"use client"

import {useState, useEffect} from "react"
import Link from "next/link"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Badge} from "@/components/ui/badge"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import { ArrowLeft, DollarSign, Package, CheckCircle, Edit, TrendingUp, Users, AlertCircle, Calculator, Trash2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Label} from "@/components/ui/label"
import {toast} from "@/components/ui/use-toast"
import {Progress} from "@/components/ui/progress"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";

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
    date: string
    status: "ALLOCATED" | "SOLD" | "RETURNED"
    soldQuantity?: number
    paymentReceived?: number
}

export default function EndOfDay() {
    const [salespeople, setSalespeople] = useState<Salesperson[]>([])
    const [allocations, setAllocations] = useState<Allocation[]>([])
    const [selectedSalesperson, setSelectedSalesperson] = useState("")
    const [processingAllocations, setProcessingAllocations] = useState<{
        [key: string]: { soldQuantity: number; paymentReceived: number }
    }>({})
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null)
    const [editFormData, setEditFormData] = useState({quantity: 0})

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

    const [loading, setLoading] = useState(true)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [salespeopleRes, allocationsRes] = await Promise.all([
                    fetch(`${baseUrl}/salespeople`),
                    fetch(`${baseUrl}/allocations`),
                ])

                if (!salespeopleRes.ok || !allocationsRes.ok) {
                    throw new Error("Failed to fetch data from API")
                }

                const salespeople = await salespeopleRes.json()
                const allocations = await allocationsRes.json()

                setSalespeople(salespeople)
                setAllocations(allocations)
            } catch (error) {
                console.error("Error loading data:", error)
                alert("Failed to load data from server.")
            }
        }

        fetchData()
    }, [])
    const handleDeleteAllocations = async (id: string, name: string) => {
        try {
            const res = await fetch(`${baseUrl}/allocations/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            toast({
                title: "Success",
                description: `${name} has been removed from Allocation`,
            });
            setAllocations(prev => prev.filter(allocations => allocations.id !== id));
        } catch {
            toast({
                title: "Error",
                description: "Failed to delete item",
                variant: "destructive",
            });
        }
    };

    const selectedSalespersonAllocations = allocations.filter(
        (allocation) => allocation.salespersonId === selectedSalesperson && allocation.status === "ALLOCATED",
    )

    const handleQuantityChange = (allocationId: string, soldQuantity: number) => {
        setProcessingAllocations((prev) => ({
            ...prev,
            [allocationId]: {
                soldQuantity: soldQuantity || 0,
                paymentReceived: prev[allocationId]?.paymentReceived || 0,
            },
        }))
    }

    const handlePaymentChange = (allocationId: string, paymentReceived: number) => {
        setProcessingAllocations((prev) => ({
            ...prev,
            [allocationId]: {
                soldQuantity: prev[allocationId]?.soldQuantity || 0,
                paymentReceived: paymentReceived || 0,
            },
        }))
    }

    const processEndOfDay = async () => {
        if (!selectedSalesperson) return

        const payload = Object.entries(processingAllocations).map(([allocationId, processing]) => ({
            allocationId,
            soldQuantity: processing.soldQuantity || 0,
            paymentReceived: processing.paymentReceived || 0,
        }))

        try {
            const response = await fetch(`${baseUrl}/allocations/end-of-day/${selectedSalesperson}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })
            console.log(payload)
            if (!response.ok) {
                throw new Error("Failed to process end of day")
            }

            const updatedAllocations = await response.json()

            setAllocations((prev) =>
                prev.map((a) => {
                    const updated = updatedAllocations.find((ua: Allocation) => ua.id === a.id)
                    return updated ? {...a, ...updated} : a
                }),
            )

            const salesRes = await fetch(`${baseUrl}/salespeople`)
            if (salesRes.ok) {
                const updatedSalespeople = await salesRes.json()
                setSalespeople(updatedSalespeople)
            }

            setProcessingAllocations({})
            setSelectedSalesperson("")
        } catch (error) {
            console.error("End-of-day processing failed:", error)
            alert("Failed to complete end-of-day processing. Please try again.")
        }
    }

    const getTotalExpectedPayment = () => {
        return Object.entries(processingAllocations).reduce((total, [allocationId, processing]) => {
            const allocation = selectedSalespersonAllocations.find((a) => a.id === allocationId)
            if (allocation) {
                const soldQuantity = processing.soldQuantity || 0
                return total + soldQuantity * allocation.itemPrice
            }
            return total
        }, 0)
    }

    const getTotalActualPayment = () => {
        return Object.values(processingAllocations).reduce((total, processing) => {
            return total + (processing.paymentReceived || 0)
        }, 0)
    }

    const getPaymentDifference = () => {
        return getTotalActualPayment() - getTotalExpectedPayment()
    }

    const getCompletionPercentage = () => {
        if (selectedSalespersonAllocations.length === 0) return 0
        const processedItems = Object.keys(processingAllocations).length
        return (processedItems / selectedSalespersonAllocations.length) * 100
    }

    const openEditDialog = (allocation: Allocation) => {
        setEditingAllocation(allocation)
        setEditFormData({quantity: allocation.quantity})
        setEditDialogOpen(true)
    }

    const closeEditDialog = () => {
        setEditDialogOpen(false)
        setEditingAllocation(null)
        setEditFormData({quantity: 0})
    }

    const saveAllocationEdit = async () => {
        if (!editingAllocation) return

        const updatedQuantity = editFormData.quantity

        try {
            const res = await fetch(`${baseUrl}/allocations/${editingAllocation.id}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    quantity: updatedQuantity,
                    soldQuantity: processingAllocations[editingAllocation.id]?.soldQuantity || 0,
                    paymentReceived: processingAllocations[editingAllocation.id]?.paymentReceived || 0,
                    status: editingAllocation.status,
                }),
            })

            if (!res.ok) throw new Error("Failed to update allocation")

            setAllocations((prev) =>
                prev.map((a) => (a.id === editingAllocation.id ? {...a, quantity: updatedQuantity} : a)),
            )

            const currentProcessing = processingAllocations[editingAllocation.id]
            if (currentProcessing && currentProcessing.soldQuantity > updatedQuantity) {
                setProcessingAllocations((prev) => ({
                    ...prev,
                    [editingAllocation.id]: {
                        ...currentProcessing,
                        soldQuantity: updatedQuantity,
                        paymentReceived: updatedQuantity * editingAllocation.itemPrice,
                    },
                }))
            }

            toast({
                title: "Allocation Updated",
                description: `${editingAllocation.itemName} quantity updated to ${updatedQuantity}`,
            })

            closeEditDialog()
        } catch (error) {
            console.error("Failed to update allocation:", error)
            toast({
                title: "Error",
                description: "Could not update allocation in the database.",
                variant: "destructive",
            })
        }
    }

    const selectedSalespersonData = salespeople.find((s) => s.id === selectedSalesperson)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/">
                            <Button variant="outline" size="icon"
                                    className="shadow-sm hover:shadow-md transition-shadow">
                                <ArrowLeft className="h-4 w-4"/>
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                End of Day Processing
                            </h1>
                            <p className="text-slate-600 mt-2 text-lg">Process sales and returns for allocated items</p>
                        </div>
                        {selectedSalesperson && (
                            <div
                                className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border shadow-sm">
                                <Users className="h-4 w-4 text-blue-600"/>
                                <span className="font-medium text-slate-700">{selectedSalespersonData?.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {selectedSalesperson && selectedSalespersonAllocations.length > 0 && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700">Processing Progress</span>
                                <span className="text-sm text-slate-500">{Math.round(getCompletionPercentage())}% Complete</span>
                            </div>
                            <Progress value={getCompletionPercentage()} className="h-2"/>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    {/* Salesperson Selection */}
                    <Card
                        className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-slate-800">
                                <Users className="h-5 w-5 text-blue-600"/>
                                Select Salesperson
                            </CardTitle>
                            <CardDescription>Choose a salesperson to process</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                                <SelectTrigger
                                    className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                                    <SelectValue placeholder="Select a salesperson"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {salespeople.map((salesperson) => (
                                        <SelectItem key={salesperson.id} value={salesperson.id}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                {salesperson.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                    <Card
                        className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-emerald-800">
                                <Calculator className="h-5 w-5 text-emerald-600"/>
                                Expected Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="text-3xl font-bold text-emerald-700">${getTotalExpectedPayment().toFixed(2)}</div>
                            <p className="text-sm text-emerald-600 mt-1">Based on Allocated quantities</p>
                        </CardContent>
                    </Card>
                    {/* Expected Payment */}
                    <Card
                        className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-emerald-800">
                                <Calculator className="h-5 w-5 text-emerald-600"/>
                                Expected Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="text-3xl font-bold text-emerald-700">${getTotalExpectedPayment().toFixed(2)}</div>
                            <p className="text-sm text-emerald-600 mt-1">Based on sold quantities</p>
                        </CardContent>
                    </Card>

                    {/* Actual Payment */}
                    <Card
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-blue-800">
                                <DollarSign className="h-5 w-5 text-blue-600"/>
                                Actual Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="text-3xl font-bold text-blue-700">${getTotalActualPayment().toFixed(2)}</div>
                            <p className="text-sm text-blue-600 mt-1">Payment received</p>
                        </CardContent>
                    </Card>

                    {/* Payment Difference */}
                    <Card
                        className={`shadow-lg hover:shadow-xl transition-all duration-300 ${
                            getPaymentDifference() === 0
                                ? "bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200"
                                : getPaymentDifference() > 0
                                    ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
                                    : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
                        }`}
                    >
                        <CardHeader className="pb-3">
                            <CardTitle
                                className={`flex items-center gap-2 ${
                                    getPaymentDifference() === 0
                                        ? "text-slate-800"
                                        : getPaymentDifference() > 0
                                            ? "text-emerald-800"
                                            : "text-red-800"
                                }`}
                            >
                                {getPaymentDifference() === 0 ? (
                                    <CheckCircle className="h-5 w-5 text-slate-600"/>
                                ) : getPaymentDifference() > 0 ? (
                                    <TrendingUp className="h-5 w-5 text-emerald-600"/>
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-600"/>
                                )}
                                Difference
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-3xl font-bold ${
                                    getPaymentDifference() === 0
                                        ? "text-slate-700"
                                        : getPaymentDifference() > 0
                                            ? "text-emerald-700"
                                            : "text-red-700"
                                }`}
                            >
                                {getPaymentDifference() >= 0 ? "+" : ""}${getPaymentDifference().toFixed(2)}
                            </div>
                            <p
                                className={`text-sm mt-1 ${
                                    getPaymentDifference() === 0
                                        ? "text-slate-600"
                                        : getPaymentDifference() > 0
                                            ? "text-emerald-600"
                                            : "text-red-600"
                                }`}
                            >
                                {getPaymentDifference() === 0
                                    ? "Balanced"
                                    : getPaymentDifference() > 0
                                        ? "Overpayment"
                                        : "Underpayment"}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Processing Table */}
                {selectedSalesperson && selectedSalespersonAllocations.length > 0 && (
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                        <CardHeader className="border-b border-slate-100">
                            <CardTitle className="text-xl text-slate-800">Process Allocations</CardTitle>
                            <CardDescription className="text-base">
                                Enter sold quantities and payments received for{" "}
                                <span className="font-semibold text-blue-600">{selectedSalespersonData?.name}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="block">
                                {/* Mobile Card Layout */}
                                <div className="block md:hidden space-y-4">
                                    {selectedSalespersonAllocations.map((allocation, index) => {
                                        const processing = processingAllocations[allocation.id] || {
                                            soldQuantity: 0,
                                            paymentReceived: 0,
                                        }
                                        const expectedPayment = (processing.soldQuantity ?? 0) * allocation.itemPrice
                                        const returnedQuantity = allocation.quantity - (processing.soldQuantity ?? 0)

                                        return (
                                            <div
                                                key={allocation.id}
                                                className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-medium text-slate-800 text-lg">{allocation.itemName}</h3>
                                                        <p className="text-sm text-slate-600">Unit Price: <span className="font-semibold text-emerald-600">${allocation.itemPrice}</span></p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                                                    onClick={() => openEditDialog(allocation)}
                                                                >
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-[425px]">
                                                                <DialogHeader>
                                                                    <DialogTitle>Edit Allocation</DialogTitle>
                                                                    <DialogDescription>
                                                                        Update the allocated quantity for {editingAllocation?.itemName}
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="grid gap-4 py-4">
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <Label htmlFor="item-name" className="text-right">
                                                                            Item
                                                                        </Label>
                                                                        <Input
                                                                            id="item-name"
                                                                            value={editingAllocation?.itemName || ""}
                                                                            className="col-span-3"
                                                                            disabled
                                                                        />
                                                                    </div>
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <Label htmlFor="unit-price" className="text-right">
                                                                            Unit Price
                                                                        </Label>
                                                                        <Input
                                                                            id="unit-price"
                                                                            value={`$${editingAllocation?.itemPrice || 0}`}
                                                                            className="col-span-3"
                                                                            disabled
                                                                        />
                                                                    </div>
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <Label htmlFor="current-qty" className="text-right">
                                                                            Current Qty
                                                                        </Label>
                                                                        <Input
                                                                            id="current-qty"
                                                                            value={editingAllocation?.quantity || 0}
                                                                            className="col-span-3"
                                                                            disabled
                                                                        />
                                                                    </div>
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <Label htmlFor="new-qty" className="text-right">
                                                                            New Qty
                                                                        </Label>
                                                                        <Input
                                                                            id="new-qty"
                                                                            type="number"
                                                                            min="0"
                                                                            value={editFormData.quantity}
                                                                            onChange={(e) =>
                                                                                setEditFormData({
                                                                                    quantity: Number.parseInt(e.target.value) || 0,
                                                                                })
                                                                            }
                                                                            className="col-span-3"
                                                                        />
                                                                    </div>
                                                                    {editingAllocation &&
                                                                        processingAllocations[editingAllocation.id]?.soldQuantity > 0 && (
                                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                                <Label className="text-right text-sm text-muted-foreground">
                                                                                    Note
                                                                                </Label>
                                                                                <p className="col-span-3 text-sm text-muted-foreground">
                                                                                    {
                                                                                        processingAllocations[editingAllocation.id]
                                                                                            .soldQuantity
                                                                                    }{" "}
                                                                                    items already sold.
                                                                                    {editFormData.quantity <
                                                                                        processingAllocations[editingAllocation.id]
                                                                                            .soldQuantity &&
                                                                                        " Sold quantity will be adjusted to match new allocation."}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button variant="outline" onClick={closeEditDialog}>
                                                                        Cancel
                                                                    </Button>
                                                                    <Button onClick={saveAllocationEdit}>Save Changes</Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>

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
                                                                        Are you sure you want to delete "{allocation.itemName}"? This action cannot be undone and will
                                                                        remove all associated data.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteAllocations(allocation.id, allocation.itemName)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        Delete Product
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <div>
                                                        <Label className="text-sm text-slate-600">Allocated Qty</Label>
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 block w-fit mt-1">
                                                            {allocation.quantity}
                                                        </Badge>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm text-slate-600">Status</Label>
                                                        <div className="flex flex-col gap-1 mt-1">
                                                            {processing.soldQuantity > 0 && (
                                                                <Badge className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 w-fit">
                                                                    {processing.soldQuantity} sold
                                                                </Badge>
                                                            )}
                                                            {returnedQuantity > 0 && (
                                                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 w-fit">
                                                                    {returnedQuantity} returned
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3">
                                                    <div>
                                                        <Label className="text-sm text-slate-600">Sold Quantity</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={allocation.quantity}
                                                            value={processing.soldQuantity ?? 0}
                                                            onChange={(e) =>
                                                                handleQuantityChange(allocation.id, Number.parseInt(e.target.value) || 0)
                                                            }
                                                            className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label className="text-sm text-slate-600">Expected Payment</Label>
                                                            <p className="font-semibold text-emerald-600 mt-1">${expectedPayment.toFixed(2)}</p>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm text-slate-600">Actual Payment</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={processing.paymentReceived ?? 0}
                                                                onChange={(e) =>
                                                                    handlePaymentChange(allocation.id, Number.parseFloat(e.target.value) || 0)
                                                                }
                                                                className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Desktop Table Layout */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/80">
                                                <TableHead className="font-semibold text-slate-700">Item</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Allocated</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Unit Price</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Sold Qty</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Expected</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Actual Payment</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedSalespersonAllocations.map((allocation, index) => {
                                                const processing = processingAllocations[allocation.id] || {
                                                    soldQuantity: 0,
                                                    paymentReceived: 0,
                                                }
                                                const expectedPayment = (processing.soldQuantity ?? 0) * allocation.itemPrice
                                                const returnedQuantity = allocation.quantity - (processing.soldQuantity ?? 0)

                                                return (
                                                    <TableRow
                                                        key={allocation.id}
                                                        className={`hover:bg-slate-50/50 transition-colors ${
                                                            index % 2 === 0 ? "bg-white" : "bg-slate-25"
                                                        }`}
                                                    >
                                                        <TableCell className="font-medium text-slate-800">{allocation.itemName}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                {allocation.quantity}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-semibold text-emerald-600">${allocation.itemPrice}</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max={allocation.quantity}
                                                                value={processing.soldQuantity ?? 0}
                                                                onChange={(e) =>
                                                                    handleQuantityChange(allocation.id, Number.parseInt(e.target.value) || 0)
                                                                }
                                                                className="w-20 sm:w-24 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-semibold text-emerald-600">
                                                            ${expectedPayment.toFixed(2)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={processing.paymentReceived ?? 0}
                                                                onChange={(e) =>
                                                                    handlePaymentChange(allocation.id, Number.parseFloat(e.target.value) || 0)
                                                                }
                                                                className="w-24 sm:w-28 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1">
                                                                {processing.soldQuantity > 0 && (
                                                                    <Badge className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                                                                        {processing.soldQuantity} sold
                                                                    </Badge>
                                                                )}
                                                                {returnedQuantity > 0 && (
                                                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                                                                        {returnedQuantity} returned
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                                                                    <DialogTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            className="h-8 w-8 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                                                            onClick={() => openEditDialog(allocation)}
                                                                        >
                                                                            <Edit className="h-3 w-3" />
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="sm:max-w-[425px]">
                                                                        <DialogHeader>
                                                                            <DialogTitle>Edit Allocation</DialogTitle>
                                                                            <DialogDescription>
                                                                                Update the allocated quantity for {editingAllocation?.itemName}
                                                                            </DialogDescription>
                                                                        </DialogHeader>
                                                                        <div className="grid gap-4 py-4">
                                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                                <Label htmlFor="item-name" className="text-right">
                                                                                    Item
                                                                                </Label>
                                                                                <Input
                                                                                    id="item-name"
                                                                                    value={editingAllocation?.itemName || ""}
                                                                                    className="col-span-3"
                                                                                    disabled
                                                                                />
                                                                            </div>
                                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                                <Label htmlFor="unit-price" className="text-right">
                                                                                    Unit Price
                                                                                </Label>
                                                                                <Input
                                                                                    id="unit-price"
                                                                                    value={`$${editingAllocation?.itemPrice || 0}`}
                                                                                    className="col-span-3"
                                                                                    disabled
                                                                                />
                                                                            </div>
                                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                                <Label htmlFor="current-qty" className="text-right">
                                                                                    Current Qty
                                                                                </Label>
                                                                                <Input
                                                                                    id="current-qty"
                                                                                    value={editingAllocation?.quantity || 0}
                                                                                    className="col-span-3"
                                                                                    disabled
                                                                                />
                                                                            </div>
                                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                                <Label htmlFor="new-qty" className="text-right">
                                                                                    New Qty
                                                                                </Label>
                                                                                <Input
                                                                                    id="new-qty"
                                                                                    type="number"
                                                                                    min="0"
                                                                                    value={editFormData.quantity}
                                                                                    onChange={(e) =>
                                                                                        setEditFormData({
                                                                                            quantity: Number.parseInt(e.target.value) || 0,
                                                                                        })
                                                                                    }
                                                                                    className="col-span-3"
                                                                                />
                                                                            </div>
                                                                            {editingAllocation &&
                                                                                processingAllocations[editingAllocation.id]?.soldQuantity > 0 && (
                                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                                        <Label className="text-right text-sm text-muted-foreground">
                                                                                            Note
                                                                                        </Label>
                                                                                        <p className="col-span-3 text-sm text-muted-foreground">
                                                                                            {
                                                                                                processingAllocations[editingAllocation.id]
                                                                                                    .soldQuantity
                                                                                            }{" "}
                                                                                            items already sold.
                                                                                            {editFormData.quantity <
                                                                                                processingAllocations[editingAllocation.id]
                                                                                                    .soldQuantity &&
                                                                                                " Sold quantity will be adjusted to match new allocation."}
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                        </div>
                                                                        <DialogFooter>
                                                                            <Button variant="outline" onClick={closeEditDialog}>
                                                                                Cancel
                                                                            </Button>
                                                                            <Button onClick={saveAllocationEdit}>Save Changes</Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>

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
                                                                                Are you sure you want to delete "{allocation.itemName}"? This action cannot be undone and will
                                                                                remove all associated data.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleDeleteAllocations(allocation.id, allocation.itemName)}
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
                            </div>
                            {/* Summary Footer */}
                            <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-100">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                        <p className="text-sm text-slate-600 mb-1">Expected Payment</p>
                                        <p className="text-2xl font-bold text-emerald-600">${getTotalExpectedPayment().toFixed(2)}</p>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                        <p className="text-sm text-slate-600 mb-1">Actual Payment</p>
                                        <p className="text-2xl font-bold text-blue-600">${getTotalActualPayment().toFixed(2)}</p>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                        <p className="text-sm text-slate-600 mb-1">Difference</p>
                                        <p
                                            className={`text-2xl font-bold ${
                                                getPaymentDifference() === 0
                                                    ? "text-slate-600"
                                                    : getPaymentDifference() > 0
                                                        ? "text-emerald-600"
                                                        : "text-red-600"
                                            }`}
                                        >
                                            {getPaymentDifference() >= 0 ? "+" : ""}${getPaymentDifference().toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    onClick={processEndOfDay}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                                    size="lg"
                                >
                                    <CheckCircle className="mr-2 h-5 w-5"/>
                                    Complete End of Day Processing
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Empty State */}
                {selectedSalesperson && selectedSalespersonAllocations.length === 0 && (
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                        <CardContent className="text-center py-12">
                            <div
                                className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="h-10 w-10 text-slate-400"/>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Allocations Found</h3>
                            <p className="text-slate-600">This salesperson has no allocated items to process today.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}