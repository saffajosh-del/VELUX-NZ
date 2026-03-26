import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCTS, PITCHED_SIZES, FLAT_SIZES, ROOF_WINDOW_SIZES, FLASHINGS, BLINDS, ACCESSORIES } from '@/data/products';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type StepId = 'product-type' | 'pitch' | 'material' | 'sun-tunnel-type' | 'roof-window-model' | 'opening' | 'truss' | 'size' | 'results' | 'blinds' | 'addon' | 'summary';

// ... (in SkylightSelector)



interface SelectionState {
    productCategory: 'skylight' | 'roof-window' | 'sun-tunnel' | null;
    roofPitch: 'pitched' | 'flat' | null;
    roofMaterial: 'tiled-corrugated' | 'wide-metal' | null;
    // Derived or legacy mapping for compatibility
    roofType: 'tiled' | 'corrugated' | 'wide-metal' | 'flat' | null;
    // installType removed, assumed 'new'
    openingType: 'fixed' | 'manual' | 'electric' | 'solar' | null;
    orientation: 'portrait' | 'landscape' | null;
    trussSpacing: number | 'unsure' | null;
    sizeCode: string | null;
    selectedProduct: string | null; // Product ID
    selectedBlind: string | null; // Blind ID
    selectedInsectScreen: boolean;
    selectedAddon: string | null;
}

const PRODUCT_TYPE_OPTIONS = [
    {
        id: 'skylight',
        label: 'Skylight',
        icon: <img src="/skylight-icon.png" alt="Skylight" className="w-16 h-16 object-contain" />
    },
    {
        id: 'roof-window',
        label: 'Roof Window',
        icon: <img src="/roof-window-icon.png" alt="Roof Window" className="w-16 h-16 object-contain" />
    },
    {
        id: 'sun-tunnel',
        label: 'Sun Tunnel',
        icon: <img src="/sun-tunnel-icon.png" alt="Sun Tunnel" className="w-16 h-16 object-contain mt-2" />
    },
];

const PITCH_OPTIONS = [
    {
        id: 'pitched',
        label: 'Pitched Roof',
        subLabel: '15° - 90°',
        icon: (
            <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-gray-800">
                <path d="M5 35L30 5L55 35" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'flat',
        label: 'Flat Roof',
        subLabel: '0° - 60°',
        icon: (
            <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-gray-800">
                <path d="M10 25H50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
];

const MATERIAL_OPTIONS = [
    { id: 'tiled-corrugated', label: 'Tiled / Corrugated Metal', image: '/Untitled design (9).png' },
    { id: 'wide-metal', label: 'Wide-span Metal (Trimdek / Klip-Lok)', image: '/IMG_3050.JPG' },
];



const OPENING_OPTIONS = [
    { id: 'fixed', label: 'Fixed (Non-Opening)' },
    { id: 'manual', label: 'Manual Opening' },
    { id: 'electric', label: 'Electric Opening' },
    { id: 'solar', label: 'Solar Powered' },
];

const TRUSS_OPTIONS = [
    { id: 600, label: '600mm' },
    { id: 900, label: '900mm' },
    { id: 1200, label: '1200mm' },
];


export default function SkylightSelector() {
    const [step, setStep] = useState<StepId>('product-type');
    const [history, setHistory] = useState<StepId[]>([]);
    const [selection, setSelection] = useState<SelectionState>({
        productCategory: null,
        roofPitch: null,
        roofMaterial: null,
        roofType: null,
        openingType: null,
        orientation: 'portrait',
        trussSpacing: null,
        sizeCode: null,
        selectedProduct: null,
        selectedBlind: null,
        selectedInsectScreen: false,
        selectedAddon: null,
    });

    // Helpers to move between steps
    const nextStep = (next: StepId) => {
        setHistory([...history, step]);
        setStep(next);
    };

    const backStep = () => {
        const prev = history[history.length - 1];
        if (prev) {
            setHistory(history.slice(0, -1));
            setStep(prev);
        }
    };



    // ----------------------------------------------------------------------------
    // FILTER LOGIC
    // ----------------------------------------------------------------------------

    const isFlatRoof = selection.roofType === 'flat';

    // Filter Products based on current selection
    const validProducts = useMemo(() => {
        return PRODUCTS.filter(p => {
            // 0. Product Category Check
            if (selection.productCategory === 'sun-tunnel') {
                return p.id === 'twr' || p.id === 'twf' || p.id === 'tcr';
            }
            if (selection.productCategory === 'roof-window') {
                if (selection.selectedProduct) {
                    return p.id === selection.selectedProduct;
                }
                return p.id === 'ggl' || p.id === 'gpl';
            }
            if (selection.productCategory === 'skylight') {
                // Exclude Roof Windows and Sun Tunnels from Skylight flow
                if (['ggl', 'gpl', 'twr', 'twf', 'tcr'].includes(p.id)) return false;
            }

            // 1. Roof Type Check
            if (selection.roofType) {
                if (isFlatRoof && !p.roofType.includes('flat')) return false;
                if (!isFlatRoof && !p.roofType.includes('pitched')) return false;
            }

            // 2. Opening Check
            if (selection.openingType) {
                if (p.openingType !== selection.openingType) return false;
            }

            return true;
        });
    }, [selection.roofType, selection.openingType, isFlatRoof, selection.productCategory, selection.selectedProduct]);

    // Available Opening Types based on Roof
    const availableOpeningTypes = useMemo(() => {
        const types = new Set<string>();
        PRODUCTS.forEach(p => {
            if (selection.roofType) {
                if (isFlatRoof && !p.roofType.includes('flat')) return;
                if (!isFlatRoof && !p.roofType.includes('pitched')) return;
            }
            types.add(p.openingType);
        });
        return OPENING_OPTIONS.filter(o => types.has(o.id));
    }, [selection.roofType, isFlatRoof]);

    // Valid Sizes Logic
    const validSizes = useMemo(() => {
        const sizeSet = new Set<string>();

        // Collect all compatible sizes from currently valid products
        validProducts.forEach(p => {
            p.compatibleSizes.forEach(s => sizeSet.add(s));
        });

        if (selection.trussSpacing && selection.trussSpacing !== 'unsure') {
            if (isFlatRoof) {
                // Flat Roof Logic: Filter by Overall Curb Width
                // 600mm -> 14xx (460mm) and 22xx (665mm) logic roughly, or use code prefix
                // data.md:
                // 1430 (460 wide) -> 600 truss (exception)
                // 22xx (665 wide) -> 600 truss
                // 30xx (870 wide) -> 900 truss
                // 34xx (970 wide) -> 900 truss
                // 46xx (1275 wide) -> 1200 truss

                let validPrefixes: string[] = [];
                if (selection.trussSpacing === 600) validPrefixes = ['14', '22'];
                else if (selection.trussSpacing === 900) validPrefixes = ['30', '34'];
                else if (selection.trussSpacing === 1200) validPrefixes = ['46'];

                const restricted = Array.from(sizeSet).filter(code => !validPrefixes.some(pre => code.startsWith(pre)));
                restricted.forEach(r => sizeSet.delete(r));

            } else {
                // Pitched Roof Logic (Existing)
                // 600mm -> Only 'C' series
                // 900mm -> Only 'M' series
                // 1200mm -> Only 'S' series

                const allowedPrefix = selection.trussSpacing === 600 ? 'C' :
                    selection.trussSpacing === 900 ? 'M' :
                        'S';

                const restricted = Array.from(sizeSet).filter(code => !code.startsWith(allowedPrefix));
                restricted.forEach(r => sizeSet.delete(r));
            }
        }

        // Orientation Logic (Pitched only rule from PRD: FCM 2270 / 3072 / 4672 landscape constrained?)
        // PRD say: "Removes restricted sizes (e.g. FCM 2270 / 3072 / 4672 landscape)"
        // Actually the PRD says: "Removes restricted sizes (e.g. FCM 2270 / 3072 / 4672 landscape)"
        // Wait, FCM is Flat Roof.
        // Step 4 is Roof Pitch / Orientation *if applicable*. 
        // Usually Flat roof (FCM) is installed on a curb. 
        // If user says "Landscape", we might exclude some tall sizes?
        // Let's implement the logic: If Landscape, exclude FCM 2270, 3072, 4672 if they are "Portrait only" designs?
        // Actually, usually 2270 is 572x1792. It's very tall. If you install it landscape 1792x572, maybe it's fine?
        // PRD explicitly says so. So we filter them out if Landscape.

        if (selection.orientation === 'landscape') {
            const restricted = ['2270', '3072', '4672'];
            restricted.forEach(r => sizeSet.delete(r));
        }

        if (selection.productCategory === 'roof-window') {
            // Filter Roof Windows based on truss spacing if set
            // MK series -> 780mm width -> Fits 900mm spacing
            // SK series -> 1140mm width -> Fits 1200mm spacing
            // CK series -> 550mm width -> Fits 600mm spacing
            const sizes = ROOF_WINDOW_SIZES.filter(s => sizeSet.has(s.code));

            if (selection.trussSpacing && selection.trussSpacing !== 'unsure') {
                const allowedPrefix = selection.trussSpacing === 600 ? 'C' :
                    selection.trussSpacing === 900 ? 'M' :
                        'S';
                return sizes.filter(s => s.code.startsWith(allowedPrefix + 'K')); // e.g. CK, MK, SK
            }
            return sizes;
        }

        const sizes = isFlatRoof ? FLAT_SIZES : PITCHED_SIZES;
        return sizes.filter(s => sizeSet.has(s.code));
    }, [validProducts, isFlatRoof, selection.orientation, selection.trussSpacing]);


    // ----------------------------------------------------------------------------
    // HANDLERS
    // ----------------------------------------------------------------------------

    const handleProductTypeSelect = (id: string) => {
        setSelection({ ...selection, productCategory: id as any });
        if (id === 'skylight') {
            nextStep('pitch');
        } else if (id === 'sun-tunnel') {
            nextStep('pitch');
        } else if (id === 'roof-window') {
            // Roof Windows are always pitched (15-90 degrees)
            setSelection(prev => ({ ...prev, productCategory: 'roof-window', roofPitch: 'pitched', roofType: 'tiled' }));
            // We default to 'tiled' (EDW) but better to ask Material as 'wide-metal' might check constraints?
            // Actually, let's ask Material.
            nextStep('material');
        }
    };

    const handlePitchSelect = (id: string) => {
        setSelection({ ...selection, roofPitch: id as any, roofType: id === 'flat' ? 'flat' : null });

        if (selection.productCategory === 'sun-tunnel') {
            if (id === 'flat') {
                // Flat roof Sun Tunnel -> TCR (Must use TCR)
                setSelection(prev => ({ ...prev, selectedProduct: 'tcr', sizeCode: '014' }));
                nextStep('results');
            } else {
                // Pitched roof Sun Tunnel -> Ask for Material
                nextStep('material');
            }
        } else {
            // Skylight flow
            if (id === 'flat') {
                nextStep('opening');
            } else {
                nextStep('material');
            }
        }
    };

    const handleMaterialSelect = (id: string) => {
        const mappedType = id === 'tiled-corrugated' ? 'tiled' : 'wide-metal';
        setSelection({ ...selection, roofMaterial: id as any, roofType: mappedType });

        if (selection.productCategory === 'sun-tunnel') {
            if (id === 'wide-metal') {
                // Metal Roofs: MUST use TCR
                setSelection(prev => ({ ...prev, selectedProduct: 'tcr', sizeCode: '014', roofType: 'wide-metal' }));
                nextStep('results');
            } else {
                // Tiled Roofs: Use TWF or TWR
                nextStep('sun-tunnel-type');
            }
        } else if (selection.productCategory === 'roof-window') {
            // Roof Window Flow
            // EDW is for Tile/Corrugated. If Wide Metal, maybe warn?
            // But for now, let's just proceed to Model Selection
            nextStep('roof-window-model');
        } else {
            // Skylight flow
            nextStep('opening');
        }
    };

    const handleSunTunnelTypeSelect = (type: 'rigid' | 'flexible') => {
        const productId = type === 'rigid' ? 'twr' : 'twf';

        // Sun Tunnels have fixed size code 0K14 (014)
        setSelection({ ...selection, selectedProduct: productId, sizeCode: '0K14' });
        nextStep('results');
    };

    const handleRoofWindowModelSelect = (model: 'ggl' | 'gpl') => {
        setSelection({ ...selection, selectedProduct: model });
        nextStep('truss');
    };

    const handleOpeningSelect = (id: string) => {
        setSelection({ ...selection, openingType: id as any, orientation: 'portrait' });
        nextStep('truss');
    };

    const handleTrussSelect = (spacing: number | 'unsure') => {
        setSelection({ ...selection, trussSpacing: spacing });
        if (spacing === 'unsure') {
            // Route to results step to show grouped options by truss spacing
            nextStep('results');
        } else {
            nextStep('size');
        }
    };

    const handleSizeSelect = (code: string) => {
        const results = validProducts.filter(p => p.compatibleSizes.includes(code));
        const selectedProduct = results.length > 0 ? results[0].id : null;
        setSelection({ ...selection, sizeCode: code, selectedProduct });
        nextStep('blinds');
    };

    const handleProductSelect = (id: string) => {
        setSelection({ ...selection, selectedProduct: id });
        nextStep('blinds');
    };

    const handleBlindSelect = (id: string | null) => {
        // Toggle logic: If clicking the same blind, deselect it. If clicking a new one, select it.
        // If id is null (logic not needed anymore with no 'No Blinds' button, but good for safety), clear selection.
        if (id === null) {
            setSelection({ ...selection, selectedBlind: null });
        } else if (selection.selectedBlind === id) {
            setSelection({ ...selection, selectedBlind: null });
        } else {
            setSelection({ ...selection, selectedBlind: id });
        }
    };

    const handleSkylightBlindSelect = (id: string | null) => {
        // For skylights, we set the blind (or null) and immediately advance
        // We need to bypass the toggle logic and just set it
        setSelection(prev => ({ ...prev, selectedBlind: id }));
        // Use a small timeout to let the state update or just direct call if nextStep doesn't depend on immediate render of selection
        // Actually nextStep just changes 'step' state, so it's fine.
        // But we want the selection to stick.
        setTimeout(() => nextStep('summary'), 0);
    };

    const toggleInsectScreen = () => {
        setSelection({ ...selection, selectedInsectScreen: !selection.selectedInsectScreen });
    };

    const handleUpgradesComplete = () => {
        nextStep('summary');
    };



    const handleExportPDF = async (elementId = 'summary-card', filename = 'velux-selection.pdf') => {
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2, // Higher resolution
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(filename);
        } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback to print if PDF generation fails
            window.print();
        }
    };

    // ----------------------------------------------------------------------------
    // RENDER STEPS
    // ----------------------------------------------------------------------------

    const renderProductTypeStep = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRODUCT_TYPE_OPTIONS.map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => handleProductTypeSelect(opt.id)}
                    className="flex flex-col items-center justify-center p-8 bg-white border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all group min-h-[200px]"
                >
                    <span className="mb-6 grayscale group-hover:grayscale-0 transition-all">{opt.icon}</span>
                    <span className="text-xl font-bold text-foreground text-center">{opt.label}</span>
                </button>
            ))}
        </div>
    );

    const renderPitchStep = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PITCH_OPTIONS.map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => handlePitchSelect(opt.id)}
                    className="flex flex-col items-center justify-center p-8 bg-white border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all group"
                >
                    <span className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{opt.icon}</span>
                    <span className="text-lg font-medium text-foreground">{opt.label}</span>
                    {opt.subLabel && <span className="text-sm text-muted-foreground mt-1">{opt.subLabel}</span>}
                </button>
            ))}
        </div>
    );

    const renderMaterialStep = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MATERIAL_OPTIONS.map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => handleMaterialSelect(opt.id)}
                    className="flex flex-col items-center justify-center p-8 bg-white border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all group"
                >
                    <img src={opt.image} alt={opt.label} className="w-32 h-32 object-contain mb-4" />
                    <span className="text-lg font-medium text-center text-foreground">{opt.label}</span>
                </button>
            ))}
        </div>
    );

    const renderSunTunnelTypeStep = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
                onClick={() => handleSunTunnelTypeSelect('rigid')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all group"
            >
                {/* <div className="text-4xl mb-4">🔦</div> -- REMOVED */}
                <span className="text-lg font-bold">Rigid Sun Tunnel</span>
                <span className="text-sm text-muted-foreground mt-2">Recommended for longer distances</span>
            </button>
            <button
                onClick={() => handleSunTunnelTypeSelect('flexible')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all group"
            >
                {/* <div className="text-4xl mb-4">〰️</div> -- REMOVED */}
                <span className="text-lg font-bold">Flexible Sun Tunnel</span>
                <span className="text-sm text-muted-foreground mt-2">Ideal for shorter distances</span>
            </button>
        </div>
    );

    const renderRoofWindowModelStep = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
                onClick={() => handleRoofWindowModelSelect('ggl')}
                className="flex flex-col items-center p-8 bg-white border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all text-left overflow-hidden group"
            >
                <div className="w-full h-48 mb-6 flex items-center justify-center rounded-lg overflow-hidden">
                    <img
                        src="/GGL-roof-window.png"
                        alt="Centre Pivot Roof Window (GGL)"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <span className="text-xl font-bold mb-2">Centre Pivot (GGL)</span>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                    <li>Top control bar</li>
                    <li>Convenient even with furniture placed beneath</li>
                    <li>Suitable for pitch 15°-90°</li>
                </ul>
            </button>
            <button
                onClick={() => handleRoofWindowModelSelect('gpl')}
                className="flex flex-col items-center p-8 bg-white border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all text-left overflow-hidden group"
            >
                <div className="w-full h-48 mb-6 flex items-center justify-center rounded-lg overflow-hidden">
                    <img
                        src="/GPL-roof-window.png"
                        alt="Dual Action Roof Window (GPL)"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <span className="text-xl font-bold mb-2">Dual Action (GPL)</span>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                    <li>Opens outwards for panoramic views</li>
                    <li>Maximized headroom</li>
                    <li>Suitable for pitch 15°-55°</li>
                </ul>
            </button>
        </div>
    );

    const renderOpeningStep = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableOpeningTypes.map((opt, index) => (
                <button
                    key={opt.id}
                    onClick={() => handleOpeningSelect(opt.id)}
                    className={`p-6 bg-white border border-border rounded-xl hover:border-primary/50 transition-all text-center flex flex-col justify-center items-center h-32 group ${availableOpeningTypes.length === 3 && index === 2 ? 'md:col-span-2 md:w-1/2 md:mx-auto' : ''}`}
                >
                    <div className="flex flex-col items-center">
                        <h3 className="text-lg font-medium group-hover:text-primary transition-colors">{opt.label}</h3>
                        {opt.id === 'electric' && (
                            <p className="text-xs text-red-500 mt-1 font-medium">* Requires Certified Electrician</p>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );

    const renderTrussStep = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TRUSS_OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => handleTrussSelect(opt.id)}
                        className="p-8 bg-white border border-border rounded-xl hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-4 group"
                    >
                        <div className="text-3xl font-bold text-primary group-hover:scale-110 transition-transform">{opt.id}mm</div>
                    </button>
                ))}
            </div>
            <button
                onClick={() => handleTrussSelect('unsure')}
                className="w-full p-4 bg-gray-50 border border-border rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all text-center text-muted-foreground font-medium"
            >
                Not Sure
            </button>
            <div className="mt-8 flex justify-center">
                <img
                    src="/truss-spacing-diagram.png"
                    alt="Diagram showing truss/rafter spacing measurement"
                    className="max-w-full h-auto rounded-xl border border-border shadow-sm"
                    style={{ maxHeight: '400px' }}
                />
            </div>
        </div>
    );

    const renderSizeStep = () => (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-center gap-3">
                {validSizes.map((s) => {
                    // Logic to distribute evenly: 
                    // If 6 items, use 3 columns (33%). 
                    // Otherwise default to 4 columns (25%).
                    const isSixItems = validSizes.length === 6;
                    const desktopWidthClass = isSixItems ? "md:w-[calc(33.333%-8px)]" : "md:w-[calc(25%-9px)]";

                    return (
                        <button
                            key={s.code}
                            onClick={() => handleSizeSelect(s.code)}
                            className={`w-[calc(50%-6px)] ${desktopWidthClass} p-4 bg-white border border-border rounded-lg hover:border-primary transition-all text-center flex flex-col items-center justify-center min-h-[100px] group`}
                        >
                            <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{s.label} mm</span>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col items-center justify-center space-y-4 pt-4">
                <p className="text-sm text-center text-muted-foreground px-4">
                    Sizes above refer to <span className="font-bold">{selection.productCategory === 'roof-window' ? 'Overall Frame Dimensions' : 'Overall Curb Dimensions'}</span> and are <span className="italic text-red-600">width x height</span>.
                </p>
                <img
                    src="/skylight-size.png"
                    alt="Skylight Dimensions Diagram"
                    className="max-w-full h-auto max-h-64 object-contain rounded-lg border shadow-sm"
                />
            </div>
            {validSizes.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    No sizes available for this configuration. Please go back and change options.
                </div>
            )}
        </div>
    );

    const renderResultsStep = () => {
        if (selection.productCategory === 'sun-tunnel') {
            const product = PRODUCTS.find(p => p.id === selection.selectedProduct);
            if (!product) return <div>Product logic error</div>;

            const price = product.prices['014'] || product.prices['0K14'];

            return (
                <div>
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-border">
                        <div className="grid grid-cols-1 md:grid-cols-3">
                            <div className="p-8 bg-gray-50 flex items-center justify-center">
                                <img src={product.image} alt={product.name} className="max-h-64 object-contain" />
                            </div>
                            <div className="p-8 md:col-span-2 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                                    <p className="text-muted-foreground mb-6">
                                        {product.id === 'tcr' ? 'Up to 1150mm' : product.id === 'twr' ? 'Up to 1700mm' : 'Up to 2000mm'}
                                    </p>

                                    <div className="space-y-3 mb-8">
                                        <div className="flex items-center text-sm">
                                            <Check className="w-5 h-5 text-primary mr-3" />
                                            <span>
                                                {product.id === 'tcr' ? 'For Flat Roofs (0°-60°)' : 'For Pitched Roofs (15°-60°)'}
                                            </span>
                                        </div>
                                        {product.id === 'tcr' && (
                                            <div className="flex items-center text-sm">
                                                <Check className="w-5 h-5 text-primary mr-3" />
                                                <span>Custom Flashing Required</span>
                                            </div>
                                        )}
                                        {product.id !== 'tcr' && (
                                            <div className="flex items-center text-sm">
                                                <Check className="w-5 h-5 text-primary mr-3" />
                                                <span>Integrated Flashing</span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-sm">
                                            <span className="font-medium text-right">
                                                {product?.id === 'tcr' ? 'Up to 1150mm' : product?.id === 'twr' ? 'Up to 1700mm' : 'Up to 2000mm'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div className="text-4xl font-bold text-gray-900">${price}</div>
                                    <Button size="lg" onClick={() => {
                                        // Specific Logic: TWR/TCR -> Addon Step
                                        if (product.id === 'twr' || product.id === 'tcr') {
                                            nextStep('addon');
                                        } else {
                                            nextStep('summary');
                                        }
                                    }}>Select</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Handle "Not Sure" State
        if (selection.trussSpacing === 'unsure') {
            // Find valid product based on opening/roof type (ignoring size/truss filtering)
            // We can re-use validProducts logc but we need ONE model to display.
            // validProducts array already contains the filtered products.
            // Assuming 1 main model per opening type (e.g. VSE for Electric).

            // If multiple products match, we display all of them (e.g. if we had VSE and AnotherElectric)
            // But usually there's just one series.

            return (
                <div id="filtered-results-list" className="space-y-8 bg-white p-6 rounded-xl">

                    {validProducts.map((product) => {
                        // Group compatible sizes by truss spacing
                        // For Roof Windows: CK=~550mm, MK=~780mm, SK=~1140mm
                        // For Flat Roof: Check actual width from FLAT_SIZES
                        //   ~460-665mm width -> 600mm truss
                        //   ~870-970mm width -> 900mm truss
                        //   ~1275mm width -> 1200mm truss

                        const sizes600 = product.compatibleSizes.filter(code => {
                            // Letter-based codes (roof windows)
                            if (code.startsWith('C') || code.startsWith('CK') || code === '550') return true;
                            // Numeric codes (flat roof) - check width
                            if (isFlatRoof) {
                                const sizeObj = FLAT_SIZES.find(s => s.code === code);
                                return sizeObj && sizeObj.width <= 665;
                            }
                            return false;
                        });

                        const sizes900 = product.compatibleSizes.filter(code => {
                            // Letter-based codes (roof windows)
                            if (code.startsWith('M') || code.startsWith('MK')) return true;
                            // Numeric codes (flat roof) - check width
                            if (isFlatRoof) {
                                const sizeObj = FLAT_SIZES.find(s => s.code === code);
                                return sizeObj && sizeObj.width > 665 && sizeObj.width <= 970;
                            }
                            return false;
                        });
                        const sizes1200 = product.compatibleSizes.filter(code => {
                            // Letter-based codes (roof windows)
                            if (code.startsWith('S') || code.startsWith('SK')) return true;
                            // Numeric codes (flat roof) - check width
                            if (isFlatRoof) {
                                const sizeObj = FLAT_SIZES.find(s => s.code === code);
                                return sizeObj && sizeObj.width > 970;
                            }
                            return false;
                        });

                        const renderSizeGroup = (title: string, codes: string[]) => {
                            if (codes.length === 0) return null;
                            return (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold mb-3 text-gray-700">{title}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {codes.map(code => {
                                            const sizeList = selection.productCategory === 'roof-window'
                                                ? ROOF_WINDOW_SIZES
                                                : (isFlatRoof ? FLAT_SIZES : PITCHED_SIZES);

                                            const sizeObj = sizeList.find(s => s.code === code);
                                            if (!sizeObj) return null;
                                            const price = product.prices[code];

                                            return (
                                                <Card key={code} className="hover:border-primary/50 transition-all">
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-bold text-lg">{code}</span>
                                                            <span className="font-bold text-primary">${price}</span>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mb-1">
                                                            {sizeObj.label} mm
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {product.model} {code}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        };

                        return (
                            <div key={product.id} className="space-y-4">
                                <h2 className="text-xl font-bold border-b pb-2">{product.name} - All Options</h2>
                                <div className="space-y-6">
                                    {renderSizeGroup('600mm Truss Spacing (Fits 550mm wide)', sizes600)}
                                    {renderSizeGroup('900mm Truss Spacing (Fits 780mm wide)', sizes900)}
                                    {renderSizeGroup('1200mm Truss Spacing (Fits 1140mm wide)', sizes1200)}
                                </div>
                            </div>
                        );
                    })}

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-medium">
                        ⚠️ Important: You need to confirm your truss spacing in order to select the appropriate window size for installation. The options above show all available sizes for this model.
                    </div>
                    <div className="flex justify-end border-t pt-4 mt-4">
                        <Button variant="outline" onClick={() => handleExportPDF('filtered-results-list', 'velux-skylight-options.pdf')}>
                            <Printer className="w-4 h-4 mr-2" /> Print / Save List
                        </Button>
                    </div>
                </div>
            );
        }

        // Standard Result Logic (Specific Size Selected)
        // Standard Result Logic (Specific Size Selected)
        const compatibleProducts = PRODUCTS.filter(p => {
            // 0. Product Category Check
            if (selection.productCategory === 'sun-tunnel') {
                return p.id === 'twr' || p.id === 'twf' || p.id === 'tcr';
            }
            if (selection.productCategory === 'roof-window') {
                if (selection.selectedProduct) {
                    return p.id === selection.selectedProduct;
                }
                return p.id === 'ggl' || p.id === 'gpl';
            }

            if (selection.roofType) {
                if (isFlatRoof && !p.roofType.includes('flat')) return false;
                if (!isFlatRoof && !p.roofType.includes('pitched')) return false;
            }
            if (selection.openingType) {
                if (p.openingType !== selection.openingType) return false;
            }
            // Check size compatibility if size selected
            if (selection.sizeCode && !p.compatibleSizes.includes(selection.sizeCode)) return false;

            return true;
        });

        return (
            <div>
                <div className="grid grid-cols-1 gap-6">
                    {compatibleProducts.map(product => {
                        const price = product.prices[selection.sizeCode!] || 0;
                        const sizeObj = selection.productCategory === 'roof-window'
                            ? ROOF_WINDOW_SIZES.find(s => s.code === selection.sizeCode)
                            : (isFlatRoof ? FLAT_SIZES : PITCHED_SIZES).find(s => s.code === selection.sizeCode);

                        return (
                            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-border flex flex-col md:flex-row">
                                <div className="p-8 bg-gray-50 flex items-center justify-center md:w-1/3">
                                    {product.image && <img src={product.image} alt={product.name} className="max-h-48 object-contain" />}
                                </div>
                                <div className="p-8 md:w-2/3 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                                        <p className="text-muted-foreground mb-4">Size: {selection.sizeCode} ({sizeObj?.label} mm)</p>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center text-sm">
                                                <Check className="w-5 h-5 text-primary mr-3" />
                                                <span>{product.openingType === 'fixed' ? 'Fixed (Non-opening)' :
                                                    product.openingType === 'manual' ? 'Manual Opening' :
                                                        product.openingType === 'electric' ? 'Electric Opening' : 'Solar Powered'}</span>
                                            </div>
                                            {/* Logic for wide-metal compatibility */}
                                            {selection.roofType === 'wide-metal' && (
                                                <div className="flex items-center text-sm">
                                                    <Check className="w-5 h-5 text-primary mr-3" />
                                                    <span>Compatible with wide-metal roof</span>
                                                </div>
                                            )}
                                            {product.openingType === 'electric' && (
                                                <div className="flex items-center text-sm text-red-600 font-medium">
                                                    <span>* Requires Certified Electrician</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-end justify-between mt-4">
                                        <div className="text-4xl font-bold text-gray-900">${price}</div>
                                        <Button size="lg" onClick={() => handleProductSelect(product.id)}>Select</Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderBlindsStep = () => {
        // Filter blinds based on selected product model
        const product = PRODUCTS.find(p => p.id === selection.selectedProduct);
        if (!product) return null;

        // Check if blind tray is available for flat roof products
        // FCM sizes 1430, 3055, 3072, 4672 have no blind tray, so skip blinds entirely
        if (isFlatRoof && selection.sizeCode) {
            const zzz199 = ACCESSORIES.find(a => a.id === 'zzz199');
            if (zzz199) {
                const prices = zzz199.prices as unknown as Record<string, number>;
                if (!prices[selection.sizeCode]) {
                    // No blind tray available for this size, skip to summary
                    nextStep('summary');
                    return null;
                }
            }
        }

        // Separate Blinds (Darkening/Translucent) and Accessories (Screens)
        const compatibleItems = BLINDS.filter(b => b.compatibleModels.includes(product.model) && b.prices[selection.sizeCode!]);
        const availableBlinds = compatibleItems.filter(b => b.type !== 'accessory');
        const availableScreens = compatibleItems.filter(b => b.type === 'accessory');

        if (selection.productCategory === 'roof-window') {
            return (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* 1. Blind Selection */}
                        <div>
                            <h3 className="text-xl font-bold mb-4">1. Add a Blind?</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {availableBlinds.map((b) => {
                                    const price = b.prices[selection.sizeCode!];
                                    const isSelected = selection.selectedBlind === b.id;
                                    return (
                                        <Card
                                            key={b.id}
                                            className={`cursor-pointer transition-all ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'hover:border-primary'}`}
                                            onClick={() => handleBlindSelect(b.id)}
                                        >
                                            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                                                {b.image && (
                                                    <img
                                                        src={b.image}
                                                        alt={b.name}
                                                        className="h-32 w-auto object-contain mb-4"
                                                    />
                                                )}
                                                <h3 className="text-lg font-bold mb-1">{b.name}</h3>
                                                {b.subtitle && (
                                                    <p className="text-muted-foreground font-medium text-sm mb-3 text-gray-700">{b.subtitle}</p>
                                                )}
                                                <div className="text-xl font-bold text-primary">+${price}</div>
                                                <div className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold">
                                                    {isSelected ? 'Added' : 'Click to Add'}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Insect Screen Selection (Only if available) */}
                        {availableScreens.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold mb-4">2. Add an Insect Screen?</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {availableScreens.map((s) => {
                                        const price = s.prices[selection.sizeCode!];
                                        const isSelected = selection.selectedInsectScreen;
                                        return (
                                            <Card
                                                key={s.id}
                                                className={`cursor-pointer transition-all ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'hover:border-primary'}`}
                                                onClick={toggleInsectScreen}
                                            >
                                                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                                                    {/* Generic Screen Icon or Image if available */}
                                                    {s.image ? (
                                                        <img
                                                            src={s.image}
                                                            alt={s.name}
                                                            className="h-32 w-auto object-contain mb-4"
                                                        />
                                                    ) : (
                                                        <div className="text-4xl mb-4">🦟</div>
                                                    )}
                                                    <h3 className="text-lg font-bold mb-1">{s.name}</h3>
                                                    <p className="text-muted-foreground font-medium text-sm mb-3">Keep bugs out while letting fresh air in</p>
                                                    <div className="text-xl font-bold text-primary">+${price}</div>
                                                    <div className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold">
                                                        {isSelected ? 'Added' : 'Click to Add'}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-6 border-t">
                        <Button size="lg" onClick={handleUpgradesComplete} className="w-full md:w-auto px-12">
                            Continue to Summary
                        </Button>
                    </div>
                </div>
            );
        }

        // ORIGINAL LAYOUT FOR SKYLIGHTS
        // Reverting to the simpler single-column or grid layout with "No Blinds" button
        return (
            <div className="space-y-8">
                {/* <h2 className="text-2xl font-bold mb-6">Select a Blind (Optional)</h2> -- REMOVED PER USER REQUEST */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableBlinds.map((b) => {
                        const price = b.prices[selection.sizeCode!];
                        const isSelected = selection.selectedBlind === b.id;
                        return (
                            <Card
                                key={b.id}
                                className={`cursor-pointer transition-all hover:border-primary ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : ''}`}
                                onClick={() => handleSkylightBlindSelect(b.id)}
                            >
                                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                                    {b.image && (
                                        <img
                                            src={b.image}
                                            alt={b.name}
                                            className="h-32 w-auto object-contain mb-4"
                                        />
                                    )}
                                    <h3 className="text-lg font-bold mb-1">{b.name}</h3>
                                    {b.subtitle && (
                                        <p className="text-muted-foreground font-medium text-sm mb-3 text-gray-700">{b.subtitle}</p>
                                    )}
                                    <div className="text-xl font-bold text-primary">+${price}</div>
                                </CardContent>
                            </Card>
                        );
                    })}
                    <div className={availableBlinds.length % 2 === 0 ? "md:col-span-2 flex justify-center" : ""}>
                        <Card
                            className={`cursor-pointer transition-all flex items-center justify-center hover:border-primary ${availableBlinds.length % 2 === 0 ? "w-full md:w-[calc(50%-0.5rem)]" : "w-full"}`}
                            onClick={() => handleSkylightBlindSelect(null)}
                        >
                            <CardContent className="py-2 px-6 text-center">
                                <h3 className="text-base font-semibold">No Blinds</h3>
                                <p className="text-xs text-muted-foreground">Proceed without adding blinds</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    };

    const handleAddonSelect = (addonId: string | null) => {
        setSelection({ ...selection, selectedAddon: addonId });
    };

    const renderAddonStep = () => {
        const ztr = ACCESSORIES.find(a => a.id === 'ztr0k14');
        const price = ztr?.prices['0K14'] || 0;

        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card
                        className={`cursor-pointer transition-all hover:border-primary/50 overflow-hidden group ${selection.selectedAddon === 'ztr0k14' ? 'ring-2 ring-primary border-primary' : ''}`}
                        onClick={() => handleAddonSelect(selection.selectedAddon === 'ztr0k14' ? null : 'ztr0k14')}
                    >
                        <CardContent className="p-0 flex flex-col items-center text-center h-full">
                            <div className="aspect-video relative bg-gray-50 flex items-center justify-center p-8 w-full">
                                <img src="/ztr-extension.png" alt={ztr?.name} className="max-h-full object-contain mix-blend-multiply" />
                            </div>
                            <div className="p-6 flex flex-col items-center w-full">
                                <div className="mb-2">
                                    <h3 className="font-bold text-lg">{ztr?.name}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Extend the length of your Sun Tunnel. Recommended for deeper roof cavities.
                                </p>
                                <div className="text-xl font-bold text-primary mb-4">${price}</div>
                                <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold bg-gray-50">
                                    {selection.selectedAddon === 'ztr0k14' ? 'Added' : 'Click to Add'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-center mt-8">
                    <Button size="lg" onClick={() => nextStep('summary')} className="w-full md:w-auto px-12">
                        Continue to Summary
                    </Button>
                </div>
            </div>
        );
    };

    const renderSummaryStep = () => {
        const product = PRODUCTS.find(p => p.id === selection.selectedProduct);
        const blind = BLINDS.find(b => b.id === selection.selectedBlind);
        // Sun Tunnels have fixed size code 014 / 0K14, logic handled via product properties or selection
        const sizeCode = selection.sizeCode!;
        const size = selection.productCategory === 'roof-window'
            ? ROOF_WINDOW_SIZES.find(s => s.code === sizeCode)
            : (isFlatRoof ? FLAT_SIZES : PITCHED_SIZES).find(s => s.code === sizeCode);

        const isSunTunnel = selection.productCategory === 'sun-tunnel';

        // Auto calculate price
        const basePrice = product?.prices[sizeCode] || 0;
        const blindPrice = blind ? (blind.prices[sizeCode] || 0) : 0;

        let screenPrice = 0;
        if (selection.selectedInsectScreen) {
            const screenProduct = BLINDS.find(b => b.type === 'accessory' && b.id === 'zil'); // Assuming ZIL is the only screen for now
            if (screenProduct && screenProduct.prices[sizeCode]) {
                screenPrice = screenProduct.prices[sizeCode];
            }
        }

        // Flashing - Modified logic for itemized display
        let flashingPrice = 0;
        let flashingName = '';

        if (isSunTunnel) {
            if (selection.roofPitch === 'flat') {
                // Flat Roof Sun Tunnel (TCR) -> Custom Flashing Required
                flashingName = 'Custom Flashing Required';
            } else {
                // Pitched Roof
                if (selection.roofMaterial === 'wide-metal') {
                    // Wide Metal -> Custom Flashing Required (TCR)
                    flashingName = 'Custom Flashing Required';
                } else {
                    // Tiled (TWR or TWF) -> Integrated Flashing
                    // Integrated flashing text logic:
                    flashingName = 'Integrated Flashing';
                    flashingPrice = 0;
                }
            }
        } else {
            // Skylight Logic
            if (selection.roofPitch === 'pitched') {
                if (selection.roofMaterial === 'tiled-corrugated') {
                    flashingPrice = FLASHINGS.prices[sizeCode] || 0;
                    flashingName = `EDW ${sizeCode} Flashing (Tile/Corrugated)`;
                } else {
                    flashingName = 'Custom Flashing Required';
                }
            } else {
                // Flat roof
                flashingName = 'Custom Curb Flashing Required';

                // FCM sizes 1430, 3055, 3072, 4672 have no blind options
                if (['1430', '3055', '3072', '4672'].includes(sizeCode)) {
                    flashingName = `${flashingName}\nNo blind available for this model`;
                }
            }
        }

        // Accessory Logic (ZZZ 199 for Flat Roof Blinds)
        let accessoryPrice = 0;
        let accessoryName = '';
        if (isFlatRoof && blind && sizeCode) {
            const zzz199 = ACCESSORIES.find(a => a.id === 'zzz199');
            if (zzz199) {
                const prices = zzz199.prices as unknown as Record<string, number>;
                // or safely check. For this specific usage, since we know ZZZ has all sizes, it's safer.
                // But Typescript sees the union. Cast to unknown first.
                if (prices[sizeCode]) {
                    accessoryPrice = prices[sizeCode];
                    accessoryName = `ZZZ 199 ${sizeCode} Blind Tray`;
                }
            }
        }

        // Addon Logic (ZTR 0K14)
        let addonPrice = 0;
        let addonName = '';
        const isCompatibleSunTunnel = product?.id === 'twr' || product?.id === 'tcr';

        if (isCompatibleSunTunnel && selection.selectedAddon === 'ztr0k14') {
            const ztr = ACCESSORIES.find(a => a.id === 'ztr0k14');
            if (ztr) {
                // Cast to any/unknown to handle mixed key types
                addonPrice = (ztr.prices as unknown as Record<string, number>)['0K14'] || 0;
                addonName = ztr.name;
            }
        }

        const total = basePrice + flashingPrice + blindPrice + accessoryPrice + screenPrice + addonPrice;

        return (
            <div className="space-y-6">
                <div id="summary-card" className="bg-white p-8 rounded-xl border shadow-sm">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Check className="w-6 h-6 text-green-600" /> Great Selection
                    </h2>

                    <div className="flex flex-col-reverse md:flex-row gap-8 items-start">
                        <div className="space-y-4 text-sm md:text-base flex-1 w-full">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Product</span>
                                <span className="font-medium text-right">
                                    {isSunTunnel
                                        ? `${product?.name.split('(')[0].trim()} (${product?.id.toUpperCase()} ${sizeCode})`
                                        : `${product?.name.split('(')[0].trim()} (${product?.model} ${sizeCode})`
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Size</span>
                                {isSunTunnel ? (
                                    <span className="font-medium text-right">
                                        {product?.id === 'tcr' ? 'Up to 1150mm' : product?.id === 'twr' ? 'Up to 1700mm' : 'Up to 2000mm'}
                                    </span>
                                ) : (
                                    <span className="font-medium text-right">{size ? `${size.label} mm` : sizeCode}</span>
                                )}
                            </div>

                            {/* Itemized Costs */}
                            <div className="py-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>{product?.model} {sizeCode} {selection.productCategory === 'roof-window' ? 'Roof Window' : (isSunTunnel ? 'Sun Tunnel' : 'Skylight')}</span>
                                    <span>${basePrice}</span>
                                </div>
                                {blind && blindPrice > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>{blind.model} {sizeCode} {blind.name} Blind</span>
                                        <span>${blindPrice}</span>
                                    </div>
                                )}
                                {(flashingPrice > 0 || flashingName.includes('Custom') || flashingName.includes('Integrated')) && (
                                    <div className="flex justify-between text-sm">
                                        <span className={flashingName.includes('Custom') ? "font-bold text-red-600" : ""}>
                                            {flashingName.split('\n').map((line, i) => (
                                                <span key={i} className="block">{line}</span>
                                            ))}
                                        </span>
                                        <span>{flashingPrice > 0 ? `$${flashingPrice}` : ''}</span>
                                    </div>
                                )}
                                {selection.selectedInsectScreen && screenPrice > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>ZIL {sizeCode} Insect Screen</span>
                                        <span>${screenPrice}</span>
                                    </div>
                                )}
                                {addonName && addonPrice > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>{addonName}</span>
                                        <span>${addonPrice}</span>
                                    </div>
                                )}
                                {accessoryPrice > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>{accessoryName}</span>
                                        <span>${accessoryPrice}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between py-4 border-t border-b text-xl font-bold mt-4">
                                <span>TOTAL ESTIMATE (RRP)</span>
                                <span className="text-primary">${total}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">* Does not include installation</p>
                            {product?.id === 'vse' && (
                                <p className="text-xs text-red-600 mt-1">* Requires Certified Electrician</p>
                            )}
                        </div>

                        <div className="w-full md:w-64 flex flex-col items-center">
                            {product?.image && <img src={product.image} alt={product.name} className="w-full object-contain mb-4 rounded-lg" />}
                            {blind && blind.image && (
                                <div className="relative w-full mt-2">
                                    <img src={blind.image} alt={blind.name} className="w-full h-32 object-contain rounded-lg border p-2" />
                                    <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                                        + Blind
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8 no-print">
                        <Button variant="outline" onClick={() => handleExportPDF()} className="flex-1">
                            Export Summary
                        </Button>
                        <Button onClick={() => window.location.reload()} className="flex-1">
                            Start New Selection
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const currentTitle = () => {
        switch (step) {
            case 'product-type': return 'Select Product Category';
            case 'pitch': return 'Is your roof pitched or flat?';
            case 'material': return 'What is the roof material?';
            case 'sun-tunnel-type': return 'Select Sun Tunnel Type';
            case 'roof-window-model': return 'Select Operation Method';
            case 'opening': return 'How should the skylight open?';
            case 'truss': return 'What is your truss/rafter spacing?';
            case 'size': return selection.productCategory === 'roof-window' ? 'Select Window Size' : 'Select Skylight Size';
            case 'results': return 'Selection Results';
            case 'blinds': return selection.productCategory === 'roof-window' ? 'Choose Upgrades' : 'Do you require blinds?';
            case 'addon': return 'Add Rigid Extension?';
            case 'summary': return 'Selection Summary';
            default: return '';
        }
    };



    return (
        <div className="max-w-2xl mx-auto w-full min-h-screen py-10 px-4 flex flex-col font-sans">
            {/* Header - Minimalist */}
            <div className="mb-12 text-center">
                <img src="/velux logo.svg" alt="VELUX" className="h-16 mx-auto mb-2" />
            </div>

            {/* Step Title - clean */}
            <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                {/* Back Button */}
                {step !== 'product-type' && (
                    <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground" onClick={backStep}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                )}

                <h1 className="text-3xl font-light text-gray-900 mb-2">{currentTitle()}</h1>
                <div className="h-1 w-20 bg-primary mb-6"></div>
            </motion.div>
            {/* Content */}
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {step === 'product-type' && renderProductTypeStep()}
                        {step === 'pitch' && renderPitchStep()}
                        {step === 'material' && renderMaterialStep()}
                        {step === 'sun-tunnel-type' && renderSunTunnelTypeStep()}
                        {step === 'roof-window-model' && renderRoofWindowModelStep()}
                        {step === 'opening' && renderOpeningStep()}
                        {step === 'truss' && renderTrussStep()}
                        {step === 'size' && renderSizeStep()}
                        {step === 'results' && renderResultsStep()}
                        {step === 'blinds' && renderBlindsStep()}
                        {step === 'addon' && renderAddonStep()}
                        {step === 'summary' && renderSummaryStep()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
