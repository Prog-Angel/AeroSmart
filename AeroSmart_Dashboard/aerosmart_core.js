// DOM Elements
const walletToggle = document.getElementById('walletToggle');
const walletDropdown = document.getElementById('walletDropdown');
const smartRouteCard = document.getElementById('smartRouteCard');
const alertBubble = document.getElementById('alertBubble');
const alertBubbleText = document.getElementById('alertBubbleText');
const ptBalance = document.getElementById('ptBalance');
const profileModal = document.getElementById('profileModal');
const weatherIcon = document.getElementById('weatherIcon');
const weatherText = document.getElementById('weatherText');
const routeTextContent = document.getElementById('routeTextContent');
const aiMessageText = document.getElementById('aiMessageText');
const districtIndicator = document.getElementById('districtIcon');
const activeDistrictText = document.getElementById('activeDistrictText');

// PT Info Elements
const ptInfoBtn = document.getElementById('ptInfoBtn');
const ptInfoModal = document.getElementById('ptInfoModal');
const closePtInfoBtn = document.getElementById('closePtInfoBtn');

// Profile Inputs
const userNameInput = document.getElementById('userNameInput');
const homeLocationInput = document.getElementById('homeLocationInput');
const workLocationInput = document.getElementById('workLocationInput');
const prefFloodsInput = document.getElementById('prefFloods');
const prefEmissionsInput = document.getElementById('prefEmissions');

// Danger Alert Elements
const dangerAlertModal = document.getElementById('dangerAlertModal');
const dangerAlertTitle = document.getElementById('dangerAlertTitle');
const dangerAlertText = document.getElementById('dangerAlertText');

// Agent Icons
const aeroSentinel = document.getElementById('aeroSentinel');
const aeroNavigator = document.getElementById('aeroNavigator');
const aeroVisualizer = document.getElementById('aeroVisualizer');

// Top Controls & Modals
const settingsGearBtn = document.getElementById('settingsGearBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const trophyBtn = document.getElementById('trophyBtn');
const leaderboardModal = document.getElementById('leaderboardModal');
const userRankText = document.getElementById('userRankText');

// State
let userProfile = {};

// Initialize events
document.addEventListener('DOMContentLoaded', () => {

    // Check Local Storage
    const savedProfile = localStorage.getItem('aeroSmartUser');
    if (savedProfile) {
        userProfile = JSON.parse(savedProfile);
        startApp();
    } else {
        // Show Modal
        profileModal.classList.add('active');
    }

    // Toggle Wallet Dropdown
    walletToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        walletDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        walletDropdown.classList.remove('active');
    });

    walletDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // PT Info Modal Logic
    if (ptInfoBtn && ptInfoModal && closePtInfoBtn) {
        ptInfoBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent dropdown from toggling
            ptInfoModal.classList.add('active');
        });

        closePtInfoBtn.addEventListener('click', () => {
            ptInfoModal.classList.remove('active');
        });
    }

    // Top Controls Logic
    if (settingsGearBtn) {
        settingsGearBtn.addEventListener('click', () => {
            profileModal.classList.add('active');
        });
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('aeroTheme', isDark ? 'dark' : 'light');
        });
    }

    // Apply saved theme
    const savedTheme = localStorage.getItem('aeroTheme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
    } else {
        document.body.classList.add('dark-theme');
    }

    if (trophyBtn) {
        trophyBtn.addEventListener('click', () => {
            showLeaderboard();
        });
    }

    if (aeroVisualizer) {
        aeroVisualizer.addEventListener('click', toggleDangerLayers);
    }

    // Make GPS Meter draggable
    const gpsMeter = document.getElementById('gpsMeter');
    if (gpsMeter) {
        makeDraggable(gpsMeter);
    }

    // Initialize District Scores in localStorage
    initDistrictScores();
});

function initDistrictScores() {
    let scores = localStorage.getItem('districtScores');
    if (!scores) {
        scores = {
            "الجبيهة": 18500,
            "حي الصحابة": 15000,
            "تلاع العلي": 12000,
            "خلدا": 11000,
            "سحاب": 8500,
            "القسطل": 8000,
            "وسط البلد": 7500
        };
        localStorage.setItem('districtScores', JSON.stringify(scores));
    }
}

function saveProfile() {
    const name = userNameInput.value.trim() || 'صديقي';
    const home = homeLocationInput.value.trim() || 'المنزل';
    const work = workLocationInput.value.trim() || 'العمل';
    const prefFloods = prefFloodsInput ? prefFloodsInput.checked : true;
    const prefEmissions = prefEmissionsInput ? prefEmissionsInput.checked : true;

    userProfile = { name, home, work, prefFloods, prefEmissions };
    localStorage.setItem('aeroSmartUser', JSON.stringify(userProfile));

    profileModal.classList.remove('active');
    startApp();
}

function startApp() {
    // 0. Smart Theme
    setSmartTheme();

    // 1. Personalized Weather Greeting
    getWeatherData();

    // 2. Comprehensive Security Check (Home & Work)
    checkLocations();

    // 3. Initialize Leaflet Map
    initMap();

    // 4. Register Dynamic Location with AeroNavigator
    registerLocation();

    // 5. Start AeroVisualizer Real-time Polling
    if (!window.aeroPollInterval) {
        window.aeroPollInterval = setInterval(pollAeroVisualizer, 2000);
    }

    // 6. Setup Agent Buttons
    setupAgentButtons();
}

let highStakesMode = false;

function setupAgentButtons() {
    const aeroShield = document.getElementById('aeroShield');
    if (aeroShield) {
        aeroShield.onclick = function () {
            highStakesMode = !highStakesMode;
            if (highStakesMode) {
                aeroShield.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.6))'; // Red background
                aeroShield.style.color = '#fff';
                aeroShield.classList.add('pulse-green'); // re-use pulse for animation
                showAiMessage("🚨 تم تفعيل 'High Stakes Mode'. النقاط والخصومات ستكون مضاعفة!");
            } else {
                aeroShield.style.background = '';
                aeroShield.style.color = '';
                aeroShield.classList.remove('pulse-green');
                showAiMessage("🛡️ تم إيقاف 'High Stakes Mode'. عادت النقاط للوضع الطبيعي.");
            }
        };
    }

    const aeroNavigatorBtn = document.getElementById('aeroNavigator');
    if (aeroNavigatorBtn) {
        aeroNavigatorBtn.onclick = function () {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    showAiMessage(`📡 إحداثياتك الحية: خط العرض ${pos.coords.latitude.toFixed(4)}، خط الطول ${pos.coords.longitude.toFixed(4)} (منطقة: ${currentActiveDistrict})`);
                });
            } else {
                showAiMessage("📡 لا يمكن الوصول للموقع الحالي.");
            }
        };
    }
}

async function setSmartTheme() {
    const apiKey = "349c8f2737873dfbf6896a261081229c";
    const city = "Amman";
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ar`);
        const data = await response.json();
        if (data && data.weather) {
            const condition = data.weather[0].main;
            const hour = new Date().getHours();
            const isNight = hour < 6 || hour > 18;

            const savedTheme = localStorage.getItem('aeroTheme');
            if (savedTheme) {
                if (savedTheme === 'dark') document.body.classList.add('dark-theme');
                else document.body.classList.remove('dark-theme');
            } else {
                if (isNight || condition === "Dust" || condition === "Sand" || condition === "Smoke" || condition === "Ash") {
                    document.body.classList.add('dark-theme');
                } else {
                    document.body.classList.remove('dark-theme');
                }
            }
        }
    } catch (e) {
        console.error("Theme: Error fetching weather");
    }
}

// Weather Simulation System (Amman Default)
const weatherStates = [
    { main: 'Clear', temp: 24, icon: 'fa-sun', color: 'text-warning', msg: 'الجو في عمان رائع اليوم! رحلة ممتعة بنقاء كامل ☀️' },
    { main: 'Rain', temp: 18, icon: 'fa-cloud-showers-heavy', color: 'text-info', msg: 'يا صديقي، الجو ممطر.. لا تنسَ مظلتك وخفف سرعتك بجانب المدارس. 🌧️', alert: 'خطر تشكل السيول في المناطق المنخفضة!' },
    { main: 'Thunderstorm', temp: 15, icon: 'fa-bolt', color: 'text-primary', msg: 'تحذير: عواصف رعدية متوقعة! تجنب القيادة في المناطق المنخفضة. ⚡', alert: 'تنبيه عالي: خطر الفيضانات في الأنفاق والوديان!' },
    { main: 'Dust', temp: 28, icon: 'fa-wind', color: 'text-secondary', msg: 'تنبيه: عاصفة رملية! يرجى إغلاق النوافذ وتشغيل مصابيح الضباب. 🌪️' }
];
let currentWeatherIdx = 0;

window.simulateWeather = function() {
    currentWeatherIdx = (currentWeatherIdx + 1) % weatherStates.length;
    const state = weatherStates[currentWeatherIdx];
    
    const iconEl = document.getElementById('weather-icon');
    const statusEl = document.getElementById('weather-status');
    
    if (iconEl) iconEl.className = `fas ${state.icon} ${state.color}`;
    if (statusEl) statusEl.innerText = `${state.temp}°C`;
    
    showAiMessage(state.msg);

    // Only show flood danger alert if Rain or Storm
    if (state.alert) {
        setTimeout(() => {
            const dangerAlertModal = document.getElementById('dangerAlertModal');
            const dangerTitle = document.getElementById('dangerTitle');
            if (dangerAlertModal && dangerTitle) {
                dangerTitle.innerText = state.alert;
                dangerAlertModal.classList.add('active');
            }
        }, 2000);
    }
};

async function getWeatherData() {
    // Initial call to set UI from first simulation state or fallback
    const iconEl = document.getElementById('weather-icon');
    const statusEl = document.getElementById('weather-status');
    if (iconEl && iconEl.classList.contains('fa-spin')) {
        const state = weatherStates[0];
        iconEl.className = `fas ${state.icon} ${state.color}`;
        statusEl.innerText = `${state.temp}°C`;
    }
}

function updateWeatherUI(data) {
    const weatherIcon = document.getElementById('weather-icon');
    const weatherStatus = document.getElementById('weather-status');
    const weatherTip = document.getElementById('weather-tip');

    if (!weatherIcon || !weatherStatus || !weatherTip) return;

    const temp = Math.round(data.main.temp);
    const condition = data.weather[0].main;

    weatherStatus.innerText = `${temp}°C`;
    const userName = userProfile.name || "صديقي";

    if (condition === "Clear" || condition === "Clouds") {
        weatherIcon.className = "fas fa-sun text-warning";
        weatherTip.innerText = `يا ${userName}، الجو مثالي لزيارة وسط البلد اليوم، استمتع بالنقاوة!`;
    } else if (condition === "Rain") {
        weatherIcon.className = "fas fa-cloud-showers-heavy text-info";
        weatherTip.innerText = `يا ${userName}، انتبه للطريق! خطر تشكل سيول في بعض المناطق المنخفضة.`;
    }
}

let map;
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement || map) return; // Prevent double initialization

    map = L.map('map', { zoomControl: false }).setView([31.95, 35.91], 13); // إحداثيات عمان
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Feature: Click-to-Go with Reverse Geocoding
    map.on('click', async function (e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Show loading state
        document.querySelector('.search-input').value = "جاري تحديد الموقع...";

        let destName = "وجهة مختارة";
        try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`);
            const data = await resp.json();
            if (data && data.display_name) {
                // Extract suburb or road for a cleaner name
                destName = data.address.suburb || data.address.neighbourhood || data.address.road || data.display_name.split(',')[0];
            }
        } catch (err) {
            destName = `نقطة (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
        }

        const searchInput = document.querySelector('.search-input');
        const distText = document.getElementById('activeDistrictText');

        searchInput.value = destName;

        // Special Warning for Industrial/Maintenance Zones
        const isDanger = destName.includes("سحاب") || destName.includes("صناعية") || destName.includes("قسطل");
        if (isDanger) {
            searchInput.style.color = "#F59E0B"; 
            if (activeDistrictText) {
                activeDistrictText.innerText = `تحذير: منطقة صناعية - ${destName}`;
            }
        } else {
            searchInput.style.color = "var(--text-dark)";
            if (activeDistrictText) {
                activeDistrictText.innerText = `الوجهة: ${destName}`;
            }
        }

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const startCoords = [pos.coords.latitude, pos.coords.longitude];
                drawDynamicRoutes(startCoords, [lat, lng], destName);
            });
        } else {
            drawDynamicRoutes([32.02, 35.87], [lat, lng], destName);
        }
    });

    // Setup Signal and Bell Icons
    setupTopIcons();
}

function setupTopIcons() {
    const aeroSentinelBtn = document.getElementById('aeroSentinel');
    const bellIcon = document.getElementById('bellIcon');
    const bellDot = document.getElementById('bellDot');

    // Satellite Dish = Cloud Connectivity Signal (was blue, now green)
    if (aeroSentinelBtn) {
        // Initial success green pulse blink
        aeroSentinelBtn.classList.add('pulse-green');
        setTimeout(() => aeroSentinelBtn.classList.remove('pulse-green'), 3000);

        aeroSentinelBtn.onclick = () => {
            showAiMessage("📡 نظام Aero-Smart متصل بسحابة عمان الذكية - البيانات محدثة");
            aeroSentinelBtn.classList.add('pulse-green');
            setTimeout(() => aeroSentinelBtn.classList.remove('pulse-green'), 2000);
        };
    }

    // Bell = Pollution Notification
    if (bellIcon && bellDot) {
        setTimeout(() => {
            bellDot.style.display = 'block';
        }, 3000);

        bellIcon.onclick = () => {
            bellDot.style.display = 'none';
            const userName = userProfile.name || "صديقي";
            showAiMessage(`⚠️ يا ${userName}، المسار المعتاد إلى منطقة عملك به نسبة تلوث عالية. نوصي بتأمين مسار جديد.`);
        };
    }
}

function checkLocations() {
    // Disabled the startup toast as we moved it to the Bell Icon
}

// UI Actions
let dangerLayers = [];
let dangerLayersVisible = false;

function toggleDangerLayers() {
    if (!map) return;

    if (dangerLayersVisible) {
        dangerLayers.forEach(layer => map.removeLayer(layer));
        dangerLayers = [];
        dangerLayersVisible = false;
        aeroVisualizer.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
        aeroVisualizer.classList.remove('active');
    } else {
        const sahb = L.circle([31.87, 36.00], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2000 }).addTo(map).bindPopup("<div style='text-align: right; font-family: Tajawal;'><i class='fa-solid fa-shield-virus' style='color: #EF4444;'></i> سحاب الصناعية: انبعاثات عالية</div>");
        const qastal = L.circle([31.74, 35.94], { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.3, radius: 2000 }).addTo(map).bindPopup("<div style='text-align: right; font-family: Tajawal;'><i class='fa-solid fa-shield-virus' style='color: #EF4444;'></i> القسطل الصناعية: انبعاثات عالية</div>");
        const downtown = L.circle([31.95, 35.93], { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.4, radius: 1500 }).addTo(map).bindPopup("<div style='text-align: right; font-family: Tajawal;'><i class='fa-solid fa-cloud-showers-water' style='color: #3b82f6;'></i> وسط البلد: خطر تشكل سيول</div>");

        dangerLayers.push(sahb, qastal, downtown);
        dangerLayersVisible = true;
        aeroVisualizer.innerHTML = '<i class="fa-regular fa-eye"></i>';
        aeroVisualizer.classList.add('active');
    }
}

function hideRoutePopup() {
    smartRouteCard.classList.remove('active');
    aeroNavigator.classList.remove('pulsing');
}

function hideDangerAlert() {
    dangerAlertModal.classList.remove('active');
    if (window.pendingJourneyPath) {
        startDynamicJourney(window.pendingJourneyPath, window.pendingDestination);
    }
}

function acceptSafeRoute() {
    dangerAlertModal.classList.remove('active');
    if (window.safeJourneyPath) {
        startDynamicJourney(window.safeJourneyPath, window.pendingDestination);
    }
}

let gpsInterval;

function acceptRoute() {
    hideRoutePopup();

    // Animate compass
    const icon = aeroNavigator.querySelector('i');
    icon.classList.remove('fa-compass');
    icon.classList.add('fa-location-arrow');
    aeroNavigator.classList.add('active');

    // We remove the old green polyline drawer from acceptRoute as we moved mapping logic to secureRoute
}

let destinationMarker, movingCarMarker, routingControl;

async function secureRoute() {
    const destination = document.querySelector('.search-input').value.trim() || 'جامعة الزيتونة الأردنية';
    const btn = document.querySelector('.emergency-btn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري فحص المسارات...';
    btn.style.opacity = '0.8';

    // Activate all agents
    aeroSentinel.classList.add('pulsing');
    aeroNavigator.classList.add('pulsing');
    aeroVisualizer.classList.add('pulsing');

    const ammanLocations = {
        'جامعة الزيتونة': [31.8340, 35.8488],
        'جامعة الزيتونة الأردنية': [31.8340, 35.8488],
        'وسط البلد': [31.9515, 35.9392],
        'تاج مول': [31.9430, 35.9015],
        'الصحابة': [31.9860, 35.9860],
        'الجبيهة': [32.0200, 35.8700]
    };

    // 1. Get Destination Coordinates (Hardcoded or Nominatim)
    let destCoords = null;
    for (let key in ammanLocations) {
        if (destination.includes(key)) {
            destCoords = ammanLocations[key];
            break;
        }
    }

    if (!destCoords) {
        try {
            const nomResp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination + " Amman Jordan")}&limit=1&viewbox=35.7,31.7,36.1,32.1&bounded=1`);
            const nomData = await nomResp.json();
            if (nomData && nomData.length > 0) {
                destCoords = [parseFloat(nomData[0].lat), parseFloat(nomData[0].lon)];
            } else {
                destCoords = [31.84, 35.87]; // Fallback
            }
        } catch (e) {
            destCoords = [31.84, 35.87];
        }
    }

    // 2. Get Current Location
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const startCoords = [pos.coords.latitude, pos.coords.longitude];
            await finalizeRouteGeneration(startCoords, destCoords, destination, btn);
        }, async () => {
            // Fallback to Jubeiha
            const startCoords = [32.02, 35.87];
            await finalizeRouteGeneration(startCoords, destCoords, destination, btn);
        });
    } else {
        const startCoords = [32.02, 35.87];
        await finalizeRouteGeneration(startCoords, destCoords, destination, btn);
    }
}

function finalizeRouteGeneration(startCoords, destCoords, destination, btn) {
    const userName = userProfile.name || "صديقي";
    btn.innerHTML = `<i class="fa-solid fa-check"></i> يا ${userName}، جاري تأمين أذكى مسار إلى ${destination}...`;
    btn.style.background = 'linear-gradient(135deg, var(--emerald-green), #10B981)';
    btn.style.opacity = '1';

    aeroSentinel.classList.remove('pulsing');
    aeroNavigator.classList.remove('pulsing');
    aeroVisualizer.classList.remove('pulsing');

    drawDynamicRoutes(startCoords, destCoords, destination);

    setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> تأمين المسار';
        btn.style.background = 'linear-gradient(135deg, var(--emerald-green), var(--cyan-blue))';
    }, 3000);
}

function drawDynamicRoutes(startCoords, destCoords, destination) {
    if (!map) return;

    // Clear previous layers
    if (routingControl) map.removeControl(routingControl);
    if (destinationMarker) map.removeLayer(destinationMarker);
    if (movingCarMarker) map.removeLayer(movingCarMarker);

    // Update UI
    const distDisplay = document.getElementById('activeDistrictDisplay');
    if (distDisplay) distDisplay.innerHTML = `<i class="fa-solid fa-map-location-dot"></i> الوجهة: ${destination}`;

    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(startCoords[0], startCoords[1]),
            L.latLng(destCoords[0], destCoords[1])
        ],
        showAlternatives: true,
        fitSelectedRoutes: true,
        show: false,
        createMarker: function () { return null; },
        lineOptions: {
            styles: [{ color: '#6B7280', opacity: 0.4, weight: 4, dashArray: '5, 10' }], // DANGEROUS Route: Dashed Grey
            extendToWaypoints: true,
            missingRouteTolerance: 0
        },
        altLineOptions: {
            styles: [
                { color: '#000', opacity: 0.2, weight: 10 }, // Outer shadow
                { color: '#10B981', opacity: 1, weight: 6 }  // SAFE Route: Neon Green
            ],
            extendToWaypoints: true,
            missingRouteTolerance: 0
        }
    }).addTo(map);

    // Destination Marker
    destinationMarker = L.marker(destCoords).addTo(map)
        .bindPopup(`<div style="text-align: right; font-family: 'Tajawal', sans-serif;"><b>${destination}</b><br>منطقة نقية <i class="fa-solid fa-leaf" style="color: var(--emerald-green);"></i></div>`)
        .openPopup();

    // Car Marker (Blue dot)
    const carIcon = L.divIcon({
        className: 'moving-car-icon',
        html: '<div class="car-dot"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    movingCarMarker = L.marker(startCoords, { icon: carIcon }).addTo(map);

    routingControl.on('routesfound', function (e) {
        const primaryRoute = e.routes[0];
        const altRoute = e.routes.length > 1 ? e.routes[1] : e.routes[0];

        const primaryCoords = primaryRoute.coordinates.map(c => [c.lat, c.lng]);
        const altCoords = altRoute.coordinates.map(c => [c.lat, c.lng]);

        // Define Danger Zones
        const industrialZones = [
            { lat: 31.87, lng: 36.00, name: 'سحاب الصناعية' },
            { lat: 31.74, lng: 35.94, name: 'القسطل الصناعية' }
        ];
        const floodZones = [
            { lat: 31.95, lng: 35.93, name: 'وسط البلد' } // Downtown Amman
        ];

        let dangerFound = null;
        let dangerType = '';

        for (let coord of primaryCoords) {
            if (userProfile.prefEmissions !== false) {
                for (let zone of industrialZones) {
                    if (Math.abs(coord[0] - zone.lat) < 0.05 && Math.abs(coord[1] - zone.lng) < 0.05) {
                        dangerFound = zone;
                        dangerType = 'industrial';
                        break;
                    }
                }
            }
            if (dangerFound) break;

            if (userProfile.prefFloods !== false && (weatherStates[currentWeatherIdx].main === 'Rain' || weatherStates[currentWeatherIdx].main === 'Thunderstorm')) {
                for (let zone of floodZones) {
                    if (Math.abs(coord[0] - zone.lat) < 0.02 && Math.abs(coord[1] - zone.lng) < 0.02) {
                        dangerFound = zone;
                        dangerType = 'flood';
                        break;
                    }
                }
            }
            if (dangerFound) break;
        }

        if (dangerFound) {
            window.pendingJourneyPath = primaryCoords;
            window.safeJourneyPath = altCoords;
            window.pendingDestination = destination;

            const userName = userProfile.name || "صديقي";
            if (dangerType === 'industrial') {
                dangerAlertTitle.innerHTML = `<i class="fa-solid fa-shield-virus"></i> تحذير انبعاثات صناعية`;
                dangerAlertText.innerHTML = `أهلاً <b>${userName}</b>، مسارك الحالي يمر بمنطقة <b>${dangerFound.name}</b> والتي تسجل حالياً نسبة عالية من الانبعاثات. يفضل إغلاق النوافذ وتفعيل وضع النقاء، أو تحويل المسار.`;
                document.getElementById('aeroShield').classList.add('active');
            } else {
                dangerAlertTitle.innerHTML = `<i class="fa-solid fa-cloud-showers-water" style="color: #3b82f6;"></i> خطر تشكل سيول`;
                dangerAlertText.innerHTML = `أهلاً <b>${userName}</b>، المسار الحالي يمر بمنطقة <b>${dangerFound.name}</b> وهي مصنفة كمنطقة خطرة لتجمع السيول. جارٍ اقتراح مسار جبلي آمن لك.`;
            }
            dangerAlertModal.classList.add('active');
        } else {
            promptStartDriving(primaryCoords, destination, false);
        }
    });
}

function setupDraggableCamera() {
    const floatCam = document.getElementById('floatingCamera');
    let isDragging = false;
    let offsetX, offsetY;

    floatCam.addEventListener('mousedown', (e) => {
        if (e.target.closest('.close-cam')) return; // Ignore close button
        isDragging = true;
        
        // Use client coordinates for fixed positioning
        const rect = floatCam.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        floatCam.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        let x = e.clientX - offsetX;
        let y = e.clientY - offsetY;
        
        // Boundaries
        x = Math.max(0, Math.min(window.innerWidth - floatCam.offsetWidth, x));
        y = Math.max(0, Math.min(window.innerHeight - floatCam.offsetHeight, y));
        
        floatCam.style.left = `${x}px`;
        floatCam.style.top = `${y}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        floatCam.style.transition = 'transform 0.2s';
    });
}
setupDraggableCamera();

let cameraFeedInterval;

async function promptStartDriving(coords, destination, isGreenRoute) {
    const startDrivingModal = document.getElementById('startDrivingModal');
    const confirmBtn = document.getElementById('confirmStartDrivingBtn');

    startDrivingModal.classList.add('active');

    // Cleanup old listener
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.onclick = async () => {
        startDrivingModal.classList.remove('active');

        // Show GPS Pill and Floating Camera immediately
        const gpsMeter = document.getElementById('gpsMeter');
        const gpsDistance = document.getElementById('gpsDistance');
        const gpsTokens = document.getElementById('gpsTokens');
        const floatingCamera = document.getElementById('floatingCamera');
        const cameraFeedImg = document.getElementById('cameraFeedImg');

        if (gpsMeter) {
            gpsMeter.style.display = 'flex';
            setTimeout(() => {
                gpsMeter.classList.add('active');
                // Ensure it's reachable for dragging
                window.makeDraggable(gpsMeter);
            }, 10);
            gpsDistance.innerText = '0.0';
            gpsTokens.innerText = '+0';
            const progressFill = document.getElementById('journeyProgress');
            if (progressFill) progressFill.style.width = '0%';
        }

        if (floatingCamera) {
            floatingCamera.style.display = 'block';
            
            const cameraFeedVideo = document.getElementById('cameraFeedVideo');
            if (cameraFeedVideo) {
                // Access the laptop webcam for a true live experience
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        cameraFeedVideo.srcObject = stream;
                        // Save stream to window to stop it later
                        window.currentCamStream = stream;
                    })
                    .catch(err => {
                        console.error("Camera access denied or unavailable", err);
                        // Fallback to a looping dashcam-like video if webcam fails
                        cameraFeedVideo.src = 'https://cdn.pixabay.com/video/2021/04/16/71285-538186175_tiny.mp4'; 
                        cameraFeedVideo.loop = true;
                        cameraFeedVideo.muted = true;
                        cameraFeedVideo.play();
                    });
            }
        }

        // Immediate PT reward for starting
        window.applyReward(1, "تم بدء الرحلة بنجاح");

        try {
            fetch('http://127.0.0.1:5000/api/start-camera', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isGreenRoute: isGreenRoute })
            });
        } catch (e) {}

        startDynamicJourney(coords, destination, isGreenRoute);
    };
}

function startDynamicJourney(coords, destination, isGreenRoute) {
    if (!movingCarMarker || !coords || coords.length === 0) return;

    // Use L.LatLng objects for higher precision
    const pathPoints = coords.map(c => L.latLng(c[0], c[1]));
    const smoothCoords = interpolatePath(pathPoints.map(p => [p.lat, p.lng]), 1200); 
    
    const gpsDistance = document.getElementById('gpsDistance');
    const gpsTokens = document.getElementById('gpsTokens');
    const ptBalance = document.getElementById('ptBalance');
    const progressFill = document.getElementById('journeyProgress');

    // Draw an explicit thick Green Line exactly where the car will go
    if (window.activeJourneyLine) {
        map.removeLayer(window.activeJourneyLine);
    }
    window.activeJourneyLine = L.polyline(smoothCoords, {
        color: '#10B981', 
        weight: 7, 
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
    }).addTo(map);

    showAiMessage(`بدأت رحلتك نحو ${destination}. حظاً موفقاً!`, 8000);

    // Initial Seatbelt Reward
    setTimeout(() => {
        window.applyReward(2, 'تم ربط حزام الأمان ✅');
        if (isGreenRoute) {
            setTimeout(() => {
                window.applyReward(20, 'مسار أخضر! تم تجنب التلوث 🌱');
            }, 3000);
        }
    }, 1500);

    let distanceAccum = 0;
    let tokensAccum = 0;
    let lastPTDistance = 0;

    let idx = 0;
    const driveInterval = setInterval(() => {
        if (idx >= smoothCoords.length) {
            clearInterval(driveInterval);
            const floatingCamera = document.getElementById('floatingCamera');
            const gpsMeter = document.getElementById('gpsMeter');
            if (floatingCamera) floatingCamera.style.display = 'none';
            if (gpsMeter) gpsMeter.classList.remove('active');
            
            if (window.activeJourneyLine) {
                map.removeLayer(window.activeJourneyLine);
                window.activeJourneyLine = null;
            }

            let finalSessionTokens = parseInt(gpsTokens.innerText.replace('+', '')) || 0;
            finishJourney(finalSessionTokens, destination);
            return;
        }

        // Set Marker Position precisely
        const currentPos = L.latLng(smoothCoords[idx][0], smoothCoords[idx][1]);
        movingCarMarker.setLatLng(currentPos);
        
        if (idx % 25 === 0) map.panTo(currentPos, { animate: true, duration: 1.0 });

        if (progressFill) {
            progressFill.style.width = (idx / smoothCoords.length * 100) + '%';
        }

        distanceAccum = (idx * (coords.length * 0.15 / smoothCoords.length)).toFixed(1);
        if (gpsDistance) gpsDistance.innerText = distanceAccum;

        if (parseFloat(distanceAccum) - lastPTDistance >= 5.0) {
            lastPTDistance = parseFloat(distanceAccum);
            tokensAccum += 1;
            if (gpsTokens) gpsTokens.innerText = '+' + (tokensAccum + 1);
            window.applyReward(1, `أداء ممتاز! +1 PT 🌱`);
        }

        idx += 1;
    }, 45); 
}

function makeDraggable(el) {
    if (!el) return;
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    el.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'I') return;
        isDragging = true;
        startX    = e.clientX;
        startY    = e.clientY;
        startLeft = el.offsetLeft;
        startTop  = el.offsetTop;
        el.style.transition = 'opacity 0.4s ease';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        el.style.left = (startLeft + e.clientX - startX) + 'px';
        el.style.top  = (startTop  + e.clientY - startY) + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// Apply draggability on load
document.addEventListener('DOMContentLoaded', () => {
    const gpsMeterEl = document.getElementById('gpsMeter');
    if (gpsMeterEl) makeDraggable(gpsMeterEl);
});

function hideDangerAlert() {
    const dangerAlertModal = document.getElementById('dangerAlertModal');
    if (dangerAlertModal) dangerAlertModal.classList.remove('active');

    if (window.pendingJourneyPath) {
        startDynamicJourney(window.pendingJourneyPath, window.pendingDestination);
    }
}

function acceptSafeRoute() {
    const dangerAlertModal = document.getElementById('dangerAlertModal');
    if (dangerAlertModal) dangerAlertModal.classList.remove('active');

    if (window.safeJourneyPath) {
        promptStartDriving(window.safeJourneyPath, window.pendingDestination, true);
    }
}

// Global functions for Heavy Tokens & Simulation Controls
function updateDistrictScore(points) {
    if (!userProfile || !userProfile.home) return;
    let scores = JSON.parse(localStorage.getItem('districtScores') || '{}');
    if (scores[userProfile.home] !== undefined) {
        scores[userProfile.home] += points;
        localStorage.setItem('districtScores', JSON.stringify(scores));
    }
}

function showAiMessage(text, duration = 6000, isSentinel = false) {
    const aiMessageStrip = document.getElementById('aiMessageStrip');
    const aiMessageText = document.getElementById('aiMessageText');
    if (aiMessageStrip && aiMessageText) {
        if (window.aiMsgTimeout) clearTimeout(window.aiMsgTimeout);
        aiMessageStrip.className = 'ai-chat-bubble';
        aiMessageText.innerHTML = isSentinel ? `<b>Sentinel:</b> ${text}` : text;
        setTimeout(() => aiMessageStrip.classList.add('active'), 10);
        window.aiMsgTimeout = setTimeout(() => {
            aiMessageStrip.classList.remove('active');
        }, duration);
    }
}

function interpolatePath(coords, numPoints) {
    if (!coords || coords.length < 2) return coords;
    
    // Calculate total distance and segment distances
    let totalDist = 0;
    let segDists = [];
    for (let i = 0; i < coords.length - 1; i++) {
        let p1 = coords[i], p2 = coords[i+1];
        let d = Math.sqrt(Math.pow(p2[0]-p1[0], 2) + Math.pow(p2[1]-p1[1], 2));
        segDists.push(d);
        totalDist += d;
    }
    
    let interpolated = [];
    for (let i = 0; i < coords.length - 1; i++) {
        let start = coords[i], end = coords[i+1];
        let ptsInSegment = Math.max(1, Math.floor((segDists[i] / totalDist) * numPoints));
        for (let j = 0; j < ptsInSegment; j++) {
            let lat = start[0] + (end[0] - start[0]) * (j / ptsInSegment);
            let lng = start[1] + (end[1] - start[1]) * (j / ptsInSegment);
            interpolated.push([lat, lng]);
        }
    }
    interpolated.push(coords[coords.length - 1]);
    return interpolated;
}

window.applyReward = function (points, message) {
    const aiMessageStrip = document.getElementById('aiMessageStrip');
    const aiMessageText = document.getElementById('aiMessageText');
    const ptBalance = document.getElementById('ptBalance');
    const gpsTokens = document.getElementById('gpsTokens');

    if (!ptBalance || !gpsTokens) return;

    let currentBalance = parseInt(ptBalance.innerText.replace(/,/g, ''));
    let currentSessionTokens = parseInt(gpsTokens.innerText.replace('+', '')) || 0;

    currentBalance += points;
    currentSessionTokens += points;

    ptBalance.innerText = currentBalance.toLocaleString();
    gpsTokens.innerText = (currentSessionTokens >= 0 ? '+' : '') + currentSessionTokens;
    gpsTokens.style.color = currentSessionTokens >= 0 ? 'var(--emerald-green)' : '#EF4444';

    updateDistrictScore(points);

    if (aiMessageStrip) {
        aiMessageStrip.className = 'ai-chat-bubble bg-success active';
        aiMessageText.innerHTML = `<b>+${points} PT:</b> ${message}`;
        if (window.aiMsgTimeout) clearTimeout(window.aiMsgTimeout);
        window.aiMsgTimeout = setTimeout(() => {
            aiMessageStrip.classList.remove('active');
            setTimeout(() => aiMessageStrip.className = 'ai-chat-bubble', 400);
        }, 5000);
    }
};

window.applyPenalty = function (points, message) {
    const aiMessageStrip = document.getElementById('aiMessageStrip');
    const aiMessageText = document.getElementById('aiMessageText');
    const ptBalance = document.getElementById('ptBalance');
    const gpsTokens = document.getElementById('gpsTokens');
    const gpsMeter = document.getElementById('gpsMeter');

    if (!ptBalance || !gpsTokens) return;

    let currentBalance = parseInt(ptBalance.innerText.replace(/,/g, ''));
    let currentSessionTokens = parseInt(gpsTokens.innerText.replace('+', '')) || 0;

    currentBalance -= points;
    currentSessionTokens -= points;

    ptBalance.innerText = currentBalance.toLocaleString();
    gpsTokens.innerText = (currentSessionTokens >= 0 ? '+' : '') + currentSessionTokens;
    gpsTokens.style.color = currentSessionTokens >= 0 ? 'var(--emerald-green)' : '#EF4444';

    updateDistrictScore(-points);

    if (aiMessageStrip) {
        aiMessageStrip.className = 'ai-chat-bubble bg-danger shake active';
        aiMessageText.innerHTML = `<b>-${points} PT:</b> ${message}`;
        setTimeout(() => aiMessageStrip.classList.remove('shake'), 400);
        if (window.aiMsgTimeout) clearTimeout(window.aiMsgTimeout);
        window.aiMsgTimeout = setTimeout(() => {
            aiMessageStrip.classList.remove('active');
            setTimeout(() => aiMessageStrip.className = 'ai-chat-bubble', 400);
        }, 7000);
    }

    if (gpsMeter) {
        gpsMeter.classList.add('shake');
        setTimeout(() => gpsMeter.classList.remove('shake'), 400);
    }
};

const GEMINI_API_KEY = "AIzaSyAA32_dS6K0_czWx_tP92bE5NIK3mM4mf0"; // From .env

window.analyzeEventWithAI = async function (eventDescription) {
    const aiMessageStrip = document.getElementById('aiMessageStrip');
    const aiMessageText = document.getElementById('aiMessageText');

    if (aiMessageStrip) {
        aiMessageStrip.className = 'ai-chat-bubble active';
        aiMessageText.innerHTML = `<i class="fa-solid fa-microchip fa-spin"></i> Aero-Engine يحلل...`;
    }

    const promptText = `
أنت المحرك الأساسي لنظام Aero-Smart. حلل الحدث التالي للقيادة في الأردن، بناءً على هذه القواعد الصارمة (التوكين الثقيلة):
- حزام الأمان: +2
- مسافة أمان: +5
- توقف للمشاة: +10
- مسار أخضر: +20
- تجاوز خاطئ: -15
- قطع إشارة حمراء: -50

الحدث هو: "${eventDescription}"

قم بالرد بصيغة JSON فقط وبدون أي نصوص إضافية (لا تستخدم Markdown ولا \`\`\`json). يجب أن يكون الرد كالتالي:
{
  "points": (رقم صحيح موجب أو سالب بناء على الحدث),
  "message": "(رسالة تفاعلية ذكية، قصيرة وتخاطب السائق بأسلوب مشجع إذا كانت إيجابية أو حازم إذا كانت سلبية)"
}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            let jsonText = data.candidates[0].content.parts[0].text.trim();
            const result = JSON.parse(jsonText);

            if (result.points >= 0) {
                applyReward(result.points, result.message);
            } else {
                applyPenalty(Math.abs(result.points), result.message);
            }
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (aiMessageText) {
            aiMessageText.innerHTML = `حدث خطأ في محرك الذكاء الاصطناعي.`;
            setTimeout(() => {
                aiMessageText.innerHTML = `استمري بقيادة آمنة.`;
            }, 3000);
        }
    }
};

function finishJourney(totalEarned, destination) {
    const gpsMeter = document.getElementById('gpsMeter');
    if (aiMessageStrip) aiMessageStrip.style.display = 'none';

    setTimeout(() => {
        if (gpsMeter) {
            gpsMeter.classList.remove('active');
            setTimeout(() => gpsMeter.style.display = 'none', 400);
        }

        const userName = userProfile.name || "صديقي";
        const alertBubble = document.getElementById('alertBubble');
        const alertBubbleText = document.getElementById('alertBubbleText');

        if (alertBubble && alertBubbleText) {
            alertBubbleText.innerHTML = `أحسنتِ يا <b>${userName}</b>! لقد وفرتِ 30% من انبعاثات الكربون وحصلتِ على مكافأة النقاء (${totalEarned} PT).`;
            alertBubble.classList.add('show');
            setTimeout(() => alertBubble.classList.remove('show'), 6000);
        }
    }, 1500);
}

// Utility: Number counter animation
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Draggable Utility for GPS Meter and AI Avatar
function makeDraggable(elmnt) {
    if (!elmnt) return;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const handle = elmnt.querySelector('.drag-handle') || elmnt;

    if (handle) {
        handle.style.cursor = 'grab';
        handle.onmousedown = dragMouseDown;
        handle.ontouchstart = dragTouchStart;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        elmnt.style.transition = 'none'; // Disable transition during drag for smoothness
        if (handle) handle.style.cursor = 'grabbing';
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Convert bottom/right to top/left if first time dragging
        if (!elmnt.style.top || elmnt.style.top === 'auto') {
            elmnt.style.top = elmnt.offsetTop + "px";
            elmnt.style.left = elmnt.offsetLeft + "px";
            elmnt.style.bottom = "auto";
            elmnt.style.right = "auto";
        }

        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        if (handle) handle.style.cursor = 'grab';
    }

    // Touch support for mobile
    function dragTouchStart(e) {
        const touch = e.touches[0];
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        document.ontouchend = closeDragElementTouch;
        document.ontouchmove = elementDragTouch;
        elmnt.style.transition = 'none';
    }

    function elementDragTouch(e) {
        const touch = e.touches[0];
        pos1 = pos3 - touch.clientX;
        pos2 = pos4 - touch.clientY;
        pos3 = touch.clientX;
        pos4 = touch.clientY;

        if (!elmnt.style.top || elmnt.style.top === 'auto') {
            elmnt.style.top = elmnt.offsetTop + "px";
            elmnt.style.left = elmnt.offsetLeft + "px";
            elmnt.style.bottom = "auto";
            elmnt.style.right = "auto";
        }

        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElementTouch() {
        document.ontouchend = null;
        document.ontouchmove = null;
    }
}

function showLeaderboard() {
    const leaderboardModal = document.getElementById('leaderboardModal');
    const leaderboardContent = document.querySelector('.leaderboard-content');
    const userRankText = document.getElementById('userRankText');
    const userPtText = document.getElementById('userPtText');

    if (!leaderboardModal || !leaderboardContent) return;

    let scores = JSON.parse(localStorage.getItem('districtScores') || '{}');
    let sortedDistricts = Object.keys(scores).map(d => ({ name: d, score: scores[d] })).sort((a, b) => b.score - a.score);

    leaderboardContent.innerHTML = '';

    const medals = [
        '<i class="fa-solid fa-medal" style="color: #FBBF24; margin-left: 8px; font-size: 18px;"></i>',
        '<i class="fa-solid fa-medal" style="color: #9CA3AF; margin-left: 8px; font-size: 18px;"></i>',
        '<i class="fa-solid fa-medal" style="color: #D97706; margin-left: 8px; font-size: 18px;"></i>'
    ];

    const bgs = [
        'rgba(251, 191, 36, 0.1)',
        'rgba(156, 163, 175, 0.1)',
        'rgba(217, 119, 6, 0.1)'
    ];

    let userRank = -1;

    for (let i = 0; i < sortedDistricts.length; i++) {
        let district = sortedDistricts[i];

        if (userProfile && district.name === userProfile.home) {
            userRank = i + 1;
        }

        if (i < 3) {
            leaderboardContent.innerHTML += `
            <div class="lb-item rank-${i + 1}" style="display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid var(--glass-border); border-radius: 10px; background: ${bgs[i]}; margin-bottom: 5px;">
                <span style="color: var(--text-dark); font-weight: bold;">${medals[i]} المركز ${i === 0 ? 'الأول' : i === 1 ? 'الثاني' : 'الثالث'}: ${district.name}</span>
                <span style="font-weight: bold; color: var(--emerald-green);">${(district.score / 1000).toFixed(1)}K PT</span>
            </div>`;
        }
    }

    // Update user rank text
    if (userProfile && userProfile.home) {
        if (userRankText) userRankText.innerText = userRank > 0 ? `المركز ${userRank}` : 'غير مصنف';
        if (userPtText) userPtText.innerText = (scores[userProfile.home] || 0).toLocaleString() + ' PT';

        const topH3 = leaderboardModal.querySelector('h3');
        if (topH3) topH3.innerHTML = `منطقتك: ${userProfile.home} 🏆`;
    }

    if (!document.getElementById('leaderboardModal').classList.contains('active')) {
        leaderboardModal.classList.add('active');
    }
}

// AeroVisualizer Polling & Dynamic Location Logic
let lastSahabaPoints = -1;
let currentActiveDistrict = "حي الصحابة";

function registerLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            try {
                await fetch('http://127.0.0.1:5000/api/location', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat, lng })
                });
                console.log("AeroNavigator: Location registered successfully.");
            } catch (e) {
                console.error("Failed to register location:", e);
            }
        }, (err) => {
            console.log("Geolocation denied or failed. Defaulting to Home.");
        });
    }
}

async function pollAeroVisualizer() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/status');
        if (!response.ok) return;
        const data = await response.json();

        const newPoints = data.pt;
        const message = data.msg;
        const activeDistrict = data.active_district || "حي الصحابة";

        // Update Active District UI Indicator
        if (activeDistrictText && activeDistrict !== currentActiveDistrict) {
            activeDistrictText.innerText = `الحي النشط: ${activeDistrict}`;
            currentActiveDistrict = activeDistrict;
        } else if (activeDistrictText && activeDistrictText.innerText.includes("جاري التحديد")) {
            activeDistrictText.innerText = `الحي النشط: ${activeDistrict}`;
            currentActiveDistrict = activeDistrict;
        }

        if (newPoints > 0 && newPoints !== lastSahabaPoints) {
            // Update local storage score for Active District
            let scores = JSON.parse(localStorage.getItem('districtScores') || '{}');
            const oldPoints = scores[activeDistrict] || 0;

            // Only trigger if points actually increased (ignore initial load)
            if (lastSahabaPoints !== -1 && newPoints > oldPoints) {
                scores[activeDistrict] = newPoints;
                localStorage.setItem('districtScores', JSON.stringify(scores));

                // Trigger AI Message
                if (message) {
                    showAiMessage(message, 10000, true);
                }

                // Update Leaderboard silently if open, and add animations
                const leaderboardModal = document.getElementById('leaderboardModal');
                if (leaderboardModal && leaderboardModal.classList.contains('active')) {
                    showLeaderboard(); // Re-render

                    // Add pulse to Active District item
                    setTimeout(() => {
                        const items = document.querySelectorAll('.lb-item');
                        items.forEach(item => {
                            if (item.innerText.includes(activeDistrict)) {
                                item.classList.add('pulse-green', 'slide-up');
                                setTimeout(() => {
                                    item.classList.remove('pulse-green', 'slide-up');
                                }, 2000);
                            }
                        });
                    }, 50);
                }

                // Update user balance if they live in the Active District
                if (userProfile.home === activeDistrict) {
                    const ptBalance = document.getElementById('ptBalance');
                    if (ptBalance) {
                        ptBalance.innerText = newPoints.toLocaleString();
                        ptBalance.parentElement.classList.add('pulse-green');
                        setTimeout(() => ptBalance.parentElement.classList.remove('pulse-green'), 1500);
                    }
                }
            }

            // Initial load sync
            if (lastSahabaPoints === -1) {
                scores[activeDistrict] = newPoints;
                localStorage.setItem('districtScores', JSON.stringify(scores));
                if (userProfile.home === activeDistrict) {
                    const ptBalance = document.getElementById('ptBalance');
                    if (ptBalance) ptBalance.innerText = newPoints.toLocaleString();
                }
            }

            lastSahabaPoints = newPoints;
        }
    } catch (e) {
        // Silently fail if server is down
    }
}

// showAiMessage was merged above.

// Simulation & Violation Logic
function triggerViolation(vType, vMsg, points) {
    const userName = (userProfile && userProfile.name) ? userProfile.name : "صديقي";
    
    // Play alert sound
    const audio = document.getElementById('alertSound');
    if (audio) {
        audio.volume = 0.4;
        audio.play().catch(e => console.log("Sound blocked by browser"));
    }

    // 1. UI Frame Flash
    document.body.classList.add('violation-active');
    setTimeout(() => document.body.classList.remove('violation-active'), 2000);

    // 2. Camera Specific Feedback
    if (vType === 'عدم انتباه') {
        const cam = document.getElementById('floatingCamera');
        if (cam) {
            cam.classList.add('cam-warning');
            setTimeout(() => cam.classList.remove('cam-warning'), 4000);
        }
    }

    // 3. Analysis Flow
    showAiMessage(`Aero-Engine يحلل الحدث...`, 2000);
    
    setTimeout(() => {
        let finalMsg = "";
        if (vType === 'عدم انتباه') {
            finalMsg = `يا ${userName}، تم رصد تشتت في الانتباه، يرجى التركيز على الطريق.`;
            if (window.applyPenalty) window.applyPenalty(points, vType);
        } else {
            finalMsg = `يا ${userName}، تم رصد سلوك خطير (${vType})، تم خصم النقاط وتنبيه المركبات.`;
            if (window.applyPenalty) window.applyPenalty(points, vType);
        }
        showAiMessage(finalMsg, 15000);
    }, 2000);

    // 4. Bell
    const bellDot = document.getElementById('bellDot');
    if (bellDot) bellDot.style.display = 'block';

    analyzeEventWithAI(`رصد مخالفة: ${vType}`);
}

// Simulation Helpers
window.toggleSimGroup = function(groupId) {
    const groups = document.querySelectorAll('.sim-group');
    groups.forEach(g => {
        if (g.id === groupId) {
            g.classList.toggle('active');
        } else {
            g.classList.remove('active');
        }
    });
};

window.setWeather = function(idx) {
    currentWeatherIdx = idx - 1; // Adjust for zero-based and simulateWeather increment
    simulateWeather();
    // Auto close group after selection
    document.getElementById('weatherSimGroup').classList.remove('active');
};

// Positive Behavior Reward Simulator
window.triggerReward = function(actionName, points) {
    const userName = (userProfile && userProfile.name) ? userProfile.name : 'صديقي';

    const audio = document.getElementById('alertSound');
    if (audio) {
        audio.volume = 0.3;
        audio.play().catch(() => {});
    }

    // Green flash effect
    document.body.classList.add('reward-active');
    setTimeout(() => document.body.classList.remove('reward-active'), 1500);

    showAiMessage(`Aero-Engine يرصد سلوكاً إيجابياً...`, 2000);

    setTimeout(() => {
        const finalMsg = `أحسنت يا ${userName}! (${actionName}) — تم منحك <b>+${points} PT</b> 🌱`;
        if (window.applyReward) window.applyReward(points, actionName);
        showAiMessage(finalMsg, 10000);
    }, 2000);

    const bellDot = document.getElementById('bellDot');
    if (bellDot) bellDot.style.display = 'block';

    document.getElementById('rewardSimGroup').classList.remove('active');

    if (window.analyzeEventWithAI) {
        window.analyzeEventWithAI(`سلوك إيجابي: ${actionName}`);
    }
};

// Close sim groups when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.sim-group')) {
        document.querySelectorAll('.sim-group').forEach(g => g.classList.remove('active'));
    }
});

