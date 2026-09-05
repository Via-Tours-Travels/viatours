/* ==========================================================================
   VIA TOURS & TRAVELS — CORE JAVASCRIPT ENGINE
   Features: Multi-Currency Engine, Luxury Fallback Catalog, Router Bug Fixes,
   Interactive Trip Wizard, Smart AI Concierge, Admin Management Portal
   ========================================================================== */

// --- INITIAL PRELOADER (LUXURY BRAND EXPERIENCE) ---
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader && !preloader.classList.contains('hidden')) {
        preloader.classList.add('hidden');
    }
}
window.addEventListener('load', () => {
    setTimeout(hidePreloader, 650);
});
setTimeout(hidePreloader, 1300);

// --- LUXURY BRAND EMBLEM FALLBACK (When Remote Logo Fails to Load) ---
function handleLogoError(img) {
    if (!img || img.dataset.hasFailed) return;
    img.dataset.hasFailed = 'true';
    img.onerror = null;

    const fallback = document.createElement('div');
    fallback.className = 'brand-emblem-fallback';
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', 'Via Tours & Travels Emblem');
    fallback.innerHTML = `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
                <linearGradient id="viaBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fef08a"/>
                    <stop offset="50%" stop-color="#d97706"/>
                    <stop offset="100%" stop-color="#92400e"/>
                </linearGradient>
                <radialGradient id="viaBgGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="rgba(217,119,6,0.2)"/>
                    <stop offset="100%" stop-color="rgba(217,119,6,0.05)"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" stroke="url(#viaBrandGrad)" stroke-width="2.5" fill="url(#viaBgGrad)"/>
            <polygon points="32,7 34,13 32,11 30,13" fill="url(#viaBrandGrad)"/>
            <polygon points="32,57 34,51 32,53 30,51" fill="url(#viaBrandGrad)"/>
            <polygon points="7,32 13,34 11,32 13,30" fill="url(#viaBrandGrad)"/>
            <polygon points="57,32 51,34 53,32 51,30" fill="url(#viaBrandGrad)"/>
            <path d="M20 21 L32 45 L44 21" stroke="url(#viaBrandGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M26 29 L38 29" stroke="url(#viaBrandGrad)" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
        </svg>
    `;

    if (img.parentNode) {
        img.parentNode.replaceChild(fallback, img);
    }
}
window.handleLogoError = handleLogoError;

// --- SUPABASE CLIENT SETUP ---
const SUPABASE_URL = 'https://goqwtovltftehautxekh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bQXp8x_2x4ymx4_oxcOFUA_UTGsqF-5';
const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// --- STATE MANAGEMENT ---
let appSettings = {
    business_name: 'Via Tours & Travels',
    email: 'hello@viatours.com',
    phone: '+91 98765 43210',
    whatsapp: '919876543210',
    address: 'MG Road, Bengaluru, Karnataka 560001, India'
};

let currentCurrency = localStorage.getItem('via_currency') || 'INR';
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
let activeDestFilter = null;
let activeCategoryFilter = null;
let currentPackage = null;
let currentItinerary = [];
let currentGallery = [];
let heroSearchQuery = null;

// Currency Conversion Rates (Base: INR)
const CURRENCY_RATES = {
    INR: { rate: 1, symbol: '₹', code: 'INR' },
    USD: { rate: 0.012, symbol: '$', code: 'USD' },
    EUR: { rate: 0.011, symbol: '€', code: 'EUR' },
    AED: { rate: 0.044, symbol: 'AED ', code: 'AED' }
};

// Initialize Theme
document.body.classList.toggle('dark-mode', isDarkMode);
updateThemeIcon();

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeIcon();
}

// --- CURRENCY CONVERTER ---
function changeCurrency(curr) {
    if (!CURRENCY_RATES[curr]) curr = 'INR';
    currentCurrency = curr;
    localStorage.setItem('via_currency', curr);
    const selector = document.getElementById('currencySelector');
    if (selector) selector.value = curr;
    
    // Re-render active views that contain prices
    const hash = window.location.hash || '#/home';
    if (hash.includes('package/')) {
        const parts = hash.split('/');
        if (parts[2]) loadPackageDetails(parts[2]);
    } else if (hash.includes('packages')) {
        loadPackages();
    } else if (hash.includes('home') || !hash || hash === '#/') {
        loadHomePackages();
    }
}

function formatPrice(amountINR) {
    const num = Number(amountINR) || 0;
    const curr = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.INR;
    const converted = Math.round(num * curr.rate);
    if (currentCurrency === 'INR') {
        return curr.symbol + converted.toLocaleString('en-IN');
    }
    return curr.symbol + converted.toLocaleString('en-US');
}

// --- SANITIZATION & HELPERS ---
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function debounce(fn, delay = 350) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = (type === 'success' ? '<i class="fas fa-check-circle"></i> ' : '<i class="fas fa-exclamation-circle"></i> ') + escapeHTML(msg);
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}

async function withLoading(button, fn) {
    if (!button) return fn();
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    try {
        await fn();
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmMessage').textContent = message;
    modal.style.display = 'flex';
    document.getElementById('confirmYes').onclick = () => {
        modal.style.display = 'none';
        onConfirm();
    };
    document.getElementById('confirmNo').onclick = () => {
        modal.style.display = 'none';
    };
}

// --- VERIFIED LUXURY FALLBACK CATALOG ---
const LUXURY_FALLBACK_DATA = {
    destinations: [
        {
            id: 'dest-maldives',
            name: 'Maldives',
            country: 'Maldives',
            region: 'South Asia / Indian Ocean',
            image_url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
            description: 'Idyllic turquoise atolls, pristine overwater villas, private coral reefs, and world-class underwater dining.',
            best_time: 'November to April',
            attractions: ['Male Atoll', 'Baa Atoll Biosphere', 'Ari Atoll Luxury Reefs'],
            is_published: true
        },
        {
            id: 'dest-switzerland',
            name: 'Switzerland',
            country: 'Switzerland',
            region: 'Europe',
            image_url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80',
            description: 'Majestic Alpine peaks, panoramic Glacier Express rail journeys, luxury chalets in Zermatt, and crystal lakes.',
            best_time: 'Year-round (Ski: Dec-Mar, Scenic: May-Oct)',
            attractions: ['Jungfraujoch', 'Matterhorn Zermatt', 'Lake Geneva', 'Interlaken'],
            is_published: true
        },
        {
            id: 'dest-bali',
            name: 'Bali',
            country: 'Indonesia',
            region: 'Southeast Asia',
            image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
            description: 'Lush terraced rice fields, sacred cliffside temples, private pool villas in Ubud, and breathtaking sunset beach clubs.',
            best_time: 'April to October',
            attractions: ['Ubud Rainforest', 'Uluwatu Cliff Temple', 'Seminyak Luxury Beach', 'Nusa Penida'],
            is_published: true
        },
        {
            id: 'dest-dubai',
            name: 'Dubai',
            country: 'United Arab Emirates',
            region: 'Middle East',
            image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
            description: 'Iconic architectural marvels, 7-star hospitality, luxury desert oasis glamping, and private superyacht charters.',
            best_time: 'October to April',
            attractions: ['Burj Al Arab', 'Palm Jumeirah', 'Desert Conservation Reserve', 'Dubai Marina'],
            is_published: true
        },
        {
            id: 'dest-kashmir',
            name: 'Kashmir',
            country: 'India',
            region: 'South Asia',
            image_url: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&q=80',
            description: 'The Paradise on Earth. Royal wooden houseboats on Dal Lake, snow slopes of Gulmarg, and saffron valleys of Pahalgam.',
            best_time: 'March to October (Snow: Dec-Feb)',
            attractions: ['Dal Lake Shikara', 'Gulmarg Gondola', 'Pahalgam Betaab Valley', 'Sonamarg'],
            is_published: true
        },
        {
            id: 'dest-amalfi',
            name: 'Amalfi Coast',
            country: 'Italy',
            region: 'Europe',
            image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
            description: 'Dramatic pastel cliffside villages, azure Mediterranean yachting, cliff-edge infinity pools, and Michelin dining.',
            best_time: 'May to September',
            attractions: ['Positano', 'Capri Island Yachting', 'Ravello Gardens', 'Amalfi Cathedral'],
            is_published: true
        }
    ],

    packages: [
        {
            id: 'pkg-maldives-sanctuary',
            title: 'Maldives Overwater Luxury Sanctuary 5★',
            price: 185000,
            duration: '5 Days / 4 Nights',
            category: 'Luxury',
            destination_id: 'dest-maldives',
            destinations: { name: 'Maldives', country: 'Maldives' },
            image_url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
            gallery_images: [
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
                'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
                'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
                'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&q=80'
            ],
            short_description: 'Private overwater pool villa at a 5-star resort with roundtrip scenic seaplane transfers and sunset dolphin yacht cruise.',
            description: 'Surrender to absolute paradise. Wake up to panoramic turquoise views from your private overwater pool villa. Enjoy gourmet all-inclusive dining across 4 signature restaurants, guided coral reef snorkeling, and a sunset champagne yacht cruise with dolphin watching.',
            itinerary: [
                { title: 'Day 1: Scenic Seaplane Arrival & Sunset Welcome', desc: 'Touch down at Velana Airport and board a scenic 35-minute seaplane flight over turquoise atolls. Check in to your private Overwater Pool Villa with complimentary champagne and evening sunset canapés.' },
                { title: 'Day 2: Private Reef Snorkeling & Floating Breakfast', desc: 'Indulge in an iconic floating breakfast in your private infinity pool. Afternoon guided marine biologist coral safari to swim with sea turtles and manta rays.' },
                { title: 'Day 3: Sunset Champagne Yacht Cruise', desc: 'Morning at leisure at the overwater spa with a signature 60-minute couple massage. Board a private luxury yacht for a sunset cruise with wild dolphin pod sightings.' },
                { title: 'Day 4: Sandbank Private Picnic & Stargazing', desc: 'Speedboat transfer to an exclusive uninhabited sandbank for a private gourmet chef lunch. Evening candlelit beach dinner under the stars.' },
                { title: 'Day 5: Farewell to Paradise', desc: 'Enjoy breakfast overlooking the lagoon before your return seaplane flight to Male for your international connection.' }
            ],
            inclusions: ['4 Nights in 5★ Overwater Pool Villa', 'Roundtrip Scenic Seaplane Transfers', 'Daily Gourmet Breakfast & Multi-Course Dinners', 'Sunset Champagne Dolphin Yacht Cruise', '60-Minute Couple Overwater Spa Treatment', 'Complimentary Snorkeling Gear & Non-Motorized Watersports', '24/7 Dedicated Island Butler Concierge'],
            exclusions: ['International Flight Tickets', 'Premium Alcoholic Brands Outside Meal Package', 'Personal Gratuities & Visa Fees', 'Motorized Jet Ski & Scuba Certification'],
            important_info: ['Passport must be valid for at least 6 months from arrival.', 'Complimentary 30-day tourist visa granted upon arrival in Maldives.', 'Seaplane flights operate strictly during daylight hours (06:00 - 16:30).'],
            is_published: true
        },
        {
            id: 'pkg-swiss-alps-express',
            title: 'Swiss Alps & Glacier Express Grand Tour',
            price: 245000,
            duration: '7 Days / 6 Nights',
            category: 'Luxury',
            destination_id: 'dest-switzerland',
            destinations: { name: 'Switzerland', country: 'Switzerland' },
            image_url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80',
            gallery_images: [
                'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=800&q=80',
                'https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=800&q=80',
                'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
                'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800&q=80'
            ],
            short_description: 'First-class panoramic Glacier Express rail, 5-star alpine chalets in Zermatt & Interlaken, and Jungfraujoch summit.',
            description: 'Experience Switzerland in ultimate grandeur. Travel aboard First Class Swiss Panoramic rail through soaring Alpine valleys, stay in 5-star mountain view chalets, visit Jungfraujoch — The Top of Europe, and cruise Lake Lucerne.',
            itinerary: [
                { title: 'Day 1: Zurich Arrival & Private Transfer to Lucerne', desc: 'VIP meet & greet at Zurich Airport. Private Mercedes chauffeur transfer to 5-star Grand Hotel National Lucerne. Evening private lake cruise with Swiss fondue.' },
                { title: 'Day 2: Mount Pilatus Golden Round Trip', desc: 'Ascend the world\'s steepest cogwheel railway to Mount Pilatus summit for breathtaking views across 73 Alpine peaks.' },
                { title: 'Day 3: Glacier Express First Class to Zermatt', desc: 'Board the legendary Glacier Express in First Class Excellence category. Travel through dramatic gorges and over 291 bridges with a 5-course gourmet lunch on board.' },
                { title: 'Day 4: Matterhorn Glacier Paradise & Zermatt Luxury', desc: 'Cable car ascent to Matterhorn Glacier Paradise (3,883m). Afternoon luxury chocolate tasting and stroll through car-free Zermatt village.' },
                { title: 'Day 5: Interlaken & Lauterbrunnen Valley of 72 Waterfalls', desc: 'Scenic journey to Interlaken. Private excursion through the fairytale Lauterbrunnen valley and Grindelwald First cliff walk.' },
                { title: 'Day 6: Jungfraujoch — Top of Europe', desc: 'Board the modern Eiger Express tri-cable gondola to Jungfraujoch. Walk through the Ice Palace and step onto the eternal snow of the Aletsch Glacier.' },
                { title: 'Day 7: Zurich Departure', desc: 'First class scenic train to Zurich Airport for your onward international flight.' }
            ],
            inclusions: ['6 Nights in 5★ Grand Alpine Hotels (Lucerne, Zermatt, Interlaken)', 'First Class Swiss Travel Pass with All Mountain Rail Excursions', 'Glacier Express First Class Reservation & 5-Course Dining', 'Jungfraujoch Top of Europe & Mount Pilatus Excursions', 'Private Mercedes Airport Transfers', 'Daily Swiss Gourmet Breakfast & Fondue Experiences', '24/7 Dedicated Swiss Concierge Support'],
            exclusions: ['International Flights to/from Zurich', 'Schengen Visa Processing Fees', 'Personal Ski Rental & Ski Passes', 'Travel Insurance'],
            important_info: ['Schengen visa required for Indian passport holders (Via Tours provides full document filing assistance).', 'Warm layered clothing recommended even during summer months at high altitudes.'],
            is_published: true
        },
        {
            id: 'pkg-bali-luxe-villas',
            title: 'Bali Luxe Retreat: Private Pool Villas & Ubud',
            price: 115000,
            duration: '6 Days / 5 Nights',
            category: 'Honeymoon',
            destination_id: 'dest-bali',
            destinations: { name: 'Bali', country: 'Indonesia' },
            image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
            gallery_images: [
                'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80',
                'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&q=80',
                'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80',
                'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=800&q=80'
            ],
            short_description: 'Private pool villas in Ubud rainforest and Seminyak beachfront, floating breakfast, and Uluwatu sunset VIP dinner.',
            description: 'Indulge in the spiritual and luxury essence of Bali. Rejuvenate in private jungle pool villas overlooking the Ayung river valley, enjoy signature flower bath spas, and soak in cliffside Uluwatu sunsets.',
            itinerary: [
                { title: 'Day 1: Arrival & Private Pool Villa Check-In', desc: 'VIP Fast Track airport welcome in Denpasar. Chauffeur transfer to your luxury private pool villa in Ubud. Romantic candlelit welcome dinner.' },
                { title: 'Day 2: Ubud Hidden Waterfalls & Rice Terraces', desc: 'Private 4x4 tour to Tegallalang rice terraces, Bali jungle swing with photographer, and sacred Tirta Empul water temple blessing.' },
                { title: 'Day 3: Transfer to Beachfront Seminyak & Sunset Club', desc: 'Scenic transfer to 5★ beachfront resort in Seminyak. Afternoon relaxation at a VIP beach club cabana.' },
                { title: 'Day 4: Nusa Penida Island Private Speedboat Tour', desc: 'Private speedboat excursion to Kelingking T-Rex cliff, Angel\'s Billabong, and crystal bay snorkeling with manta rays.' },
                { title: 'Day 5: Uluwatu Cliff Temple & Jimbaran Seafood Feast', desc: 'Visit Uluwatu temple perched on a 70-meter cliff. Watch the traditional Kecak fire dance followed by a private seafood dinner on the beach.' },
                { title: 'Day 6: Spa Morning & Departure', desc: '2-hour traditional Balinese couple spa treatment and private airport transfer for flight home.' }
            ],
            inclusions: ['5 Nights in Luxury Private Pool Villas (Ubud + Seminyak)', 'Private Dedicated Chauffeur & Air-Conditioned SUV for Entire Tour', 'Daily Floating & Gourmet Breakfasts', 'Private Nusa Penida Island Speedboat Day Excursion', '2-Hour Royal Balinese Couple Spa Massage', 'VIP Uluwatu Temple & Jimbaran Beach Candlelight Dinner'],
            exclusions: ['International Flights', 'Indonesia Visa on Arrival ($35 USD paid directly at airport)', 'Personal Shopping & Tips'],
            important_info: ['Visa on Arrival available for 80+ nationalities at DPS Airport.', 'Currency: Indonesian Rupiah (IDR). Credit cards widely accepted.'],
            is_published: true
        },
        {
            id: 'pkg-dubai-ultra-luxury',
            title: 'Dubai Ultra Luxury & Desert Oasis Glamping',
            price: 165000,
            duration: '5 Days / 4 Nights',
            category: 'Luxury',
            destination_id: 'dest-dubai',
            destinations: { name: 'Dubai', country: 'United Arab Emirates' },
            image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
            gallery_images: [
                'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&q=80',
                'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80',
                'https://images.unsplash.com/photo-1526495124232-a04e1849168c?w=800&q=80'
            ],
            short_description: '5-star Burj Al Arab hospitality, private luxury yacht cruise around Palm Jumeirah, and desert oasis villa stay.',
            description: 'Step into a realm of modern opulence. From helicopter skyline tours to private desert glamping under Arabian stars with five-star banquet dining.',
            itinerary: [
                { title: 'Day 1: Rolls Royce Airport Transfer & 5★ Hotel Check-In', desc: 'VIP meet at Dubai International Airport with executive transfer to Atlantis The Royal / Burj Al Arab.' },
                { title: 'Day 2: Private Superyacht Cruise & Burj Khalifa Sky Lounge', desc: '3-hour private yacht cruise around Palm Jumeirah with champagne. Afternoon VIP access to Burj Khalifa At The Top SKY (Level 148).' },
                { title: 'Day 3: Desert Oasis Resort & Starlight Dune Safari', desc: 'Transfer to Al Maha Luxury Desert Resort. Private vintage Land Rover wildlife safari, falconry show, and private dune dinner.' },
                { title: 'Day 4: Miracle Garden, Museum of the Future & Fine Dining', desc: 'Priority access to Museum of the Future. Evening gourmet dining at Michelin-starred Ossiano underwater restaurant.' },
                { title: 'Day 5: Gold Souk Shopping & Luxury Departure', desc: 'Private guided tour of old Dubai and Gold Souk. Airport transfer for onward flight.' }
            ],
            inclusions: ['4 Nights in 5★ Ultra Luxury Resorts & Desert Oasis Villa', 'Private Chauffeur Fleet for All Transfers & Sightseeing', 'Private 3-Hour Superyacht Cruise with Catering', 'Burj Khalifa Level 148 SKY VIP Lounge Access', 'Royal Desert Conservation Safari & Gourmet Dune Dinner', 'Museum of the Future Priority Entry'],
            exclusions: ['International Flights', 'UAE Tourist Visa (Assistance provided)', 'Tourism Dirham Fee (approx $5/night)'],
            important_info: ['UAE Visa issued within 48 hours for most travelers.', 'Dress code for fine dining venues is smart elegant.'],
            is_published: true
        },
        {
            id: 'pkg-kashmir-paradise',
            title: 'Kashmir Paradise: Heritage Houseboat & Gulmarg',
            price: 78000,
            duration: '6 Days / 5 Nights',
            category: 'Family',
            destination_id: 'dest-kashmir',
            destinations: { name: 'Kashmir', country: 'India' },
            image_url: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&q=80',
            gallery_images: [
                'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&q=80',
                'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=800&q=80'
            ],
            short_description: 'Luxury cedar houseboat on Dal Lake, Gulmarg Phase 2 Gondola pass, and snow-capped pine valley escapes.',
            description: 'Discover the Crown of India. Float on the tranquil waters of Dal Lake with a traditional Shikara, take the world\'s highest cable car in Gulmarg, and stroll through Pahalgam\'s pine forests.',
            itinerary: [
                { title: 'Day 1: Srinagar Arrival & Royal Houseboat Check-In', desc: 'Warm Kashmiri welcome at Srinagar Airport. Transfer to luxury heritage carved-wood houseboat on Dal Lake. Sunset Shikara ride.' },
                { title: 'Day 2: Mughal Gardens & Old Srinagar Walk', desc: 'Tour of Nishat Bagh, Shalimar Bagh, and Shankaracharya Temple with local heritage expert.' },
                { title: 'Day 3: Gulmarg — Meadow of Flowers & Phase 2 Gondola', desc: 'Scenic drive to Gulmarg. Ascend to Kongdoori and Apharwat Peak via high-altitude gondola.' },
                { title: 'Day 4: Pahalgam — Valley of Shepherds', desc: 'Drive through saffron fields and apple orchards to Pahalgam. Visit Betaab Valley and Aru Valley.' },
                { title: 'Day 5: Baisaran Valley & River Rafting Excursion', desc: 'Pony trek or hike to Mini Switzerland (Baisaran). Evening riverside bonfire with traditional Kashmiri Wazwan feast.' },
                { title: 'Day 6: Srinagar Airport Departure', desc: 'Morning shikara photo tour and transfer to Srinagar Airport for your flight.' }
            ],
            inclusions: ['2 Nights Luxury Heritage Houseboat + 3 Nights 5★ Resort in Gulmarg/Pahalgam', 'Private Heating & Luxury Transport Throughout', 'Phase 1 & 2 Gulmarg Gondola Tickets Included', 'Daily Traditional Breakfasts & 4-Course Dinners (Wazwan Included)', 'Complimentary Sunset Shikara Rides'],
            exclusions: ['Domestic Airfare to Srinagar', 'Personal Snow Activity Rentals (Skiing/Sledging)', 'Pony Rides in Baisaran'],
            important_info: ['Postpaid mobile connections (Airtel/Jio/BSNL) work in Jammu & Kashmir.', 'Carry warm jackets even in summer months for Gulmarg Phase 2.'],
            is_published: true
        },
        {
            id: 'pkg-vietnam-charm',
            title: 'Vietnam... The Timeless Charm & Halong Bay Luxury Cruise',
            price: 128000,
            duration: '7 Days / 6 Nights',
            category: 'Adventure',
            destination_id: 'dest-vietnam',
            destinations: { name: 'Vietnam', country: 'Vietnam' },
            image_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
            gallery_images: [
                'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
                'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80'
            ],
            short_description: 'Value-Driven Luxury 5-star Halong Bay boutique cruise with private balcony, Hanoi French Quarter, and Hoi An ancient lantern town.',
            description: 'A mesmerizing journey through Vietnam\'s timeless landscapes and culinary wonders. Glide through thousands of limestone karst islands on a 5-star luxury cruise, and explore lantern-lit UNESCO ancient streets with dedicated private chauffeured transfers.',
            itinerary: [
                { title: 'Day 1: Hanoi Arrival & French Quarter Stroll', desc: 'VIP airport transfer to 5★ French colonial hotel in Hanoi. Evening guided street food walk and Water Puppet show.' },
                { title: 'Day 2: Hanoi to Halong Bay Luxury Cruise Boarding', desc: 'Limousine transfer to Halong Bay. Board your 5-star boutique ship. Cruise through emerald waters with cave kayaking and cooking class.' },
                { title: 'Day 3: Sunrise Tai Chi & Flight to Danang / Hoi An', desc: 'Sunrise Tai Chi on sundeck, explore Sung Sot Cave. Transfer to airport for flight to Danang, continue to ancient Hoi An.' },
                { title: 'Day 4: Hoi An Lantern Town & Basket Boat River Safari', desc: 'Cycle through organic herb villages, take a traditional round basket boat safari, and release floating lanterns on the river.' },
                { title: 'Day 5: Ba Na Hills & Golden Hand Bridge', desc: 'Cable car to Ba Na Hills to walk along the iconic Golden Bridge held by giant stone hands.' },
                { title: 'Day 6: Hue Imperial City Day Tour', desc: 'Excursion through Hai Van Pass to the ancient Imperial Citadel of Hue and tomb of Emperor Khai Dinh.' },
                { title: 'Day 7: Danang Departure', desc: 'Transfer to Danang Airport for international flight home.' }
            ],
            inclusions: ['5 Nights in 5★ Luxury Boutique Hotels + 1 Night 5★ Halong Bay Cruise Suite', 'All Domestic Vietnam Flights (Hanoi to Danang)', 'Halong Bay Kayaking, Cooking Demonstration & All Ship Meals', 'Ba Na Hills Golden Bridge Cable Car Priority Pass', 'Private English-Speaking Tour Guides & Luxury Limousine Vans'],
            exclusions: ['International Flights', 'Vietnam E-Visa Fee ($25 USD, assistance provided)', 'Personal Beverages Outside Set Menus'],
            important_info: ['Vietnam E-Visa is processed online in 3-4 working days.', 'Vegetarian and Indian dietary requests are fully accommodated on the cruise.'],
            is_published: true
        }
    ],

    blogs: [
        {
            id: 'blog-maldives-guide',
            slug: 'ultimate-maldives-luxury-guide',
            title: 'The Ultimate Guide to Selecting Your Dream Maldives Resort',
            excerpt: 'From private seaplane transfers to underwater restaurants, discover the key differences between atolls, overwater villas, and all-inclusive luxury.',
            image_url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
            content: `
                <p>When planning a journey to the Maldives, one of the most common questions travelers ask is how to choose between the hundreds of private island resorts. Each atoll in this archipelago offers unique geographic and marine advantages.</p>
                <h2>1. Seaplane vs. Speedboat Transfers</h2>
                <p>Resorts within North and South Male Atolls are accessible via a 20-45 minute luxury speedboat transfer, which operates 24/7. However, if you are seeking ultimate seclusion and pristine marine biodiversity, taking a 35-45 minute scenic seaplane flight to Baa Atoll or Raa Atoll offers unmatched bird's-eye views of turquoise coral rings.</p>
                <h2>2. Overwater Villas vs. Beach Villas</h2>
                <p>While overwater villas provide direct lagoon access and uninterrupted ocean sunsets, beach villas often feature larger private gardens and immediate soft white sand access. For trips of 5 nights or longer, we frequently recommend a split-stay experience (2 nights Beach Villa + 3 nights Overwater Pool Villa) for the best of both worlds.</p>
                <h2>3. All-Inclusive Luxury Defined</h2>
                <p>Not all all-inclusive plans are created equal. At Via Tours & Travels, we specifically partner with 5-star resorts that offer Premium All-Inclusive dining, including multi-course à la carte meals, premium cellar wines, complimentary spa sessions, and guided marine excursions.</p>
            `,
            created_at: '2026-02-15T10:00:00Z',
            is_published: true
        },
        {
            id: 'blog-swiss-scenic-trains',
            slug: 'switzerland-scenic-train-routes',
            title: 'Riding the Clouds: Switzerland\'s Most Breathtaking Rail Journeys',
            excerpt: 'Why the Glacier Express, Bernina Express, and GoldenPass panoramic trains are best experienced with first-class Swiss travel passes.',
            image_url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80',
            content: `
                <p>Switzerland possesses the world's most sophisticated and breathtaking railway network. The experience of gazing through panoramic glass ceilings as alpine glaciers and pristine valleys glide by is unmatched.</p>
                <h2>The Glacier Express: The World's Slowest Express Train</h2>
                <p>Connecting Zermatt with St. Moritz in roughly 8 hours, the Glacier Express crosses 291 bridges and 91 tunnels. First Class Excellence class includes dedicated concierge service, a five-course gourmet meal, and guaranteed window seating.</p>
                <h2>The GoldenPass Panoramic</h2>
                <p>Running from Montreux on Lake Geneva to Interlaken and Lucerne, this route showcases historic Swiss vineyards, storybook wooden chalets, and shimmering turquoise lakes.</p>
            `,
            created_at: '2026-01-28T14:30:00Z',
            is_published: true
        },
        {
            id: 'blog-bali-culture-villas',
            slug: 'bali-hidden-gems-luxury-retreat',
            title: 'Beyond the Crowds: Curating a Private Sanctuary in Bali',
            excerpt: 'How to experience Bali with private waterfall tours, cliffside infinity pools, and authentic temple water blessings.',
            image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
            content: `
                <p>While Bali is celebrated globally, experiencing the island with tranquility requires thoughtful itinerary curation and private chauffeured access.</p>
                <h2>The Magic of Ubud\'s River Valleys</h2>
                <p>Staying in Ubud allows you to immerse yourself in the sound of rushing rivers and lush jungle canopies. Morning yoga sessions, private cooking classes with master chefs, and quiet temple visits before public hours reveal Bali\'s true soul.</p>
            `,
            created_at: '2026-01-10T09:15:00Z',
            is_published: true
        },
        {
            id: 'blog-packing-checklist',
            slug: 'luxury-international-travel-packing-checklist',
            title: 'Essential International Travel & Packing Checklist for Luxury Voyagers',
            excerpt: 'From passport validity and multi-currency prep to private seaplane luggage allowances, review our essential pre-departure checklist.',
            image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
            content: `
                <p>Preparing for a seamless luxury holiday requires thoughtful preparation. Here is our senior travel concierge-recommended pre-departure checklist to ensure effortless, stress-free journeys worldwide.</p>
                <h2>1. Travel Documentation & Visa Clearance</h2>
                <p>Always verify that your passport has at least 6 months validity from your scheduled date of return and at least 3 blank pages. Keep digital PDF copies of your flight tickets, luxury resort vouchers, and travel insurance accessible on your smartphone offline.</p>
                <h2>2. Currency & Multi-Currency Cards</h2>
                <p>While international credit cards are widely accepted at 5-star resorts, carrying a modest reserve of local currency (for gratuities, traditional bazaars, and local artisans) is recommended. Ensure international roaming and bank transaction alerts are activated before departure.</p>
                <h2>3. Luggage & Packing Strategy</h2>
                <p>When traveling to island destinations via seaplane (such as the Maldives), keep in mind luggage weight guidelines (typically 20kg checked + 5kg hand luggage). For European alpine expeditions, pack high-quality breathable thermal layers and UV-polarized sunglasses.</p>
            `,
            created_at: '2026-02-20T11:00:00Z',
            is_published: true
        }
    ],

    testimonials: [
        {
            name: 'Aarav & Meera Kapoor',
            location: 'Mumbai, India — Maldives Honeymoon Overwater Villa 5★',
            rating: 5,
            message: 'Our Maldives honeymoon planned by Via Tours & Travels exceeded every expectation. The overwater pool villa was breathtaking, and our private seaplane and champagne yacht cruise went off without a hitch. Truly 5-star service!',
            image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
        },
        {
            name: 'Dr. Siddharth Sen & Family',
            location: 'Bengaluru, India — Switzerland Glacier Express Tour 5★',
            rating: 5,
            message: 'Traveling with elderly parents and kids can be challenging, but Via Tours & Travels orchestrated every private transfer and Swiss rail ticket flawlessly. The Glacier Express was the highlight of our year!',
            image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80'
        },
        {
            name: 'Vikramaditya & Friends',
            location: 'Delhi, India — Dubai Ultra Luxury & Desert Safari 5★',
            rating: 5,
            message: 'From the private superyacht around Palm Jumeirah to the desert glamping villa, the VIP treatment was top tier. The 24/7 WhatsApp concierge answered all our requests in seconds.',
            image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80'
        },
        {
            name: 'Priya & Arjun Mehta',
            location: 'Ahmedabad, India — Bali Private Pool Villa Retreat 5★',
            rating: 5,
            message: 'The private jungle pool villa in Ubud and cliffside dinner in Uluwatu arranged by Via Tours & Travels were out of a fairy tale. Everything was curated with impeccable perfection and care.',
            image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80'
        }
    ],

    faqs: [
        {
            question: 'How does Via Tours & Travels customize our travel itinerary?',
            answer: 'Every journey begins with understanding your preferences. After you submit your inquiry or speak with our travel concierge, we assign a dedicated senior destination architect who crafts a bespoke day-by-day itinerary including flights, 5-star resort options, private transfers, and handpicked local experiences. You can refine and modify the plan as many times as you like until it is completely tailored to your vision.'
        },
        {
            question: 'Do you provide Visa documentation and appointment assistance?',
            answer: 'Yes! We provide complete end-to-end visa assistance for Schengen (Europe), UK, USA, UAE, Vietnam, Singapore, Japan, and 80+ other destinations. We guide you through document preparation, cover letters, appointment bookings, and flight/hotel proof vouchers.'
        },
        {
            question: 'What is your Flexible Date Change policy?',
            answer: 'We provide 100% Free Date Changes up to 21 days prior to your departure date across all our customized private tour packages with zero administrative penalties. If unforeseen circumstances arise, your dedicated concierge will seamlessly re-align resort reservations and flight dates.'
        },
        {
            question: 'What is the deposit and payment structure?',
            answer: 'To confirm your luxury itinerary and secure resort allocations, we request an initial booking deposit (typically 25% to 30% depending on the destination and peak seasonality). The remaining balance is payable prior to voucher issuance with full GST invoices and receipt acknowledgment.'
        },
        {
            question: 'Can we personalize special dietary preferences (Vegetarian, Jain, Halal, Vegan)?',
            answer: 'Absolutely. Prior to your departure, our concierge coordinates directly with executive chefs at your 5-star resorts, private cruises, and booked fine-dining restaurants to guarantee seamless vegetarian, Jain, Halal, vegan, or allergen-free meals throughout your stay.'
        },
        {
            question: 'Are flight tickets and airport transfers included?',
            answer: 'All our bespoke packages include private chauffeured airport transfers. We can also include international and domestic flights based on your preferred airlines, departure cities, and cabin class (Economy, Premium Economy, Business, or First Class).'
        },
        {
            question: 'How does 24/7 dedicated concierge support work while we are traveling?',
            answer: 'You will have direct 24/7 WhatsApp and phone access to your dedicated senior travel specialist throughout your journey, paired with local on-ground representatives ready to assist with restaurant reservations, schedule tweaks, or emergency assistance in real time.'
        },
        {
            question: 'What financial security and traveler protection guarantees are in place?',
            answer: 'Via Tours & Travels operates with full IATA & ASTA accreditation, bank-grade SSL encryption, and segregated client trust escrow accounts. All vouchers, booking reference numbers, and emergency contact directories are delivered to you well in advance of departure.'
        }
    ]
};

// --- DATA FETCHING WITH SEAMLESS FALLBACK ---
async function fetchDestinations() {
    try {
        if (sb) {
            const { data, error } = await sb.from('destinations').select('*').eq('is_published', true);
            if (!error && data && data.length > 0) {
                // Merge Supabase data with fallback data without duplicates
                const ids = new Set(data.map(d => d.id));
                const nonDupFallbacks = LUXURY_FALLBACK_DATA.destinations.filter(d => !ids.has(d.id));
                return [...data, ...nonDupFallbacks];
            }
        }
    } catch (e) {
        console.warn('Supabase destinations fallback:', e);
    }
    return LUXURY_FALLBACK_DATA.destinations;
}

async function fetchPackages() {
    try {
        if (sb) {
            const { data, error } = await sb.from('packages').select('*, destinations(name, country)').eq('is_published', true);
            if (!error && data && data.length > 0) {
                const ids = new Set(data.map(p => p.id));
                const nonDupFallbacks = LUXURY_FALLBACK_DATA.packages.filter(p => !ids.has(p.id));
                return [...data, ...nonDupFallbacks];
            }
        }
    } catch (e) {
        console.warn('Supabase packages fallback:', e);
    }
    return LUXURY_FALLBACK_DATA.packages;
}

async function fetchBlogs() {
    try {
        if (sb) {
            const { data, error } = await sb.from('blog_posts').select('*').eq('is_published', true).order('created_at', { ascending: false });
            if (!error && data && data.length > 0) {
                const ids = new Set(data.map(b => b.id));
                const nonDupFallbacks = LUXURY_FALLBACK_DATA.blogs.filter(b => !ids.has(b.id));
                return [...data, ...nonDupFallbacks];
            }
        }
    } catch (e) {
        console.warn('Supabase blogs fallback:', e);
    }
    return LUXURY_FALLBACK_DATA.blogs;
}

async function fetchTestimonials() {
    try {
        if (sb) {
            const { data, error } = await sb.from('testimonials').select('*');
            if (!error && data && data.length > 0) {
                return data;
            }
        }
    } catch (e) {
        console.warn('Supabase testimonials fallback:', e);
    }
    return LUXURY_FALLBACK_DATA.testimonials;
}

async function fetchFaqs() {
    try {
        if (sb) {
            const { data, error } = await sb.from('faqs').select('*').eq('is_published', true);
            if (!error && data && data.length > 0) {
                return data;
            }
        }
    } catch (e) {
        console.warn('Supabase faqs fallback:', e);
    }
    return LUXURY_FALLBACK_DATA.faqs;
}

// --- SEO & SOCIAL META TAG HELPER ---
function updateSEO(title, desc) {
    document.title = title.includes('Via Tours') ? title : `${title} — Via Tours & Travels`;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = desc || 'Via Tours & Travels - Premium luxury travel agency.';
}

// --- ROUTER (WITH CRITICAL BUG FIXES & FALLBACK) ---
function navTo(page, id = null) {
    // Close mobile menu if open
    toggleMenu(false);

    // Build standard hash route
    if (page === 'blog-post' && id) {
        window.location.hash = '#/blog-post/' + encodeURIComponent(id);
    } else if (page === 'package' && id) {
        window.location.hash = '#/package/' + encodeURIComponent(id);
    } else if (page === 'packages' && id) {
        window.location.hash = '#/packages/' + encodeURIComponent(id);
    } else {
        window.location.hash = '#/' + page;
    }
}

async function router() {
    const hash = window.location.hash || '#/home';

    // Guard against in-page anchor jumps (e.g. #section-main, #section-tips)
    if (hash && !hash.startsWith('#/')) {
        const anchorId = hash.replace(/^#/, '');
        const anchorEl = document.getElementById(anchorId);
        if (anchorEl) {
            anchorEl.scrollIntoView({ behavior: 'smooth' });
            return;
        }
    }

    const parts = hash.replace(/^#\/?/, '').split('/');
    const page = parts[0] || 'home';
    const id = parts[1] ? decodeURIComponent(parts[1]) : null;

    const siteWrapper = document.getElementById('site-wrapper');
    const adminWrapper = document.getElementById('admin-wrapper');

    // Update active nav styling (Desktop menu)
    document.querySelectorAll('.nav-menu a, .nav-links-wrap a').forEach(a => a.classList.remove('active'));
    const activeNav = document.getElementById('nav-' + (page === 'blog-post' ? 'blog' : page));
    if (activeNav) activeNav.classList.add('active');

    // Update active mobile bottom bar styling
    document.querySelectorAll('.mob-nav-item').forEach(m => m.classList.remove('active'));
    const mobActiveNav = document.getElementById('mob-nav-' + (page === 'blog-post' ? 'packages' : (page === 'package' ? 'packages' : page)));
    if (mobActiveNav) mobActiveNav.classList.add('active');

    // Hide sticky booking bar if leaving package details
    const mobStickyBooking = document.getElementById('mobileStickyBooking');
    if (mobStickyBooking && page !== 'package') {
        mobStickyBooking.style.display = 'none';
    }

    // Admin view separation
    if (page === 'admin') {
        if (siteWrapper) siteWrapper.style.display = 'none';
        if (adminWrapper) adminWrapper.style.display = 'block';
        if (sb) {
            const { data: { session } } = await sb.auth.getSession();
            if (session) {
                initAdminDashboard();
            } else {
                const loginBox = document.getElementById('admin-login');
                const dashBox = document.getElementById('admin-dashboard');
                if (loginBox) loginBox.style.display = 'block';
                if (dashBox) dashBox.style.display = 'none';
            }
        }
        return;
    }

    if (siteWrapper) siteWrapper.style.display = 'block';
    if (adminWrapper) adminWrapper.style.display = 'none';

    // Hide all views then show the target view
    document.querySelectorAll('.page-view').forEach(p => p.style.display = 'none');
    const view = document.getElementById('page-' + page) || document.getElementById('page-home');
    if (view) view.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'instant' });

    // FIXED SWITCH STATEMENT: Explicit break on every case including default
    switch (page) {
        case 'home':
            loadHomeData();
            updateSEO('Via Tours & Travels — Bespoke Luxury Journeys & Holidays', 'World-class luxury travel agency offering custom packages, 5-star villas, and dedicated 24/7 concierge.');
            break;

        case 'destinations':
            loadDestinations();
            updateSEO('Explore World Destinations | Via Tours & Travels', 'Discover handpicked luxury destinations across Maldives, Switzerland, Bali, Dubai, Italy, and beyond.');
            break;

        case 'packages':
            activeDestFilter = id || null;
            initPackageFilters();
            loadPackages();
            updateSEO('Curated Luxury Travel Packages | Via Tours & Travels', 'Explore bespoke luxury itineraries with 5-star stays, private chauffeur transfers, and transparent pricing.');
            break;

        case 'package':
            if (id) loadPackageDetails(id);
            break;

        case 'blog':
            loadBlog();
            updateSEO('The Via Travel Journal | Luxury Travel Advice & Guides', 'In-depth destination insights, packing guides, and luxury travel stories from our specialists.');
            break;

        case 'blog-post':
            if (id) loadBlogPost(id);
            break;

        case 'plan-trip':
            setupPlanForm(id);
            updateSEO('Design Your Bespoke Trip | Via Tours & Travels', 'Tell us your dream holiday vision and receive a tailored luxury itinerary within 24 hours.');
            break;

        case 'about':
            updateSEO('Our 15-Year Heritage | Via Tours & Travels', 'Learn about Via Tours & Travels, architecting extraordinary travel memories and authentic luxury since 2009.');
            break;

        case 'contact':
            updateSEO('Contact Our Luxury Travel Concierge | Via Tours & Travels', 'Reach our senior travel specialists for personalized bookings, private yacht charters, and visa assistance.');
            break;

        case 'terms':
            updateSEO('Terms & Conditions — Via Tours & Travels', 'Terms of service and booking conditions for Via Tours & Travels.');
            break;

        case 'privacy':
            updateSEO('Privacy Policy — Via Tours & Travels', 'Privacy policy and data protection standards for Via Tours & Travels.');
            break;

        default:
            // Clean fallback without fall-through bugs
            loadHomeData();
            updateSEO('Via Tours & Travels — Bespoke Luxury Journeys', 'Premium luxury travel agency.');
            break;
    }
}

// --- DATE PICKER CONSTRAINTS (PREVENT PAST BOOKINGS) ---
function initDatePickers() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputIds = ['hero_date', 'pt_dates', 'modal_pt_dates', 'm_book_date'];
    dateInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.min = today;
        }
    });
}

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
    // Sync currency selector
    const currSelect = document.getElementById('currencySelector');
    if (currSelect) currSelect.value = currentCurrency;
    initDatePickers();
    router();
    maybeShowTripModal();
});

// --- MOBILE MENU TOGGLE ---
function toggleMenu(forceState) {
    const menu = document.getElementById('navMenu');
    const overlay = document.getElementById('navOverlay');
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const icon = document.getElementById('menuToggleIcon');
    if (!menu) return;

    const isOpen = forceState !== undefined ? forceState : !menu.classList.contains('active');
    menu.classList.toggle('active', isOpen);
    if (overlay) overlay.classList.toggle('active', isOpen);
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', isOpen);
    if (icon) icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

// --- POPUP TRIP MODAL ---
function showTripModal() {
    initDatePickers();
    const modal = document.getElementById('tripModal');
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    const firstInput = modal.querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

function hideTripModal() {
    const modal = document.getElementById('tripModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    sessionStorage.setItem('viaTripModalDismissed', 'true');
}

// --- SAMPLE ITINERARY DOWNLOAD MODAL LOGIC ---
function openSampleItineraryModal(pkgTitle) {
    const modal = document.getElementById('sampleItineraryModal');
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    if (pkgTitle) {
        const select = document.getElementById('sample_dest');
        if (select) {
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].value.toLowerCase().includes(pkgTitle.toLowerCase()) || pkgTitle.toLowerCase().includes(select.options[i].value.toLowerCase())) {
                    select.selectedIndex = i;
                    break;
                }
            }
        }
    }
    const firstInput = document.getElementById('sample_name');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

function closeSampleItineraryModal() {
    const modal = document.getElementById('sampleItineraryModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
}

async function handleSampleItineraryDownload(e) {
    e.preventDefault();
    const btn = document.getElementById('btn_sample_download');
    const name = document.getElementById('sample_name')?.value.trim();
    const email = document.getElementById('sample_email')?.value.trim();
    const dest = document.getElementById('sample_dest')?.value || 'Signature Luxury Journeys';

    if (!name || !email) {
        showToast('Please enter your full name and email address.', 'error');
        return;
    }

    await withLoading(btn, async () => {
        // Save lead to Supabase if connected
        if (sb) {
            try {
                await sb.from('enquiries').insert([{
                    name: name,
                    email: email,
                    phone: 'Lead Capture (PDF Download)',
                    destination: dest,
                    requirements: 'Downloaded Sample Itinerary PDF Guide for ' + dest,
                    status: 'New'
                }]);
            } catch(err) {
                console.warn('Enquiry capture info:', err);
            }
        }

        // Generate and trigger download of luxury itinerary PDF summary document
        const cleanDest = dest.replace(/[^a-zA-Z0-9]/g, '_');
        const issueDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        const fallbackTextDownload = () => {
            const content = `=================================================================\nVIA TOURS & TRAVELS — CURATED SAMPLE ITINERARY GUIDE\n=================================================================\n\nPrepared Exclusively For: ${name}\nEmail: ${email}\nSelected Itinerary: ${dest}\nDate of Issue: ${issueDate}\nAccreditation: IATA #08392110 | ASTA Verified Luxury Tour Operator\n\n-----------------------------------------------------------------\nSIGNATURE ITINERARY HIGHLIGHTS & INCLUSIONS\n-----------------------------------------------------------------\n✓ Handpicked 5-Star Accommodations & Private Overwater/Pool Villas\n✓ Private Mercedes Chauffeur Transfers & Speedboat/Seaplane Connections\n✓ Gourmet Breakfasts, Multi-Course Fine Dining & Curated Excursions\n✓ 24/7 Dedicated Senior Concierge Specialist on WhatsApp\n✓ 100% Free Date Changes up to 21 Days Prior to Departure\n\n-----------------------------------------------------------------\nHOW TO PERSONALIZE YOUR DATES & EXPERIENCE\n-----------------------------------------------------------------\nTo adjust resort choices, add helicopter excursions, or receive formal flight quotations:\n\nWhatsApp Concierge: +91 98765 43210\nDirect Email: hello@viatours.com\nWebsite: https://www.viatours.com\n\nThank you for choosing Via Tours & Travels — Crafting Extraordinary Journeys.`;
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Via_Tours_Sample_Itinerary_${cleanDest}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        if (window.jspdf && window.jspdf.jsPDF) {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

                // Header Banner (Royal Navy #061029)
                doc.setFillColor(6, 16, 41);
                doc.rect(0, 0, 210, 38, 'F');

                // Gold Accent Line
                doc.setFillColor(232, 119, 34);
                doc.rect(0, 38, 210, 2, 'F');

                // Brand Title & Tagline
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(20);
                doc.text('VIA TOURS & TRAVELS', 14, 16);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(232, 119, 34);
                doc.text('CURATED LUXURY & BESPOKE BESPOKE JOURNEYS', 14, 23);

                doc.setTextColor(148, 163, 184);
                doc.setFontSize(7.5);
                doc.text('IATA Accredited Tour Operator  |  ASTA Verified Luxury Partner', 14, 30);

                // Prepared For Info Card
                doc.setFillColor(245, 247, 251);
                doc.roundedRect(14, 46, 182, 32, 2, 2, 'F');
                doc.setDrawColor(223, 229, 239);
                doc.roundedRect(14, 46, 182, 32, 2, 2, 'S');

                doc.setTextColor(15, 23, 42);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10.5);
                doc.text('COMPLIMENTARY CURATED SAMPLE ITINERARY', 20, 54);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                doc.setTextColor(51, 65, 85);
                doc.text(`Guest Name: ${name}`, 20, 61);
                doc.text(`Email Address: ${email}`, 20, 66);
                doc.text(`Selected Itinerary: ${dest}`, 20, 71);
                doc.text(`Date of Issue: ${issueDate}`, 120, 61);
                doc.text('Status: VIP Requested Preview', 120, 66);

                // Section 1: Signature Inclusions
                doc.setTextColor(6, 16, 41);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('Signature Highlights & Inclusions', 14, 88);

                doc.setDrawColor(232, 119, 34);
                doc.setLineWidth(0.5);
                doc.line(14, 91, 196, 91);

                const inclusions = [
                    'Handpicked 5-Star Accommodations & Private Overwater / Pool Villa Stays',
                    'Private Mercedes Chauffeur Transfers & Speedboat / Seaplane VIP Connections',
                    'Daily Gourmet Breakfasts, Multi-Course Fine Dining & Chef-Curated Experiences',
                    '24/7 Dedicated Senior Concierge Specialist on WhatsApp & Direct Priority Call',
                    '100% Free Date Changes up to 21 Days Prior to Departure & Full Visa Assistance'
                ];

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                let yPos = 99;
                inclusions.forEach(item => {
                    doc.setTextColor(232, 119, 34);
                    doc.text('✓', 16, yPos);
                    doc.setTextColor(51, 65, 85);
                    const splitText = doc.splitTextToSize(item, 170);
                    doc.text(splitText, 22, yPos);
                    yPos += splitText.length * 5.5 + 2;
                });

                // Section 2: Sample Day-by-Day Flow
                yPos += 4;
                doc.setTextColor(6, 16, 41);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('Curated Day-by-Day Journey Framework', 14, yPos);
                doc.setDrawColor(232, 119, 34);
                doc.line(14, yPos + 3, 196, yPos + 3);
                yPos += 10;

                const days = [
                    { day: 'Day 1: VIP Arrival & Private Chauffeur Welcome', desc: 'VIP meet & assist upon landing. Private luxury transfer to your 5-star suite with sunset champagne reception.' },
                    { day: 'Day 2: Immersive Private Cultural & Scenic Excursion', desc: 'Guided cultural exploration with private local specialist. Gourmet dining at signature partner restaurant.' },
                    { day: 'Day 3: Signature Leisure, Wellness & Scenic Views', desc: 'Dedicated spa wellness treatments, private yacht charter or scenic mountain pass, and personal leisure.' },
                    { day: 'Day 4: Bespoke Adventure & Celebration Dinner', desc: 'Curated excursion tailored to your party, followed by a romantic or family candlelit celebration under the stars.' },
                    { day: 'Day 5+: Farewell & Departure Transfer', desc: 'Gourmet breakfast overlooking vistas, private chauffeur connection to airport with VIP lounge access.' }
                ];

                days.forEach(d => {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8.5);
                    doc.setTextColor(232, 119, 34);
                    doc.text(d.day, 16, yPos);
                    yPos += 4.5;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(71, 85, 105);
                    const descLines = doc.splitTextToSize(d.desc, 175);
                    doc.text(descLines, 16, yPos);
                    yPos += descLines.length * 4.2 + 2.5;
                });

                // Section 3: Concierge Contact Box
                doc.setFillColor(6, 16, 41);
                doc.roundedRect(14, 238, 182, 34, 2, 2, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('Personalize Your Bespoke Quotation', 20, 246);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                doc.setTextColor(226, 232, 240);
                doc.text('WhatsApp Concierge: +91 98765 43210  |  Email: hello@viatours.com', 20, 253);
                doc.text('Official Website: https://www.viatours.com', 20, 258);

                doc.setTextColor(232, 119, 34);
                doc.setFontSize(8);
                doc.text('Connect directly with our senior destination architects to lock in VIP perks and room upgrades.', 20, 265);

                // Footer Bar
                doc.setFillColor(232, 119, 34);
                doc.rect(0, 286, 210, 1.2, 'F');
                doc.setTextColor(148, 163, 184);
                doc.setFontSize(7.5);
                doc.text('© 2026 Via Tours & Travels. All Rights Reserved. Confidential & Prepared Exclusively for Client.', 14, 292);

                doc.save(`Via_Tours_Sample_Itinerary_${cleanDest}.pdf`);
            } catch (err) {
                console.warn('jsPDF generation error, falling back to text:', err);
                fallbackTextDownload();
            }
        } else {
            fallbackTextDownload();
        }

        if (window.confetti) {
            window.confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        }

        closeSampleItineraryModal();
        showToast(`Sample itinerary for ${dest} (PDF) downloaded successfully!`, 'success');
    });
}

function maybeShowTripModal() {
    if (sessionStorage.getItem('viaTripModalDismissed') === 'true') return;

    let hasTriggered = false;
    const trigger = () => {
        if (hasTriggered || sessionStorage.getItem('viaTripModalDismissed') === 'true') return;
        hasTriggered = true;
        showTripModal();
    };

    // 1. Desktop Exit-Intent Trigger: user moves cursor toward top of browser to leave
    const handleExitIntent = (e) => {
        if (e.clientY <= 12 && !hasTriggered) {
            trigger();
            document.removeEventListener('mouseleave', handleExitIntent);
        }
    };
    setTimeout(() => {
        document.addEventListener('mouseleave', handleExitIntent);
    }, 8000);

    // 2. Engaged Scroll-Depth Trigger: when user has scrolled > 55% after 20s
    const handleScroll = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0 && (scrollTop / docHeight) >= 0.55) {
            window.removeEventListener('scroll', handleScroll);
            trigger();
        }
    };
    setTimeout(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
    }, 20000);

    // 3. Fallback gentle timer (45 seconds instead of aggressive 2.8s)
    setTimeout(() => {
        trigger();
    }, 45000);
}

const tripModalBackdrop = document.getElementById('tripModal');
if (tripModalBackdrop) {
    tripModalBackdrop.addEventListener('click', (e) => {
        if (e.target === tripModalBackdrop) hideTripModal();
    });
}

const sampleModalBackdrop = document.getElementById('sampleItineraryModal');
if (sampleModalBackdrop) {
    sampleModalBackdrop.addEventListener('click', (e) => {
        if (e.target === sampleModalBackdrop) closeSampleItineraryModal();
    });
}

document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('imageLightboxModal');
    const isLightboxActive = lightbox && lightbox.classList.contains('active');

    if (e.key === 'Escape') {
        if (isLightboxActive) { closeLightbox(); return; }
        const menu = document.getElementById('navMenu');
        if (menu && menu.classList.contains('active')) toggleMenu(false);
        const tripModal = document.getElementById('tripModal');
        if (tripModal && tripModal.classList.contains('active')) hideTripModal();
        const sampleModal = document.getElementById('sampleItineraryModal');
        if (sampleModal && sampleModal.classList.contains('active')) closeSampleItineraryModal();
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal && confirmModal.style.display === 'flex') confirmModal.style.display = 'none';
        const chatWin = document.getElementById('chatWindow');
        if (chatWin && chatWin.classList.contains('active')) toggleChat();
    } else if (isLightboxActive) {
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        else if (e.key === 'ArrowRight') navigateLightbox(1);
    }
});

// --- HOME PAGE LOADER ---
async function loadHomeData() {
    loadHomeDestinations();
    loadHomePackages();
    loadHomeBlogs();
    loadHomeTestimonials();
    loadHomeFaqs();
}

async function loadHomeDestinations() {
    const container = document.getElementById('home_destinations');
    if (!container) return;
    const dests = await fetchDestinations();
    const displayList = dests.slice(0, 4);

    container.innerHTML = displayList.map(d => `
        <div class="dest-card" onclick="navTo('packages', '${escapeHTML(d.id)}')">
            <div class="dest-img-wrap">
                <img src="${escapeHTML(d.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80')}" alt="Luxury travel experiences in ${escapeHTML(d.name)}" loading="lazy">
                <span class="dest-tag"><i class="fas fa-sun"></i> ${escapeHTML(d.best_time || 'Best Season')}</span>
            </div>
            <div class="dest-body">
                <h3>${escapeHTML(d.name)}</h3>
                <p class="dest-country"><i class="fas fa-map-marker-alt" style="color:var(--gold-500);"></i> ${escapeHTML(d.country || d.region || 'Worldwide')}</p>
                <div class="dest-footer">
                    <span>Explore More Itineraries</span>
                    <i class="fas fa-arrow-right"></i>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadHomePackages() {
    const container = document.getElementById('home_packages');
    if (!container) return;
    const packages = await fetchPackages();
    const displayList = packages.slice(0, 3);

    container.innerHTML = displayList.map(p => renderPackageCard(p)).join('');
}

async function loadHomeBlogs() {
    const container = document.getElementById('home_blog');
    if (!container) return;
    const blogs = await fetchBlogs();
    const displayList = blogs.slice(0, 3);

    container.innerHTML = displayList.map(b => `
        <article class="blog-card" onclick="navTo('blog-post', '${escapeHTML(b.slug || b.id)}')">
            <img src="${escapeHTML(b.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80')}" alt="${escapeHTML(b.title)}" loading="lazy">
            <div class="blog-body">
                <div class="blog-meta-tag">
                    <span><i class="fas fa-bookmark"></i> Curated Guide</span>
                    <span>${new Date(b.created_at || Date.now()).toLocaleDateString('en-IN', { month:'short', day:'numeric', year:'numeric' })}</span>
                </div>
                <h3 class="blog-title">${escapeHTML(b.title)}</h3>
                <p class="blog-excerpt">${escapeHTML(b.excerpt || '')}</p>
                <span class="read-story">Read Article <i class="fas fa-arrow-right"></i></span>
            </div>
        </article>
    `).join('');
}

async function loadHomeTestimonials() {
    const container = document.getElementById('home_testimonials');
    if (!container) return;
    const testimonials = await fetchTestimonials();
    const displayList = testimonials.slice(0, 4);

    container.innerHTML = displayList.map(t => `
        <div class="testimonial-card">
            <div class="testimonial-stars">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
            </div>
            <p class="testimonial-text">"${escapeHTML(t.message)}"</p>
            <div class="testimonial-author">
                <img src="${escapeHTML(t.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80')}" alt="Verified Guest ${escapeHTML(t.name)}" class="testimonial-avatar">
                <div class="testimonial-author-info">
                    <h4>${escapeHTML(t.name)}</h4>
                    <span style="color:var(--gold-500); font-weight:600; font-size:0.8rem;"><i class="fas fa-map-marker-alt"></i> ${escapeHTML(t.location || 'Verified Traveler')}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadHomeFaqs() {
    const container = document.getElementById('home_faqs');
    if (!container) return;
    const faqs = await fetchFaqs();

    container.innerHTML = faqs.map((f, i) => `
        <div class="faq-item">
            <div class="faq-question" onclick="toggleFaq(${i})">
                <span>${escapeHTML(f.question)}</span>
                <i class="fas fa-chevron-down faq-icon" id="faq-icon-${i}"></i>
            </div>
            <div class="faq-answer" id="faq-answer-${i}" style="display:${i === 0 ? 'block' : 'none'};">
                <p>${escapeHTML(f.answer)}</p>
            </div>
        </div>
    `).join('');

    // Rotate first FAQ icon open
    const firstIcon = document.getElementById('faq-icon-0');
    if (firstIcon) firstIcon.style.transform = 'rotate(180deg)';
}

function toggleFaq(index) {
    const ans = document.getElementById('faq-answer-' + index);
    const icon = document.getElementById('faq-icon-' + index);
    if (!ans || !icon) return;
    const isOpen = ans.style.display === 'block';
    ans.style.display = isOpen ? 'none' : 'block';
    icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}

// --- HERO SEARCH ENGINE ---
function setSearchTab(category, btn) {
    document.querySelectorAll('.search-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategoryFilter = category === 'all' ? null : category;
}

function searchFromHero() {
    const dest = document.getElementById('hero_dest')?.value.trim();
    const date = document.getElementById('hero_date')?.value;
    const travelers = document.getElementById('hero_travellers')?.value;

    heroSearchQuery = {
        destination: dest || null,
        date: date || null,
        travelers: travelers || null,
        category: activeCategoryFilter || null
    };

    navTo('packages');
}

function quickSearchDest(destName) {
    heroSearchQuery = { destination: destName };
    navTo('packages');
}

function filterByCollection(category) {
    heroSearchQuery = { category: category };
    navTo('packages');
}

// --- DESTINATIONS PAGE VIEW ---
async function loadDestinations() {
    const container = document.getElementById('list_destinations');
    if (!container) return;

    const searchTerm = (document.getElementById('dest-search')?.value || '').toLowerCase();
    const countryFilter = document.getElementById('dest-country-filter')?.value || '';
    const sortVal = document.getElementById('dest-sort')?.value || 'name_asc';

    const allDests = await fetchDestinations();

    // Populate country filter dropdown if not yet populated
    const countrySelect = document.getElementById('dest-country-filter');
    if (countrySelect && countrySelect.options.length <= 1) {
        const uniqueCountries = [...new Set(allDests.map(d => d.country).filter(Boolean))].sort();
        uniqueCountries.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            countrySelect.appendChild(opt);
        });
    }

    let filtered = allDests.filter(d => {
        const matchesSearch = !searchTerm || 
            (d.name && d.name.toLowerCase().includes(searchTerm)) || 
            (d.country && d.country.toLowerCase().includes(searchTerm)) || 
            (d.region && d.region.toLowerCase().includes(searchTerm));
        const matchesCountry = !countryFilter || d.country === countryFilter;
        return matchesSearch && matchesCountry;
    });

    // Sorting
    switch (sortVal) {
        case 'name_desc': filtered.sort((a,b) => b.name.localeCompare(a.name)); break;
        case 'country_asc': filtered.sort((a,b) => (a.country||'').localeCompare(b.country||'') || a.name.localeCompare(b.name)); break;
        default: filtered.sort((a,b) => a.name.localeCompare(b.name)); break;
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:60px 0;"><i class="fas fa-search" style="font-size:3rem; color:var(--gold-500); margin-bottom:15px;"></i><h3>No destinations match your search</h3><p style="color:var(--text-muted);">Try resetting filters to view our full collection.</p></div>';
        return;
    }

    // Group by Country
    const grouped = {};
    filtered.forEach(d => {
        const c = d.country || d.region || 'Featured Worlds';
        if (!grouped[c]) grouped[c] = [];
        grouped[c].push(d);
    });

    let html = '';
    for (const country in grouped) {
        html += `
            <div style="margin-bottom:45px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px; border-bottom:1px solid var(--border-light); padding-bottom:10px;">
                    <i class="fas fa-map-pin" style="color:var(--gold-500);"></i>
                    <h2 style="font-size:1.5rem; margin:0;">${escapeHTML(country)}</h2>
                    <span class="luxury-badge" style="font-size:0.7rem; padding:2px 8px;">${grouped[country].length} ${grouped[country].length === 1 ? 'Location' : 'Locations'}</span>
                </div>
                <div class="grid-4">
                    ${grouped[country].map(d => `
                        <div class="dest-card" onclick="navTo('packages', '${escapeHTML(d.id)}')">
                            <div class="dest-img-wrap">
                                <img src="${escapeHTML(d.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80')}" alt="${escapeHTML(d.name)}" loading="lazy">
                                <span class="dest-tag"><i class="fas fa-sun"></i> ${escapeHTML(d.best_time || 'All Seasons')}</span>
                            </div>
                            <div class="dest-body">
                                <h3>${escapeHTML(d.name)}</h3>
                                <p class="dest-country">${escapeHTML(d.description ? d.description.substring(0, 75) + '...' : '')}</p>
                                <div class="dest-footer">
                                    <span>View Curated Tours</span>
                                    <i class="fas fa-arrow-right"></i>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

const debounceDestSearch = debounce(loadDestinations, 350);

function resetDestFilters() {
    const s = document.getElementById('dest-search'); if (s) s.value = '';
    const c = document.getElementById('dest-country-filter'); if (c) c.value = '';
    const sort = document.getElementById('dest-sort'); if (sort) sort.value = 'name_asc';
    loadDestinations();
}

// --- PACKAGES CATALOG VIEW ---
function renderSkeletons(containerId = 'list_packages', count = 6) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skel-card">
                <div class="skeleton skel-img"></div>
                <div class="skel-body">
                    <div class="skeleton skel-line" style="width:40%;"></div>
                    <div class="skeleton skel-line" style="width:85%; height:20px; margin:10px 0;"></div>
                    <div class="skeleton skel-line" style="width:60%;"></div>
                    <div class="skeleton skel-line" style="width:35%; height:24px; margin-top:20px;"></div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

async function initPackageFilters() {
    const destSelect = document.getElementById('filter-destination');
    if (destSelect && destSelect.options.length <= 1) {
        const dests = await fetchDestinations();
        dests.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.name + (d.country ? ` (${d.country})` : '');
            destSelect.appendChild(opt);
        });
    }

    // Carry over heroSearchQuery parameters
    if (heroSearchQuery) {
        if (heroSearchQuery.destination) {
            const searchInput = document.getElementById('pkg_search');
            if (searchInput) searchInput.value = heroSearchQuery.destination;
        }
        if (heroSearchQuery.category) {
            const catSelect = document.getElementById('filter-category');
            if (catSelect) catSelect.value = heroSearchQuery.category;
        }
    }
}

function renderPackageCard(p) {
    const destName = p.destinations?.name || (LUXURY_FALLBACK_DATA.destinations.find(d => d.id === p.destination_id)?.name) || 'World Class';
    const formattedPrice = formatPrice(p.price);
    const category = p.category || 'Luxury';
    
    return `
        <div class="pkg-card" onclick="navTo('package', '${escapeHTML(p.id)}')">
            <div class="pkg-img-box">
                <img src="${escapeHTML(p.image_url || 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80')}" alt="${escapeHTML(p.title)}" loading="lazy">
                <span class="pkg-ribbon">${escapeHTML(category)}</span>
                <span class="pkg-rating"><i class="fas fa-star"></i> 4.9 (120+)</span>
            </div>
            <div class="pkg-body">
                <div class="pkg-meta-row">
                    <span><i class="fas fa-clock"></i> ${escapeHTML(p.duration || 'Flexible Days')}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHTML(destName)}</span>
                </div>
                <h3 class="pkg-title">${escapeHTML(p.title)}</h3>
                <p class="pkg-desc">${escapeHTML(p.short_description || p.description || 'Curated luxury journey with handpicked 5-star accommodations and private excursions.')}</p>
                
                <div class="pkg-highlights">
                    <span class="pkg-chip"><i class="fas fa-hotel"></i> 5★ Stays</span>
                    <span class="pkg-chip"><i class="fas fa-car"></i> Private Chauffeur</span>
                    <span class="pkg-chip"><i class="fas fa-utensils"></i> Gourmet Meals</span>
                </div>

                <div class="pkg-footer">
                    <div class="pkg-price-wrap">
                        <span class="price-lead">From / Per Person</span>
                        <div class="price-amount"><span class="currency">${formattedPrice}</span></div>
                    </div>
                    <div class="pkg-action-btns">
                        <button class="btn btn-gold btn-sm" onclick="event.stopPropagation(); navTo('package', '${escapeHTML(p.id)}')">View Tour</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadPackages() {
    renderSkeletons('list_packages', 6);
    const container = document.getElementById('list_packages');
    if (!container) return;

    const searchTerm = (document.getElementById('pkg_search')?.value || '').toLowerCase();
    const filterDest = document.getElementById('filter-destination')?.value || activeDestFilter || '';
    const filterCat = document.getElementById('filter-category')?.value || '';
    const minPrice = document.getElementById('filter-min-price')?.value;
    const maxPrice = document.getElementById('filter-max-price')?.value;
    const sortVal = document.getElementById('pkg_sort')?.value || 'new';

    const allPackages = await fetchPackages();

    let filtered = allPackages.filter(p => {
        const destName = p.destinations?.name || (LUXURY_FALLBACK_DATA.destinations.find(d => d.id === p.destination_id)?.name) || '';
        const matchesSearch = !searchTerm || 
            (p.title && p.title.toLowerCase().includes(searchTerm)) || 
            (p.duration && p.duration.toLowerCase().includes(searchTerm)) ||
            (destName && destName.toLowerCase().includes(searchTerm));
        
        const matchesDest = !filterDest || p.destination_id === filterDest || destName.toLowerCase() === filterDest.toLowerCase();
        const matchesCat = !filterCat || (p.category && p.category.toLowerCase() === filterCat.toLowerCase());
        const matchesMin = !minPrice || p.price >= Number(minPrice);
        const matchesMax = !maxPrice || p.price <= Number(maxPrice);

        return matchesSearch && matchesDest && matchesCat && matchesMin && matchesMax;
    });

    // Sorting
    if (sortVal === 'price_asc') filtered.sort((a,b) => a.price - b.price);
    else if (sortVal === 'price_desc') filtered.sort((a,b) => b.price - a.price);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:70px 20px;">
                <i class="fas fa-compass" style="font-size:3.5rem; color:var(--gold-500); margin-bottom:16px;"></i>
                <h2>No Luxury Packages Found</h2>
                <p style="color:var(--text-muted); max-width:500px; margin:0 auto 24px;">We couldn't find packages matching your exact criteria. Customize a trip with our senior travel concierge!</p>
                <button class="btn btn-gold" onclick="clearFilter()"><i class="fas fa-undo"></i> Reset Filters</button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(p => renderPackageCard(p)).join('');
}

const debounceSearch = debounce(loadPackages, 350);

function clearFilter() {
    activeDestFilter = null;
    heroSearchQuery = null;
    const search = document.getElementById('pkg_search'); if (search) search.value = '';
    const dest = document.getElementById('filter-destination'); if (dest) dest.value = '';
    const cat = document.getElementById('filter-category'); if (cat) cat.value = '';
    const min = document.getElementById('filter-min-price'); if (min) min.value = '';
    const max = document.getElementById('filter-max-price'); if (max) max.value = '';
    const sort = document.getElementById('pkg_sort'); if (sort) sort.value = 'new';
    loadPackages();
}

// --- PACKAGE DETAILS VIEW (EDITORIAL LUXURY) ---
async function loadPackageDetails(id) {
    const container = document.getElementById('pkg_details_container');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center; padding:100px 0;"><div class="loader-spinner"></div><p style="margin-top:15px;">Loading bespoke itinerary...</p></div>';

    let pkg = null;
    if (sb) {
        try {
            const { data, error } = await sb.from('packages').select('*, destinations(name, country)').eq('id', id).maybeSingle();
            if (!error && data) pkg = data;
        } catch(e) {}
    }

    if (!pkg) {
        pkg = LUXURY_FALLBACK_DATA.packages.find(p => p.id === id || p.title.toLowerCase().includes(id.toLowerCase()));
    }

    if (!pkg) {
        container.innerHTML = `
            <div style="text-align:center; padding:80px 20px;">
                <h2>Package Not Found</h2>
                <p style="color:var(--text-muted); margin-bottom:20px;">The requested itinerary may have been updated or moved.</p>
                <button class="btn btn-gold" onclick="navTo('packages')"><i class="fas fa-arrow-left"></i> Return to Packages</button>
            </div>
        `;
        return;
    }

    currentPackage = pkg;
    updateSEO(`${pkg.title} | Via Tours & Travels`, pkg.short_description || pkg.description);

    const destName = pkg.destinations?.name || (LUXURY_FALLBACK_DATA.destinations.find(d => d.id === pkg.destination_id)?.name) || 'Global Destination';
    const uniqueImages = Array.from(new Set([pkg.image_url, ...(pkg.gallery_images || [])].filter(Boolean)));
    if (uniqueImages.length === 0) {
        uniqueImages.push('https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80');
    }
    const baseFormattedPrice = formatPrice(pkg.price);

    // Build adaptive mosaic gallery markup without duplicate repeats
    let galleryClass = 'mosaic-gallery';
    let galleryHTML = '';
    const imagesAttr = escapeHTML(JSON.stringify(uniqueImages));

    if (uniqueImages.length === 1) {
        galleryClass += ' single-img';
        galleryHTML = `
            <div class="mosaic-main" onclick="openLightbox('${escapeHTML(uniqueImages[0])}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                <img src="${escapeHTML(uniqueImages[0])}" id="detail_main_image" alt="${escapeHTML(pkg.title)}">
                <span class="mosaic-zoom-badge"><i class="fas fa-expand"></i> View High-Res Photo</span>
            </div>
        `;
    } else if (uniqueImages.length === 2) {
        galleryClass += ' dual-img';
        galleryHTML = `
            <div class="mosaic-main" onclick="openLightbox('${escapeHTML(uniqueImages[0])}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                <img src="${escapeHTML(uniqueImages[0])}" id="detail_main_image" alt="${escapeHTML(pkg.title)}">
                <span class="mosaic-zoom-badge"><i class="fas fa-expand"></i> Photo 1 of 2</span>
            </div>
            <div class="mosaic-item" onclick="openLightbox('${escapeHTML(uniqueImages[1])}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                <img src="${escapeHTML(uniqueImages[1])}" alt="${escapeHTML(pkg.title)} 2">
                <span class="mosaic-zoom-badge"><i class="fas fa-expand"></i> Photo 2 of 2</span>
            </div>
        `;
    } else if (uniqueImages.length === 3) {
        galleryClass += ' triple-img';
        galleryHTML = `
            <div class="mosaic-main" onclick="openLightbox('${escapeHTML(uniqueImages[0])}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                <img src="${escapeHTML(uniqueImages[0])}" id="detail_main_image" alt="${escapeHTML(pkg.title)}">
                <span class="mosaic-zoom-badge"><i class="fas fa-expand"></i> View Full Gallery</span>
            </div>
            <div class="mosaic-item" onclick="openLightbox('${escapeHTML(uniqueImages[1])}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                <img src="${escapeHTML(uniqueImages[1])}" alt="${escapeHTML(pkg.title)} 2">
            </div>
            <div class="mosaic-item" onclick="openLightbox('${escapeHTML(uniqueImages[2])}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                <img src="${escapeHTML(uniqueImages[2])}" alt="${escapeHTML(pkg.title)} 3">
            </div>
        `;
    } else {
        const mainImg = uniqueImages[0];
        const extraItems = uniqueImages.slice(1, 5).map((imgUrl, i) => `
            <div class="mosaic-item" onclick="openLightbox('${escapeHTML(imgUrl)}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                <img src="${escapeHTML(imgUrl)}" alt="${escapeHTML(pkg.title)} ${i + 2}">
            </div>
        `).join('');

        galleryHTML = `
            <div class="mosaic-main" onclick="openLightbox('${escapeHTML(mainImg)}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                <img src="${escapeHTML(mainImg)}" id="detail_main_image" alt="${escapeHTML(pkg.title)}">
                <span class="mosaic-zoom-badge"><i class="fas fa-expand"></i> ${uniqueImages.length} Photos</span>
            </div>
            ${extraItems}
        `;
    }

    container.innerHTML = `
        <div class="pkg-detail-header">
            <div class="pkg-breadcrumbs">
                <a onclick="navTo('home')">Home</a>
                <i class="fas fa-chevron-right" style="font-size:0.7rem;"></i>
                <a onclick="navTo('packages')">Packages</a>
                <i class="fas fa-chevron-right" style="font-size:0.7rem;"></i>
                <span>${escapeHTML(pkg.title)}</span>
            </div>
            
            <h1 class="pkg-detail-title">${escapeHTML(pkg.title)}</h1>
            <div class="pkg-detail-meta">
                <span><i class="fas fa-clock"></i> ${escapeHTML(pkg.duration || 'Flexible')}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${escapeHTML(destName)}</span>
                <span><i class="fas fa-crown"></i> ${escapeHTML(pkg.category || 'Luxury')}</span>
                <span><i class="fas fa-star" style="color:#fbbf24;"></i> 4.9 (120+ Reviews)</span>
            </div>
        </div>

        <!-- Adaptive Mosaic Gallery -->
        <div class="${galleryClass}">
            ${galleryHTML}
        </div>

        <!-- Detail Main Layout -->
        <div class="detail-layout">
            <div class="detail-content">
                <div style="margin-bottom:30px;">
                    <h3>Journey Overview</h3>
                    <p style="font-size:1.05rem; line-height:1.75; color:var(--text-secondary); margin-top:8px;">${escapeHTML(pkg.description || pkg.short_description || '')}</p>
                </div>

                <div class="luxury-tabs">
                    <button class="luxury-tab-btn active" onclick="switchDetailTab(event, 'itinerary')"><i class="fas fa-stream"></i> Day-by-Day Itinerary</button>
                    <button class="luxury-tab-btn" onclick="switchDetailTab(event, 'inclusions')"><i class="fas fa-check-circle"></i> Inclusions & Exclusions</button>
                    <button class="luxury-tab-btn" onclick="switchDetailTab(event, 'notes')"><i class="fas fa-info-circle"></i> Important Advisory</button>
                </div>

                <div id="detail_tab_content">
                    <!-- Injected by renderDetailTabContent -->
                </div>
            </div>

            <!-- Sticky Luxury Booking & Price Calculator Sidebar -->
            <aside class="sticky-sidebar">
                <div class="sidebar-price-box">
                    <span class="sidebar-price-label">Starting From</span>
                    <div class="sidebar-price-val" id="sidebar_display_price">${baseFormattedPrice}</div>
                    <span class="sidebar-price-note"><i class="fas fa-check-circle"></i> Best Luxury Value Guaranteed</span>
                </div>

                <div class="calc-row">
                    <label for="calc_travelers"><i class="fas fa-user-friends"></i> Number of Travelers</label>
                    <select id="calc_travelers" onchange="calculateSidebarPrice()">
                        <option value="1">1 Solo Traveler</option>
                        <option value="2" selected>2 Adults (1 Couple Room)</option>
                        <option value="3">3 Adults (1 Triple Room)</option>
                        <option value="4">4 Adults (2 Luxury Rooms)</option>
                        <option value="6">6 Adults (3 Luxury Rooms / Villa)</option>
                    </select>
                </div>

                <div class="calc-row">
                    <label for="calc_tier"><i class="fas fa-hotel"></i> Accommodation Tier</label>
                    <select id="calc_tier" onchange="calculateSidebarPrice()">
                        <option value="1.0" selected>5★ Ultra Luxury Resort / Villa</option>
                        <option value="0.85">4★ Premium Boutique Suite (-15%)</option>
                        <option value="1.35">Presidential / Private Pool Villa (+35%)</option>
                    </select>
                </div>

                <div class="calc-summary">
                    <div class="calc-summary-row">
                        <span>Base Rate / Person</span>
                        <span id="calc_base_rate">${baseFormattedPrice}</span>
                    </div>
                    <div class="calc-summary-row">
                        <span>Travelers</span>
                        <span id="calc_pax_count">2</span>
                    </div>
                    <div class="calc-summary-row total">
                        <span>Estimated Total</span>
                        <span id="calc_total_val" style="color:var(--gold-500); font-weight:800;">${baseFormattedPrice}</span>
                    </div>
                </div>

                <a href="https://wa.me/${escapeHTML(appSettings.whatsapp)}?text=${encodeURIComponent('Hello Via Tours! I am interested in customizing the ' + pkg.title + ' itinerary.')}" target="_blank" class="btn btn-whatsapp" style="width:100%; margin-bottom:12px;">
                    <i class="fab fa-whatsapp"></i> Chat with Concierge
                </a>

                <button class="btn btn-gold" style="width:100%;" onclick="openCustomTripFromPkg('${escapeHTML(pkg.id)}')">
                    <i class="fas fa-file-invoice"></i> Request Formal Quotation
                </button>
            </aside>
        </div>
    `;

    // Initialize Mobile Sticky Booking Bar
    const mobSticky = document.getElementById('mobileStickyBooking');
    const mobPrice = document.getElementById('mobStickyPrice');
    const mobWa = document.getElementById('mobStickyWaBtn');
    if (mobSticky && mobPrice) {
        mobSticky.style.display = 'flex';
        mobPrice.textContent = baseFormattedPrice;
        if (mobWa) {
            mobWa.href = `https://wa.me/${escapeHTML(appSettings.whatsapp)}?text=${encodeURIComponent('Hello Via Tours! I would like to customize or book the ' + pkg.title + ' tour.')}`;
        }
    }

    renderDetailTabContent('itinerary');
    calculateSidebarPrice();
}

function openCustomTripFromCurrentPkg() {
    if (currentPackage && currentPackage.id) {
        openCustomTripFromPkg(currentPackage.id);
    } else {
        navTo('plan-trip');
    }
}

function switchDetailTab(ev, tab) {
    document.querySelectorAll('.luxury-tab-btn').forEach(b => b.classList.remove('active'));
    ev.currentTarget.classList.add('active');
    renderDetailTabContent(tab);
}

function renderDetailTabContent(tab) {
    const c = document.getElementById('detail_tab_content');
    if (!c || !currentPackage) return;
    const pkg = currentPackage;

    if (tab === 'itinerary') {
        const itin = pkg.itinerary || [];
        c.innerHTML = `
            <div class="itinerary-timeline">
                ${itin.length ? itin.map((d, idx) => `
                    <div class="itinerary-day-card">
                        <div class="itinerary-dot">${idx + 1}</div>
                        <h4>${escapeHTML(d.title || `Day ${idx + 1}`)}</h4>
                        <p style="white-space:pre-line;">${escapeHTML(d.desc || d.description || '')}</p>
                    </div>
                `).join('') : '<p style="padding:20px; color:var(--text-muted);">Custom detailed day-by-day plan will be tailored upon booking.</p>'}
            </div>
        `;
    } else if (tab === 'inclusions') {
        const inc = pkg.inclusions || [];
        const exc = pkg.exclusions || [];
        c.innerHTML = `
            <div class="checklist-grid">
                <div class="check-box included">
                    <h4><i class="fas fa-check-circle"></i> What is Included</h4>
                    <ul class="check-list included">
                        ${inc.map(i => `<li><i class="fas fa-check"></i> <span>${escapeHTML(i)}</span></li>`).join('') || '<li>Standard 5★ Inclusions</li>'}
                    </ul>
                </div>
                <div class="check-box excluded">
                    <h4><i class="fas fa-times-circle"></i> Exclusions</h4>
                    <ul class="check-list excluded">
                        ${exc.map(e => `<li><i class="fas fa-times"></i> <span>${escapeHTML(e)}</span></li>`).join('') || '<li>Personal expenses & flights outside package</li>'}
                    </ul>
                </div>
            </div>
        `;
    } else if (tab === 'notes') {
        const notes = pkg.important_info || [];
        c.innerHTML = `
            <div class="check-box" style="background:var(--surface-card);">
                <h4><i class="fas fa-shield-alt" style="color:var(--gold-500);"></i> Essential Travel & Visa Advisory</h4>
                <ul class="check-list included" style="margin-top:14px;">
                    ${notes.map(n => `<li><i class="fas fa-info-circle" style="color:var(--gold-500);"></i> <span>${escapeHTML(n)}</span></li>`).join('') || '<li>Passport must have at least 6 months validity.</li>'}
                    <li><i class="fas fa-info-circle" style="color:var(--gold-500);"></i> <span>Our team provides full visa documentation, appointment filing, and fast-track clearance support.</span></li>
                </ul>
            </div>
        `;
    }
}

function calculateSidebarPrice() {
    if (!currentPackage) return;
    const travelers = Number(document.getElementById('calc_travelers')?.value) || 2;
    const tierMultiplier = Number(document.getElementById('calc_tier')?.value) || 1.0;
    const basePrice = currentPackage.price || 150000;

    const pricePerPerson = basePrice * tierMultiplier;
    const totalEstimate = pricePerPerson * travelers;

    const baseEl = document.getElementById('calc_base_rate');
    const paxEl = document.getElementById('calc_pax_count');
    const totalEl = document.getElementById('calc_total_val');
    const sidebarDisplay = document.getElementById('sidebar_display_price');

    if (baseEl) baseEl.textContent = formatPrice(pricePerPerson);
    if (paxEl) paxEl.textContent = travelers;
    if (totalEl) totalEl.textContent = formatPrice(totalEstimate);
    if (sidebarDisplay) sidebarDisplay.textContent = formatPrice(totalEstimate);

    const mobPrice = document.getElementById('mobStickyPrice');
    if (mobPrice) mobPrice.textContent = formatPrice(pricePerPerson);
}

function openCustomTripFromPkg(pkgId) {
    navTo('plan-trip', pkgId);
}

// --- HIGH-END LUXURY LIGHTBOX MODAL ---
let lightboxImages = [];
let currentLightboxIndex = 0;

function openLightbox(url, imagesList = [], caption = '') {
    const modal = document.getElementById('imageLightboxModal');
    const img = document.getElementById('lightboxActiveImage');
    const cap = document.getElementById('lightboxCaption');
    if (!modal || !img) return;

    if (imagesList && imagesList.length > 0) {
        lightboxImages = imagesList;
        currentLightboxIndex = imagesList.indexOf(url) >= 0 ? imagesList.indexOf(url) : 0;
    } else {
        lightboxImages = [url];
        currentLightboxIndex = 0;
    }

    img.src = lightboxImages[currentLightboxIndex] || url;
    if (cap) cap.textContent = caption || (currentPackage ? currentPackage.title : 'Via Tours & Travels');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    updateLightboxNav();
}

function closeLightbox(e) {
    if (e && e.target && !e.target.classList.contains('lightbox-backdrop') && !e.target.classList.contains('lightbox-close')) return;
    const modal = document.getElementById('imageLightboxModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function navigateLightbox(dir) {
    if (lightboxImages.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
    const img = document.getElementById('lightboxActiveImage');
    if (img) img.src = lightboxImages[currentLightboxIndex];
    updateLightboxNav();
}

function updateLightboxNav() {
    const prevBtn = document.getElementById('lightboxPrevBtn');
    const nextBtn = document.getElementById('lightboxNextBtn');
    const show = lightboxImages.length > 1;
    if (prevBtn) prevBtn.style.display = show ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = show ? 'flex' : 'none';
}

// --- INTERACTIVE MULTI-STEP TRIP BUILDER ---
let currentTripStep = 1;

function selectTripStyle(styleName, el) {
    document.querySelectorAll('.style-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    const hidden = document.getElementById('pt_style');
    if (hidden) hidden.value = styleName;
}

function nextTripStep(stepNum) {
    // Validate current step
    if (stepNum > currentTripStep) {
        if (currentTripStep === 1) {
            const dest = document.getElementById('pt_dest').value.trim();
            if (!dest) {
                showToast('Please enter your preferred destination.', 'error');
                return;
            }
        } else if (currentTripStep === 2) {
            const dates = document.getElementById('pt_dates').value;
            if (!dates) {
                showToast('Please select an estimated travel date.', 'error');
                return;
            }
        }
    }

    currentTripStep = stepNum;

    // Update progress nodes
    for (let i = 1; i <= 4; i++) {
        const node = document.getElementById('node-' + i);
        const content = document.getElementById('step-' + i);
        if (node) {
            node.classList.remove('active', 'completed');
            if (i === stepNum) node.classList.add('active');
            else if (i < stepNum) node.classList.add('completed');
        }
        if (content) {
            content.classList.remove('active');
            if (i === stepNum) content.classList.add('active');
        }
    }
}

async function setupPlanForm(pkgId) {
    initDatePickers();
    currentTripStep = 1;
    nextTripStep(1);

    const destInput = document.getElementById('pt_dest');
    const pkgHidden = document.getElementById('pt_pkg_id');
    if (destInput) destInput.value = '';
    if (pkgHidden) pkgHidden.value = '';

    if (pkgId) {
        let pkg = (await fetchPackages()).find(p => p.id === pkgId);
        if (pkg) {
            if (destInput) destInput.value = `${pkg.title} (${pkg.destinations?.name || ''})`;
            if (pkgHidden) pkgHidden.value = pkg.id;
        }
    }
}

// Plan trip form submission
const planTripForm = document.getElementById('planTripForm');
if (planTripForm) {
    planTripForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // If user pressed Enter in steps 1-3, advance wizard smoothly instead of submitting
        if (currentTripStep < 4) {
            nextTripStep(currentTripStep + 1);
            return;
        }

        // Spam check
        if (document.getElementById('honeypot')?.value) {
            showToast('Spam detected.', 'error');
            return;
        }

        const btn = document.getElementById('btn_submit_plan');
        await withLoading(btn, async () => {
            const name = document.getElementById('pt_name')?.value.trim();
            const email = document.getElementById('pt_email')?.value.trim();
            const phone = document.getElementById('pt_phone')?.value.trim();
            const dest = document.getElementById('pt_dest')?.value.trim();
            const dates = document.getElementById('pt_dates')?.value;
            const travelers = document.getElementById('pt_travelers')?.value || '2';
            const duration = document.getElementById('pt_duration_pref')?.value;
            const hotel = document.getElementById('pt_hotel')?.value;
            const budget = document.getElementById('pt_budget')?.value.trim();
            const style = document.getElementById('pt_style')?.value || 'Ultra Luxury';
            const req = document.getElementById('pt_req')?.value.trim();
            const pkgId = document.getElementById('pt_pkg_id')?.value || null;

            if (!name || !email || !phone) {
                showToast('Please fill all required contact fields.', 'error');
                return;
            }

            const payload = {
                name,
                email,
                phone,
                destination: dest,
                travel_dates: dates ? `${dates} (${duration})` : duration,
                travelers,
                hotel_pref: `${hotel} (${style})`,
                budget: budget || 'Flexible',
                requirements: req,
                package_id: pkgId,
                status: 'New'
            };

            if (sb) {
                try {
                    await sb.from('enquiries').insert([payload]);
                    const { data: cust } = await sb.from('customers').select('id').eq('email', email).maybeSingle();
                    if (!cust) {
                        await sb.from('customers').insert([{ name, email, phone, whatsapp: phone }]);
                    }
                } catch (err) {
                    console.warn('Enquiry save to Supabase:', err);
                }
            }

            // Trigger celebratory confetti if library is available
            if (window.confetti) {
                window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }

            showToast('🎉 Your bespoke itinerary inquiry has been received! Our specialist will contact you shortly.', 'success');
            
            // Redirect to WhatsApp handover option or home
            setTimeout(() => {
                navTo('home');
            }, 2500);
        });
    });
}

// Modal Trip Form Submission
const tripModalForm = document.getElementById('tripModalForm');
if (tripModalForm) {
    tripModalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (document.getElementById('modal_honeypot')?.value) return;

        const name = document.getElementById('modal_pt_name')?.value.trim();
        const email = document.getElementById('modal_pt_email')?.value.trim();
        const phone = document.getElementById('modal_pt_phone')?.value.trim();
        const dest = document.getElementById('modal_pt_dest')?.value.trim();
        const dates = document.getElementById('modal_pt_dates')?.value;
        const travelers = document.getElementById('modal_pt_travelers')?.value || '2';
        const req = document.getElementById('modal_pt_req')?.value.trim();

        if (!name || !email || !phone) {
            showToast('Please fill all required fields.', 'error');
            return;
        }

        const payload = {
            name,
            email,
            phone,
            destination: dest || 'General Luxury Escapes',
            travel_dates: dates || 'Flexible',
            travelers,
            requirements: req,
            status: 'New'
        };

        if (sb) {
            try {
                await sb.from('enquiries').insert([payload]);
            } catch (err) {}
        }

        if (window.confetti) window.confetti({ particleCount: 100, spread: 70 });
        showToast('Thank you! Your travel quotation request has been received.', 'success');
        hideTripModal();
    });
}

// Quick Contact Form
async function handleQuickContact(e) {
    e.preventDefault();
    const name = document.getElementById('c_name')?.value.trim() || '';
    const email = document.getElementById('c_email')?.value.trim() || '';
    const phone = document.getElementById('c_phone')?.value.trim() || '';
    const msg = document.getElementById('c_msg')?.value.trim() || '';

    if (sb) {
        try {
            await sb.from('enquiries').insert([{
                name, email, phone,
                destination: 'Contact Page Inquiry',
                requirements: msg,
                status: 'New'
            }]);
        } catch (err) {
            console.warn('Contact inquiry save error:', err);
        }
    }
    showToast('Your message has been sent to our concierge desk!', 'success');
    e.target.reset();
}

// Newsletter Subscription
async function handleNewsletter(e) {
    e.preventDefault();
    const emailInput = document.getElementById('nl_email');
    const email = emailInput ? emailInput.value.trim() : '';
    if (!email) return;

    if (sb) {
        try {
            await sb.from('enquiries').insert([{
                name: 'Newsletter Subscriber',
                email: email,
                phone: 'N/A',
                destination: 'Newsletter Subscription (The Luxury Bulletin)',
                requirements: 'Opted in for secret villa deals, seasonal travel guides, and VIP invitations.',
                status: 'Subscribed'
            }]);
        } catch (err) {
            console.warn('Newsletter subscription save error:', err);
        }
    }
    showToast(`Thank you! ${email} is now subscribed to The Luxury Bulletin.`, 'success');
    if (e.target && e.target.reset) e.target.reset();
}

// --- TRAVEL JOURNAL BLOG VIEW ---
async function loadBlog() {
    const container = document.getElementById('list_blog');
    if (!container) return;
    const blogs = await fetchBlogs();

    container.innerHTML = blogs.map(b => `
        <article class="blog-card" onclick="navTo('blog-post', '${escapeHTML(b.slug || b.id)}')">
            <img src="${escapeHTML(b.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80')}" alt="${escapeHTML(b.title)}" loading="lazy">
            <div class="blog-body">
                <div class="blog-meta-tag">
                    <span><i class="fas fa-compass"></i> Via Journal</span>
                    <span>${new Date(b.created_at || Date.now()).toLocaleDateString('en-IN', { month:'short', day:'numeric', year:'numeric' })}</span>
                </div>
                <h2 class="blog-title">${escapeHTML(b.title)}</h2>
                <p class="blog-excerpt">${escapeHTML(b.excerpt || '')}</p>
                <span class="read-story">Read Article <i class="fas fa-arrow-right"></i></span>
            </div>
        </article>
    `).join('');
}

async function loadBlogPost(slugOrId) {
    const container = document.getElementById('blog_details_container');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center; padding:80px 0;"><div class="loader-spinner"></div><p>Loading article...</p></div>';

    let blog = null;
    if (sb) {
        try {
            const isUUID = /^[0-9a-fA-F-]{36}$/.test(slugOrId);
            let q = sb.from('blog_posts').select('*').eq('is_published', true);
            if (isUUID) q = q.eq('id', slugOrId);
            else q = q.eq('slug', slugOrId);
            const { data } = await q.maybeSingle();
            if (data) blog = data;
        } catch (e) {}
    }

    if (!blog) {
        blog = LUXURY_FALLBACK_DATA.blogs.find(b => b.slug === slugOrId || b.id === slugOrId);
    }

    if (!blog) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px 0;">
                <h2>Article Not Found</h2>
                <p style="color:var(--text-muted); margin-bottom:20px;">The requested travel story is no longer available.</p>
                <button class="btn btn-gold" onclick="navTo('blog')"><i class="fas fa-arrow-left"></i> Back to Travel Journal</button>
            </div>
        `;
        return;
    }

    updateSEO(`${blog.title} | Via Journal`, blog.excerpt || 'Luxury travel guide by Via Tours.');

    const sanitizedContent = window.DOMPurify ? DOMPurify.sanitize(blog.content || '') : blog.content;

    container.innerHTML = `
        <article class="article-shell">
            <span class="article-back" onclick="navTo('blog')"><i class="fas fa-arrow-left"></i> All Travel Stories</span>
            <div class="article-header">
                <span class="luxury-badge" style="margin-bottom:12px;"><i class="fas fa-feather"></i> Curated Guide</span>
                <h1 style="font-size:clamp(2.2rem, 4vw, 3rem); margin-bottom:14px;">${escapeHTML(blog.title)}</h1>
                <p style="font-size:1.15rem; color:var(--text-muted); margin-bottom:20px;">${escapeHTML(blog.excerpt || '')}</p>
                <div style="display:flex; align-items:center; gap:16px; font-size:0.88rem; color:var(--text-muted);">
                    <span><i class="fas fa-user-edit"></i> Via Editorial Desk</span>
                    <span>•</span>
                    <span>${new Date(blog.created_at || Date.now()).toLocaleDateString('en-IN', { month:'long', day:'numeric', year:'numeric' })}</span>
                    <span>•</span>
                    <span>5 Min Read</span>
                </div>
            </div>

            <img src="${escapeHTML(blog.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80')}" alt="${escapeHTML(blog.title)}" class="article-hero-image">

            <div class="article-reading-layout">
                <aside class="article-aside">
                    <div class="article-toc">
                        <p><i class="fas fa-list-ul"></i> Article Highlights</p>
                        <a href="javascript:void(0)" onclick="document.getElementById('section-main')?.scrollIntoView({ behavior: 'smooth' })">Overview & Insights</a>
                        <a href="javascript:void(0)" onclick="document.getElementById('section-tips')?.scrollIntoView({ behavior: 'smooth' })">Specialist Advice</a>
                    </div>

                    <div style="background:var(--surface-card); border:1px solid var(--border-gold); border-radius:var(--radius-md); padding:24px; text-align:center; box-shadow:var(--shadow-md);">
                        <i class="fas fa-crown" style="font-size:2rem; color:var(--gold-500); margin-bottom:10px;"></i>
                        <h4 style="margin-bottom:8px;">Ready to Explore?</h4>
                        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">Let us tailor this exact journey for you.</p>
                        <button class="btn btn-gold btn-sm" style="width:100%;" onclick="navTo('plan-trip')">Plan This Trip</button>
                    </div>
                </aside>

                <div class="article-body" id="section-main">
                    ${sanitizedContent}
                    
                    <div id="section-tips" class="article-specialist-tips" style="margin-top:36px; padding:24px; background:var(--surface-soft); border-left:4px solid var(--gold-500); border-radius:var(--radius-md);">
                        <h4 style="margin-bottom:8px; color:var(--gold-500); font-family:var(--font-heading);"><i class="fas fa-lightbulb"></i> Via Travel Specialist Advice</h4>
                        <p style="font-size:0.95rem; line-height:1.7; color:var(--text-secondary); margin-bottom:12px;">Every journey we curate is fully customized to your travel rhythm, accommodation style, and pace. For bespoke arrangements, room upgrade preferences, or private chauffeured transfers, connect directly with our senior travel concierge.</p>
                        <button class="btn btn-gold btn-sm" onclick="navTo('plan-trip')"><i class="fas fa-magic"></i> Custom Quote for This Trip</button>
                    </div>
                </div>
            </div>
        </article>
    `;
}

// --- AI CONCIERGE CHAT WIDGET ---
function toggleChat() {
    const win = document.getElementById('chatWindow');
    if (win) win.classList.toggle('active');
}

function handleChatKey(e) {
    if (e.key === 'Enter') handleChatSend();
}

function handleChatSend() {
    const input = document.getElementById('chatInput');
    const msg = input?.value.trim();
    if (!msg) return;
    input.value = '';
    processAiMessage(msg);
}

function askAiPrompt(promptText) {
    processAiMessage(promptText);
}

function processAiMessage(msg) {
    const chatBody = document.getElementById('chatBody');
    if (!chatBody) return;

    // Append User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.textContent = msg;
    chatBody.appendChild(userMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Simulate Natural AI Response
    setTimeout(() => {
        let reply = "I would be delighted to assist you in planning your bespoke journey. You can explore our featured packages or click 'Plan Bespoke Trip' for a custom quote!";
        const m = msg.toLowerCase();

        if (m.includes('honeymoon') || m.includes('romantic') || m.includes('couple')) {
            reply = "💍 For an unforgettable honeymoon, we recommend our Maldives Overwater Pool Sanctuary or Bali Luxe Villa Retreat. Both feature private sunset yacht charters, floating breakfasts, and couple spa treatments!";
        } else if (m.includes('maldives') || m.includes('overwater')) {
            reply = "🏝️ Our 5★ Maldives Overwater Sanctuary package includes scenic seaplane transfers, private pool villas, and all gourmet dining. Prices start from " + formatPrice(185000) + " per person.";
        } else if (m.includes('swiss') || m.includes('switzerland') || m.includes('alps')) {
            reply = "🏔️ Our Swiss Alps & Glacier Express Grand Tour features first-class scenic panoramic rail, 5★ chalets in Zermatt and Interlaken, and Jungfraujoch Top of Europe access!";
        } else if (m.includes('dubai') || m.includes('desert')) {
            reply = "✨ Our Dubai Ultra Luxury package includes Burj Al Arab stay, private Palm Jumeirah superyacht charter, and luxury desert oasis glamping.";
        } else if (m.includes('visa') || m.includes('passport')) {
            reply = "🛂 Via Tours provides end-to-end visa assistance for Schengen, UK, USA, UAE, and 80+ countries. We handle all appointment bookings and documentation vouchers.";
        } else if (m.includes('cost') || m.includes('price') || m.includes('budget')) {
            reply = "💎 All our packages feature transparent pricing with no hidden charges. You can switch currencies at the top right (" + currentCurrency + ") or design a custom trip matching your specific budget!";
        } else if (m.includes('contact') || m.includes('phone') || m.includes('call')) {
            reply = "📞 You can reach our senior travel specialists directly at " + appSettings.phone + " or via WhatsApp for 24/7 VIP assistance.";
        }

        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg bot';
        botMsg.textContent = reply;
        chatBody.appendChild(botMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 550);
}

// --- SUPABASE STORAGE FILE UPLOAD HELPER ---
async function uploadFileToSupabase(file, folder = 'package-images') {
    if (!sb || !file) return null;
    try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${safeName}`;
        const { data, error } = await sb.storage.from(folder).upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
        });
        if (error) {
            console.warn('Storage upload error:', error);
            showToast('Storage upload notice: ' + error.message, 'error');
            return null;
        }
        const { data: { publicUrl } } = sb.storage.from(folder).getPublicUrl(fileName);
        return publicUrl;
    } catch (err) {
        console.warn('Storage upload exception:', err);
        return null;
    }
}

// --- ADMIN MANAGEMENT PORTAL ---
let loginAttempts = 0;
let lockoutUntil = 0;

async function adminLogin() {
    const now = Date.now();
    if (now < lockoutUntil) {
        showToast(`Account locked for ${Math.ceil((lockoutUntil - now) / 1000)}s due to multiple attempts.`, 'error');
        return;
    }

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPass')?.value;
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        showToast('Please enter both admin email and password.', 'error');
        return;
    }

    if (!sb) {
        showToast('Database connection unavailable.', 'error');
        return;
    }

    await withLoading(btn, async () => {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
            loginAttempts++;
            if (loginAttempts >= 5) {
                lockoutUntil = Date.now() + 60000;
                loginAttempts = 0;
                showToast('Too many failed attempts. Locked for 60 seconds.', 'error');
            } else {
                showToast(`Login failed (${loginAttempts}/5): ${error.message}`, 'error');
            }
            return;
        }

        loginAttempts = 0;
        showToast('Welcome back, Admin!', 'success');
        initAdminDashboard();
    });
}

async function forgotPassword() {
    const email = document.getElementById('loginEmail')?.value.trim();
    if (!email) {
        showToast('Please enter your admin email above first.', 'error');
        return;
    }
    if (sb) {
        const { error } = await sb.auth.resetPasswordForEmail(email);
        if (error) showToast(error.message, 'error');
        else showToast('Password reset link sent to your email.', 'success');
    }
}

async function logout() {
    if (sb) await sb.auth.signOut();
    const loginBox = document.getElementById('admin-login');
    const dashBox = document.getElementById('admin-dashboard');
    if (loginBox) loginBox.style.display = 'block';
    if (dashBox) dashBox.style.display = 'none';
    navTo('home');
    showToast('Signed out of staff portal successfully.');
}

function toggleSidebar() {
    const side = document.getElementById('adminSide');
    if (side) {
        side.classList.toggle('collapsed');
        isSidebarCollapsed = side.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
    }
}

async function initAdminDashboard() {
    if (sb) {
        const { data: { session } } = await sb.auth.getSession();
        if (!session) {
            const loginBox = document.getElementById('admin-login');
            const dashBox = document.getElementById('admin-dashboard');
            if (loginBox) loginBox.style.display = 'block';
            if (dashBox) dashBox.style.display = 'none';
            return;
        }
    }

    const loginBox = document.getElementById('admin-login');
    const dashBox = document.getElementById('admin-dashboard');
    if (loginBox) loginBox.style.display = 'none';
    if (dashBox) dashBox.style.display = 'block';

    loadAdminStats();
    loadAdminPackages();
    loadAdminDestinations();
    loadAdminEnquiries();
    loadAdminCustomers();
    loadAdminBookings();
    loadAdminBlog();
    loadAdminFaqs();
    loadAdminTestimonials();
    loadAdminSettings();
}

function showAdminTab(tabName, ev) {
    document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
    const target = document.getElementById('tab-' + tabName);
    if (target) target.style.display = 'block';

    document.querySelectorAll('.admin-menu li').forEach(li => li.classList.remove('active'));
    if (ev && ev.currentTarget) ev.currentTarget.classList.add('active');
}

async function loadAdminStats() {
    if (!sb) return;
    try {
        const [enqRes, newEnqRes, pkgRes, custRes, bookRes] = await Promise.all([
            sb.from('enquiries').select('id', { count: 'exact', head: true }),
            sb.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'New'),
            sb.from('packages').select('id', { count: 'exact', head: true }).eq('is_published', true),
            sb.from('customers').select('id', { count: 'exact', head: true }),
            sb.from('bookings').select('*')
        ]);

        document.getElementById('stat_enq').textContent = enqRes.count || 0;
        document.getElementById('stat_new_enq').textContent = newEnqRes.count || 0;
        document.getElementById('stat_pkg').textContent = pkgRes.count || 0;
        document.getElementById('stat_cust').textContent = custRes.count || 0;

        const bookings = bookRes.data || [];
        const rev = bookings.reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0);
        const bal = bookings.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);

        document.getElementById('stat_revenue').textContent = '₹' + rev.toLocaleString('en-IN');
        document.getElementById('stat_balance').textContent = '₹' + bal.toLocaleString('en-IN');

        // Recent Enquiries Table
        const { data: recentEnq } = await sb.from('enquiries').select('*').order('created_at', { ascending: false }).limit(5);
        document.getElementById('table_recent_enq').innerHTML = (recentEnq || []).map(e => `
            <tr>
                <td><strong>${escapeHTML(e.name || e.customer_name || 'Guest')}</strong><br><small style="color:#94a3b8;">${escapeHTML(e.email)}</small></td>
                <td>${escapeHTML(e.destination || 'Custom')}</td>
                <td><span class="luxury-badge" style="font-size:0.75rem;">${escapeHTML(e.status || 'New')}</span></td>
            </tr>
        `).join('');
    } catch (e) {
        console.warn('Admin stats error:', e);
    }
}

// Package Admin CRUD
async function loadAdminPackages() {
    const table = document.getElementById('table_packages');
    if (!table) return;

    let packages = [];
    if (sb) {
        const { data, error } = await sb.from('packages').select('*').order('created_at', { ascending: false });
        if (!error && data) packages = data;
    }

    if (packages.length === 0) {
        table.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:#94a3b8;"><i class="fas fa-box-open" style="font-size:1.8rem; margin-bottom:8px; display:block; color:var(--gold-400);"></i>No packages in database yet.<br><small>Click <strong>"+ Add Luxury Package"</strong> to create your first package.</small></td></tr>`;
        return;
    }

    table.innerHTML = packages.map(p => `
        <tr>
            <td><input type="checkbox" class="package-checkbox" value="${escapeHTML(p.id)}"></td>
            <td><img src="${escapeHTML(p.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&q=80')}" style="width:48px; height:48px; border-radius:6px; object-fit:cover;"></td>
            <td><strong>${escapeHTML(p.title)}</strong><br><small style="color:#94a3b8;">${escapeHTML(p.duration || '')}</small></td>
            <td>₹${Number(p.price || 0).toLocaleString('en-IN')}</td>
            <td><span class="luxury-badge" style="font-size:0.75rem;">${p.is_published ? 'Live' : 'Draft'}</span></td>
            <td>
                <button class="btn btn-gold btn-sm" onclick="editPackage('${escapeHTML(p.id)}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="delItem('packages', '${escapeHTML(p.id)}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openPkgModal() {
    document.getElementById('pkgFormModal').style.display = 'block';
    document.getElementById('m_pkg_id').value = '';
    document.getElementById('pkg_modal_title').textContent = 'Add Luxury Package';
    document.querySelectorAll('#pkgFormModal input, #pkgFormModal textarea').forEach(i => {
        if (i.type !== 'hidden' && i.type !== 'file') i.value = '';
    });
    const fileImg = document.getElementById('m_pkg_img');
    if (fileImg) fileImg.value = '';
    const fileGal = document.getElementById('m_pkg_gallery');
    if (fileGal) fileGal.value = '';
    currentItinerary = [];
    currentGallery = [];
    renderItinEditor();
    renderGalleryPreview();
    loadDestDropdown();
}

function addItinDay(day = null) {
    currentItinerary.push(day || { title: `Day ${currentItinerary.length + 1}`, desc: '' });
    renderItinEditor();
}

function renderItinEditor() {
    const editor = document.getElementById('itin_editor');
    if (!editor) return;
    editor.innerHTML = currentItinerary.map((d, i) => `
        <div style="background:#081535; border:1px solid #1c3060; padding:12px; border-radius:8px; margin-bottom:10px;">
            <input type="text" value="${escapeHTML(d.title)}" placeholder="Day Title" oninput="currentItinerary[${i}].title = this.value" style="margin-bottom:6px; background:#0c1a3d; color:#fff;">
            <textarea placeholder="Day Description" rows="2" oninput="currentItinerary[${i}].desc = this.value" style="background:#0c1a3d; color:#fff;">${escapeHTML(d.desc || d.description || '')}</textarea>
            <button type="button" class="btn btn-danger btn-sm" onclick="currentItinerary.splice(${i}, 1); renderItinEditor();" style="margin-top:6px;"><i class="fas fa-trash"></i> Remove Day</button>
        </div>
    `).join('');
}

function renderGalleryPreview() {
    const preview = document.getElementById('gallery_preview');
    if (!preview) return;
    preview.innerHTML = currentGallery.map((url, i) => `
        <div style="position:relative;">
            <img src="${escapeHTML(url)}" style="width:80px; height:80px; object-fit:cover; border-radius:6px;">
            <button type="button" onclick="currentGallery.splice(${i},1); renderGalleryPreview();" style="position:absolute; top:2px; right:2px; background:rgba(239,68,68,0.9); color:#fff; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

async function loadDestDropdown() {
    const select = document.getElementById('m_pkg_dest');
    if (!select) return;
    const dests = await fetchDestinations();
    select.innerHTML = '<option value="">None / Custom Destination</option>' + dests.map(d => `<option value="${escapeHTML(d.id)}">${escapeHTML(d.name)} (${escapeHTML(d.country || '')})</option>`).join('');
}

async function savePackage() {
    const title = document.getElementById('m_pkg_title').value.trim();
    if (!title) {
        showToast('Please enter package title.', 'error');
        return;
    }
    const id = document.getElementById('m_pkg_id').value;
    const payload = {
        title,
        price: parseFloat(document.getElementById('m_pkg_price').value || 0),
        duration: document.getElementById('m_pkg_duration').value.trim(),
        category: document.getElementById('m_pkg_cat').value.trim(),
        destination_id: document.getElementById('m_pkg_dest').value || null,
        short_description: document.getElementById('m_pkg_short_desc').value.trim(),
        description: document.getElementById('m_pkg_desc').value.trim(),
        itinerary: currentItinerary,
        inclusions: document.getElementById('m_pkg_inc').value.split('\n').map(s => s.trim()).filter(Boolean),
        exclusions: document.getElementById('m_pkg_exc').value.split('\n').map(s => s.trim()).filter(Boolean),
        important_info: document.getElementById('m_pkg_imp').value.split('\n').map(s => s.trim()).filter(Boolean),
        is_published: document.getElementById('m_pkg_pub').value === 'true'
    };

    // Upload featured image if selected
    const featuredFile = document.getElementById('m_pkg_img')?.files?.[0];
    if (featuredFile) {
        const uploadedUrl = await uploadFileToSupabase(featuredFile, 'package-images');
        if (uploadedUrl) payload.image_url = uploadedUrl;
    }

    // Upload gallery images if selected
    const galleryFiles = document.getElementById('m_pkg_gallery')?.files;
    if (galleryFiles && galleryFiles.length > 0) {
        for (let i = 0; i < galleryFiles.length; i++) {
            const gUrl = await uploadFileToSupabase(galleryFiles[i], 'package-images');
            if (gUrl) currentGallery.push(gUrl);
        }
    }
    payload.gallery_images = currentGallery;

    if (sb) {
        const { error } = id ? await sb.from('packages').update(payload).eq('id', id) : await sb.from('packages').insert([payload]);
        if (error) {
            showToast('Error saving package: ' + error.message, 'error');
            return;
        }
    }
    document.getElementById('pkgFormModal').style.display = 'none';
    showToast('Package saved successfully!');
    loadAdminPackages();
}

async function editPackage(id) {
    let p = null;
    if (sb) {
        const { data } = await sb.from('packages').select('*').eq('id', id).single();
        p = data;
    }
    if (!p) {
        const packages = await fetchPackages();
        p = packages.find(x => x.id === id);
    }
    if (!p) return;
    await loadDestDropdown();
    document.getElementById('pkgFormModal').style.display = 'block';
    document.getElementById('pkg_modal_title').textContent = 'Edit Package';
    document.getElementById('m_pkg_id').value = p.id;
    document.getElementById('m_pkg_title').value = p.title || '';
    document.getElementById('m_pkg_price').value = p.price || '';
    document.getElementById('m_pkg_cat').value = p.category || '';
    document.getElementById('m_pkg_duration').value = p.duration || '';
    document.getElementById('m_pkg_dest').value = p.destination_id || '';
    document.getElementById('m_pkg_short_desc').value = p.short_description || '';
    document.getElementById('m_pkg_desc').value = p.description || '';
    document.getElementById('m_pkg_inc').value = (p.inclusions || []).join('\n');
    document.getElementById('m_pkg_exc').value = (p.exclusions || []).join('\n');
    document.getElementById('m_pkg_imp').value = (p.important_info || []).join('\n');
    document.getElementById('m_pkg_pub').value = p.is_published ? 'true' : 'false';
    currentItinerary = p.itinerary || [];
    renderItinEditor();
    currentGallery = p.gallery_images || [];
    renderGalleryPreview();
}

// Destination Admin CRUD
async function loadAdminDestinations() {
    const table = document.getElementById('table_destinations');
    if (!table) return;

    let dests = [];
    if (sb) {
        const { data, error } = await sb.from('destinations').select('*').order('name');
        if (!error && data) dests = data;
    }

    if (dests.length === 0) {
        table.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color:#94a3b8;"><i class="fas fa-map-marked-alt" style="font-size:1.8rem; margin-bottom:8px; display:block; color:var(--gold-400);"></i>No destinations in database yet.<br><small>Click <strong>"+ Add Destination"</strong> to create one.</small></td></tr>`;
        return;
    }

    table.innerHTML = dests.map(d => `
        <tr>
            <td><input type="checkbox" class="dest-checkbox" value="${escapeHTML(d.id)}"></td>
            <td><strong>${escapeHTML(d.name)}</strong></td>
            <td>${escapeHTML(d.country || '')}</td>
            <td><span class="luxury-badge" style="font-size:0.75rem;">${d.is_published ? 'Live' : 'Hidden'}</span></td>
            <td>
                <button class="btn btn-gold btn-sm" onclick="editDestination('${escapeHTML(d.id)}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="delItem('destinations', '${escapeHTML(d.id)}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openDestModal() {
    document.getElementById('destFormModal').style.display = 'block';
    document.getElementById('m_dest_id').value = '';
    document.querySelectorAll('#destFormModal input, #destFormModal textarea').forEach(i => {
        if (i.type !== 'hidden' && i.type !== 'file') i.value = '';
    });
}

async function editDestination(id) {
    let d = null;
    if (sb) {
        const { data } = await sb.from('destinations').select('*').eq('id', id).single();
        d = data;
    }
    if (!d) {
        const dests = await fetchDestinations();
        d = dests.find(x => x.id === id);
    }
    if (!d) return;
    document.getElementById('destFormModal').style.display = 'block';
    document.getElementById('m_dest_id').value = d.id;
    document.getElementById('m_dest_name').value = d.name || '';
    document.getElementById('m_dest_country').value = d.country || '';
    document.getElementById('m_dest_region').value = d.region || '';
    document.getElementById('m_dest_desc').value = d.description || '';
    document.getElementById('m_dest_time').value = d.best_time || '';
    document.getElementById('m_dest_pub').value = d.is_published ? 'true' : 'false';
}

async function saveDestination() {
    const name = document.getElementById('m_dest_name').value.trim();
    if (!name) { showToast('Please enter destination name.', 'error'); return; }
    const id = document.getElementById('m_dest_id')?.value;
    const payload = {
        name,
        country: document.getElementById('m_dest_country').value.trim(),
        region: document.getElementById('m_dest_region').value.trim(),
        description: document.getElementById('m_dest_desc').value.trim(),
        best_time: document.getElementById('m_dest_time').value.trim(),
        is_published: document.getElementById('m_dest_pub').value === 'true'
    };
    const destFile = document.getElementById('m_dest_img')?.files?.[0];
    if (destFile) {
        const destImgUrl = await uploadFileToSupabase(destFile, 'package-images');
        if (destImgUrl) payload.image_url = destImgUrl;
    }
    if (sb) {
        const { error } = id ? await sb.from('destinations').update(payload).eq('id', id) : await sb.from('destinations').insert([payload]);
        if (error) {
            showToast('Error saving destination: ' + error.message, 'error');
            return;
        }
    }
    document.getElementById('destFormModal').style.display = 'none';
    showToast('Destination saved successfully!');
    loadAdminDestinations();
}

// Enquiries Admin & RFC-4180 CSV Export
async function loadAdminEnquiries() {
    const table = document.getElementById('table_enquiries');
    if (!table || !sb) return;
    const { data } = await sb.from('enquiries').select('*').order('created_at', { ascending: false });
    table.innerHTML = (data || []).map(e => `
        <tr>
            <td><strong>${escapeHTML(e.name || e.customer_name || 'Guest')}</strong><br>${escapeHTML(e.email || '')}<br>${escapeHTML(e.phone || '')}</td>
            <td>Dest: ${escapeHTML(e.destination || 'N/A')}<br>Dates: ${escapeHTML(e.travel_dates || 'N/A')}<br>Budget: ${escapeHTML(e.budget || 'N/A')}</td>
            <td>
                <select class="status-dropdown" onchange="changeStatus('enquiries', '${escapeHTML(e.id)}', this.value)" style="background:#081535; color:#fff; padding:4px 8px; border-radius:4px;">
                    <option ${e.status === 'New' ? 'selected' : ''}>New</option>
                    <option ${e.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                    <option ${e.status === 'Quotation Sent' ? 'selected' : ''}>Quotation Sent</option>
                    <option ${e.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option ${e.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
                <textarea placeholder="VIP internal notes" onchange="saveNote('${escapeHTML(e.id)}', this.value)" style="width:100%; margin-top:6px; font-size:12px; background:#081535; color:#fff;">${escapeHTML(e.internal_notes || '')}</textarea>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="delItem('enquiries', '${escapeHTML(e.id)}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function changeStatus(table, id, status) {
    if (sb) await sb.from(table).update({ status }).eq('id', id);
    showToast('Status updated to ' + status);
}

async function saveNote(id, text) {
    if (sb) await sb.from('enquiries').update({ internal_notes: text }).eq('id', id);
    showToast('Note saved.');
}

function csvEscape(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
}

async function exportEnquiries() {
    let rows = [];
    if (sb) {
        const { data } = await sb.from('enquiries').select('*').order('created_at', { ascending: false });
        rows = data || [];
    }
    const headers = ['Full Name', 'Email', 'Phone', 'Destination', 'Travel Dates', 'Travelers', 'Budget', 'Status', 'Internal Notes'];
    const csvContent = [
        headers.join(','),
        ...rows.map(r => [
            csvEscape(r.name),
            csvEscape(r.email),
            csvEscape(r.phone),
            csvEscape(r.destination),
            csvEscape(r.travel_dates),
            csvEscape(r.travelers),
            csvEscape(r.budget),
            csvEscape(r.status),
            csvEscape(r.internal_notes)
        ].join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `via_tours_enquiries_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Enquiries exported to CSV.');
}

// Customers & Bookings Admin
async function loadAdminCustomers() {
    const table = document.getElementById('table_customers');
    if (!table || !sb) return;
    const { data } = await sb.from('customers').select('*').order('created_at', { ascending: false });
    table.innerHTML = (data || []).map(c => `
        <tr>
            <td><strong>${escapeHTML(c.name)}</strong></td>
            <td>${escapeHTML(c.email)}<br>${escapeHTML(c.phone)}</td>
            <td><textarea style="background:#081535; color:#fff; width:100%; font-size:12px;">${escapeHTML(c.notes || '')}</textarea></td>
        </tr>
    `).join('');
}

async function loadAdminBookings() {
    const table = document.getElementById('table_bookings');
    if (!table || !sb) return;
    const { data } = await sb.from('bookings').select('*').order('travel_date', { ascending: false });
    table.innerHTML = (data || []).map(b => `
        <tr>
            <td><strong>${escapeHTML(b.customer_name || 'VIP Client')}</strong></td>
            <td>${escapeHTML(b.package_name || 'Custom')}</td>
            <td>${b.travel_date ? new Date(b.travel_date).toLocaleDateString() : 'N/A'}</td>
            <td>₹${Number(b.total_amount).toLocaleString('en-IN')} (Paid: ₹${Number(b.amount_paid).toLocaleString('en-IN')})</td>
            <td><span class="luxury-badge">${escapeHTML(b.booking_status || 'Confirmed')}</span></td>
        </tr>
    `).join('');
}

function openBookModal() {
    initDatePickers();
    document.getElementById('bookFormModal').style.display = 'block';
}

async function saveBooking() {
    const total = parseFloat(document.getElementById('m_book_total').value || 0);
    const paid = parseFloat(document.getElementById('m_book_paid').value || 0);
    const payload = {
        customer_name: document.getElementById('m_book_customer_name').value.trim(),
        package_name: document.getElementById('m_book_package_name').value.trim(),
        travel_date: document.getElementById('m_book_date').value,
        travelers: parseInt(document.getElementById('m_book_travelers').value) || 2,
        total_amount: total,
        amount_paid: paid,
        balance: total - paid,
        booking_status: document.getElementById('m_book_status').value
    };
    if (sb) await sb.from('bookings').insert([payload]);
    document.getElementById('bookFormModal').style.display = 'none';
    showToast('Booking saved.');
    loadAdminBookings();
}

// Blog Admin
async function loadAdminBlog() {
    const table = document.getElementById('table_blog');
    if (!table) return;

    let blogs = [];
    if (sb) {
        const { data, error } = await sb.from('blog_posts').select('*').order('created_at', { ascending: false });
        if (!error && data) blogs = data;
    }

    if (blogs.length === 0) {
        table.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:32px; color:#94a3b8;"><i class="fas fa-feather-alt" style="font-size:1.8rem; margin-bottom:8px; display:block; color:var(--gold-400);"></i>No stories in database yet.<br><small>Click <strong>"+ Add Story"</strong> to publish one.</small></td></tr>`;
        return;
    }

    table.innerHTML = blogs.map(b => `
        <tr>
            <td><strong>${escapeHTML(b.title)}</strong></td>
            <td><span class="luxury-badge">${b.is_published ? 'Live' : 'Hidden'}</span></td>
            <td>
                <button class="btn btn-gold btn-sm" onclick="editBlog('${escapeHTML(b.id)}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="delItem('blog_posts', '${escapeHTML(b.id)}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openBlogModal() {
    document.getElementById('blogFormModal').style.display = 'block';
    document.getElementById('m_blog_id').value = '';
    document.querySelectorAll('#blogFormModal input, #blogFormModal textarea').forEach(i => {
        if (i.type !== 'hidden') i.value = '';
    });
}

async function editBlog(id) {
    let b = null;
    if (sb) {
        const { data } = await sb.from('blog_posts').select('*').eq('id', id).single();
        b = data;
    }
    if (!b) {
        const blogs = await fetchBlogs();
        b = blogs.find(x => x.id === id);
    }
    if (!b) return;
    document.getElementById('blogFormModal').style.display = 'block';
    document.getElementById('m_blog_id').value = b.id;
    document.getElementById('m_blog_title').value = b.title || '';
    document.getElementById('m_blog_slug').value = b.slug || '';
    document.getElementById('m_blog_img').value = b.image_url || '';
    document.getElementById('m_blog_excerpt').value = b.excerpt || '';
    document.getElementById('m_blog_content').value = b.content || '';
    document.getElementById('m_blog_pub').value = b.is_published ? 'true' : 'false';
}

async function saveBlogPost() {
    const title = document.getElementById('m_blog_title').value.trim();
    if (!title) { showToast('Please enter title.', 'error'); return; }
    const id = document.getElementById('m_blog_id')?.value;
    const payload = {
        title,
        slug: document.getElementById('m_blog_slug').value.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image_url: document.getElementById('m_blog_img').value.trim(),
        excerpt: document.getElementById('m_blog_excerpt').value.trim(),
        content: document.getElementById('m_blog_content').value.trim(),
        is_published: document.getElementById('m_blog_pub').value === 'true'
    };
    if (sb) {
        const { error } = id ? await sb.from('blog_posts').update(payload).eq('id', id) : await sb.from('blog_posts').insert([payload]);
        if (error) {
            showToast('Error saving story: ' + error.message, 'error');
            return;
        }
    }
    document.getElementById('blogFormModal').style.display = 'none';
    showToast('Blog post saved.');
    loadAdminBlog();
}

// Testimonials & FAQs Admin
async function loadAdminTestimonials() {
    const table = document.getElementById('table_testimonials');
    if (!table) return;

    let tests = [];
    if (sb) {
        const { data, error } = await sb.from('testimonials').select('*');
        if (!error && data) tests = data;
    }

    if (tests.length === 0) {
        table.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:32px; color:#94a3b8;">No client testimonials in database yet.<br><small>Click <strong>"+ Add Testimonial"</strong> to create one.</small></td></tr>`;
        return;
    }

    table.innerHTML = tests.map(t => `
        <tr>
            <td><strong>${escapeHTML(t.name)}</strong></td>
            <td>${escapeHTML((t.message || '').substring(0, 70))}...</td>
            <td><button class="btn btn-danger btn-sm" onclick="delItem('testimonials', '${escapeHTML(t.id)}')"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function openTestModal() {
    document.getElementById('testFormModal').style.display = 'block';
    document.querySelectorAll('#testFormModal input, #testFormModal textarea').forEach(i => i.value = '');
}

async function saveTestimonial() {
    const payload = {
        name: document.getElementById('m_test_name').value.trim(),
        location: document.getElementById('m_test_loc').value.trim(),
        rating: parseInt(document.getElementById('m_test_rating').value) || 5,
        image_url: document.getElementById('m_test_img').value.trim(),
        message: document.getElementById('m_test_msg').value.trim()
    };
    if (sb) {
        const { error } = await sb.from('testimonials').insert([payload]);
        if (error) {
            showToast('Error saving testimonial: ' + error.message, 'error');
            return;
        }
    }
    document.getElementById('testFormModal').style.display = 'none';
    showToast('Testimonial saved.');
    loadAdminTestimonials();
}

async function loadAdminFaqs() {
    const table = document.getElementById('table_faqs');
    if (!table) return;

    let faqs = [];
    if (sb) {
        const { data, error } = await sb.from('faqs').select('*');
        if (!error && data) faqs = data;
    }

    if (faqs.length === 0) {
        table.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:32px; color:#94a3b8;">No custom FAQs in database yet.<br><small>Default luxury FAQs are active on the site.</small></td></tr>`;
        return;
    }

    table.innerHTML = faqs.map(f => `
        <tr>
            <td><strong>${escapeHTML(f.question)}</strong></td>
            <td><span class="luxury-badge">${f.is_published ? 'Live' : 'Hidden'}</span></td>
            <td><button class="btn btn-danger btn-sm" onclick="delItem('faqs', '${escapeHTML(f.id)}')"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function openFaqModal() {
    document.getElementById('faqFormModal').style.display = 'block';
    document.querySelectorAll('#faqFormModal input, #faqFormModal textarea').forEach(i => i.value = '');
}

async function saveFaq() {
    const payload = {
        question: document.getElementById('m_faq_question').value.trim(),
        answer: document.getElementById('m_faq_answer').value.trim(),
        is_published: document.getElementById('m_faq_pub').value === 'true'
    };
    if (sb) {
        const { error } = await sb.from('faqs').insert([payload]);
        if (error) {
            showToast('Error saving FAQ: ' + error.message, 'error');
            return;
        }
    }
    document.getElementById('faqFormModal').style.display = 'none';
    showToast('FAQ saved.');
    loadAdminFaqs();
    loadHomeFaqs();
}

// Settings Admin
async function loadAdminSettings() {
    if (sb) {
        try {
            const { data } = await sb.from('website_settings').select('*').eq('id', 1).maybeSingle();
            if (data) appSettings = { ...appSettings, ...data };
        } catch(e) {}
    }
    document.getElementById('set_name').value = appSettings.business_name || '';
    document.getElementById('set_email').value = appSettings.email || '';
    document.getElementById('set_phone').value = appSettings.phone || '';
    document.getElementById('set_whatsapp').value = appSettings.whatsapp || '';
    document.getElementById('set_address').value = appSettings.address || '';
}

async function saveSettings() {
    appSettings = {
        business_name: document.getElementById('set_name').value.trim(),
        email: document.getElementById('set_email').value.trim(),
        phone: document.getElementById('set_phone').value.trim(),
        whatsapp: document.getElementById('set_whatsapp').value.trim(),
        address: document.getElementById('set_address').value.trim()
    };
    if (sb) await sb.from('website_settings').update(appSettings).eq('id', 1);
    showToast('Settings saved.');
}

async function delItem(table, id) {
    if (!id) {
        showToast('Cannot delete record: Missing valid ID.', 'error');
        return;
    }
    showConfirm('Are you sure you want to permanently delete this record?', async () => {
        if (sb) {
            const { error } = await sb.from(table).delete().eq('id', id);
            if (error) {
                showToast('Failed to delete: ' + error.message, 'error');
                return;
            }
        }
        showToast('Record deleted successfully.');
        if (table === 'packages') loadAdminPackages();
        else if (table === 'destinations') loadAdminDestinations();
        else if (table === 'enquiries') loadAdminEnquiries();
        else if (table === 'blog_posts') loadAdminBlog();
        else if (table === 'faqs') loadAdminFaqs();
        else if (table === 'testimonials') loadAdminTestimonials();
    });
}

function toggleAllCheckboxes(type, master) {
    document.querySelectorAll(`.${type}-checkbox`).forEach(cb => cb.checked = master.checked);
}

// Scroll progress and top button indicator
window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    const progressBar = document.getElementById('scrollProgress');
    if (progressBar) progressBar.style.width = progress + '%';

    const btn = document.getElementById('scrollTopBtn');
    if (btn) {
        if (scrollTop > 300) btn.classList.add('show');
        else btn.classList.remove('show');
    }

    const header = document.getElementById('mainHeader');
    if (header) {
        if (scrollTop > 40) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    }
});
