import { useState, useEffect } from "react";
import { getFooter, updateFooter, FooterSet } from "../../api/footerSetting";

const FooterSettings = () => {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<FooterSet>({
        quickLinks: {
            exploreMenu: "",
            restaurantLocator: "",
            contactUs: "",
            aboutUs: "",
        },
        contactInfo: {
            address1: "",
            address2: "",
            phone: "",
            email: "",
        },
    });

    const fetchFooter = async () => {
        const res = await getFooter();
        if (res.data) {
            setForm({
                quickLinks: {
                    exploreMenu: res.data.quickLinks.exploreMenu,
                    restaurantLocator: res.data.quickLinks.restaurantLocator,
                    contactUs: res.data.quickLinks.contactUs,
                    aboutUs: res.data.quickLinks.aboutUs,
                },
                contactInfo: {
                    address1: res.data.contactInfo.address1,
                    address2: res.data.contactInfo.address2,
                    phone: res.data.contactInfo.phone,
                    email: res.data.contactInfo.email,
                },
            });
        }
    };

    useEffect(() => {
        fetchFooter();
    }, []);


    const handleSave = async () => {
        // return console.log(form)
        if (!form.quickLinks.exploreMenu || !form.quickLinks.restaurantLocator || !form.quickLinks.contactUs || !form.quickLinks.aboutUs) return alert("All quick link fields are required.");
        if (!form.contactInfo.address1 || !form.contactInfo.address2 || !form.contactInfo.phone || !form.contactInfo.email) return alert("All contact info fields are required.");
        if (form.contactInfo.phone.startsWith('+')) return alert("Phone number should not start with +");
        if (form.contactInfo.phone.length > 10 || form.contactInfo.phone.length < 10) return alert("Enter valid mobile number.");
        if (!/\S+@\S+\.\S+/.test(form.contactInfo.email)) return alert("Invalid email address");
        setLoading(true);
        try {
            await updateFooter(form);
            alert("Footer updated successfully!");
        } catch (err) {
            alert("Error saving footer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold mb-6">Footer Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Quick Links Section */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-yellow-600 border-b pb-2">Quick Links (URLs)</h4>
                    {(Object.keys(form.quickLinks) as Array<keyof typeof form.quickLinks>).map((field) => (
                        <div key={field}>
                            <label className="block text-sm capitalize">
                                {field.replace(/([A-Z])/g, ' $1')}
                            </label>
                            <input 
                                className="w-full border p-2 rounded mt-1"
                                // Access nested value
                                value={form.quickLinks[field]} 
                                onChange={(e) => setForm({
                                    ...form,
                                    quickLinks: {
                                        ...form.quickLinks,
                                        [field]: e.target.value
                                    }
                                })}
                            />
                        </div>
                    ))}
                </div>

                {/* Contact Info Section */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-yellow-600 border-b pb-2">Contact Info</h4>
                    {(Object.keys(form.contactInfo) as Array<keyof typeof form.contactInfo>).map((field) => (
                        <div key={field}>
                            <label className="block text-sm capitalize">{field}</label>
                            <input 
                                className="w-full border p-2 rounded mt-1"
                                // Access nested value
                                value={form.contactInfo[field]} 
                                onChange={(e) => setForm({
                                    ...form,
                                    contactInfo: {
                                        ...form.contactInfo,
                                        [field]: e.target.value
                                    }
                                })}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <button 
                onClick={handleSave}
                className="mt-8 px-10 py-3 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition"
            >
                {loading ? "Saving..." : "Update Footer"}
            </button>
        </div>
    );
};

export default FooterSettings;