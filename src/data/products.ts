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
    compatibleSizes: string[];
    image?: string;
}

export interface Flashing {
    id: string;
    name: string;
    prices: Record<string, number>;
}

export interface Blind {
    id: string;
    model: string;
    name: string;
    type: string; // "darkening" or "translucent"
    compatibleModels: string[]; // "FS", "VS", "VSE", "VSS"
    prices: Record<string, number>;
    image?: string;
    subtitle?: string;
}

// ----------------------------------------------------------------------
// DATA
// ----------------------------------------------------------------------

export const PITCHED_SIZES: Size[] = [
    { code: 'C01', width: 550, height: 700, label: '550 x 700' },
    { code: 'C04', width: 550, height: 980, label: '550 x 980' },
    { code: 'C06', width: 550, height: 1180, label: '550 x 1180' },
    { code: 'C08', width: 550, height: 1400, label: '550 x 1400' },
    { code: 'C12', width: 550, height: 1800, label: '550 x 1800' },
    { code: 'M02', width: 780, height: 780, label: '780 x 780' },
    { code: 'M04', width: 780, height: 980, label: '780 x 980' },
    { code: 'M06', width: 780, height: 1180, label: '780 x 1180' },
    { code: 'M08', width: 780, height: 1400, label: '780 x 1400' },
    { code: 'S01', width: 1140, height: 700, label: '1140 x 700' },
    { code: 'S06', width: 1140, height: 1180, label: '1140 x 1180' },
];

export const FLAT_SIZES: Size[] = [
    { code: '1430', width: 460, height: 870, label: '460 x 870' }, // Overall Curb
    { code: '2222', width: 665, height: 665, label: '665 x 665' },
    { code: '2230', width: 665, height: 870, label: '665 x 870' },
    { code: '2234', width: 665, height: 970, label: '665 x 970' },
    { code: '2246', width: 665, height: 1275, label: '665 x 1275' },
    { code: '2270', width: 665, height: 1885, label: '665 x 1885' },
    { code: '3030', width: 870, height: 870, label: '870 x 870' },
    { code: '3046', width: 870, height: 1275, label: '870 x 1275' },
    { code: '3055', width: 870, height: 1505, label: '870 x 1505' },
    { code: '3072', width: 870, height: 1935, label: '870 x 1935' },
    { code: '3434', width: 970, height: 970, label: '970 x 970' },
    { code: '3446', width: 970, height: 1275, label: '970 x 1275' },
    { code: '4622', width: 1275, height: 665, label: '1275 x 665' },
    { code: '4646', width: 1275, height: 1275, label: '1275 x 1275' },
    { code: '4672', width: 1275, height: 1935, label: '1275 x 1935' },
];

export const ROOF_WINDOW_SIZES: Size[] = [
    { code: 'CK02', width: 550, height: 780, label: '550 x 780' },
    { code: 'CK04', width: 550, height: 980, label: '550 x 980' },
    { code: 'MK04', width: 780, height: 980, label: '780 x 980' },
    { code: 'MK06', width: 780, height: 1180, label: '780 x 1180' },
    { code: 'MK08', width: 780, height: 1400, label: '780 x 1400' },
    { code: 'SK06', width: 1140, height: 1180, label: '1140 x 1180' },
];

export const PRODUCTS: Product[] = [
    // PITCHED ROOF
    {
        id: 'fs',
        model: 'FS',
        name: 'Fixed Skylight (FS)',
        roofType: ['pitched'],
        openingType: 'fixed',
        compatibleSizes: ['C01', 'C04', 'C06', 'C08', 'C12', 'M02', 'M04', 'M06', 'M08', 'S01', 'S06'],
        prices: {
            'C01': 558, 'C04': 645, 'C06': 740, 'C08': 827, 'C12': 1170,
            'M02': 761, 'M04': 803, 'M06': 909, 'M08': 1017, 'S01': 885,
            'S06': 1056
        },
        image: '/FS-skylight.jpg'
    },
    {
        id: 'vs',
        model: 'VS',
        name: 'Manual Opening Skylight (VS)',
        roofType: ['pitched'],
        openingType: 'manual',
        compatibleSizes: ['C01', 'C04', 'C06', 'C08', 'M02', 'M04', 'M06', 'M08', 'S01', 'S06'],
        prices: {
            'C01': 1271, 'C04': 1292, 'C06': 1381, 'C08': 1451, 'M02': 1451,
            'M04': 1514, 'M06': 1653, 'M08': 1792, 'S01': 1594, 'S06': 2009
        },
        image: '/VS-skylight.jpg'
    },
    {
        id: 'vse',
        model: 'VSE',
        name: 'Electric Opening Skylight (VSE)',
        roofType: ['pitched'],
        openingType: 'electric',
        compatibleSizes: ['C01', 'C04', 'C06', 'C08', 'M04', 'M06', 'M08', 'S01', 'S06'],
        prices: {
            'C01': 2392, 'C04': 2421, 'C06': 2486, 'C08': 2547, 'M04': 2596,
            'M06': 2709, 'M08': 2823, 'S01': 2686, 'S06': 2995
        },
        image: '/VSE-skylight.jpg'
    },
    {
        id: 'vss',
        model: 'VSS',
        name: 'Solar Opening Skylight (VSS)',
        roofType: ['pitched'],
        openingType: 'solar',
        compatibleSizes: ['C01', 'C04', 'C06', 'C08', 'M02', 'M04', 'M06', 'M08', 'S01', 'S06'],
        prices: {
            'C01': 2579, 'C04': 2610, 'C06': 2680, 'C08': 2746, 'M02': 2735,
            'M04': 2799, 'M06': 2921, 'M08': 3043, 'S01': 2896, 'S06': 3229
        },
        image: '/VSS-skylight.png'
    },
    // ROOF WINDOWS
    {
        id: 'ggl',
        model: 'GGL',
        name: 'Centre Pivot Roof Window (GGL)',
        roofType: ['pitched'],
        openingType: 'manual',
        compatibleSizes: ['CK02', 'CK04', 'MK04', 'MK08', 'SK06'],
        prices: {
            'CK02': 842, 'CK04': 893, 'MK04': 1045, 'MK08': 1277, 'SK06': 1581
        },
        image: '/GGL-roof-window.png'
    },
    {
        id: 'gpl',
        model: 'GPL',
        name: 'Dual Action Roof Window (GPL)',
        roofType: ['pitched'],
        openingType: 'manual',
        compatibleSizes: ['CK04', 'MK04', 'MK06', 'MK08', 'SK06'],
        prices: {
            'CK04': 1003, 'MK04': 1153, 'MK06': 1264, 'MK08': 1429, 'SK06': 1665
        },
        image: '/GPL-roof-window.png'
    },

    // FLAT ROOF
    {
        id: 'fcm',
        model: 'FCM',
        name: 'Flat Roof Fixed (FCM)',
        roofType: ['flat'],
        openingType: 'fixed',
        compatibleSizes: ['1430', '2222', '2230', '2234', '2246', '2270', '3030', '3046', '3055', '3072', '3434', '3446', '4646', '4672'],
        // Excluding 4622 as it is not in price list for FCM
        prices: {
            '1430': 379, '2222': 411, '2230': 447, '2234': 473, '2246': 537,
            '2270': 968, '3030': 519, '3046': 659, '3055': 804, '3072': 2041,
            '3434': 591, '3446': 696, '4646': 731, '4672': 2271
        },
        image: '/FCM-skylight.jpg'
    },
    {
        id: 'vcm',
        model: 'VCM',
        name: 'Flat Roof Manual (VCM)',
        roofType: ['flat'],
        openingType: 'manual',
        compatibleSizes: ['2222', '2234', '2246', '3030', '3046', '3434', '4646'],
        prices: {
            '2222': 1342, '2234': 1449, '2246': 1601, '3030': 1678, '3046': 1822,
            '3434': 1753, '4646': 2136
        },
        image: '/VCM-skylight.jpg'
    },
    {
        id: 'vcs',
        model: 'VCS',
        name: 'Flat Roof Solar (VCS)',
        roofType: ['flat'],
        openingType: 'solar',
        compatibleSizes: ['2222', '2234', '2246', '3030', '3046', '3434', '4622', '4646'],
        prices: {
            '2222': 2598, '2234': 2747, '2246': 2927, '3030': 2937, '3046': 3081,
            '3434': 3000, '4622': 2946, '4646': 3228
        },
        image: '/VCS-skylight.jpg',
    },
    // SUN TUNNELS
    {
        id: 'twr',
        model: 'TWR',
        name: 'Rigid Sun Tunnel (TWR)',
        roofType: ['pitched'],
        openingType: 'fixed', // Not really opening, but prevents filter issues if generic
        compatibleSizes: ['0K14'],
        prices: {
            '0K14': 781
        },
        image: '/TWR-sun-tunnel.jpg'
    },
    {
        id: 'twf',
        model: 'TWF',
        name: 'Flexible Sun Tunnel (TWF)',
        roofType: ['pitched'],
        openingType: 'fixed',
        compatibleSizes: ['0K14'],
        prices: {
            '0K14': 482
        },
        image: '/TWF-sun-tunnel.jpg'
    },
    {
        id: 'tcr',
        model: 'TCR',
        name: 'Sun Tunnel (TCR)',
        roofType: ['flat', 'pitched'], // Can be used on both per user logic
        openingType: 'fixed',
        compatibleSizes: ['014'],
        prices: {
            '014': 831
        },
        image: '/TCR-sun-tunnel.jpg'
    }
];

export const FLASHINGS: Flashing = {
    id: 'edw',
    name: 'EDW Flashing (Tile/Corrugated)',
    prices: {
            'C01': 117, 'C04': 123, 'C06': 124, 'C08': 132, 'C12': 164,
            'M02': 142, 'M04': 142, 'M06': 146, 'M08': 149, 'S01': 150,
            'S06': 176, 'CK02': 122, 'CK04': 135, 'MK04': 155, 'MK06': 160,
            'MK08': 163, 'SK06': 193
        }
};

export const BLINDS: Blind[] = [
    {
        id: 'fscd',
        model: 'FSCD',
        name: 'Solar Honeycomb',
        subtitle: '(Darkening)',
        type: 'darkening',
        compatibleModels: ['FS'],
        prices: {
            'C01': 635, 'C04': 635, 'C06': 635, 'C08': 635, 'C12': 794,
            'M02': 650, 'M04': 650, 'M06': 650, 'M08': 650, 'S01': 663,
            'S06': 663
        },
        image: '/solar-honeycomb-blackout.png'
    },
    {
        id: 'fsld',
        model: 'FSLD',
        name: 'Solar Translucent',
        subtitle: '(Light Filtering)',
        type: 'translucent',
        compatibleModels: ['FS'],
        prices: {
            'C01': 635, 'C04': 635, 'C06': 635, 'C08': 635, 'C12': 0,
            'M02': 650, 'M04': 650, 'M06': 650, 'M08': 650, 'S01': 663,
            'S06': 663
        },
        image: '/solar-translucent.png'
        // Note: C12 excluded in data markdown for FSLD/FSCH/FSLH
    },
    {
        id: 'fsch',
        model: 'FSCH',
        name: 'Solar Honeycomb',
        subtitle: '(Darkening)',
        type: 'darkening',
        compatibleModels: ['VS', 'VSE', 'VSS'],
        prices: {
            'C01': 635, 'C04': 635, 'C06': 635, 'C08': 635, 'M02': 650,
            'M04': 650, 'M06': 650, 'M08': 650, 'S01': 663, 'S06': 663
        },
        image: '/solar-honeycomb-blackout.png'
    },
    {
        id: 'fslh',
        model: 'FSLH',
        name: 'Solar Translucent',
        subtitle: '(Light Filtering)',
        type: 'translucent',
        compatibleModels: ['VS', 'VSE', 'VSS'],
        prices: {
            'C01': 635, 'C04': 635, 'C06': 635, 'C08': 635, 'M02': 650,
            'M04': 650, 'M06': 650, 'M08': 650, 'S01': 663, 'S06': 663
        },
        image: '/solar-translucent.png'
    },
    // ROOF WINDOW BLINDS
    {
        id: 'fhc',
        model: 'FHC',
        name: 'Manual Honeycomb Blackout',
        subtitle: '(Room Darkening)',
        type: 'darkening',
        compatibleModels: ['GGL', 'GPL'],
        prices: {
            'CK02': 257, 'CK04': 273, 'MK04': 283, 'MK06': 302, 'MK08': 329,
            'SK06': 355
        },
        image: '/solar-honeycomb-blackout.png' // Utilizing existing image for now
    },
    {
        id: 'zil',
        model: 'ZIL',
        name: 'Insect Screen',
        type: 'accessory',
        compatibleModels: ['GGL', 'GPL'],
        prices: {
            'CK02': 339, 'CK04': 339, 'MK04': 419, 'MK06': 419, 'MK08': 419,
            'SK06': 465, 'CK06': 351, 'MK10': 433, 'SK10': 481
        },
        image: '/ZIL-insect-screen.png'
    },
    // Flat roof blinds
    {
        id: 'fscc',
        model: 'FSCC',
        name: 'Solar Honeycomb',
        subtitle: '(Darkening)',
        type: 'darkening',
        compatibleModels: ['FCM', 'VCM', 'VCS'],
        prices: {
            '1430': 615, '2222': 637, '2230': 637, '2234': 637, '2246': 637,
            '2270': 731, '3030': 649, '3046': 649, '3055': 640, '3072': 706,
            '3434': 662, '3446': 662, '4646': 704, '4672': 706, '4622': 704
        },
        image: '/solar-honeycomb-blackout.png'
    }
];

export const ACCESSORIES = [
    {
        id: 'zzz199',
        name: 'ZZZ 199 Blind Tray',
        compatibleModels: ['FCM', 'VCM', 'VCS'],
        prices: {
            '2222': 98, '2230': 98, '2234': 98, '2246': 98, '2270': 126,
            '3030': 101, '3046': 101, '3434': 105, '3446': 105, '4622': 109,
            '4646': 109
        }
    },
    {
        id: 'ztr0k14',
        name: 'ZTR 0K14 Rigid 1240mm Extension',
        compatibleModels: ['TWR', 'TCR'],
        prices: {
            '0K14': 307
        }
    }
];

