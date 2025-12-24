// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { ArrowLeft, Plus, Minus, Clock, Store, Package } from "lucide-react";
// import { useCartStore } from "../store/cartStore";
// import { Button } from "../components/ui/button";
// import { useTranslation } from "react-i18next";
// import { useBranchStore } from "@/store/branchStore";
// import { useDeliveryStore } from "@/store/deliveryStore";
// import { fetchBranchItems, placeOrder } from "@/services/api";
// import { useAuth } from "@/contexts/AuthContext";

// const CartCheckout = () => {
//   const { t } = useTranslation();
//   const {
//     items: cartItems,
//     updateQuantity,
//     removeItem,
//     getTotalPrice,
//     addItem,
//   } = useCartStore();
//   const { selectedBranch, clearSelectedBranch } = useBranchStore();
//   const { setDeliveryModalOpen, isDeliveryModalOpen } = useDeliveryStore();

//   const [categories, setCategories] = useState([]);
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const { isAuthenticated } = useAuth();
//   const { clearCart } = useCartStore();

//   // Order options state
//   const [orderType, setOrderType] = useState("dine-in"); // 'dine-in' or 'pickup'
//   const [specialInstructions, setSpecialInstructions] = useState("");
//   const [pickupTime, setPickupTime] = useState("");

//   // Generate pickup time options (30 mins from now, every 15 mins for next 3 hours)
//   const generateTimeSlots = () => {
//     const slots = [];
//     const now = new Date();
//     const startTime = new Date(now.getTime() + 30 * 60000); // 30 mins from now

//     for (let i = 0; i < 12; i++) {
//       const time = new Date(startTime.getTime() + i * 15 * 60000);
//       const hours = time.getHours().toString().padStart(2, "0");
//       const minutes = time.getMinutes().toString().padStart(2, "0");
//       slots.push(`${hours}:${minutes}`);
//     }
//     return slots;
//   };

//   const timeSlots = generateTimeSlots();

//   // Set default pickup time
//   useEffect(() => {
//     if (timeSlots.length > 0 && !pickupTime) {
//       setPickupTime(timeSlots[0]);
//     }
//   }, [timeSlots, pickupTime]);

//   // fetch data
//   useEffect(() => {
//     const loadBranchData = async () => {
//       if (!selectedBranch?.id) {
//         setDeliveryModalOpen(true);
//         return;
//       }
//       setLoading(true);
//       try {
//         const { items, categories } = await fetchBranchItems(selectedBranch.id);
//         setItems(items.sort((a, b) => b.loyaltyPoints - a.loyaltyPoints));
//         setCategories(categories || []);
//       } catch (error) {
//         console.error("Failed to fetch branch items:", error);
//         setItems([]);
//         setCategories([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadBranchData();
//   }, [selectedBranch, setDeliveryModalOpen]);

//   // Handle adding suggested items to cart
//   const handleAddToCart = (item) => {
//     addItem({
//       itemId: item.itemId,
//       id: item.itemId,
//       name: item.name,
//       price: item.price,
//       images: item.images?.length
//         ? [item.images[0]]
//         : ["/assets/images/placeholder.png"],
//       description: item.description,
//       _id: item.itemId || Math.random().toString(),
//       stock: 1,
//       isCombo: false,
//       comboItems: [],
//       loyaltyPoints: item.loyaltyPoints || 0,
//       stockStatus: "available",
//       status: "active",
//       categoryId: item.categoryId,
//       availableBranches: [],
//     });
//   };

//   const handlePlaceOrder = async () => {
//     try {
//       const orderDetails = {
//         items: cartItems,
//         orderType,
//         specialInstructions,
//         scheduledTime: pickupTime, // Time for both pickup and dine-in arrival
//         total: getTotalPrice(),
//         branch: selectedBranch,
//       };

//       await placeOrder({
//         items: cartItems,
//         total: getTotalPrice(),
//       });
//       // navigate("/cart");
//       alert(t("cart.order_success")); // ✅ translated
//       clearCart();
//       // Add your order submission logic here
//     } catch (error) {
//       console.log("Order failed", error);
//     }
//   };

//     return (
//       <div className="min-h-screen bg-gray-50">
//         <div className="container mx-auto px-4 py-8">
//           <div className="flex flex-col lg:flex-row gap-8">
//             {/* Cart Items */}
//             <div className="flex-1">
//               <div className="bg-white rounded-lg shadow-md p-6">
//                 <div className="flex items-center mb-6">
//                   <Link
//                     to="/menu"
//                     className="flex items-center text-gray-600 hover:text-ayamku-primary"
//                   >
//                     <ArrowLeft size={20} className="mr-2" />
//                     {t("cart.title")}
//                   </Link>
//                 </div>

//                 {cartItems.length === 0 ? (
//                   <div className="text-center py-12">
//                     <div className="text-6xl mb-4">🛒</div>
//                     <h2 className="text-xl font-semibold mb-2">
//                       {t("cart.empty")}
//                     </h2>
//                     <p className="text-gray-600 mb-6">{t("cart.addItems")}</p>
//                     <Link to="/menu">
//                       <Button className="bg-ayamku-primary hover:bg-red-600 text-white">
//                         {t("cart.browseMenu")}
//                       </Button>
//                     </Link>
//                   </div>
//                 ) : (
//                   <div className="space-y-4">
//                     {cartItems.map((item) => (
//                       <div
//                         key={item.id}
//                         className="flex items-center space-x-4 p-4 border rounded-lg"
//                       >
//                         <img
//                           src={
//                             item.images?.[0].url ||
//                             "/assets/images/placeholder.png"
//                           }
//                           alt={item.name}
//                           className="w-16 h-16 object-cover rounded"
//                         />
//                         <div className="flex-1">
//                           <h3 className="font-medium">{item.name}</h3>
//                           <p className="text-ayamku-primary font-semibold">
//                             ${item.price}
//                           </p>
//                         </div>
//                         <div className="flex items-center space-x-2">
//                           <button
//                             onClick={() =>
//                               updateQuantity(item.id, item.quantity - 1)
//                             }
//                             className="w-8 h-8 flex items-center justify-center border border-red-200 text-ayamku-primary rounded"
//                           >
//                             <Minus size={14} />
//                           </button>
//                           <span className="w-8 text-center">
//                             {item.quantity}
//                           </span>
//                           <button
//                             onClick={() =>
//                               updateQuantity(item.id, item.quantity + 1)
//                             }
//                             className="w-8 h-8 flex items-center justify-center bg-ayamku-primary text-white rounded"
//                           >
//                             <Plus size={14} />
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {/* Suggested Items */}
//                 <div className="mt-12">
//                   <h3 className="text-xl font-semibold mb-6">
//                     {t("cart.suggestedTitle")}
//                   </h3>
//                   {loading ? (
//                     <div className="flex justify-center py-8">
//                       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ayamku-primary" />
//                     </div>
//                   ) : items.length === 0 ? (
//                     <div className="text-center py-8 text-gray-500">
//                       No suggested items available
//                     </div>
//                   ) : (
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       {items.slice(0, 6).map((item) => (
//                         <div
//                           key={item.itemId}
//                           className="bg-gray-50 rounded-lg p-4 hover:shadow-lg transition-shadow"
//                         >
//                           <img
//                             src={
//                               item.images?.[0]?.url ||
//                               "/assets/images/placeholder.png"
//                             }
//                             alt={item.name}
//                             className="w-full h-32 object-cover rounded mb-3"
//                           />
//                           <h4 className="font-medium text-sm mb-1 line-clamp-1">
//                             {item.name}
//                           </h4>
//                           <p className="text-xs text-gray-600 mb-2 line-clamp-2">
//                             {item.description || "Delicious food item"}
//                           </p>
//                           <div className="flex items-center justify-between">
//                             <span className="font-semibold text-ayamku-primary">
//                               ${item.price}
//                             </span>
//                             <Button
//                               size="sm"
//                               onClick={() => handleAddToCart(item)}
//                               className="bg-ayamku-primary hover:bg-red-600 text-white rounded-full w-8 h-8 p-0 flex items-center justify-center"
//                             >
//                               <Plus size={16} />
//                             </Button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Order Summary */}
//             <div className="lg:w-80">
//               <div className="bg-white rounded-lg shadow-md p-6 sticky top-24 space-y-6">
//                 <h3 className="text-xl font-semibold">
//                   {t("cart.totalTitle")}
//                 </h3>

//                 {cartItems.length > 0 && (
//                   <>
//                     {/* Order Type Selection */}
//                     <div className="space-y-3">
//                       <label className="text-sm font-semibold text-gray-700">
//                         Order Type
//                       </label>
//                       <div className="grid grid-cols-2 gap-3">
//                         <button
//                           onClick={() => setOrderType("dine-in")}
//                           className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
//                             orderType === "dine-in"
//                               ? "border-ayamku-primary bg-red-50 text-ayamku-primary"
//                               : "border-gray-200 hover:border-gray-300"
//                           }`}
//                         >
//                           <Store size={24} className="mb-2" />
//                           <span className="text-sm font-medium">Dine In</span>
//                         </button>
//                         <button
//                           onClick={() => setOrderType("pickup")}
//                           className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
//                             orderType === "pickup"
//                               ? "border-ayamku-primary bg-red-50 text-ayamku-primary"
//                               : "border-gray-200 hover:border-gray-300"
//                           }`}
//                         >
//                           <Package size={24} className="mb-2" />
//                           <span className="text-sm font-medium">Pickup</span>
//                         </button>
//                       </div>
//                     </div>

//                     {/* Time Selection - Pickup or Dine-in */}
//                     <div className="space-y-2">
//                       <label className="text-sm font-semibold text-gray-700 flex items-center">
//                         <Clock size={16} className="mr-2" />
//                         {orderType === "pickup"
//                           ? "Pickup Time"
//                           : "Arrival Time"}
//                       </label>
//                       <select
//                         value={pickupTime}
//                         onChange={(e) => setPickupTime(e.target.value)}
//                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayamku-primary focus:border-transparent"
//                       >
//                         {timeSlots.map((time) => (
//                           <option key={time} value={time}>
//                             {time}
//                           </option>
//                         ))}
//                       </select>
//                       <p className="text-xs text-gray-500">
//                         {orderType === "pickup"
//                           ? "Orders ready in 30 minutes minimum"
//                           : "Let us know when you plan to arrive"}
//                       </p>
//                     </div>

//                     {/* Special Instructions */}
//                     <div className="space-y-2">
//                       <label className="text-sm font-semibold text-gray-700">
//                         Special Instructions
//                       </label>
//                       <textarea
//                         value={specialInstructions}
//                         onChange={(e) => setSpecialInstructions(e.target.value)}
//                         placeholder="e.g., No sauce, extra spicy, well done..."
//                         rows={3}
//                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayamku-primary focus:border-transparent resize-none"
//                         maxLength={200}
//                       />
//                       <p className="text-xs text-gray-500 text-right">
//                         {specialInstructions.length}/200
//                       </p>
//                     </div>

//                     {/* Order Items Summary */}
//                     <div className="space-y-2 pt-4 border-t">
//                       <h4 className="font-semibold text-sm text-gray-700 mb-3">
//                         Order Summary
//                       </h4>
//                       {cartItems.map((item) => (
//                         <div
//                           key={item.id}
//                           className="flex justify-between text-sm"
//                         >
//                           <span className="flex-1 truncate">
//                             {item.quantity} × {item.name}
//                           </span>
//                           <span className="ml-2 font-medium">
//                             ${(item.price * item.quantity).toFixed(2)}
//                           </span>
//                         </div>
//                       ))}
//                     </div>

//                     {/* Totals */}
//                     <div className="border-t pt-4 space-y-2">
//                       <div className="flex justify-between text-sm">
//                         <span>{t("cart.discount")}</span>
//                         <span>$0.00</span>
//                       </div>
//                       <div className="flex justify-between font-semibold text-lg">
//                         <span>{t("cart.duePayment")}</span>
//                         <span className="text-ayamku-primary">
//                           ${getTotalPrice().toFixed(2)}
//                         </span>
//                       </div>
//                     </div>

//                     {/* Place Order Button */}
//                     <Button
//                       onClick={handlePlaceOrder}
//                       className="w-full bg-ayamku-primary hover:bg-red-600 text-white"
//                     >
//                       {t("cart.placeOrder")}
//                     </Button>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };
// export default CartCheckout;
// src/pages/CartCheckout.tsx - Updated with Redemption System
// src/pages/CartCheckout.tsx - Smart Redemption System
// src/pages/CartCheckout.tsx - Smart Redemption System
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Gift, X, Check } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { Button } from "../components/ui/button";
import { useTranslation } from "react-i18next";
import { useBranchStore } from "@/store/branchStore";
import { useDeliveryStore } from "@/store/deliveryStore";
import { fetchBranchItems, getMyRedemptions, placeOrder } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { uuidv4 } from "zod";
import confetti from "canvas-confetti";
import PaymentForm from "@/components/PaymentForm";

const CartCheckout = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const {
    items: cartItems,
    typeOfOrder,
    arrivalTime,
    specialInstruction,
    updateQuantity,
    removeItem,
    getTotalPrice,
    addItem,
    clearCart,
  } = useCartStore();
  const { selectedBranch } = useBranchStore();
  const { setDeliveryModalOpen } = useDeliveryStore();

  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Order options state
  const [orderType, setOrderType] = useState("dine-in");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [pickupTime, setPickupTime] = useState("");

  // Redemption state
  const [availableRedemptions, setAvailableRedemptions] = useState([]);
  const [appliedRedemptions, setAppliedRedemptions] = useState([]);
  const [freeItems, setFreeItems] = useState([]); // Items not in cart, added as free
  const [showRedemptionsModal, setShowRedemptionsModal] = useState(false);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);
  const { user } = useAuth();

  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const startTime = new Date(now.getTime() + 30 * 60000);

    for (let i = 0; i < 12; i++) {
      const time = new Date(startTime.getTime() + i * 15 * 60000);
      const hours = time.getHours().toString().padStart(2, "0");
      const minutes = time.getMinutes().toString().padStart(2, "0");
      slots.push(`${hours}:${minutes}`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    if (timeSlots.length > 0 && !pickupTime) {
      setPickupTime(timeSlots[0]);
    }
  }, [timeSlots, pickupTime]);

  useEffect(() => {
    const loadBranchData = async () => {
      if (!selectedBranch?.id) {
        setDeliveryModalOpen(true);
        return;
      }
      setLoading(true);
      try {
        const { items, categories } = await fetchBranchItems(selectedBranch?.id);
        setItems(items.sort((a, b) => b.loyaltyPoints - a.loyaltyPoints));
        setCategories(categories || []);
      } catch (error) {
        console.error("Failed to fetch branch items:", error);
        setItems([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadBranchData();
  }, [selectedBranch, setDeliveryModalOpen]);

  useEffect(() => {
    if (isAuthenticated && showRedemptionsModal) {
      fetchRedemptions();
    }
  }, [isAuthenticated, showRedemptionsModal]);

  const fetchRedemptions = async () => {
    try {
      setRedemptionsLoading(true);
      const response = await getMyRedemptions();
      // const pending = response.filter(
      //   (r) =>
      //     r.status === "pending" &&
      //     !appliedRedemptions.find((a) => a.redemptionId === r._id) &&
      //     !freeItems.find((f) => f.redemptionId === r._id)
      // );
      // setAvailableRedemptions(pending);
      const pending = response.filter(
        (r) =>
          r.status === "pending" &&
          !appliedRedemptions.find((a) => a.redemptionId === r.redemptionId) &&
          !freeItems.find((f) => f.redemptionId === r.redemptionId)
      );
      setAvailableRedemptions(pending);
    } catch (error) {
      console.error("Failed to fetch redemptions:", error);
      toast.error("Failed to load your redemptions");
    } finally {
      setRedemptionsLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    addItem({
      itemId: item.itemId,
      id: item.itemId,
      name: item.name,
      price: item.price,
      images: item.images?.length
        ? [item.images[0]]
        : ["/assets/images/placeholder.png"],
      description: item.description,
      _id: item.itemId || Math.random().toString(),
      stock: 1,
      isCombo: false,
      comboItems: [],
      loyaltyPoints: item.loyaltyPoints || 0,
      stockStatus: "available",
      status: "active",
      categoryId: item.categoryId,
      availableBranches: [],
    });
  };

  // Smart matching: Check if redeemed item exists in cart
  const findMatchingCartItem = (redemptionName) => {
    // Try exact match first
    let match = cartItems.find(
      (item) => item.name.toLowerCase() === redemptionName.toLowerCase()
    );

    if (!match) {
      // Try partial match (e.g., "Free Burger" matches "Chicken Burger")
      match = cartItems.find(
        (item) =>
          item.name
            .toLowerCase()
            .includes(redemptionName.toLowerCase().replace("free ", "")) ||
          redemptionName.toLowerCase().includes(item.name.toLowerCase())
      );
    }

    return match;
  };

  const handleApplyRedemption = (redemption) => {
    const matchingItem = findMatchingCartItem(redemption.redeemableName);

    if (matchingItem) {
      // Count how many redemptions already applied to this item
      const appliedCount = appliedRedemptions.filter(
        (r) => r.matchedCartItemId === matchingItem.id
      ).length;

      // If cart has remaining quantity for discount
      if (appliedCount < matchingItem.quantity) {
        setAppliedRedemptions((prev) => [
          ...prev,
          {
            ...redemption,
            matchedCartItemId: matchingItem.id,
            matchedCartItemName: matchingItem.name,
            discountAmount: matchingItem.price,
            type: "discount",
          },
        ]);
        toast.success(
          `${redemption.redeemableName} applied — one ${matchingItem.name} is free!`
        );
      } else {
        // Already discounted all available quantity → add as free item
        const itemDetails = items.find((i) =>
          i.name
            .toLowerCase()
            .includes(
              redemption.redeemableName.toLowerCase().replace("free ", "")
            )
        );

        setFreeItems((prev) => [
          ...prev,
          {
            ...redemption,
            itemDetails,
            type: "free",
          },
        ]);
        toast.success(
          `${redemption.redeemableName} added as a free extra item!`,
          { description: "You've already redeemed all in-cart items." }
        );
      }
    } else {
      // No cart match → add as free item
      const itemDetails = items.find((i) =>
        i.name
          .toLowerCase()
          .includes(
            redemption.redeemableName.toLowerCase().replace("free ", "")
          )
      );

      setFreeItems((prev) => [
        ...prev,
        {
          ...redemption,
          itemDetails,
          type: "free",
        },
      ]);
      toast.success(`${redemption.redeemableName} added as a free item!`);
    }

    // Remove from available list after applying
    setAvailableRedemptions((prev) =>
      prev.filter((r) => r.redemptionId !== redemption.redemptionId)
    );

    setShowRedemptionsModal(false);
  };

  // const handleApplyRedemption = (redemption) => {
  //   const matchingItem = findMatchingCartItem(redemption.redeemableName);

  //   if (matchingItem) {
  //     // CASE 1: Item exists in cart - Apply as discount
  //     setAppliedRedemptions([
  //       ...appliedRedemptions,
  //       {
  //         ...redemption,
  //         matchedCartItemId: matchingItem.id,
  //         matchedCartItemName: matchingItem.name,
  //         discountAmount: matchingItem.price,
  //         type: "discount",
  //       },
  //     ]);
  //     toast.success(
  //       `${redemption.redeemableName} will be deducted from ${matchingItem.name}!`
  //     );
  //   } else {
  //     // CASE 2: Item NOT in cart - Add as free item
  //     const itemDetails = items.find((i) =>
  //       i.name
  //         .toLowerCase()
  //         .includes(
  //           redemption.redeemableName.toLowerCase().replace("free ", "")
  //         )
  //     );

  //     setFreeItems([
  //       ...freeItems,
  //       {
  //         ...redemption,
  //         itemDetails,
  //         type: "free",
  //       },
  //     ]);
  //     toast.success(`${redemption.redeemableName} added as a free item!`, {
  //       description: "You'll receive this item at no charge",
  //     });
  //   }
  //   // ✅ Remove from available rewards after applying
  //   setAvailableRedemptions((prev) =>
  //     prev.filter((r) => r.redemptionId !== redemption.redemptionId)
  //   );

  //   setShowRedemptionsModal(false);
  // };

  const handleRemoveRedemption = (redemption) => {
    if (redemption.type === "discount") {
      setAppliedRedemptions(
        appliedRedemptions.filter(
          (r) => r.redemptionId !== redemption.redemptionId
        )
      );
      toast.info(`Discount removed from ${redemption.matchedCartItemName}`);
    } else {
      setFreeItems(
        freeItems.filter((r) => r.redemptionId !== redemption.redemptionId)
      );
      toast.info(`${redemption.redeemableName} removed from free items`);
    }

    setAvailableRedemptions([...availableRedemptions, redemption]);
  };

  // Calculate totals with smart redemptions
  const calculateTotals = () => {
    const subtotal = getTotalPrice();

    // Calculate discount from matched items
    const redemptionDiscount = appliedRedemptions.reduce((sum, r) => {
      return sum + (r.discountAmount || 0);
    }, 0);

    const total = Math.max(0, subtotal - redemptionDiscount);

    return {
      subtotal,
      redemptionDiscount,
      total,
      freeItemsCount: freeItems.length,
    };
  };

  const { subtotal, redemptionDiscount, total, freeItemsCount } = calculateTotals();

  const handleOrder = async () =>{
    useCartStore.setState({
      typeOfOrder: orderType,
      arrivalTime: pickupTime,
      specialInstruction: specialInstructions,

    })

    setIsPaymentModalOpen(true);
  }

  // const handlePlaceOrder = async () => {
  //   try {
  //     console.log("🛒 Placing order...");
      
  //     setIsPlacingOrder(true);
  //     setIsPaymentModalOpen(false);
  //     // Combine all redemption IDs (both discount + free)
  //     const redemptionIds = [
  //       ...appliedRedemptions.map((r) => r.redemptionId),
  //       ...freeItems.map((f) => f.redemptionId),
  //     ];

  //     const orderDetails = {
  //       orderId: crypto.randomUUID(), // or generated by backend
  //       userId: user.userId, // backend will replace this
  //       items: cartItems,
  //       address: selectedBranch
  //         ? {
  //             street: selectedBranch.address || "",
  //           }
  //         : {},
  //       totalPrice: total,
  //       paymentMethod: "cash", // or selected payment option
  //       status: "pending",
  //       createdAt: Date.now(),
  //       updatedAt: Date.now(),

  //       // --- Custom fields ---
  //       orderType,
  //       specialInstructions,
  //       scheduledTime: pickupTime,
  //       branchId: selectedBranch?.id,
  //       redemptionIds, // ✅ all redemptions included here
  //       subtotal,
  //       redemptionDiscount,
  //       freeItemsCount: freeItems.length,
  //     };

  //     // You can now call your backend API here:
  //     await placeOrder(orderDetails);

  //     confetti({
  //       particleCount: 120,
  //       spread: 80,
  //       origin: { y: 0.6 },
  //       colors: ["#E53E3E", "#F6AD55", "#48BB78"],
  //     });

  //     toast.success("🎉 Order placed successfully!", {
  //       description: "Your delicious food is on the way 🚗💨",
  //       duration: 4000,
  //     });

  //     setShowSuccessModal(true);

  //     clearCart();
  //   } catch (error) {
  //     toast.error("Something went wrong! Please try again.");
  //   } finally {
  //     setIsPlacingOrder(false);
  //   }
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <Link
                  to="/menu"
                  className="flex items-center text-gray-600 hover:text-ayamku-primary"
                >
                  <ArrowLeft size={20} className="mr-2" />
                  {t("cart.title")}
                </Link>
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <h2 className="text-xl font-semibold mb-2">
                    {t("cart.empty")}
                  </h2>
                  <p className="text-gray-600 mb-6">{t("cart.addItems")}</p>
                  <Link to="/menu">
                    <Button className="bg-ayamku-primary hover:bg-red-600 text-white">
                      {t("cart.browseMenu")}
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {cartItems.map((item) => {
                      const hasDiscount = appliedRedemptions.find(
                        (r) => r.matchedCartItemId === item.id
                      );

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center space-x-4 p-4 border rounded-lg ${
                            hasDiscount ? "bg-green-50 border-green-300" : ""
                          }`}
                        >
                          <img
                            src={
                              item.images?.[0]?.url ||
                              "/assets/images/placeholder.png"
                            }
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{item.name}</h3>
                              {hasDiscount && (
                                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full flex items-center gap-1">
                                  <Gift size={12} />
                                  FREE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <p
                                className={`font-semibold ${
                                  hasDiscount
                                    ? "text-gray-400 line-through"
                                    : "text-ayamku-primary"
                                }`}
                              >
                                ${item.price}
                              </p>
                              {hasDiscount && (
                                <p className="text-green-600 font-bold">
                                  $0.00
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="w-8 h-8 flex items-center justify-center border border-red-200 text-ayamku-primary rounded"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="w-8 h-8 flex items-center justify-center bg-ayamku-primary text-white rounded"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Free Items Section */}
                  {freeItems.length > 0 && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <Gift size={18} className="mr-2" />
                        Free Items (From Rewards)
                      </h4>
                      <div className="space-y-2">
                        {freeItems.map((freeItem) => (
                          <div
                            key={freeItem.redemptionId}
                            className="flex items-center justify-between bg-white p-3 rounded"
                          >
                            <div className="flex items-center space-x-3">
                              {freeItem.itemDetails?.images?.[0] && (
                                <img
                                  src={freeItem.itemDetails.images[0].url}
                                  alt={freeItem.redeemableName}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-medium text-sm">
                                  {freeItem.redeemableName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Quantity: 1 (Free)
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveRedemption(freeItem)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Discounts Applied Section */}
                  {appliedRedemptions.length > 0 && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                        <Check size={18} className="mr-2" />
                        Discounts Applied
                      </h4>
                      <div className="space-y-2">
                        {appliedRedemptions.map((redemption) => (
                          <div
                            key={redemption.redemptionId}
                            className="flex items-center justify-between bg-white p-3 rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <Gift size={16} className="text-green-600" />
                              <div>
                                <span className="text-sm font-medium">
                                  {redemption.redeemableName}
                                </span>
                                <p className="text-xs text-gray-500">
                                  Applied to: {redemption.matchedCartItemName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-600 font-bold text-sm">
                                -${redemption.discountAmount}
                              </span>
                              <button
                                onClick={() =>
                                  handleRemoveRedemption(redemption)
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Suggested Items */}
              <div className="mt-12">
                <h3 className="text-xl font-semibold mb-6">
                  {t("cart.suggestedTitle")}
                </h3>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ayamku-primary" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No suggested items available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {items.slice(0, 6).map((item) => (
                      <div
                        key={item.itemId}
                        className="bg-gray-50 rounded-lg p-4 hover:shadow-lg transition-shadow"
                      >
                        <img
                          src={
                            item.images?.[0]?.url ||
                            "/assets/images/placeholder.png"
                          }
                          alt={item.name}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                        <h4 className="font-medium text-sm mb-1 line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {item.description || "Delicious food item"}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-ayamku-primary">
                            ${item.price}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(item)}
                            className="bg-ayamku-primary hover:bg-red-600 text-white rounded-full w-8 h-8 p-0 flex items-center justify-center"
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24 space-y-6">
              <h3 className="text-xl font-semibold">{t("cart.totalTitle")}</h3>

              {cartItems.length > 0 && (
                <>
                  {/* Apply Redemptions Button */}
                  {isAuthenticated && (
                    <button
                      onClick={() => setShowRedemptionsModal(true)}
                      className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <Gift size={20} />
                      Apply Rewards
                    </button>
                  )}

                  {/* Order Type Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Order Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setOrderType("dine-in")}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                          orderType === "dine-in"
                            ? "border-ayamku-primary bg-red-50 text-ayamku-primary"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-sm font-medium">Dine In</span>
                      </button>
                      <button
                        onClick={() => setOrderType("pickup")}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                          orderType === "pickup"
                            ? "border-ayamku-primary bg-red-50 text-ayamku-primary"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-sm font-medium">Pickup</span>
                      </button>
                    </div>
                  </div>

                  {/* Time Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      {orderType === "pickup" ? "Pickup Time" : "Arrival Time"}
                    </label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Special Instructions */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Special Instructions
                    </label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="e.g., No sauce, extra spicy..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                      maxLength={200}
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">
                      Order Summary
                    </h4>
                    {cartItems.map((item) => {
                      const hasDiscount = appliedRedemptions.find(
                        (r) => r.matchedCartItemId === item.id
                      );
                      return (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="flex-1 truncate flex items-center gap-1">
                            {item.quantity} × {item.name}
                            {hasDiscount && (
                              <Gift size={12} className="text-green-600" />
                            )}
                          </span>
                          <span
                            className={`ml-2 font-medium ${
                              hasDiscount ? "line-through text-gray-400" : ""
                            }`}
                          >
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Free Items in Summary */}
                    {freeItems.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold text-blue-600 mb-2">
                          Free Items:
                        </p>
                        {freeItems.map((item) => (
                          <div
                            key={item.redemptionId}
                            className="flex justify-between text-sm text-blue-600"
                          >
                            <span className="flex-1 truncate flex items-center gap-1">
                              <Gift size={12} />1 × {item.redeemableName}
                            </span>
                            <span className="ml-2 font-medium">$0.00</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {Number(redemptionDiscount) > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center">
                          <Gift size={14} className="mr-1" />
                          Rewards Discount
                        </span>
                        <span>-${Number(redemptionDiscount).toFixed(2)}</span>
                      </div>
                    )}

                    {freeItemsCount > 0 && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span className="flex items-center">
                          <Gift size={14} className="mr-1" />
                          Free Items ({freeItemsCount})
                        </span>
                        <span>Included</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg">
                      <span>{t("cart.duePayment")}</span>
                      <span className="text-ayamku-primary">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <Button
                    // onClick={handlePlaceOrder}
                    onClick={handleOrder}
                    // onClick={() => setIsPaymentModalOpen(true)}
                    disabled={isPlacingOrder}
                    className="bg-ayamku-primary text-white w-full h-12 text-lg rounded-xl flex items-center justify-center"
                  >
                    {isPlacingOrder ? (
                      <>
                        <span className="loader mr-2"></span>
                        Placing Order...
                      </>
                    ) : (
                      t("cart.placeOrder")
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Redemptions Modal */}
      {showRedemptionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Your Available Rewards</h3>
              <button
                onClick={() => setShowRedemptionsModal(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Smart Apply:</strong> If the item is in your cart, it
                will be discounted. Otherwise, it will be added as a free item!
              </p>
            </div>

            {redemptionsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
              </div>
            ) : availableRedemptions.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 mb-4">
                  No available rewards to apply
                </p>
                <Link to="/rewards">
                  <Button className="bg-ayamku-primary text-white">
                    Browse Rewards
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {availableRedemptions.map((redemption) => {
                  const matchingItem = findMatchingCartItem(
                    redemption.redeemableName
                  );
                  const willBeDiscount = !!matchingItem;

                  return (
                    <div
                      key={redemption.redemptionId}
                      className={`border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${
                        willBeDiscount
                          ? "border-green-300 bg-green-50"
                          : "border-blue-300 bg-blue-50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {redemption.redeemableName}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Code: {redemption.redemptionId.slice(0, 12)}
                          </p>
                          {willBeDiscount ? (
                            <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                              <Check size={14} />
                              Will discount: {matchingItem.name}
                            </p>
                          ) : (
                            <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
                              <Gift size={14} />
                              Will be added as free item
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            willBeDiscount
                              ? "bg-green-200 text-green-800"
                              : "bg-blue-200 text-blue-800"
                          }`}
                        >
                          {redemption.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleApplyRedemption(redemption)}
                        className={`w-full py-2 text-white rounded-lg font-semibold transition-colors ${
                          willBeDiscount
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {willBeDiscount
                          ? "✓ Apply Discount"
                          : "+ Add as Free Item"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- RENDER THE PAYMENT MODAL CONDITIONALLY --- */}
      {isPaymentModalOpen && (
        <PaymentForm
          amount={total}
          currency="BND" // Or your desired currency
          // onPaymentSuccess={handlePlaceOrder}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {/* Full-screen overlay loader */}
      {isPlacingOrder && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="relative">
            <div className="loader-bubble"></div>
          </div>
          <p className="mt-6 text-white text-lg font-semibold animate-pulse">
            Placing your order...
          </p>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center shadow-xl max-w-sm w-full animate-in fade-in zoom-in">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-ayamku-primary mb-2">
              Order Placed Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Your order is now being prepared. We'll notify you once it's
              ready!
            </p>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/menu");
              }}
              className="bg-ayamku-primary text-white w-full"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartCheckout;
