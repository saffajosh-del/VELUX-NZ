import { useState, useMemo } from 'react';
import { PRODUCTS, PITCHED_SIZES, FLAT_SIZES, ROOF_WINDOW_SIZES, FLASHINGS, BLINDS, ACCESSORIES, type Product } from '@/data/products';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Download, FileText, Printer, ShieldCheck, Plus, Trash2, Copy, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface SelectionState {
    productCategory: 'skylight' | 'sun-tunnel' | null;
    roofPitch: 'pitched' | 'flat' | null;
    openingType: 'fixed' | 'manual' | 'electric' | 'solar' | null;
    sizeCode: string | null;
    selectedProduct: Product | null;
    selectedBlind: string | null;
    selectedInsectScreen: boolean;
    selectedAccessories: string[];
}

export interface ScheduleItem {
    id: string;
    mark: string;
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
    const [selection, setSelection] = useState<SelectionState>({
        productCategory: null,
        roofPitch: null,
        openingType: null,
        sizeCode: null,
        selectedProduct: null,
        selectedBlind: null,
        selectedInsectScreen: false,
        selectedAccessories: [],
    });

    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [nextMarkNumber, setNextMarkNumber] = useState(1);
    const [copiedMD, setCopiedMD] = useState(false);
    const [showIncGst] = useState(true);

    // Read customer ID from path if present (e.g. /bunnings)
    const pathParts = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean) : [];
    const customerId = pathParts.length > 0 && pathParts[0] !== 'spectool' ? pathParts[0].toLowerCase() : 'velux';

    const partnerInfo = useMemo(() => {
        switch (customerId) {
            case 'placemakers':
                return { name: 'PlaceMakers', logo: '/placemakers-logo.png', link: 'https://www.placemakers.co.nz' };
            case 'carters':
                return { name: 'Carters', logo: '/carters-logo.png', link: 'https://www.carters.co.nz' };
            case 'bunnings':
            case 'bunningsnz':
                return { name: 'Bunnings NZ', logo: '/bunnings-logo.png', link: 'https://www.bunnings.co.nz' };
            case 'mitre10':
            case 'mitre10nz':
                return { name: 'Mitre 10 NZ', logo: '/mitre10-logo.png', link: 'https://www.mitre10.co.nz' };
            case 'itm':
                return { name: 'ITM', logo: '/itm-logo.png', link: 'https://www.itm.co.nz' };
            default:
                return null;
        }
    }, [customerId]);

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

    const availableOpeningTypes = useMemo(() => {
        const types = new Set<string>();
        stepFilteredProducts.forEach(p => types.add(p.openingType));
        return Array.from(types);
    }, [stepFilteredProducts]);

    const finalProductsList = useMemo(() => {
        if (!selection.openingType) return [];
        return stepFilteredProducts.filter(p => p.openingType === selection.openingType);
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
    };

    const removeItem = (id: string) => {
        setSchedule(schedule.filter(item => item.id !== id));
    };

    const updateQty = (id: string, delta: number) => {
        setSchedule(schedule.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const updateNotes = (id: string, notes: string) => {
        setSchedule(schedule.map(item => item.id === id ? { ...item, notes } : item));
    };

    // Export formats
    const exportCSV = () => {
        const headers = ["Mark", "Model", "Opening", "Width (mm)", "Height (mm)", "Glazing", "R-Value", "SHGC", "Rw (dB)", "VLT", "Accessories", "Qty", "Unit RRP (NZD)", "Total RRP (NZD)", "Notes"];
        const rows = schedule.map(i => [
            i.mark,
            `${i.product.model} ${i.sizeCode}`,
            i.openingType,
            i.width,
            i.height,
            `"${i.glazing}"`,
            i.uValue,
            i.shgc,
            i.rw,
            i.vlt,
            `"${i.accessories.join('; ')}"`,
            i.qty,
            `"$${i.price.toLocaleString()} (inc. gst)"`,
            `"$${(i.price * i.qty).toLocaleString()} (inc. gst)"`,
            `"${i.notes}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `VELUX_NZ_Skylight_Schedule_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyMarkdownTable = () => {
        let md = "| Mark | Model | Size (W x H) | Glazing | R / SHGC | Rw | Accessories | Qty | Unit RRP (NZD) | Notes |\n";
        md += "|---|---|---|---|---|---|---|---|---|---|\n";
        schedule.forEach(i => {
            const accs = i.accessories.length > 0 ? i.accessories.join(', ') : 'None';
            md += `| ${i.mark} | ${i.product.model} ${i.sizeCode} | ${i.width} x ${i.height} mm | ${i.glazing} | ${i.uValue} / ${i.shgc} | ${i.rw} dB | ${accs} | ${i.qty} | $${i.price.toLocaleString()} (inc. gst) | ${i.notes} |\n`;
        });
        navigator.clipboard.writeText(md);
        setCopiedMD(true);
        setTimeout(() => setCopiedMD(false), 2000);
    };

    const exportPDF = async () => {
        const element = document.getElementById('architect-schedule-print-area');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4');
            const imgWidth = 280;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 8, 10, imgWidth, imgHeight);
            pdf.save(`VELUX_NZ_Specification_Schedule_${new Date().toISOString().slice(0,10)}.pdf`);
        } catch (e) {
            console.error("PDF generation failed:", e);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50/50 pb-16 font-sans">
            {/* Top Navigation Header */}
            <header className="border-b bg-card sticky top-0 z-40 shadow-sm backdrop-blur-md bg-card/90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <a href="https://www.velux.co.nz" target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
                            <img src="/velux logo.svg" alt="VELUX New Zealand" className="h-10 w-auto" />
                        </a>
                        {partnerInfo && (
                            <div className="flex items-center gap-3 border-l pl-6 border-neutral-200">
                                <a href={partnerInfo.link} target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
                                    <img src={partnerInfo.logo} alt={partnerInfo.name} className="h-9 w-auto object-contain" />
                                </a>
                            </div>
                        )}
                        <div className="border-l pl-6 border-neutral-200 hidden md:block">
                            <h1 className="font-bold text-base text-foreground tracking-tight flex items-center gap-2">
                                Skylight & Roof Window Specification Builder (NZ)
                                <span className="bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded font-medium border border-neutral-200">Architect Edition</span>
                            </h1>
                            <p className="text-xs text-muted-foreground">Architectural schedule, performance parameters & compliance generator</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Workflow Form Controls */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Step 1: Category */}
                        <Card className="border border-border shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                    <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 font-bold border">1</span>
                                    System Category Selection
                                </CardTitle>
                                <CardDescription>Select the architectural system category</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { id: 'skylight', title: 'Skylight Systems', desc: 'Double/Triple-glazed Pitched & Flat Solutions (Includes Roof Windows)', icon: <img src="/skylight-icon.png" alt="Skylight" className="w-10 h-10 object-contain" /> },
                                    { id: 'sun-tunnel', title: 'Sun Tunnels', desc: 'Light transmission tubing structures.', icon: <img src="/sun-tunnel-icon.png" alt="Sun Tunnel" className="w-10 h-10 object-contain" /> },
                                ].map((cat) => {
                                    const isSelected = selection.productCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelection({
                                                productCategory: cat.id as any,
                                                roofPitch: null,
                                                openingType: null,
                                                sizeCode: null,
                                                selectedProduct: null,
                                                selectedBlind: null,
                                                selectedInsectScreen: false,
                                                selectedAccessories: []
                                            })}
                                            className={`p-5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[140px] hover:shadow-md ${
                                                isSelected 
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm' 
                                                    : 'border-border bg-card hover:border-neutral-400'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">{cat.icon}</div>
                                                {isSelected && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white"><Check className="w-3 h-3 stroke-[3]" /></div>}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base text-foreground">{cat.title}</h3>
                                                <p className="text-xs text-muted-foreground mt-1 leading-normal">{cat.desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* Step 2: Roof Pitch */}
                        {selection.productCategory && (
                            <Card className="border border-border shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                        <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 font-bold border">2</span>
                                        Roof Substrate Pitch
                                    </CardTitle>
                                    <CardDescription>Specify the installation roof slope angle range</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { 
                                            id: 'pitched', 
                                            title: 'Pitched Roof Slope', 
                                            desc: '15° - 90° slope angle. Flashing integration standard.',
                                            icon: (
                                                <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className={selection.roofPitch === 'pitched' ? 'stroke-primary' : 'stroke-neutral-400'}>
                                                    <path d="M4 20L16 6L28 20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
                                                <div className="flex justify-between items-start">
                                                    <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">{pitch.icon}</div>
                                                    {isSelected && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white"><Check className="w-3 h-3 stroke-[3]" /></div>}
                                                </div>
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

                        {/* Step 3: Opening Mechanism */}
                        {selection.roofPitch && selection.productCategory !== 'sun-tunnel' && (
                            <Card className="border border-border shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                        <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 font-bold border">3</span>
                                        Ventilation & Opening Operation
                                    </CardTitle>
                                    <CardDescription>Select natural ventilation operational mode</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { id: 'fixed', label: 'Fixed Non-Opening', sub: 'Inoperable daylighting' },
                                        { id: 'manual', label: 'Manual Vent', sub: 'Winder / Dual-Action (Max 4m height)' },
                                        { id: 'electric', label: 'Mains Powered', sub: '230V electric motor' },
                                        { id: 'solar', label: 'Solar Powered', sub: 'Wireless PV cell & battery' },
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
                                                    !isAvailable ? 'opacity-30 cursor-not-allowed bg-neutral-50' : ''
                                                } ${
                                                    isSelected 
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 font-semibold' 
                                                        : 'border-border bg-card hover:border-neutral-400'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start w-full">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{op.id}</span>
                                                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-xs text-foreground mt-2">{op.label}</h4>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">{op.sub}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 4: System Size Codes */}
                        {(selection.openingType || selection.productCategory === 'sun-tunnel') && (selection.selectedProduct || selection.productCategory === 'sun-tunnel' || (selection.roofPitch === 'pitched' && selection.openingType === 'manual')) && (
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
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                                    <span>Roof Window Models (In-Reach Centre-Pivot GGU)</span>
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
                                                                <span className="text-xs font-black text-foreground">{item.model} {item.code}</span>
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

                                    {/* Insect screen selection for roof windows */}
                                    {(selection.selectedProduct?.id.startsWith('ggu') || (selection.productCategory as string) === 'roof-window') && (
                                        <div className="flex items-center justify-between border-t pt-4 border-dashed border-border">
                                            <div>
                                                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">INSECT SCREEN (ZIL)</h4>
                                                <p className="text-[10px] text-muted-foreground mt-1">Anodized aluminum framing with fibreglass mesh.</p>
                                            </div>
                                            <button
                                                onClick={() => setSelection({ ...selection, selectedInsectScreen: !selection.selectedInsectScreen })}
                                                className={`px-4 py-2 text-xs rounded-lg border font-bold transition-all ${
                                                    selection.selectedInsectScreen 
                                                        ? 'bg-primary text-primary-foreground border-primary' 
                                                        : 'bg-card text-foreground border-border hover:border-neutral-400'
                                                }`}
                                            >
                                                {selection.selectedInsectScreen ? 'Included' : 'Add Insect Screen'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Accessory check boxes */}
                                    {ACCESSORIES.filter(a => a.compatibleModels.includes(selection.selectedProduct!.model) && (a.prices as unknown as Record<string, number>)[selection.sizeCode!] !== undefined).length > 0 && (
                                        <div className="border-t pt-4 border-dashed border-border space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Required Installation Hardware</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {ACCESSORIES.filter(a => a.compatibleModels.includes(selection.selectedProduct!.model) && (a.prices as unknown as Record<string, number>)[selection.sizeCode!] !== undefined).map(acc => {
                                                    const isChecked = selection.selectedAccessories.includes(acc.id);
                                                    return (
                                                        <label key={acc.id} className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                                                            isChecked ? 'border-primary bg-primary/5' : 'border-border hover:border-neutral-300'
                                                        }`}>
                                                            <div>
                                                                <span className="text-xs font-bold text-foreground block">{acc.name}</span>
                                                                {acc.id === 'zzz199' && (
                                                                    <span className="text-[10px] text-muted-foreground block mt-0.5">Mandatory structural accessory.</span>
                                                                )}
                                                            </div>
                                                            <input 
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelection({ ...selection, selectedAccessories: [...selection.selectedAccessories, acc.id] });
                                                                    } else {
                                                                        setSelection({ ...selection, selectedAccessories: selection.selectedAccessories.filter(id => id !== acc.id) });
                                                                    }
                                                                }}
                                                                className="rounded border-neutral-300 text-primary focus:ring-primary h-4 w-4"
                                                            />
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Add to Schedule Action Button */}
                        {selection.selectedProduct && selection.sizeCode && (
                            <Button 
                                onClick={handleAddToSchedule}
                                className="w-full py-6 text-base font-bold shadow-lg flex items-center justify-center gap-2"
                                size="lg"
                            >
                                <Plus className="w-5 h-5" /> Add Configured Unit to Schedule
                            </Button>
                        )}
                    </div>

                    {/* Right Hand Live Preview & Specification Card */}
                    <div className="lg:col-span-5 space-y-6">
                        {selection.selectedProduct && selection.sizeCode && selectedSizeDetails ? (
                            <div className="sticky top-28 space-y-6">
                                <Card className="border border-border shadow-md bg-card overflow-hidden">
                                    <div className="bg-neutral-900 text-white p-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white/80 px-2 py-0.5 rounded">Specification Summary</span>
                                                <h2 className="text-2xl font-black mt-2 tracking-tight">{selection.selectedProduct.model} {selection.sizeCode}</h2>
                                                <p className="text-xs text-neutral-300 mt-1">{selection.selectedProduct.name}</p>
                                            </div>
                                            <ShieldCheck className="w-8 h-8 text-primary" />
                                        </div>
                                    </div>

                                    <CardContent className="p-6 space-y-6">
                                        {/* Physical Specifications */}
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dimensions & Daylight</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                                                    <span className="text-[11px] text-muted-foreground block">Overall Dimensions</span>
                                                    <span className="text-sm font-bold text-foreground mt-0.5 block">{selectedSizeDetails.width} × {selectedSizeDetails.height} mm</span>
                                                </div>
                                                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                                                    <span className="text-[11px] text-muted-foreground block">Net Daylight Area</span>
                                                    <span className="text-sm font-bold text-foreground mt-0.5 block">
                                                        {(selection.selectedProduct.daylightArea?.[selection.sizeCode] || 0).toFixed(2)} m²
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance Matrix */}
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Thermal & Acoustic Performance</h3>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100">
                                                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">R-Value</span>
                                                    <span className="text-sm font-bold text-foreground mt-0.5 block">{selection.selectedProduct.uValue || 2.6}</span>
                                                </div>
                                                <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100">
                                                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">SHGC</span>
                                                    <span className="text-sm font-bold text-foreground mt-0.5 block">{selection.selectedProduct.shgc || 0.24}</span>
                                                </div>
                                                <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100">
                                                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">Rw Acoustic</span>
                                                    <span className="text-sm font-bold text-foreground mt-0.5 block">{selection.selectedProduct.rw || 32} dB</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Configuration Cost Breakdown */}
                                        <div className="border-t pt-4 border-dashed border-border space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Indicative Supply RRP {showIncGst ? '(inc. gst)' : ''}</span>
                                                <span className="font-bold text-lg text-foreground">${calculatedPrice.toLocaleString()} NZD</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-normal">
                                                Includes base skylight unit, standard flashing kit, and configured factory add-ons.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="sticky top-28">
                                <Card className="border border-dashed border-neutral-300 bg-neutral-50/50 p-8 text-center space-y-3">
                                    <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto" />
                                    <h3 className="font-bold text-sm text-neutral-700">No Unit Selected</h3>
                                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                        Complete the configuration steps on the left to view technical performance parameters and add units to your project schedule.
                                    </p>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Consolidated Project Schedule Table */}
                {schedule.length > 0 && (
                    <div className="mt-12 space-y-6" id="architect-schedule-print-area">
                        <Card className="border border-border shadow-md">
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                                <div>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-primary" />
                                        Project Skylight Schedule (NZ)
                                    </CardTitle>
                                    <CardDescription>Consolidated specification table for construction documentation</CardDescription>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Button variant="outline" size="sm" onClick={copyMarkdownTable} className="text-xs gap-1.5">
                                        <Copy className="w-3.5 h-3.5" />
                                        {copiedMD ? 'Copied!' : 'Copy MD Table'}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={exportCSV} className="text-xs gap-1.5">
                                        <Download className="w-3.5 h-3.5" />
                                        Export CSV
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={exportPDF} className="text-xs gap-1.5">
                                        <Printer className="w-3.5 h-3.5" />
                                        Print Spec PDF
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-neutral-50 border-b font-bold text-neutral-600 uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Mark</th>
                                            <th className="p-4">Model Code</th>
                                            <th className="p-4">Size (WxH)</th>
                                            <th className="p-4">Light Area</th>
                                            <th className="p-4">Glazing Specification</th>
                                            <th className="p-4">R / SHGC</th>
                                            <th className="p-4">Rw (Acoustic)</th>
                                            <th className="p-4">Accessories</th>
                                            <th className="p-4">Unit Price (NZD)</th>
                                            <th className="p-4 text-center">Qty</th>
                                            <th className="p-4">Notes</th>
                                            <th className="p-4 text-center">Remove</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {schedule.map((item) => (
                                            <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                                                <td className="p-4 font-black text-foreground">{item.mark}</td>
                                                <td className="p-4 font-bold">
                                                    <div>{item.product.model}</div>
                                                    <div className="text-[10px] text-muted-foreground font-normal">{item.sizeCode}</div>
                                                </td>
                                                <td className="p-4">{item.width} × {item.height} mm</td>
                                                <td className="p-4">{((item.product.daylightArea?.[item.sizeCode] || 0)).toFixed(2)} m²</td>
                                                <td className="p-4 max-w-[180px] text-muted-foreground">{item.glazing}</td>
                                                <td className="p-4 font-medium">{item.uValue} / {item.shgc}</td>
                                                <td className="p-4 font-medium">{item.rw} dB</td>
                                                <td className="p-4 max-w-[160px]">
                                                    {item.accessories.length > 0 ? (
                                                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-neutral-600">
                                                            {item.accessories.map((acc, i) => <li key={i}>{acc}</li>)}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-neutral-400">None</span>
                                                    )}
                                                </td>
                                                <td className="p-4 font-bold text-foreground">${item.price.toLocaleString()}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 rounded border flex items-center justify-center text-neutral-600 hover:bg-neutral-100 font-bold">-</button>
                                                        <span className="font-bold w-4 text-center">{item.qty}</span>
                                                        <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 rounded border flex items-center justify-center text-neutral-600 hover:bg-neutral-100 font-bold">+</button>
                                                    </div>
                                                </td>
                                                <td className="p-4 max-w-[180px]">
                                                    <input 
                                                        type="text" 
                                                        value={item.notes} 
                                                        onChange={(e) => updateNotes(item.id, e.target.value)}
                                                        className="w-full bg-transparent border-b border-dashed border-neutral-300 focus:border-primary text-xs focus:outline-none py-0.5"
                                                    />
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => removeItem(item.id)} className="text-neutral-400 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
