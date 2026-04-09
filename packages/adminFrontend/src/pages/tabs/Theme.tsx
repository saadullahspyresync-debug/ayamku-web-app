import { useState, useEffect } from "react";
import { getAllThemeTemplates, createThemeTemplate, updateLiveTheme, getActiveTheme, ThemeTemplatePayload } from "../../api/theme";
import uploadImagesToS3 from "../../api/uploadApi";
import Modal from "../../components/Modal";
import { Loader } from "../../components/Loader";


const emptyTemplate: ThemeTemplatePayload = {
    themeName: "",
    primaryColor: "#E41B23",
    bannerImg: null,
    existingImage: null,
};

const Theme = () => {
    const [templates, setTemplates] = useState([]);
    const [activeId, setActiveId] = useState("");
    const [pageLoading, setPageLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState<ThemeTemplatePayload>(emptyTemplate);

    useEffect(() => {
        fetchData();
    }, []);

    const openAdd = () => {
        setForm(emptyTemplate);
        setIsOpen(true);
    };

    const fetchData = async () => {
        setPageLoading(true);
        try {
            const [tpls, active] = await Promise.all([
                getAllThemeTemplates(),
                getActiveTheme()
            ]);
            setTemplates(tpls.data.data);
            setActiveId(active.data.data.templateId); // Track which one is live
        } finally {
            setPageLoading(false);
        }
    };

    const handleCreateTemplate = async () => {
        if (!form.themeName || !form.bannerImg || !form.primaryColor) return alert("Please fill all fields");
        const { themeName, primaryColor } = form;

        setPageLoading(true);
        try {
            let uploadedImageUrl = null;      
            if (form.bannerImg && form.bannerImg instanceof File) {
            const [fileData] :any = await uploadImagesToS3([form.bannerImg] );
            uploadedImageUrl = fileData.url;
            }

            const bannerImg = uploadedImageUrl || form.existingImage || null;
            
            await createThemeTemplate({ themeName, primaryColor, bannerImg });
            setIsOpen(false);
            fetchData(); // Refresh list
        }
        catch (err) {
            alert("Server error, please try again" );
            console.error(err);
        } 
        finally {
            setPageLoading(false);
        }
    };

    const handleSetLive = async (tpl: any) => {
        if (!window.confirm(`Apply ${tpl.themeName} to the live website?`)) return;
        // return console.log("Setting live theme:", tpl);
        setPageLoading(true);
        try {
            // This tells the website: "Use these colors now"
            await updateLiveTheme({
                templateId: tpl.templateId,
                primaryColor: tpl.primaryColor,
                bannerImg: tpl.bannerImg,
                themeName: tpl.themeName
            });
            setActiveId(tpl.templateId);
        }
        catch (err) {
            // alert("Server error, please try again" );
            console.error(err);
        }
        finally {
            setPageLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">Theme</h3>
                {!pageLoading &&
                    <button
                    onClick={openAdd}
                    className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-md transition"
                    >
                    + Create Theme                        
                </button>}
            </div>

            {pageLoading ? <Loader tab="theme"/> : (
                <div className="grid grid-cols-3 gap-4">
                    {templates.map((tpl: any) => (
                        <div 
                            key={tpl.templateId} 
                            className={`p-4 border rounded-lg shadow-sm transition-all ${
                                activeId === tpl.templateId ? 'border-green-500 border-2 bg-green-50' : 'border-gray-200 bg-white'
                            }`}
                        >
                            {/* Theme Name */}
                            <h3 className="font-bold text-lg mb-2 capitalize">{tpl.themeName}</h3>
                            
                            {/* Image Preview */}
                            <div className="w-full h-32 mb-3 overflow-hidden rounded-md border border-gray-100">
                                {tpl.bannerImg ? (
                                    <img 
                                        src={tpl.bannerImg} 
                                        alt={tpl.themeName} 
                                        className="w-full h-full object-cover object-center"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                        No Image Provided
                                    </div>
                                )}
                            </div>

                            {/* Color Bar Preview */}
                            <div className="flex items-center gap-2 mb-4">
                                <div 
                                    className="w-full h-4 rounded-full border border-black/10" 
                                    style={{ backgroundColor: tpl.primaryColor }} 
                                />
                                <span className="text-xs text-gray-500 font-mono">{tpl.primaryColor}</span>
                            </div>

                            {/* Action Button */}
                            <button 
                                onClick={() => handleSetLive(tpl)}
                                disabled={activeId === tpl.templateId}
                                className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                                    activeId === tpl.templateId 
                                    ? 'bg-green-500 text-white cursor-default' 
                                    : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-md'
                                }`}
                            >
                                {activeId === tpl.templateId ? "Currently Live" : "Select & Publish"}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for Adding New Theme */}
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4 flex justify-center">Add New Theme</h3>

                    <label className="block text-sm font-medium mb-1">Template Name: <span className="text-red-500">*</span></label>
                    <input 
                        placeholder="Theme Name (e.g. National Day)" 
                        className="w-full border p-2"
                        value={form.themeName}
                        onChange={(e) => setForm({ ...form, themeName: e.target.value })} 
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1">Choose Color: <span className="text-red-500">*</span></label>
                        <input 
                            type="color" 
                            className="w-full h-10" 
                            value={form.primaryColor}
                            onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Upload Banner Image: <span className="text-red-500">*</span></label>
                        <input 
                            type="file"
                            accept="image/*"
                            className="w-full border p-2"
                            onChange={(e) => setForm({ ...form, bannerImg: e.target.files?.[0] || null })} 
                        />
                        <div className="mt-2 flex gap-2 flex-wrap">
                            {form.bannerImg && form.bannerImg instanceof File ? (
                                <img
                                src={URL.createObjectURL(form.bannerImg)}
                                alt="new"
                                className="w-24 h-24 object-cover rounded"
                                />
                            ) : form.existingImage ? (
                                <img
                                src={form.existingImage}
                                alt="existing"
                                className="w-24 h-24 object-cover rounded"
                                />
                            ) : null}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleCreateTemplate}
                            className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-md transition"
                        >
                            {/* {pageLoading ? "Saving.." : "Save"} */}
                            {pageLoading ? "Adding..." : "Add"}
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Theme;