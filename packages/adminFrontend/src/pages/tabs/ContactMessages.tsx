import React, { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import {
  getAllContactMessages,
  updateContactMessage,
  deleteContactMessage,
  ContactFormMessage,
  sendAdminReply,
} from "../../api/contact";
import { useAuth } from "../../contexts/AuthContext";

export const ContactMessages: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const managerBranchId = user?.branchId;

  const [messages, setMessages] = useState<ContactFormMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactFormMessage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const unreadCount = messages.filter((m) => m.status === "new").length;
  const totalCount = messages.length;

  

  // Fetch all contact messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await getAllContactMessages();
        
        const normalized: ContactFormMessage[] = res.data?.data.map((msg: any) => ({
          _id: msg._id || msg.id,
          branchId: msg.branchId,
          name: msg.name || `${msg.firstName || "Unknown"} ${msg.lastName || ""}`,
          email: msg.email,
          subject: msg.subject || "",
          message: msg.message,
          status: msg.status || "new",
          submittedAt: msg.submittedAt,
          updatedAt: msg.updatedAt,
        }));

        // --- 2. FILTER LOGIC ---
        if (isAdmin) {
          setMessages(normalized);
        } else {
          setMessages(normalized.filter((msg) => msg.branchId === managerBranchId));
        }

      } catch (err) {
        setError("Failed to load contact messages.");
        setTimeout(() => {
          setError(null);
        }, 3000);
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
    setIsReplying(false);
    setReplyText("");
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

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;
    
    setIsSending(true);
    try {
      await sendAdminReply(
        selectedMessage.email,
        selectedMessage?.subject!,
        replyText
      );
      alert("Reply sent successfully!");
      setIsReplying(false);
      setReplyText("");
      // markResolved(selectedMessage?._id!); // Optional: Mark resolved after reply
    } catch (error: any) {
      alert("Failed to send reply: " + error.message);
    } finally {
      setIsSending(false);
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
              {/* 1. Original Message Display (Keep this visible always) */}
              <h2 className="text-2xl font-semibold mb-4">{selectedMessage.subject}</h2>
              <p className="mb-2">
                <strong>From:</strong> {selectedMessage.name}
              </p>
              <p className="mb-2">
                <strong>Email:</strong> {selectedMessage.email}
              </p>
              
              {/* This is the part that was missing in the previous snippet */}
              {selectedMessage.message && (
                <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-100 italic text-gray-700 whitespace-pre-wrap">
                  "{selectedMessage.message}"
                </div>
              )}
              
              <p className="text-sm text-gray-500 my-4">
                Submitted: {new Date(selectedMessage.submittedAt || "").toLocaleString()}
              </p>

              <hr className="my-6 border-gray-100" />

              {/* 2. Toggle between Action Buttons and Reply Form */}
              {isReplying ? (
                <div className="mt-4 p-5 bg-blue-50 rounded-xl border border-blue-100 shadow-inner">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-blue-800">Compose Reply</h3>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Sending as support@ayamkubrunei.com</span>
                  </div>
                  
                  <textarea
                    className="w-full p-4 border border-blue-200 rounded-lg h-40 mb-4 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    placeholder="Hi, thanks for reaching out to Ayamku..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  
                  <div className="flex gap-3">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6" 
                      onClick={handleSendReply}
                      disabled={isSending || !replyText.trim()}
                    >
                      {isSending ? "Sending..." : "Send Official Reply"}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-gray-300"
                      onClick={() => {
                        setIsReplying(false);
                        setReplyText("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* 3. Original Action Buttons */
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
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => setIsReplying(true)}
                  >
                    Reply via Support Email
                  </Button>

                  <Button
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => deleteMessage(selectedMessage._id!)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 border rounded-lg shadow-lg bg-white text-gray-500 flex items-center justify-center h-full text-center">
              <div>
                <div className="text-4xl mb-2">📩</div>
                <p>Select a message from the list to view details and reply.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
