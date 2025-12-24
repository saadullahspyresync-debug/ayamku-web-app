import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { getMyOrders } from "@/services/api";


export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await getMyOrders().then((res) => res);
        setOrders(res || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (loading) return <div className="p-6 text-lg">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>

      {orders.length === 0 ? (
        <div>No orders found.</div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.orderId} className="shadow-md rounded-2xl p-2">
              <CardContent className="space-y-2">
                <div className="font-semibold text-lg">Order Id: {order.orderId}</div>
                <div className="text-sm opacity-80">
                  Placed on: {new Date(order.createdAt).toLocaleString()}
                </div>
                <div>Order Type: {order.orderType}</div>

                {order.items.length > 0 && (
                    <div>
                        <div className="font-medium">Items:</div>
                            <ul className="list-disc ml-5 text-sm">
                            {   order.items.map((item) => (
                                    <li key={item.itemId}>
                                    {item.name} — {item.quantity} x ${item.price}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {order.subtotal && (
                  <div className="font-semibold mt-2">Total: ${order.subtotal}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
