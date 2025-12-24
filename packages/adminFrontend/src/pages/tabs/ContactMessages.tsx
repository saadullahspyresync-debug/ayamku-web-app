import React, { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import {
  getAllContactMessages,
  updateContactMessage,
  deleteContactMessage,
  ContactFormMessage,
} from "../../api/contact";

export const ContactMessages: React.FC = () => {
  const [messages, setMessages] = useState<ContactFormMessage[]>([]);
  const [selectedMessage, setSelectedMessage] =
    useState<ContactFormMessage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = messages.filter((m) => m.status === "new").length;
  const totalCount = messages.length;

  // Fetch all contact messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await getAllContactMessages();
        const normalized: ContactFormMessage[] = res.data.data.map((msg: any) => ({
          _id: msg._id || msg.id,
          name: msg.name || `${msg.firstName || "Unknown"} ${msg.lastName || ""}`,
          email: msg.email,
          subject: msg.subject || "",
          message: msg.message,
          status: msg.status || "new",
          submittedAt: msg.submittedAt,
          updatedAt: msg.updatedAt,
        }));
        setMessages(normalized);
      } catch (err) {
        console.error("Failed to fetch contact messages:", err);
        setError("Failed to load contact messages.");
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  // Update message status via API
  const updateStatus = async (
    id: string,
    status: "new" | "pending" | "resolved"
  ) => {
    try {
      await updateContactMessage(id, { status });
      setMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status } : m))
      );
      if (selectedMessage?._id === id) {
        setSelectedMessage({ ...selectedMessage, status });
      }
    } catch (err) {
      console.error(`Failed to update status for message ${id}:`, err);
    }
  };

  // Mark a message as pending when clicked
  const markAsPending = (msg: ContactFormMessage) => {
    if (msg.status === "new") {
      updateStatus(msg._id!, "pending");
      setSelectedMessage({ ...msg, status: "pending" });
    } else {
      setSelectedMessage(msg);
    }
  };

  // Mark as resolved
  const markResolved = (id: string) => {
    updateStatus(id, "resolved");
  };

  // Delete a message
  const deleteMessage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteContactMessage(id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
      if (selectedMessage?._id === id) setSelectedMessage(null);
    } catch (err) {
      console.error("Failed to delete message:", err);
      alert("Failed to delete message.");
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-600">Loading messages...</div>
    );
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-3xl font-bold">Contact Messages</h1>
        <div className="flex gap-3">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full font-semibold">
            Total: {totalCount}
          </span>
          <span className="bg-red-500 text-white px-3 py-1 rounded-full font-semibold">
            Unread: {unreadCount}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="col-span-1">
          <h2 className="font-semibold mb-3 text-lg">All Messages</h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`p-4 border rounded-lg cursor-pointer transition-shadow hover:shadow-lg ${
                  msg.status === "new"
                    ? "bg-yellow-50 border-yellow-300"
                    : "bg-white border-gray-200"
                }`}
                onClick={() => markAsPending(msg)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{msg.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      msg.status === "resolved"
                        ? "bg-green-200 text-green-800"
                        : msg.status === "pending"
                        ? "bg-blue-200 text-blue-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {msg.status || "new"}
                  </span>
                </div>
                <div className="text-sm text-gray-600 font-medium">{msg.subject}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(msg.submittedAt || "").toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Details */}
        <div className="col-span-2">
          {selectedMessage ? (
            <div className="p-6 border rounded-lg shadow-lg bg-white">
              <h2 className="text-2xl font-semibold mb-4">{selectedMessage.subject}</h2>
              <p className="mb-2">
                <strong>From:</strong> {selectedMessage.name}
              </p>
              <p className="mb-2">
                <strong>Email:</strong> {selectedMessage.email}
              </p>
              {selectedMessage.message && (
                <p className="mb-4 whitespace-pre-wrap">{selectedMessage.message}</p>
              )}
              <p className="text-sm text-gray-500 mb-4">
                Submitted: {new Date(selectedMessage.submittedAt || "").toLocaleString()}
              </p>

              <div className="flex gap-3 flex-wrap">
                {selectedMessage.status !== "resolved" && (
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => markResolved(selectedMessage._id!)}
                  >
                    Mark as Resolved
                  </Button>
                )}
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => deleteMessage(selectedMessage._id!)}
                >
                  Delete
                </Button>
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() =>
                    window.open(
                      `mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                        selectedMessage.subject
                      )}`
                    )
                  }
                >
                  Reply via Email
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 border rounded-lg shadow-lg bg-white text-gray-500 flex items-center justify-center h-full">
              Select a message to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
