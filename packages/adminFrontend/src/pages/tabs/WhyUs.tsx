import { useState, useEffect } from "react";
import uploadImagesToS3 from "../../api/uploadApi";
import Modal from "../../components/Modal";
import { Loader } from "../../components/Loader";

import { WhyUsItem } from "../../api/whyUs";
import { getAll, create, deleteWhyChooseUS } from "../../api/whyUs";

const WhyUs = () => {
    const [items, setItems] = useState<any[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState<WhyUsItem>({ title: "", description: "", image: null });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setPageLoading(true);
        try {
            const response = await getAll();
            setItems(response.data.data);
        } finally {
            setPageLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.title || !form.description || !form.image) return alert("All fields required");
        setPageLoading(true);
        try {
            let imageUrl = "";
            if (form.image instanceof File) {
                const [fileData]: any = await uploadImagesToS3([form.image]);
                imageUrl = fileData.url;
            }

            await create({ 
                title: form.title, 
                description: form.description, 
                image: imageUrl 
            });
            
            setIsOpen(false);
            setForm({ title: "", description: "", image: null });
            fetchData();
        } catch (err) {
            alert("Server error, please try again");
        } finally {
            setPageLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure?")) return;
        setPageLoading(true);
        try {
            await deleteWhyChooseUS(id);
            fetchData();
        } catch (err) {
            alert("Server error, please try again");
        } finally {
            setPageLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">Why Us Section</h3>
                <button
                    onClick={() => setIsOpen(true)}
                    className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-md transition"
                >
                    + Add New Reason
                </button>
            </div>

            {pageLoading ? <Loader tab="whyus" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items?.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 flex-grow">
                                <img 
                                    src={item.imageUrl} 
                                    alt={item.title} 
                                    className="w-full h-40 object-cover rounded-lg mb-4" 
                                />
                                <h4 className="font-bold text-lg text-gray-800">{item.title}</h4>
                                <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                            </div>
                            <div className="px-4 pb-4 mt-auto">
                                <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    Delete Item
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4 text-center">Add "Why Choose Us" Item</h3>
                    
                    <label className="block text-sm font-medium">Title</label>
                    <input 
                        className="w-full border p-2 rounded"
                        value={form.title}
                        onChange={(e) => setForm({...form, title: e.target.value})}
                    />

                    <label className="block text-sm font-medium">Description</label>
                    <textarea 
                        className="w-full border p-2 rounded"
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm({...form, description: e.target.value})}
                    />

                    <label className="block text-sm font-medium">Icon/Image</label>
                    <input 
                        type="file" 
                        onChange={(e) => setForm({...form, image: e.target.files?.[0] || null})}
                        className="w-full border p-2 rounded"
                    />

                    <div className="flex gap-3 pt-4">
                        <button onClick={handleCreate} className="flex-1 py-2 bg-yellow-500 text-white rounded-lg">
                            {pageLoading ? "Saving..." : "Save"}
                        </button>
                        <button onClick={() => setIsOpen(false)} className="flex-1 py-2 bg-gray-200 rounded-lg">
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default WhyUs;