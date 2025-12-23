import { sdk } from 'https://esm.sh/@farcaster/frame-sdk';

// Farcaster SDK başlat
sdk.actions.ready();

// Varsayılan dilimler
const defaultSegments = [
    { label: '10 Puan', color: '#FF6B6B' },
    { label: '25 Puan', color: '#4ECDC4' },
    { label: '50 Puan', color: '#FFE66D' },
    { label: '100 Puan', color: '#95E1D3' },
    { label: 'Boş', color: '#DFE6E9' },
    { label: '75 Puan', color: '#A8E6CF' },
    { label: '200 Puan', color: '#FF8B94' },
    { label: '5 Puan', color: '#B8B5FF' }
];

// State
let segments = JSON.parse(localStorage.getItem('wheelSegments')) || defaultSegments;
let spinsLeft = getSpinsLeft();
let isSpinning = false;
let currentRotation = 0;

// DOM Elements
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const spinsCountEl = document.getElementById('spinsCount');
const resultPopup = document.getElementById('resultPopup');
const resultText = document.getElementById('resultText');
const closePopup = document.getElementById('closePopup');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPopup = document.getElementById('settingsPopup');
const segmentsList = document.getElementById('segmentsList');
const addSegmentBtn = document.getElementById('addSegment');
const saveSettingsBtn = document.getElementById('saveSettings');

// Günlük spin hakkı kontrolü
function getSpinsLeft() {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('spinDate');
    const savedSpins = localStorage.getItem('spinsLeft');
    
    if (savedDate !== today) {
        localStorage.setItem('spinDate', today);
        localStorage.setItem('spinsLeft', '5');
        return 5;
    }
    
    return parseInt(savedSpins) || 0;
}

function updateSpinsLeft() {
    spinsLeft = Math.max(0, spinsLeft - 1);
    localStorage.setItem('spinsLeft', spinsLeft.toString());
    spinsCountEl.textContent = spinsLeft;
    
    if (spinsLeft === 0) {
        spinBtn.disabled = true;
    }
}

// Çarkı çiz
function drawWheel(rotation = 0) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const segmentAngle = (2 * Math.PI) / segments.length;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);
    
    // Dilimleri çiz
    segments.forEach((segment, i) => {
        const startAngle = i * segmentAngle - Math.PI / 2;
        const endAngle = startAngle + segmentAngle;
        
        // Dilim
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();
        
        // Dilim kenarlığı
        ctx.strokeStyle = '#1a1a24';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Metin
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = getContrastColor(segment.color);
        ctx.font = 'bold 14px SF Pro Display, sans-serif';
        ctx.fillText(segment.label, radius - 20, 5);
        ctx.restore();
    });
    
    // Merkez daire
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a24';
    ctx.fill();
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Merkez nokta
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#ff6b35';
    ctx.fill();
    
    ctx.restore();
}

// Kontrast renk hesapla
function getContrastColor(hexcolor) {
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1a1a24' : '#ffffff';
}

// Ses efekti
function playTickSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
        // Ses çalmadıysa sessizce devam et
    }
}

function playWinSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.50];
        
        notes.forEach((freq, i) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.15;
            
            oscillator.start(audioCtx.currentTime + i * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.1 + 0.2);
            oscillator.stop(audioCtx.currentTime + i * 0.1 + 0.2);
        });
    } catch (e) {
        // Ses çalmadıysa sessizce devam et
    }
}

// Titreşim
function vibrate(pattern = [50]) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// Çarkı çevir
function spinWheel() {
    if (isSpinning || spinsLeft <= 0) return;
    
    isSpinning = true;
    spinBtn.disabled = true;
    canvas.classList.add('spinning');
    
    // Rastgele hedef açı (3-6 tur + rastgele pozisyon)
    const spins = 3 + Math.random() * 3;
    const targetAngle = spins * 2 * Math.PI + Math.random() * 2 * Math.PI;
    const duration = 3000 + Math.random() * 3000; // 3-6 saniye
    
    const startTime = Date.now();
    const startRotation = currentRotation;
    let lastTickAngle = 0;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing: cubic ease-out
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        currentRotation = startRotation + targetAngle * easeProgress;
        drawWheel(currentRotation);
        
        // Tick sesi
        const segmentAngle = (2 * Math.PI) / segments.length;
        const currentSegmentAngle = currentRotation % (2 * Math.PI);
        if (Math.floor(currentSegmentAngle / segmentAngle) !== Math.floor(lastTickAngle / segmentAngle)) {
            playTickSound();
            vibrate([10]);
        }
        lastTickAngle = currentSegmentAngle;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Sonuç
            finishSpin();
        }
    }
    
    animate();
}

function finishSpin() {
    isSpinning = false;
    canvas.classList.remove('spinning');
    
    // Kazanan dilimi bul
    const segmentAngle = (2 * Math.PI) / segments.length;
    const normalizedRotation = currentRotation % (2 * Math.PI);
    const winningIndex = Math.floor((2 * Math.PI - normalizedRotation + Math.PI / 2) / segmentAngle) % segments.length;
    const winner = segments[winningIndex];
    
    // Efektler
    vibrate([100, 50, 100]);
    playWinSound();
    
    // Sonucu göster
    resultText.textContent = `Kazandın: ${winner.label}`;
    resultPopup.classList.remove('hidden');
    
    // Hakkı güncelle
    updateSpinsLeft();
    
    if (spinsLeft > 0) {
        spinBtn.disabled = false;
    }
}

// Ayarlar
function renderSegmentsList() {
    segmentsList.innerHTML = '';
    
    segments.forEach((segment, i) => {
        const item = document.createElement('div');
        item.className = 'segment-item';
        item.innerHTML = `
            <input type="text" value="${segment.label}" data-index="${i}" class="segment-label">
            <input type="color" value="${segment.color}" data-index="${i}" class="segment-color">
            <button class="remove-btn" data-index="${i}">×</button>
        `;
        segmentsList.appendChild(item);
    });
    
    // Event listeners
    segmentsList.querySelectorAll('.segment-label').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            segments[index].label = e.target.value;
        });
    });
    
    segmentsList.querySelectorAll('.segment-color').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            segments[index].color = e.target.value;
        });
    });
    
    segmentsList.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (segments.length > 2) {
                const index = parseInt(e.target.dataset.index);
                segments.splice(index, 1);
                renderSegmentsList();
            }
        });
    });
}

// Event Listeners
spinBtn.addEventListener('click', spinWheel);
spinBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    spinWheel();
}, { passive: false });

closePopup.addEventListener('click', () => {
    resultPopup.classList.add('hidden');
});

settingsBtn.addEventListener('click', () => {
    renderSegmentsList();
    settingsPopup.classList.remove('hidden');
});

addSegmentBtn.addEventListener('click', () => {
    if (segments.length < 12) {
        segments.push({
            label: 'Yeni',
            color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
        });
        renderSegmentsList();
    }
});

saveSettingsBtn.addEventListener('click', () => {
    localStorage.setItem('wheelSegments', JSON.stringify(segments));
    settingsPopup.classList.add('hidden');
    drawWheel(currentRotation);
});

// Popup dışına tıklama
settingsPopup.addEventListener('click', (e) => {
    if (e.target === settingsPopup) {
        settingsPopup.classList.add('hidden');
    }
});

resultPopup.addEventListener('click', (e) => {
    if (e.target === resultPopup) {
        resultPopup.classList.add('hidden');
    }
});

// Logo çiz
function drawLogo() {
    const logoCanvas = document.getElementById('logoCanvas');
    const ctx = logoCanvas.getContext('2d');
    const size = 44;
    const center = size / 2;
    const radius = 18;
    
    // Arka plan
    ctx.fillStyle = '#0a0a0f';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 10);
    ctx.fill();
    
    // Mini çark
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#A8E6CF', '#FF8B94', '#B8B5FF', '#DFE6E9'];
    const segmentAngle = (2 * Math.PI) / 8;
    
    colors.forEach((color, i) => {
        const startAngle = i * segmentAngle - Math.PI / 2;
        const endAngle = startAngle + segmentAngle;
        
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    });
    
    // Merkez
    ctx.beginPath();
    ctx.arc(center, center, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a24';
    ctx.fill();
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Pointer
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.moveTo(center, 3);
    ctx.lineTo(center - 5, 10);
    ctx.lineTo(center + 5, 10);
    ctx.closePath();
    ctx.fill();
}

// Başlangıç
drawLogo();
spinsCountEl.textContent = spinsLeft;
if (spinsLeft === 0) {
    spinBtn.disabled = true;
}
drawWheel();

