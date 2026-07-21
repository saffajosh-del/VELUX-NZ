import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PRODUCTS, 
    PITCHED_SIZES, 
    FLAT_SIZES, 
    ROOF_WINDOW_SIZES, 
    FLASHINGS, 
    BLINDS, 
    ACCESSORIES
} from '@/data/products';
import type { Product } from '@/data/products';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Check, 
    Printer, 
    Download, 
    Plus, 
    Trash2, 
    Copy, 
    FileSpreadsheet, 
    Eye, 
    EyeOff, 
    Info, 
    Sliders,
    Building2
} from 'lucide-react';

interface SelectionState {
    productCategory: 'skylight' | 'roof-window' | 'sun-tunnel' | null;
    roofPitch: 'pitched' | 'flat' | null;
    roofMaterial: 'tile' | 'corrugated' | 'trimdek' | 'klip-lok' | null;
    openingType: 'fixed' | 'manual' | 'electric' | 'solar' | null;
    sizeCode: string | null;
    selectedProduct: Product | null;
    selectedBlind: string | null;
    selectedInsectScreen: boolean;
    selectedAccessories: string[];
}

interface ScheduleItem {
    id: string;
    mark: string; // e.g. SK-01
    product: Product;
    sizeCode: string;
    width: number;
    height: number;
    openingType: string;
    glazing: string;
    uValue: number;
    shgc: number;
    rw: number;
    vlt: number;
    balRating: string;
    accessories: string[];
    qty: number;
    notes: string;
    price: number;
}

export default function ArchitectSelector() {
    // Tab state
    const [activeTab, setActiveTab] = useState<'configure' | 'schedule'>('configure');
    
    // Spec selection state
    const [selection, setSelection] = useState<SelectionState>({
        productCategory: null,
        roofPitch: null,
        roofMaterial: null,
        openingType: null,
        sizeCode: null,
        selectedProduct: null,
        selectedBlind: null,
        selectedInsectScreen: false,
        selectedAccessories: [],
    });

    // Schedule items state
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [nextMarkNumber, setNextMarkNumber] = useState(1);
    
    // Toggle state for pricing visibility
    const [showPricing, setShowPricing] = useState(false);
    
    // Alert / Toast state
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Show temporary toast notification
    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Filter products based on selected parameters
    const filteredProducts = useMemo(() => {
        return PRODUCTS.filter(p => {
            if (selection.productCategory === 'sun-tunnel') {
                return ['twr', 'twf', 'tcr'].includes(p.id);
            }
            if (selection.productCategory === 'skylight') {
                return !['twr', 'twf', 'tcr'].includes(p.id);
            }
            return true;
        });
    }, [selection.productCategory]);

    // Available products after roof pitch selection
    const stepFilteredProducts = useMemo(() => {
        return filteredProducts.filter(p => {
            if (!selection.roofPitch) return true;
            if (selection.roofPitch === 'flat') {
                return p.roofType.includes('flat');
            } else {
                return p.roofType.includes('pitched');
            }
        });
    }, [filteredProducts, selection.roofPitch]);

    // Available opening types based on current filters
    const availableOpeningTypes = useMemo(() => {
        const types = new Set<string>();
        stepFilteredProducts.forEach(p => {
            types.add(p.openingType);
        });
        return Array.from(types);
    }, [stepFilteredProducts]);

    // Final list of products available for size selection
    const finalProductsList = useMemo(() => {
        return stepFilteredProducts.filter(p => {
            if (selection.openingType && p.openingType !== selection.openingType) {
                return false;
            }
            return true;
        });
    }, [stepFilteredProducts, selection.openingType]);

    // Sizes source for the selected product
    const availableSizes = useMemo(() => {
        if (!selection.selectedProduct) return [];
        const prod = selection.selectedProduct;
        
        if (selection.productCategory === 'sun-tunnel') {
            if (prod.id === 'twf') {
                return [{ code: '0K14', width: 350, height: 1200, label: '350 x 1200' }];
            }
            if (prod.id === 'twr') {
                return [{ code: '0K14', width: 350, height: 1700, label: '350 x 1700' }];
            }
            if (prod.id === 'tcr') {
                return [{ code: '014', width: 350, height: 1150, label: '350 x 1150' }];
            }
            return [];
        }

        const isFlat = prod.roofType.includes('flat') && !prod.roofType.includes('pitched');
        const isWindow = prod.id.startsWith('ggu') || (selection.productCategory as string) === 'roof-window';

        const sourceList = isWindow 
            ? ROOF_WINDOW_SIZES 
            : (isFlat ? FLAT_SIZES : PITCHED_SIZES);

        return sourceList.filter(s => prod.compatibleSizes.includes(s.code));
    }, [selection.selectedProduct, selection.productCategory]);

    // Selected size details
    const selectedSizeDetails = useMemo(() => {
        if (!selection.sizeCode || !selection.selectedProduct) return null;
        const prod = selection.selectedProduct;
        
        if (selection.productCategory === 'sun-tunnel') {
            if (prod.id === 'twf') {
                return { code: '0K14', width: 350, height: 1200, label: '350 x 1200' };
            }
            if (prod.id === 'twr') {
                return { code: '0K14', width: 350, height: 1700, label: '350 x 1700' };
            }
            if (prod.id === 'tcr') {
                return { code: '014', width: 350, height: 1150, label: '350 x 1150' };
            }
            return null;
        }

        const isFlat = prod.roofType.includes('flat') && !prod.roofType.includes('pitched');
        const isWindow = prod.id.startsWith('ggu') || (selection.productCategory as string) === 'roof-window';
        const sourceList = isWindow ? ROOF_WINDOW_SIZES : (isFlat ? FLAT_SIZES : PITCHED_SIZES);
        return sourceList.find(s => s.code === selection.sizeCode) || null;
    }, [selection.sizeCode, selection.selectedProduct, selection.productCategory]);

    // Calculated fields
    const calculatedPrice = useMemo(() => {
        const sizeCode = selection.sizeCode;
        if (!selection.selectedProduct || !sizeCode) return 0;
        let basePrice = selection.selectedProduct.prices[sizeCode] || 0;

        // Flashing price
        if (selection.productCategory !== 'sun-tunnel' && selection.roofPitch !== 'flat') {
            const flashingPrice = FLASHINGS[0]?.prices[sizeCode] || 0;
            basePrice += flashingPrice;
        }

        // Blind price
        if (selection.selectedBlind) {
            const blind = BLINDS.find(b => b.id === selection.selectedBlind);
            if (blind) {
                basePrice += (blind.prices[sizeCode] || 0);
            }
        }

        // Insect Screen price
        if (selection.selectedInsectScreen) {
            const zil = BLINDS.find(b => b.id === 'zil');
            if (zil && sizeCode) {
                basePrice += (zil.prices[sizeCode] || 0);
            }
        }

        // Accessories price
        selection.selectedAccessories.forEach(accId => {
            const acc = ACCESSORIES.find(a => a.id === accId);
            if (acc) {
                basePrice += ((acc.prices as unknown as Record<string, number>)[sizeCode] || 0);
            }
        });

        return basePrice;
    }, [selection.selectedProduct, selection.sizeCode, selection.selectedBlind, selection.selectedInsectScreen, selection.selectedAccessories, selection.productCategory, selection.roofPitch]);

    // Add configured item to schedule
    const handleAddToSchedule = () => {
        if (!selection.selectedProduct || !selection.sizeCode || !selectedSizeDetails) return;

        const prod = selection.selectedProduct;
        const size = selectedSizeDetails;

        const accessoryLabels: string[] = [];
        if (selection.selectedBlind) {
            const blindObj = BLINDS.find(b => b.id === selection.selectedBlind);
            if (blindObj) accessoryLabels.push(`${blindObj.name} Blind`);
        }
        if (selection.selectedInsectScreen) {
            accessoryLabels.push("ZIL Insect Screen");
        }
        selection.selectedAccessories.forEach(accId => {
            const accObj = ACCESSORIES.find(a => a.id === accId);
            if (accObj) accessoryLabels.push(accObj.name);
        });

        const glazingType = selection.productCategory === 'sun-tunnel' 
            ? 'Acrylic/Polycarbonate dome' 
            : (prod.id === 'ggu_0066' ? 'High Performance Triple Glazing' : 'High Performance Double Glazing (Clean, Quiet, Safe Laminated)');

        const newItem: ScheduleItem = {
            id: `item-${Date.now()}`,
            mark: `SK-${String(nextMarkNumber).padStart(2, '0')}`,
            product: prod,
            sizeCode: selection.sizeCode,
            width: size.width,
            height: size.height,
            openingType: prod.openingType.charAt(0).toUpperCase() + prod.openingType.slice(1),
            glazing: glazingType,
            uValue: prod.uValue || 2.6,
            shgc: prod.shgc || 0.24,
            rw: prod.rw || 32,
            vlt: prod.vlt || 0.52,
            balRating: prod.balRating || 'BAL-40',
            accessories: accessoryLabels,
            qty: 1,
            notes: 'Provide standard flashing compatible with roof type.',
            price: calculatedPrice
        };

        setSchedule([...schedule, newItem]);
        setNextMarkNumber(nextMarkNumber + 1);
        triggerToast(`Added ${newItem.mark} (${prod.model} ${size.code}) to schedule!`);
    };

    // Remove item from schedule
    const handleRemoveFromSchedule = (id: string) => {
        setSchedule(schedule.filter(item => item.id !== id));
    };

    // Update quantity of scheduled item
    const handleUpdateQty = (id: string, qty: number) => {
        if (qty < 1) return;
        setSchedule(schedule.map(item => item.id === id ? { ...item, qty } : item));
    };

    // Update custom notes of scheduled item
    const handleUpdateNotes = (id: string, notes: string) => {
        setSchedule(schedule.map(item => item.id === id ? { ...item, notes } : item));
    };

    // Update mark name (e.g. SK-01)
    const handleUpdateMark = (id: string, mark: string) => {
        setSchedule(schedule.map(item => item.id === id ? { ...item, mark } : item));
    };

    // Reset configuration wizard
    const handleReset = () => {
        setSelection({
            productCategory: null,
            roofPitch: null,
            roofMaterial: null,
            openingType: null,
            sizeCode: null,
            selectedProduct: null,
            selectedBlind: null,
            selectedInsectScreen: false,
            selectedAccessories: [],
        });
    };

    // Export Schedule to CSV
    const exportCSV = () => {
        if (schedule.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Mark,Model,Description,Size Code,Width (mm),Height (mm),Daylight Area (sqm),Glazing,R-Value,SHGC,Rw (Acoustic),BAL Rating,Accessories,Quantity,Notes";
        if (showPricing) csvContent += ",Unit Price (RRP) (inc. gst),Total Price (RRP) (inc. gst)";
        csvContent += "\n";

        schedule.forEach(item => {
            const dlArea = item.product.daylightArea?.[item.sizeCode] || 0;
            const accessoriesStr = item.accessories.join(" | ");
            
            let row = `"${item.mark}","${item.product.model}","${item.product.name}","${item.sizeCode}",${item.width},${item.height},${dlArea},"${item.glazing}",${item.uValue},${item.shgc},${item.rw},"${item.balRating}","${accessoriesStr}",${item.qty},"${item.notes.replace(/"/g, '""')}"`;
            if (showPricing) row += `,${item.price},${item.price * item.qty}`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "VELUX_NZ_Skylight_Schedule.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerToast("Downloaded Skylight Schedule CSV!");
    };

    // Copy Schedule to clipboard in Markdown table format
    const copyMarkdown = () => {
        if (schedule.length === 0) return;

        let md = `| Mark | Model | Size Code | Dimensions (WxH) | Daylight Area | Glazing Spec | R-Value | SHGC | Rw | BAL | Accessories | Qty | Notes |`;
        if (showPricing) md += ` Unit Price | Total Price |`;
        md += `\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |`;
        if (showPricing) md += ` --- | --- |`;
        md += `\n`;

        schedule.forEach(item => {
            const dlArea = item.product.daylightArea?.[item.sizeCode] || 0;
            const accs = item.accessories.length > 0 ? item.accessories.join(", ") : "None";
            let row = `| **${item.mark}** | ${item.product.model} | ${item.sizeCode} | ${item.width} x ${item.height} mm | ${dlArea} m² | ${item.glazing} | ${item.uValue} | ${item.shgc} | ${item.rw} dB | ${item.balRating} | ${accs} | ${item.qty} | ${item.notes} |`;
            if (showPricing) row += ` $${item.price.toFixed(2)} | $${(item.price * item.qty).toFixed(2)} |`;
            md += row + "\n";
        });

        navigator.clipboard.writeText(md).then(() => {
            triggerToast("Copied Markdown Schedule to clipboard!");
        });
    };

    // Print styled document
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-6 mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <a href="https://www.velux.co.nz" target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
                            <img src="/velux logo.svg" alt="VELUX New Zealand" className="h-10 object-contain" />
                        </a>
                        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Skylight SpecTool (NZ)</h1>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Technical specification & schedule builder for architects, engineers, and specifiers in New Zealand.
                    </p>
                </div>
                
                <div className="flex flex-col gap-2 items-end self-start md:self-auto">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowPricing(!showPricing)}
                            className="flex items-center gap-2 text-xs"
                        >
                            {showPricing ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showPricing ? "Hide Pricing" : "Show Indicative RRP"}
                        </Button>
                        <a 
                            href="https://resources.velux.co.nz/architectural-drawings" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-md text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                        >
                            <Download size={14} className="mr-2" />
                            CAD/BIM Portal
                        </a>
                    </div>
                    <div className="flex items-center gap-3">
                        <a 
                            href="/CodeMark Skylights.pdf" 
                            download="CodeMark Skylights.pdf"
                            className="inline-flex items-center justify-center rounded-md text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                        >
                            <Download size={14} className="mr-2" />
                            Skylight CodeMark
                        </a>
                        <a 
                            href="/CodeMark Roof Windows.pdf" 
                            download="CodeMark Roof Windows.pdf"
                            className="inline-flex items-center justify-center rounded-md text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                        >
                            <Download size={14} className="mr-2" />
                            Roof Window CodeMark
                        </a>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-neutral-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium"
                    >
                        <Info size={16} className="text-primary" />
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* View Switcher Tabs */}
            <div className="flex border-b mb-8 border-border">
                <button
                    onClick={() => setActiveTab('configure')}
                    className={`pb-4 px-6 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'configure' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Sliders size={16} />
                    1. CONFIGURE SPECIFICATION
                </button>
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`pb-4 px-6 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'schedule' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <FileSpreadsheet size={16} />
                    2. PROJECT SCHEDULE ({schedule.length})
                </button>
            </div>

            {/* TAB CONTENT: 1. CONFIGURE */}
            {activeTab === 'configure' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Panel: Configuration Options (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Step 1: Product Category */}
                        <Card className="border border-border shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                    <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 font-bold border">1</span>
                                    Product Category
                                </CardTitle>
                                <CardDescription>Select the architectural system category</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { id: 'skylight', title: 'Skylight Systems', desc: 'Double-glazed Pitched / Flat Solutions (Includes Roof Windows)', icon: <img src="/skylight-icon.png" alt="Skylight" className="w-10 h-10 object-contain" /> },
                                    { id: 'sun-tunnel', title: 'Sun Tunnels', desc: 'Light transmission tubing structures.', icon: <img src="/sun-tunnel-icon.png" alt="Sun Tunnel" className="w-10 h-10 object-contain" /> },
                                ].map((cat) => {
                                    const isSelected = selection.productCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setSelection({
                                                    ...selection,
                                                    productCategory: cat.id as any,
                                                    roofPitch: null,
                                                    openingType: null,
                                                    sizeCode: null,
                                                    selectedProduct: null
                                                });
                                            }}
                                            className={`p-5 rounded-xl border text-center flex flex-col items-center justify-start transition-all min-h-[170px] hover:shadow-sm ${
                                                isSelected 
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                                    : 'border-border bg-card hover:border-neutral-400'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-lg h-10 flex items-center justify-center ${isSelected ? 'text-primary' : 'text-neutral-400'}`}>
                                                {cat.icon}
                                            </div>
                                            <div className="mt-4">
                                                <h3 className="font-bold text-sm text-foreground">{cat.title}</h3>
                                                <p className="text-xs text-muted-foreground mt-1 leading-normal">{cat.desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* Step 2: Roof Pitch Constraints */}
                        {selection.productCategory && (
                            <Card className="border border-border shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                        <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 font-bold border">2</span>
                                        Roof Pitch & Placement
                                    </CardTitle>
                                    <CardDescription>Define the roof structure slope angle</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { 
                                            id: 'pitched', 
                                            title: 'Pitched Roof Slope', 
                                            desc: '15° - 90° pitch installation. Inboard drainage flashing required.',
                                            icon: (
                                                <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className={selection.roofPitch === 'pitched' ? 'stroke-primary' : 'stroke-neutral-400'}>
                                                    <path d="M4 20L18 6L30 20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )
                                        },
                                        { 
                                            id: 'flat', 
                                            title: 'Flat Roof Slope', 
                                            desc: '0° - 60° slope angle. Curb-mount systems or FCM framing required.',
                                            icon: (
                                                <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className={selection.roofPitch === 'flat' ? 'stroke-primary' : 'stroke-neutral-400'}>
                                                    <path d="M4 14H28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )
                                        },
                                    ].map((pitch) => {
                                        const disabled = false;
                                        const isSelected = selection.roofPitch === pitch.id;
                                        
                                        return (
                                            <button
                                                key={pitch.id}
                                                disabled={disabled}
                                                onClick={() => {
                                                    setSelection({
                                                        ...selection,
                                                        roofPitch: pitch.id as any,
                                                        openingType: null,
                                                        sizeCode: null,
                                                        selectedProduct: null
                                                    });
                                                }}
                                                className={`p-5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[130px] hover:shadow-sm ${
                                                    disabled ? 'opacity-40 cursor-not-allowed bg-neutral-50' : ''
                                                } ${
                                                    isSelected 
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                                        : 'border-border bg-card hover:border-neutral-400'
                                                }`}
                                            >
                                                <div>{pitch.icon}</div>
                                                <div className="mt-4">
                                                    <h3 className="font-bold text-sm text-foreground flex items-center justify-between">
                                                        {pitch.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-1 leading-normal">{pitch.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 3: Ventilation / Operation Mode */}
                        {selection.roofPitch && (
                            <Card className="border border-border shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                        <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 font-bold border">3</span>
                                        Ventilation / Operation Preference
                                    </CardTitle>
                                    <CardDescription>Determine mechanical venting or fixed daylighting</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { id: 'fixed', title: 'Fixed', desc: 'Non-opening' },
                                        { id: 'manual', title: 'Manual', desc: <>Winder handle<br />(Max 4m height from floor)</> },
                                        { id: 'electric', title: 'Electric', desc: '240V mains integration' },
                                        { id: 'solar', title: 'Solar-Powered', desc: 'Battery backup + remote' }
                                    ].map((op) => {
                                        const isAvailable = availableOpeningTypes.includes(op.id);
                                        const isSelected = selection.openingType === op.id;

                                        return (
                                            <button
                                                key={op.id}
                                                disabled={!isAvailable}
                                                onClick={() => {
                                                    const prod = (selection.productCategory === 'sun-tunnel' || (selection.roofPitch === 'pitched' && op.id === 'manual'))
                                                        ? null
                                                        : (finalProductsList.find(p => p.openingType === op.id) || null);
                                                    setSelection({
                                                        ...selection,
                                                        openingType: op.id as any,
                                                        selectedProduct: prod,
                                                        sizeCode: null
                                                    });
                                                }}
                                                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[100px] ${
                                                    !isAvailable ? 'opacity-30 cursor-not-allowed bg-neutral-50 border-neutral-100' : ''
                                                } ${
                                                    isSelected 
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                                        : 'border-border bg-card hover:border-neutral-400'
                                                }`}
                                            >
                                                <div className="font-bold text-xs tracking-wider uppercase">{op.title}</div>
                                                <div className="text-[10px] text-muted-foreground leading-normal mt-1">{op.desc}</div>
                                            </button>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 4: System Size Codes */}
                        {selection.openingType && (selection.selectedProduct || selection.productCategory === 'sun-tunnel' || (selection.roofPitch === 'pitched' && selection.openingType === 'manual')) && (
                            <Card className="border border-border shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                        <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 font-bold border">4</span>
                                        {selection.productCategory === 'sun-tunnel' ? 'Sun Tunnel Model Selection' : 'Standard Sizing Selection'}
                                    </CardTitle>
                                    <CardDescription>
                                        {selection.productCategory === 'sun-tunnel' 
                                            ? 'Select a rigid or flexible Sun Tunnel model' 
                                            : 'Select a standard factory-manufactured trim-opening size'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {selection.productCategory === 'sun-tunnel' ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {[
                                                { id: 'twr', code: 'TWR', name: 'Rigid Sun Tunnel', dims: '350 × 1700 mm', sizeCode: '0K14' },
                                                { id: 'twf', code: 'TWF', name: 'Flexible Sun Tunnel', dims: '350 × 1200 mm', sizeCode: '0K14' },
                                                { id: 'tcr', code: 'TCR', name: 'Flat Roof Rigid Sun Tunnel', dims: '350 × 1150 mm', sizeCode: '014' }
                                            ].map((st) => {
                                                const prod = PRODUCTS.find(p => p.id === st.id)!;
                                                const isSelected = selection.selectedProduct?.id === st.id;
                                                const dlArea = prod?.daylightArea?.[st.sizeCode] || 0.10;

                                                return (
                                                    <button
                                                        key={st.id}
                                                        onClick={() => {
                                                            setSelection({
                                                                ...selection,
                                                                selectedProduct: prod,
                                                                sizeCode: st.sizeCode
                                                            });
                                                        }}
                                                        className={`p-4 rounded-xl border text-center transition-all flex flex-col justify-center items-center min-h-[110px] ${
                                                            isSelected 
                                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 font-semibold' 
                                                                : 'border-border bg-card hover:border-neutral-400'
                                                        }`}
                                                    >
                                                        <span className="text-base font-black text-foreground">{st.code}</span>
                                                        <span className="text-xs font-semibold text-neutral-700 mt-0.5">{st.name}</span>
                                                        <span className="text-[11px] text-muted-foreground mt-1">{st.dims}</span>
                                                        {dlArea > 0 && (
                                                            <span className="text-[9px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full mt-2 font-medium tracking-wide">
                                                                {dlArea.toFixed(2)}m² Light
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : selection.roofPitch === 'pitched' && selection.openingType === 'manual' ? (
                                        <div className="space-y-6">
                                            {/* Double Glazed Roof Windows */}
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                                    <span>Double Glazed Roof Windows (GGU 0076 Centre-Pivot)</span>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                                    {[
                                                        { prodId: 'ggu_0076', model: 'GGU 0076', code: 'CK02', label: '550 × 780' },
                                                        { prodId: 'ggu_0076', model: 'GGU 0076', code: 'CK04', label: '550 × 980' },
                                                        { prodId: 'ggu_0076', model: 'GGU 0076', code: 'MK04', label: '780 × 980' },
                                                        { prodId: 'ggu_0076', model: 'GGU 0076', code: 'MK06', label: '780 × 1180' },
                                                        { prodId: 'ggu_0076', model: 'GGU 0076', code: 'MK08', label: '780 × 1400' },
                                                        { prodId: 'ggu_0076', model: 'GGU 0076', code: 'SK06', label: '1140 × 1180' },
                                                        { prodId: 'ggu_0076', model: 'GGU 0076', code: 'SK08', label: '1140 × 1400' },
                                                    ].map((item) => {
                                                        const prod = PRODUCTS.find(p => p.id === item.prodId)!;
                                                        const isSelected = selection.selectedProduct?.id === item.prodId && selection.sizeCode === item.code;
                                                        const dlArea = prod?.daylightArea?.[item.code] || 0;

                                                        return (
                                                            <button
                                                                key={`${item.model}-${item.code}`}
                                                                onClick={() => {
                                                                    setSelection({
                                                                        ...selection,
                                                                        selectedProduct: prod,
                                                                        sizeCode: item.code
                                                                    });
                                                                }}
                                                                className={`p-3 rounded-lg border text-center transition-all flex flex-col justify-center items-center ${
                                                                    isSelected 
                                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 font-semibold' 
                                                                        : 'border-border bg-card hover:border-neutral-400'
                                                                }`}
                                                            >
                                                                <span className="text-xs font-black text-foreground">{item.code}</span>
                                                                <span className="text-[11px] text-muted-foreground mt-0.5">{item.label} mm</span>
                                                                {dlArea > 0 && (
                                                                    <span className="text-[9px] bg-neutral-100 text-neutral-500 px-1 py-0.5 rounded-full mt-1.5 font-medium tracking-wide">
                                                                        {dlArea.toFixed(2)}m² Light
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Triple Glazed Roof Windows */}
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                                    <span>Triple Glazed Roof Windows (GGU 0066 Centre-Pivot)</span>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                                    {[
                                                        { prodId: 'ggu_0066', model: 'GGU 0066', code: 'CK04', label: '550 × 980' },
                                                        { prodId: 'ggu_0066', model: 'GGU 0066', code: 'MK04', label: '780 × 980' },
                                                        { prodId: 'ggu_0066', model: 'GGU 0066', code: 'MK08', label: '780 × 1400' },
                                                        { prodId: 'ggu_0066', model: 'GGU 0066', code: 'SK06', label: '1140 × 1180' },
                                                    ].map((item) => {
                                                        const prod = PRODUCTS.find(p => p.id === item.prodId)!;
                                                        const isSelected = selection.selectedProduct?.id === item.prodId && selection.sizeCode === item.code;
                                                        const dlArea = prod?.daylightArea?.[item.code] || 0;

                                                        return (
                                                            <button
                                                                key={`${item.model}-${item.code}`}
                                                                onClick={() => {
                                                                    setSelection({
                                                                        ...selection,
                                                                        selectedProduct: prod,
                                                                        sizeCode: item.code
                                                                    });
                                                                }}
                                                                className={`p-3 rounded-lg border text-center transition-all flex flex-col justify-center items-center ${
                                                                    isSelected 
                                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 font-semibold' 
                                                                        : 'border-border bg-card hover:border-neutral-400'
                                                                }`}
                                                            >
                                                                <span className="text-xs font-black text-foreground">{item.code}</span>
                                                                <span className="text-[11px] text-muted-foreground mt-0.5">{item.label} mm</span>
                                                                {dlArea > 0 && (
                                                                    <span className="text-[9px] bg-neutral-100 text-neutral-500 px-1 py-0.5 rounded-full mt-1.5 font-medium tracking-wide">
                                                                        {dlArea.toFixed(2)}m² Light
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                                    <span>Skylight Models (VS Manual Opening)</span>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                                    {[
                                                        { prodId: 'vs', model: 'VS', code: 'C04', label: '550 × 980' },
                                                        { prodId: 'vs', model: 'VS', code: 'C08', label: '550 × 1400' },
                                                        { prodId: 'vs', model: 'VS', code: 'M02', label: '780 × 780' },
                                                        { prodId: 'vs', model: 'VS', code: 'M04', label: '780 × 980' },
                                                        { prodId: 'vs', model: 'VS', code: 'M06', label: '780 × 1180' },
                                                        { prodId: 'vs', model: 'VS', code: 'M08', label: '780 × 1400' },
                                                        { prodId: 'vs', model: 'VS', code: 'S01', label: '1140 × 700' },
                                                        { prodId: 'vs', model: 'VS', code: 'S06', label: '1140 × 1180' },
                                                    ].map((item) => {
                                                        const prod = PRODUCTS.find(p => p.id === item.prodId)!;
                                                        const isSelected = selection.selectedProduct?.id === item.prodId && selection.sizeCode === item.code;
                                                        const dlArea = prod?.daylightArea?.[item.code] || 0;

                                                        return (
                                                            <button
                                                                key={`${item.model}-${item.code}`}
                                                                onClick={() => {
                                                                    setSelection({
                                                                        ...selection,
                                                                        selectedProduct: prod,
                                                                        sizeCode: item.code
                                                                    });
                                                                }}
                                                                className={`p-3 rounded-lg border text-center transition-all flex flex-col justify-center items-center ${
                                                                    isSelected 
                                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 font-semibold' 
                                                                        : 'border-border bg-card hover:border-neutral-400'
                                                                }`}
                                                            >
                                                                <span className="text-xs font-black text-foreground">{item.code}</span>
                                                                <span className="text-[11px] text-muted-foreground mt-0.5">{item.label} mm</span>
                                                                {dlArea > 0 && (
                                                                    <span className="text-[9px] bg-neutral-100 text-neutral-500 px-1 py-0.5 rounded-full mt-1.5 font-medium tracking-wide">
                                                                        {dlArea.toFixed(2)}m² Light
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {availableSizes.map((sz) => {
                                                const isSelected = selection.sizeCode === sz.code;
                                                const dlArea = selection.selectedProduct?.daylightArea?.[sz.code] || 0;
                                                
                                                return (
                                                    <button
                                                        key={sz.code}
                                                        onClick={() => {
                                                            setSelection({
                                                                ...selection,
                                                                sizeCode: sz.code
                                                            });
                                                        }}
                                                        className={`p-3 rounded-lg border text-center transition-all flex flex-col justify-center items-center ${
                                                            isSelected 
                                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 font-semibold' 
                                                                : 'border-border bg-card hover:border-neutral-400'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-black text-foreground">{sz.code}</span>
                                                        <span className="text-[11px] text-muted-foreground mt-0.5">{sz.label} mm</span>
                                                        {dlArea > 0 && (
                                                            <span className="text-[9px] bg-neutral-100 text-neutral-500 px-1 py-0.5 rounded-full mt-1.5 font-medium tracking-wide">
                                                                {dlArea.toFixed(2)}m² Light
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 5: High-Performance Add-ons */}
                        {selection.sizeCode && selection.selectedProduct && selection.productCategory !== 'sun-tunnel' && (
                            <Card className="border border-border shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                        <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 font-bold border">5</span>
                                        Specification Add-ons (Performance Options)
                                    </CardTitle>
                                    <CardDescription>Select factory integrations and installation layers</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Blinds selection */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">INTEGRATED LIGHT SHIELD / BLINDS</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {/* None Option */}
                                            <button
                                                onClick={() => {
                                                    let newAccessories = [...selection.selectedAccessories];
                                                    if (selection.selectedProduct?.model === 'FCM') {
                                                        newAccessories = newAccessories.filter(a => a !== 'zzz199');
                                                    }
                                                    setSelection({ ...selection, selectedBlind: null, selectedAccessories: newAccessories });
                                                }}
                                                className={`p-3.5 rounded-lg border text-left transition-all ${
                                                    selection.selectedBlind === null 
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                                        : 'border-border bg-card hover:border-neutral-400'
                                                }`}
                                            >
                                                <h4 className="font-bold text-xs">No Shade Integrated</h4>
                                                <p className="text-[10px] text-muted-foreground mt-1 leading-normal">Maximize daylight penetration.</p>
                                            </button>
                                            
                                            {BLINDS.filter(b => b.id !== 'zil' && b.compatibleModels.includes(selection.selectedProduct!.model) && b.prices[selection.sizeCode!] !== undefined).map(blind => {
                                                const isSelected = selection.selectedBlind === blind.id;
                                                return (
                                                    <button
                                                        key={blind.id}
                                                        onClick={() => {
                                                            const newAccessories = [...selection.selectedAccessories];
                                                            if (selection.selectedProduct?.model === 'FCM' && !newAccessories.includes('zzz199')) {
                                                                newAccessories.push('zzz199');
                                                            }
                                                            setSelection({ ...selection, selectedBlind: blind.id, selectedAccessories: newAccessories });
                                                        }}
                                                        className={`p-3.5 rounded-lg border text-left transition-all ${
                                                            isSelected 
                                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                                                : 'border-border bg-card hover:border-neutral-400'
                                                        }`}
                                                    >
                                                        <h4 className="font-bold text-xs">{blind.name} {blind.subtitle}</h4>
                                                        <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                                                            {blind.type === 'darkening' ? 'Honeycomb cell blocks 99% light.' : 'Filters glaring light.'}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Accessory check boxes */}
                                    {ACCESSORIES.filter(a => a.compatibleModels.includes(selection.selectedProduct!.model) && (a.prices as unknown as Record<string, number>)[selection.sizeCode!] !== undefined).length > 0 && (
                                        <div className="border-t pt-4 border-dashed border-border space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Required Installation Hardware</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {ACCESSORIES.filter(a => a.compatibleModels.includes(selection.selectedProduct!.model) && (a.prices as unknown as Record<string, number>)[selection.sizeCode!] !== undefined).map(acc => {
                                                    const isChecked = selection.selectedAccessories.includes(acc.id);
                                                    return (
                                                        <button
                                                            key={acc.id}
                                                            onClick={() => {
                                                                const updated = isChecked
                                                                    ? selection.selectedAccessories.filter(id => id !== acc.id)
                                                                    : [...selection.selectedAccessories, acc.id];
                                                                setSelection({ ...selection, selectedAccessories: updated });
                                                            }}
                                                            className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                                                                isChecked 
                                                                    ? 'border-primary bg-primary/5' 
                                                                    : 'border-border bg-card hover:border-neutral-400'
                                                            }`}
                                                        >
                                                            <div>
                                                                <h4 className="font-bold text-xs">{acc.name}</h4>
                                                                <p className="text-[9px] text-muted-foreground mt-0.5">Mandatory structural accessory.</p>
                                                            </div>
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                                                                isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-neutral-300 bg-white'
                                                            }`}>
                                                                {isChecked && <Check size={10} strokeWidth={4} />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Panel: Technical Specifications Summary (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {selection.selectedProduct && selection.sizeCode && selectedSizeDetails ? (
                            <div className="sticky top-6 space-y-6">
                                <Card className="border border-primary/20 shadow-md bg-white">
                                    <div className="bg-neutral-900 text-white p-5 rounded-t-lg">
                                        <div className="text-[10px] bg-primary text-primary-foreground font-black tracking-widest px-2 py-0.5 rounded inline-block uppercase">Specification Sheet</div>
                                        <h3 className="text-xl font-bold mt-2 tracking-tight">{selection.selectedProduct.name}</h3>
                                        <div className="flex justify-between items-center mt-3 text-xs text-neutral-300">
                                            <span>Model: <strong className="text-white">{selection.selectedProduct.model}</strong></span>
                                            <span>Size: <strong className="text-white">{selection.sizeCode}</strong></span>
                                        </div>
                                    </div>
                                    <CardContent className="p-5 space-y-5">
                                        {/* Technical CAD SVG Schematic */}
                                        <div className="bg-neutral-50 rounded-lg p-4 border flex items-center justify-center relative overflow-hidden h-[180px]">
                                            <div className="absolute top-2 left-2 text-[8px] bg-neutral-200 text-neutral-500 px-1 rounded uppercase tracking-wider font-bold">Profile Section</div>
                                            {(() => {
                                                const isTriple = selection.selectedProduct?.id === 'ggu_0066' || selection.selectedProduct?.name?.toLowerCase().includes('triple');
                                                return (
                                                    <svg width="220" height="130" viewBox="0 0 220 130" className="w-full h-full max-w-[220px]">
                                                        {/* Left structural support */}
                                                        <rect x="10" y="30" width="30" height="80" rx="3" fill="#E5E5E5" stroke="#A3A3A3" strokeWidth="1.5" />
                                                        {/* Right structural support */}
                                                        <rect x="180" y="30" width="30" height="80" rx="3" fill="#E5E5E5" stroke="#A3A3A3" strokeWidth="1.5" />
                                                        
                                                        {isTriple ? (
                                                            <>
                                                                {/* Triple glazing panes */}
                                                                <line x1="40" y1="52" x2="180" y2="52" stroke="#38BDF8" strokeWidth="2.5" />
                                                                <line x1="40" y1="56" x2="180" y2="56" stroke="#E0F2FE" strokeWidth="3" strokeDasharray="2 3" />
                                                                <line x1="40" y1="60" x2="180" y2="60" stroke="#0284C7" strokeWidth="2.5" />
                                                                <line x1="40" y1="64" x2="180" y2="64" stroke="#E0F2FE" strokeWidth="3" strokeDasharray="2 3" />
                                                                <line x1="40" y1="68" x2="180" y2="68" stroke="#0369A1" strokeWidth="2.5" />

                                                                <rect x="38" y="48" width="4" height="24" rx="1" fill="#171717" />
                                                                <rect x="178" y="48" width="4" height="24" rx="1" fill="#171717" />
                                                                <text x="110" y="43" textAnchor="middle" fontSize="8" fill="#737373" fontFamily="sans-serif">Triple-Glazed Gas Cavities</text>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* Double glazing panes */}
                                                                <line x1="40" y1="55" x2="180" y2="55" stroke="#38BDF8" strokeWidth="3" />
                                                                <line x1="40" y1="61" x2="180" y2="61" stroke="#E0F2FE" strokeWidth="4" strokeDasharray="2 3" />
                                                                <line x1="40" y1="67" x2="180" y2="67" stroke="#0284C7" strokeWidth="3" />

                                                                <rect x="38" y="50" width="4" height="22" rx="1" fill="#171717" />
                                                                <rect x="178" y="50" width="4" height="22" rx="1" fill="#171717" />
                                                                <text x="110" y="45" textAnchor="middle" fontSize="8" fill="#737373" fontFamily="sans-serif">Double-Glazed Gas Cavity</text>
                                                            </>
                                                        )}
                                                        
                                                        {/* Frame / Gaskets */}
                                                        <path d="M4 110 H216" stroke="#404040" strokeWidth="2.5" />
                                                        
                                                        {/* Labels */}
                                                        <text x="110" y="85" textAnchor="middle" fontSize="9" fill="#DA251D" fontWeight="bold" fontFamily="sans-serif">
                                                            {selectedSizeDetails.width} × {selectedSizeDetails.height} mm
                                                        </text>
                                                    </svg>
                                                );
                                            })()}
                                        </div>

                                        {/* Physical Specifications */}
                                        <div className="space-y-2 text-xs">
                                            <div className="text-neutral-500 font-bold uppercase tracking-wider text-[10px] pb-1 border-b">Performance Matrix</div>
                                            
                                            <div className="flex justify-between py-1 border-b border-neutral-100">
                                                <span className="text-neutral-500 flex items-center gap-1">R-Value (Total System) <span title="Thermal Heat Transfer Coefficient (lower is better)"><Info size={10} className="text-neutral-400" /></span></span>
                                                <span className="font-bold text-foreground">{selection.selectedProduct.uValue} W/m²K</span>
                                            </div>
                                            
                                            <div className="flex justify-between py-1 border-b border-neutral-100">
                                                <span className="text-neutral-500 flex items-center gap-1">Solar Heat Gain (SHGC) <span title="Fraction of solar radiation admitted (lower limits solar gain)"><Info size={10} className="text-neutral-400" /></span></span>
                                                <span className="font-bold text-foreground">{selection.selectedProduct.shgc}</span>
                                            </div>

                                            <div className="flex justify-between py-1 border-b border-neutral-100">
                                                <span className="text-neutral-500 flex items-center gap-1">Acoustic Reduction (Rw) <span title="Weighted sound reduction index (higher means more noise blocking)"><Info size={10} className="text-neutral-400" /></span></span>
                                                <span className="font-bold text-foreground">{selection.selectedProduct.rw} dB</span>
                                            </div>

                                            <div className="flex justify-between py-1 border-b border-neutral-100">
                                                <span className="text-neutral-500">Visible Light (VLT)</span>
                                                <span className="font-bold text-foreground">{((selection.selectedProduct.vlt || 0.52) * 100).toFixed(0)}%</span>
                                            </div>

                                            <div className="flex justify-between py-1 border-b border-neutral-100">
                                                <span className="text-neutral-500">Daylight Area</span>
                                                <span className="font-bold text-foreground">
                                                    {(selection.selectedProduct.daylightArea?.[selection.sizeCode!] || 0).toFixed(2)} m²
                                                </span>
                                            </div>

                                            <div className="flex justify-between py-1 border-b border-neutral-100">
                                                <span className="text-neutral-500">Bushfire Suitability</span>
                                                <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                                    {selection.selectedProduct.balRating} Ready
                                                </span>
                                            </div>

                                            <div className="flex justify-between py-1">
                                                <span className="text-neutral-500">Hail Resistance</span>
                                                <span className="font-bold text-foreground">{selection.selectedProduct.hailResistance}</span>
                                            </div>
                                        </div>

                                        {/* Cost information if visible */}
                                        {showPricing && (
                                            <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-xs flex justify-between items-center">
                                                <span className="font-bold text-primary">Indicative Supply RRP (inc. gst):</span>
                                                <span className="font-extrabold text-sm text-primary">${calculatedPrice.toLocaleString()} NZD</span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 pt-2">
                                            <Button 
                                                onClick={handleAddToSchedule}
                                                className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold h-10"
                                            >
                                                <Plus size={16} />
                                                Add to Project Schedule
                                            </Button>
                                            
                                            <Button 
                                                variant="outline"
                                                onClick={handleReset}
                                                className="w-full text-xs font-semibold h-10 border border-neutral-200"
                                            >
                                                Clear Configuration
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Compliance Badge Footer */}
                                <div className="border border-border rounded-lg p-4 bg-stone-50 space-y-2">
                                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                        <Building2 size={12} />
                                        Code Compliance
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-normal">
                                        VELUX systems specified above are engineered in compliance with New Zealand Building Code standards. Certified for NZ wind & thermal zones when installed with standard flashing kit.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <Card className="border border-neutral-200 border-dashed shadow-none text-center p-8 bg-neutral-50 min-h-[300px] flex flex-col justify-center items-center">
                                <Sliders size={40} className="text-neutral-300 mb-4" strokeWidth={1.5} />
                                <h3 className="font-bold text-sm text-foreground">Select Parameters</h3>
                                <p className="text-xs text-muted-foreground mt-2 max-w-[200px] leading-relaxed">
                                    Follow the steps in the configuration wizard to generate technical specifications.
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 2. PROJECT SCHEDULE */}
            {activeTab === 'schedule' && (
                <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-6 gap-4">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <FileSpreadsheet className="text-neutral-500" />
                                Project Skylight Schedule (NZ)
                            </CardTitle>
                            <CardDescription>Consolidated specification table for construction documentation</CardDescription>
                        </div>
                        
                        {schedule.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={copyMarkdown}
                                    className="flex items-center gap-1.5 text-xs h-9 border-neutral-200"
                                >
                                    <Copy size={13} />
                                    Copy MD Table
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={exportCSV}
                                    className="flex items-center gap-1.5 text-xs h-9 border-neutral-200"
                                >
                                    <FileSpreadsheet size={13} />
                                    Export CSV
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handlePrint}
                                    className="flex items-center gap-1.5 text-xs h-9 border-neutral-200"
                                >
                                    <Printer size={13} />
                                    Print Spec PDF
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {schedule.length > 0 ? (
                            <div className="overflow-x-auto print:overflow-visible">
                                <table className="w-full text-left border-collapse text-xs print:table" id="schedule-table">
                                    <thead>
                                        <tr className="bg-neutral-50 border-b border-border font-bold text-neutral-500 uppercase tracking-wider">
                                            <th className="p-4 w-20">Mark</th>
                                            <th className="p-4 w-28">Model Code</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4">Size (WxH)</th>
                                            <th className="p-4">Light Area</th>
                                            <th className="p-4 max-w-[150px]">Glazing Specification</th>
                                            <th className="p-4 text-center">R / SHGC</th>
                                            <th className="p-4 text-center">Rw (Acoustic)</th>
                                            <th className="p-4">Accessories</th>
                                            {showPricing && <th className="p-4 text-right">Unit Price (NZD)</th>}
                                            <th className="p-4 w-20 text-center">Qty</th>
                                            <th className="p-4 max-w-[200px]">Notes</th>
                                            <th className="p-4 w-12 text-center print:hidden">Remove</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {schedule.map((item) => (
                                            <tr key={item.id} className="hover:bg-neutral-50 transition-colors bg-white print:break-inside-avoid">
                                                {/* Mark (Editable inline) */}
                                                <td className="p-4 font-bold text-foreground">
                                                    <input 
                                                        type="text" 
                                                        value={item.mark}
                                                        onChange={(e) => handleUpdateMark(item.id, e.target.value)}
                                                        className="w-16 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-primary focus:outline-none font-bold py-0.5 print:border-none print:p-0"
                                                    />
                                                </td>
                                                {/* Model */}
                                                <td className="p-4">
                                                    <span className="font-extrabold text-neutral-800">{item.product.model}</span> {item.sizeCode}
                                                </td>
                                                {/* Type */}
                                                <td className="p-4 font-medium text-neutral-600">
                                                    {item.product.name.split(' (')[0]}
                                                </td>
                                                {/* Dimensions */}
                                                <td className="p-4 text-neutral-500 whitespace-nowrap">
                                                    {item.width} × {item.height} mm
                                                </td>
                                                {/* Daylight Area */}
                                                <td className="p-4 text-neutral-500">
                                                    {(item.product.daylightArea?.[item.sizeCode] || 0).toFixed(2)} m²
                                                </td>
                                                {/* Glazing */}
                                                <td className="p-4 text-[10px] text-neutral-500 max-w-[150px] leading-relaxed">
                                                    {item.glazing}
                                                </td>
                                                {/* R / SHGC */}
                                                <td className="p-4 text-center text-neutral-700 whitespace-nowrap">
                                                    {item.uValue} / {item.shgc}
                                                </td>
                                                {/* Acoustic Rw */}
                                                <td className="p-4 text-center text-neutral-700 font-medium">
                                                    {item.rw} dB
                                                </td>
                                                {/* Accessories */}
                                                <td className="p-4 text-[10px] text-neutral-500 max-w-[120px] leading-relaxed">
                                                    {item.accessories.length > 0 ? (
                                                        <ul className="list-disc pl-3 space-y-0.5">
                                                            {item.accessories.map((a, idx) => <li key={idx}>{a}</li>)}
                                                        </ul>
                                                    ) : <span className="text-neutral-300">None</span>}
                                                </td>
                                                {/* Pricing if toggle shown */}
                                                {showPricing && (
                                                    <td className="p-4 text-right font-semibold text-neutral-700 whitespace-nowrap">
                                                        ${item.price.toLocaleString()}
                                                    </td>
                                                )}
                                                {/* Qty (Editable inline) */}
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5 print:hidden">
                                                        <button 
                                                            onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                                                            className="w-5 h-5 rounded border bg-neutral-100 flex items-center justify-center font-bold hover:bg-neutral-200"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-6 text-center font-bold">{item.qty}</span>
                                                        <button 
                                                            onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                                                            className="w-5 h-5 rounded border bg-neutral-100 flex items-center justify-center font-bold hover:bg-neutral-200"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <span className="hidden print:inline font-bold">{item.qty}</span>
                                                </td>
                                                {/* Notes (Editable inline) */}
                                                <td className="p-4 max-w-[200px]">
                                                    <textarea
                                                        value={item.notes}
                                                        onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                                                        className="w-full bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-primary focus:outline-none py-0.5 text-[10px] leading-relaxed resize-y min-h-[40px] print:border-none print:p-0 print:resize-none"
                                                        placeholder="Add project specifications notes..."
                                                    />
                                                </td>
                                                {/* Remove button */}
                                                <td className="p-4 text-center print:hidden">
                                                    <button 
                                                        onClick={() => handleRemoveFromSchedule(item.id)}
                                                        className="text-neutral-400 hover:text-red-500 p-1 rounded hover:bg-neutral-100 transition-colors"
                                                        title="Delete row"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-20 px-4">
                                <FileSpreadsheet size={48} className="text-neutral-300 mx-auto mb-4" strokeWidth={1.5} />
                                <h3 className="font-bold text-sm text-foreground">Schedule is empty</h3>
                                <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                                    Navigate back to the configuration tab, spec your skylights, and click "Add to Project Schedule" to build your sheet.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
