export type RoofType = 'pitched' | 'flat';
export type OpeningType = 'fixed' | 'manual' | 'electric' | 'solar';

export interface Size {
    code: string;
    width: number;
    height: number;
    label: string; // "550 x 700"
}

export interface Product {
    id: string;
    model: string;
    name: string;
    roofType: RoofType[];
    openingType: OpeningType;
    prices: Record<string, number>; // sizeCode -> price
    newPrices?: Record<string, number>; // sizeCode -> price
    compatibleSizes: string[];
    image?: string;
    rValues?: Record<string, number | string>;
    shgc?: number;
    rw?: number;
    vlt?: number;
    balRating?: string;
    hailResistance?: string;
    daylightArea?: Record<string, number>;
}

export interface Flashing {
    id: string;
    name: string;
    prices: Record<string, number>;
    newPrices?: Record<string, number>;
}

export interface Blind {
    id: string;
    model: string;
    name: string;
    type: string; // "darkening" or "translucent"
    compatibleModels: string[]; // "FS", "VS", "VSE", "VSS"
    prices: Record<string, number>;
    newPrices?: Record<string, number>;
    image?: string;
    subtitle?: string;
}

export interface Accessory {
    id: string;
    name: string;
    compatibleModels: string[];
    prices: Record<string, number>;
    newPrices?: Record<string, number>;
}

// ----------------------------------------------------------------------
// DATA
// ----------------------------------------------------------------------

export const PITCHED_SIZES: Size[] = [
    { code: 'C01', width: 550, height: 700, label: '550 x 700' },
    { code: 'C04', width: 550, height: 980, label: '550 x 980' },
    { code: 'C08', width: 550, height: 1400, label: '550 x 1400' },
    { code: 'M02', width: 780, height: 780, label: '780 x 780' },
    { code: 'M04', width: 780, height: 980, label: '780 x 980' },
    { code: 'M06', width: 780, height: 1180, label: '780 x 1180' },
    { code: 'M08', width: 780, height: 1400, label: '780 x 1400' },
    { code: 'S01', width: 1140, height: 700, label: '1140 x 700' },
    { code: 'S06', width: 1140, height: 1180, label: '1140 x 1180' },
];

export const FLAT_SIZES: Size[] = [
    { code: '1430', width: 488, height: 895, label: '488 x 895' },
    { code: '2222', width: 692, height: 692, label: '692 x 692' },
    { code: '2230', width: 692, height: 895, label: '692 x 895' },
    { code: '2234', width: 692, height: 997, label: '692 x 997' },
    { code: '2246', width: 692, height: 1302, label: '692 x 1302' },
    { code: '2270', width: 692, height: 1911, label: '692 x 1911' },
    { code: '3030', width: 895, height: 895, label: '895 x 895' },
    { code: '3046', width: 895, height: 1302, label: '895 x 1302' },
    { code: '3055', width: 895, height: 1527, label: '895 x 1527' },
    { code: '3072', width: 895, height: 1959, label: '895 x 1959' },
    { code: '3434', width: 997, height: 997, label: '997 x 997' },
    { code: '3446', width: 997, height: 1302, label: '997 x 1302' },
    { code: '4622', width: 1302, height: 692, label: '1302 x 692' },
    { code: '4646', width: 1302, height: 1302, label: '1302 x 1302' },
    { code: '4672', width: 1302, height: 1959, label: '1302 x 1959' },
];

export const ROOF_WINDOW_SIZES: Size[] = [
    { code: 'CK02', width: 550, height: 780, label: '550 x 780' },
    { code: 'CK04', width: 550, height: 980, label: '550 x 980' },
    { code: 'MK04', width: 780, height: 980, label: '780 x 980' },
    { code: 'MK06', width: 780, height: 1180, label: '780 x 1180' },
    { code: 'MK08', width: 780, height: 1400, label: '780 x 1400' },
    { code: 'SK06', width: 1140, height: 1180, label: '1140 x 1180' },
    { code: 'SK08', width: 1140, height: 1400, label: '1140 x 1400' },
];

const rawPRODUCTS: Product[] = [
    // PITCHED ROOF
    {
        id: 'fs',
        model: 'FS',
        name: 'Fixed Skylight (FS)',
        roofType: ['pitched'],
        openingType: 'fixed',
        compatibleSizes: ['C01', 'C04', 'C08', 'M02', 'M04', 'M06', 'M08', 'S01', 'S06'],
        prices: {
            'C01': 648,
            'C04': 722,
            'C08': 812,
            'M02': 812,
            'M04': 820,
            'M06': 902,
            'M08': 976,
            'S01': 869,
            'S06': 1050
        },
        image: '/FS-skylight.jpg',
        rValues: {
            'C01': '0.356', 'C04': '0.372', 'C08': '0.385', 'M02': '0.385', 'M04': '0.398',
            'M06': '0.406', 'M08': '0.413', 'S01': '0.397', 'S06': '0.430'
        },
        shgc: 0.24,
        rw: 32,
        vlt: 0.52,
        balRating: 'BAL-40',
        hailResistance: 'ASTM E822',
        daylightArea: {
            'C01': 0.19, 'C04': 0.29, 'C08': 0.44,
            'M02': 0.38, 'M04': 0.50, 'M06': 0.62, 'M08': 0.75,
            'S01': 0.45, 'S06': 0.95
        }
    },
    {
        id: 'vs',
        model: 'VS',
        name: 'Manual Opening Skylight (VS)',
        roofType: ['pitched'],
        openingType: 'manual',
        compatibleSizes: ['C04', 'C08', 'M02', 'M04', 'M06', 'M08', 'S01', 'S06'],
        prices: {
            'C04': 1367,
            'C08': 1456,
            'M02': 1471,
            'M04': 1486,
            'M06': 1560,
            'M08': 1649,
            'S01': 1531,
            'S06': 1694
        },
        image: '/VS-skylight.jpg',
        rValues: {
            'C04': '0.382', 'C08': '0.389', 'M02': '0.402', 'M04': '0.410', 'M06': '0.416',
            'M08': '0.420', 'S01': '0.418', 'S06': '0.441'
        },
        shgc: 0.24,
        rw: 32,
        vlt: 0.52,
        balRating: 'BAL-40',
        hailResistance: 'ASTM E822',
        daylightArea: {
            'C04': 0.29, 'C08': 0.44, 'M02': 0.38,
            'M04': 0.50, 'M06': 0.62, 'M08': 0.75, 'S01': 0.45, 'S06': 0.95
        }
    },
    {
        id: 'vse',
        model: 'VSE',
        name: 'Electric Opening Skylight (VSE)',
        roofType: ['pitched'],
        openingType: 'electric',
        compatibleSizes: ['C04', 'C08', 'M04', 'M06', 'M08', 'S01', 'S06'],
        prices: {
            'C04': 2443,
            'C08': 2470,
            'M04': 2525,
            'M06': 2580,
            'M08': 2690,
            'S01': 2580,
            'S06': 2718
        },
        image: '/VSE-skylight.jpg',
        rValues: {
            'C04': '0.382', 'C08': '0.389', 'M04': '0.410', 'M06': '0.416', 'M08': '0.420',
            'S01': '0.418', 'S06': '0.441'
        },
        shgc: 0.24,
        rw: 32,
        vlt: 0.52,
        balRating: 'BAL-40',
        hailResistance: 'ASTM E822',
        daylightArea: {
            'C04': 0.29, 'C08': 0.44,
            'M04': 0.50, 'M06': 0.62, 'M08': 0.75, 'S01': 0.45, 'S06': 0.95
        }
    },
    {
        id: 'vss',
        model: 'VSS',
        name: 'Solar Opening Skylight (VSS)',
        roofType: ['pitched'],
        openingType: 'solar',
        compatibleSizes: ['C04', 'C08', 'M02', 'M04', 'M06', 'M08', 'S01', 'S06'],
        prices: {
            'C04': 2668,
            'C08': 2695,
            'M02': 2723,
            'M04': 2750,
            'M06': 2805,
            'M08': 2915,
            'S01': 2805,
            'S06': 2943
        },
        image: '/VSS-skylight.png',
        rValues: {
            'C04': '0.382', 'C08': '0.389', 'M02': '0.402', 'M04': '0.410', 'M06': '0.416',
            'M08': '0.420', 'S01': '0.418', 'S06': '0.441'
        },
        shgc: 0.24,
        rw: 32,
        vlt: 0.52,
        balRating: 'BAL-40',
        hailResistance: 'ASTM E822',
        daylightArea: {
            'C04': 0.29, 'C08': 0.44, 'M02': 0.38,
            'M04': 0.50, 'M06': 0.62, 'M08': 0.75, 'S01': 0.45, 'S06': 0.95
        }
    },
    // ROOF WINDOWS
    {
        id: 'ggu_0076',
        model: 'GGU 0076',
        name: 'Centre Pivot Roof Window (Double Glazing)',
        roofType: ['pitched'],
        openingType: 'manual',
        compatibleSizes: ['CK02', 'CK04', 'MK04', 'MK06', 'MK08', 'SK06', 'SK08'],
        prices: {
            'CK02': 920,
            'CK04': 992,
            'MK04': 1089,
            'MK06': 1210,
            'MK08': 1283,
            'SK06': 1537,
            'SK08': 1755
        },
        image: '/GGL-roof-window.png',
        rValues: {
            'CK02': '0.500', 'CK04': '0.500', 'MK04': '0.530', 'MK06': '0.530', 'MK08': '0.530', 'SK06': '0.530', 'SK08': 'X'
        },
        shgc: 0.31,
        rw: 34,
        vlt: 0.53,
        balRating: 'BAL-40',
        hailResistance: 'ASTM E822',
        daylightArea: {
            'CK02': 0.22, 'CK04': 0.29, 'MK04': 0.47, 'MK06': 0.59, 'MK08': 0.72, 'SK06': 0.91, 'SK08': 1.10
        }
    },
    {
        id: 'ggu_0066',
        model: 'GGU 0066',
        name: 'Centre Pivot Roof Window (Triple Glazing)',
        roofType: ['pitched'],
        openingType: 'manual',
        compatibleSizes: ['CK04', 'MK04', 'MK08', 'SK06'],
        prices: {
            'CK04': 1401,
            'MK04': 1498,
            'MK08': 1692,
            'SK06': 1946
        },
        image: '/GGL-roof-window.png',
        rValues: {
            'CK04': '0.670', 'MK04': '0.710', 'MK08': '0.710', 'SK06': '0.770'
        },
        shgc: 0.28,
        rw: 37,
        vlt: 0.48,
        balRating: 'BAL-40',
        hailResistance: 'ASTM E822',
        daylightArea: {
            'CK04': 0.29, 'MK04': 0.47, 'MK08': 0.72, 'SK06': 0.91
        }
    },
    // FLAT ROOF
    {
        id: 'fcm',
        model: 'FCM',
        name: 'Flat Roof Fixed (FCM)',
        roofType: ['flat'],
        openingType: 'fixed',
        compatibleSizes: ['1430', '2222', '2230', '2234', '2246', '2270', '3030', '3046', '3055', '3072', '3434', '3446', '4622', '4646', '4672'],
        prices: {
            '1430': 614,
            '2222': 629,
            '2230': 652,
            '2234': 697,
            '2246': 758,
            '2270': 1160,
            '3030': 750,
            '3046': 902,
            '3055': 1114,
            '3072': 2054,
            '3434': 766,
            '3446': 978,
            '4622': 740,
            '4646': 1114,
            '4672': 2274
        },
        image: '/FCM-skylight.jpg',
        rValues: {
            '1430': '0.362', '2222': '0.365', '2230': '0.365', '2234': '0.365', '2246': '0.365',
            '2270': '0.365', '3030': '0.396', '3046': '0.396', '3055': '0.410', '3072': '0.410',
            '3434': '0.409', '3446': '0.409', '4622': '0.365', '4646': '0.438', '4672': '0.438'
        },
        shgc: 0.24,
        rw: 32,
        vlt: 0.52,
        balRating: 'BAL-40',
        hailResistance: 'ASTM E822',
        daylightArea: {
            '1430': 0.28, '2222': 0.33, '2230': 0.44, '2234': 0.50, '2246': 0.68,
            '2270': 1.02, '3030': 0.58, '3046': 0.88, '3055': 1.04, '3072': 1.34,
            '3434': 0.72, '3446': 0.98, '4622': 0.68, '4646': 1.32, '4672': 2.01
        }
    },
    {
        id: 'vcm',
        model: 'VCM',
        name: 'Flat Roof Manual (VCM)',
        roofType: ['flat'],
        openingType: 'manual',
        compatibleSizes: ['2222', '2234', '2246', '3030', '3046', '4646'],
        prices: {
            '2222': 1587,
            '2234': 1712,
            '2246': 1783,
            '3030': 1747,
            '3046': 1952,
            '4646': 2095
        },
        image: '/VCM-skylight.jpg',
        rValues: {
            '2222': '0.374', '2234': '0.393', '2246': '0.403', '3030': '0.403', '3046': '0.422',
            '4646': '0.443'
        },
        shgc: 0.24,
        rw: 32,
        vlt: 0.52,
        balRating: 'BAL-40',
        hailResistance: 'ASTM E822',
        daylightArea: {
            '2222': 0.33, '2234': 0.50, '2246': 0.68, '3030': 0.58, '3046': 0.88,
            '4646': 1.32
        }
    },
    {
        id: 'vcs',
        model: 'VCS',
        name: 'Flat Roof Solar (VCS)',
        roofType: ['flat'],
        openingType: 'solar',
        compatibleSizes: ['2222', '2234', '2246', '3030', '3046', '4622', '4646'],
        prices: {
            '2222': 2765,
            '2234': 2852,
            '2246': 2910,
            '3030': 2881,
            '3046': 3056,
            '4622': 2910,
            '4646': 3163
        },
        image: '/VCS-skylight.jpg',
        rValues: {
            '2222': '0.374', '2234': '0.393', '2246': '0.403', '3030': '0.403', '3046': '0.422',
            '4622': '0.403', '4646': '0.443'
        },
        shgc: 0.24,
        rw: 32,
        vlt: 0.52,
        balRating: 'BAL-40',
        hailResistance: 'ASTM E822',
        daylightArea: {
            '2222': 0.33, '2234': 0.50, '2246': 0.68, '3030': 0.58, '3046': 0.88,
            '4622': 0.68, '4646': 1.32
        }
    },
    // SUN TUNNELS
    {
        id: 'twr',
        model: 'TWR',
        name: 'Rigid Sun Tunnel (TWR)',
        roofType: ['pitched', 'flat'],
        openingType: 'fixed',
        compatibleSizes: ['0K14'],
        prices: {
            '0K14': 881
        },
        image: '/TWR-sun-tunnel.jpg',
        rValues: {
            '0K14': '0.330'
        },
        daylightArea: { '0K14': 0.10 }
    },
    {
        id: 'twf',
        model: 'TWF',
        name: 'Flexible Sun Tunnel (TWF)',
        roofType: ['pitched', 'flat'],
        openingType: 'fixed',
        compatibleSizes: ['0K14'],
        prices: {
            '0K14': 626
        },
        image: '/TWF-sun-tunnel.jpg',
        rValues: {
            '0K14': '0.330'
        },
        daylightArea: { '0K14': 0.10 }
    },
    {
        id: 'tcr',
        model: 'TCR',
        name: 'Sun Tunnel (TCR)',
        roofType: ['flat', 'pitched'],
        openingType: 'fixed',
        compatibleSizes: ['014'],
        prices: {
            '014': 1004
        },
        image: '/TCR-sun-tunnel.jpg',
        rValues: {
            '014': '0.330'
        },
        daylightArea: { '014': 0.10 }
    }
];
const rawFLASHINGS: Flashing[] = [
    {
        id: 'edw',
        name: 'EDW Flashing (Tile/Metal Roofs)',
        prices: {
            'C01': 214,
            'C04': 224,
            'C08': 235,
            'CK02': 206,
            'CK04': 224,
            'M02': 235,
            'M04': 246,
            'M06': 267,
            'M08': 280,
            'MK04': 246,
            'MK06': 267,
            'MK08': 280,
            'S01': 280,
            'S06': 291,
            'SK06': 291,
            'SK08': 299
        },
    },
    {
        id: 'edl',
        name: 'EDL Flashing (Slate/Shingle Roofs)',
        prices: {
            'C01': 204,
            'C04': 204,
            'C08': 204,
            'CK02': 197,
            'CK04': 205,
            'M02': 246,
            'M04': 246,
            'M06': 246,
            'M08': 246,
            'MK04': 236,
            'MK06': 256,
            'MK08': 269,
            'S01': 256,
            'S06': 256,
            'SK06': 279,
            'SK08': 292
        },
    }
];

const rawBLINDS: Blind[] = [
    {
        id: 'fscd',
        model: 'FSCD',
        name: 'Solar Honeycomb',
        subtitle: '(Room Darkening)',
        type: 'darkening',
        compatibleModels: ['FS'],
        prices: {
            'C01': 710,
            'C04': 718,
            'C08': 741,
            'M02': 749,
            'M04': 772,
            'M06': 780,
            'M08': 788,
            'S01': 780,
            'S06': 811
        },
        image: '/solar-honeycomb-blackout.png'
    },
    {
        id: 'fsld',
        model: 'FSLD',
        name: 'Solar Pleated',
        subtitle: '(Light Filtering)',
        type: 'translucent',
        compatibleModels: ['FS'],
        prices: {
            'C01': 710,
            'C04': 718,
            'C08': 741,
            'M02': 749,
            'M04': 772,
            'M06': 780,
            'M08': 788,
            'S01': 780,
            'S06': 811
        },
        image: '/solar-translucent.png'
    },
    {
        id: 'fsch',
        model: 'FSCH',
        name: 'Solar Honeycomb',
        subtitle: '(Room Darkening)',
        type: 'darkening',
        compatibleModels: ['VS', 'VSE', 'VSS'],
        prices: {
            'C04': 718,
            'C08': 741,
            'M02': 749,
            'M04': 772,
            'M06': 780,
            'M08': 788,
            'S01': 780,
            'S06': 811
        },
        image: '/solar-honeycomb-blackout.png'
    },
    {
        id: 'fslh',
        model: 'FSLH',
        name: 'Solar Pleated',
        subtitle: '(Light Filtering)',
        type: 'translucent',
        compatibleModels: ['VS', 'VSE', 'VSS'],
        prices: {
            'C04': 718,
            'C08': 741,
            'M02': 749,
            'M04': 772,
            'M06': 780,
            'M08': 788,
            'S01': 780,
            'S06': 811
        },
        image: '/solar-translucent.png'
    },
    {
        id: 'dfd',
        model: 'DFD',
        name: 'Manual DUO Blind',
        subtitle: '(2 in 1 Blackout + Translucent)',
        type: 'darkening', 
        compatibleModels: ['GGU 0076', 'GGU 0066'],
        prices: {
            'CK02': 256,
            'CK04': 276,
            'MK04': 298,
            'MK06': 328,
            'MK08': 367,
            'SK06': 390,
            'SK08': 400
        },
        image: '/dfd-blind.png' 
    },
    // Flat roof blinds
    {
        id: 'fscc',
        model: 'FSCC',
        name: 'Solar Honeycomb',
        subtitle: '(Room Darkening)',
        type: 'darkening',
        compatibleModels: ['FCM', 'VCM', 'VCS'],
        prices: {
            '2222': 711,
            '2230': 726,
            '2234': 733,
            '2246': 748,
            '2270': 800,
            '3030': 763,
            '3046': 793,
            '3434': 770,
            '3446': 808,
            '4622': 830,
            '4646': 875
        },
        image: '/solar-honeycomb-blackout.png'
    },
    {
        id: 'fslc',
        model: 'FSLC',
        name: 'Solar Pleated',
        subtitle: '(Light Filtering)',
        type: 'translucent',
        compatibleModels: ['FCM', 'VCM', 'VCS'],
        prices: {
            '2222': 711,
            '2230': 726,
            '2234': 733,
            '2246': 748,
            '2270': 800,
            '3030': 763,
            '3046': 793,
            '3434': 770,
            '3446': 808,
            '4622': 830,
            '4646': 875
        },
        image: '/solar-translucent.png'
    }
];

const rawACCESSORIES: Accessory[] = [
    {
        id: 'zzz199',
        name: 'ZZZ 199 Blind Tray',
        compatibleModels: ['FCM'],
        prices: {
            '2222': 198,
            '2230': 210,
            '2234': 215,
            '2246': 236,
            '2270': 297,
            '3030': 248,
            '3046': 267,
            '3434': 257,
            '3446': 276,
            '4622': 236,
            '4646': 307
        },
    },
    {
        id: 'ztr014',
        name: 'ZTR 014 Rigid Extension',
        compatibleModels: ['TWR', 'TCR'],
        prices: {
            '014': 287
        },
    }
];

export const PRODUCTS = rawPRODUCTS;
export const FLASHINGS = rawFLASHINGS;
export const BLINDS = rawBLINDS;
export const ACCESSORIES = rawACCESSORIES;
