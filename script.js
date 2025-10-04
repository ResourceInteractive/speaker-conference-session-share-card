const defaultHeadshot = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzgwODA4MCI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAgMTRjLTIuNzEgMC01LjE5LTEuMDgtNy0yLjc5Ljg5LTEuNDggMy42MS0yL৭১IDctMi43MXMzLjI1IDEuMjMgNC4zMSAyLjQyQzE3LjE5IDE4LjA3IDE0LjcxIDE5IDEyIDE5eiIvPjwvc3ZnPg==';

const speakersWrapper = document.getElementById('speakers-wrapper');
let speakerCount = 0;

const shareContainer = document.getElementById('share-container');
const shareApiBtn = document.getElementById('share-api-btn');
const fallbackShare = document.getElementById('fallback-share');

document.getElementById('add-speaker-btn').addEventListener('click', addSpeaker);
speakersWrapper.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-speaker-btn')) {
        e.target.closest('.speaker-input').remove();
        speakerCount--;
        updateAddButtonState();
    }
});

function addSpeaker() {
    if (speakerCount >= 4) return;
    speakerCount++;
    
    const speakerId = speakerCount;
    const speakerHtml = `
        <div class="speaker-input">
            <button type="button" class="remove-speaker-btn">X</button>
            <input type="text" placeholder="Speaker ${speakerId} Name" class="speaker-name">
            <input type="text" placeholder="Speaker ${speakerId} Title" class="speaker-title">
            <label>Headshot ${speakerId}: <input type="file" class="speaker-headshot" accept="image/*"></label>
        </div>
    `;
    speakersWrapper.insertAdjacentHTML('beforeend', speakerHtml);
    updateAddButtonState();
}

function updateAddButtonState() {
    document.getElementById('add-speaker-btn').disabled = speakerCount >= 4;
}

addSpeaker();

document.getElementById('session-form').addEventListener('submit', function(event) {
    event.preventDefault();
    generateImage();
});

async function generateImage() {
    const downloadLink = document.getElementById('download-link');
    downloadLink.classList.add('disabled');
    shareContainer.style.display = 'none'; 
    
    try {
        const confName = document.getElementById('confName').value;
        const sessionTitle = document.getElementById('sessionTitle').value;
        const sessionLink = document.getElementById('sessionLink').value;
        const sessionTime = document.getElementById('sessionTime').value;
        const sessionLocation = document.getElementById('sessionLocation').value;
        
        const bgColor = document.getElementById('bgColor').value;
        const titleColor = document.getElementById('titleColor').value;
        const speakerColor = document.getElementById('speakerColor').value;
        const accentColor = document.getElementById('accentColor').value;

        const confLogoFile = document.getElementById('confLogo').files[0];
        const bgImageFile = document.getElementById('bgImage').files[0];
        const confLogo = confLogoFile ? await loadImage(confLogoFile) : null;
        const bgImage = bgImageFile ? await loadImage(bgImageFile) : null;

        const speakerElements = document.querySelectorAll('.speaker-input');
        const speakers = [];
        for (const element of speakerElements) {
            const name = element.querySelector('.speaker-name').value;
            if (!name) continue;

            const title = element.querySelector('.speaker-title').value;
            const headshotFile = element.querySelector('.speaker-headshot').files[0];
            const headshot = headshotFile ? await loadImage(headshotFile) : await loadImage(defaultHeadshot);
            speakers.push({ name, title, headshot });
        }

        const canvas = document.getElementById('social-card');
        const ctx = canvas.getContext('2d');

        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (confLogo) ctx.drawImage(confLogo, 40, 40, 80, 80);
        
        ctx.fillStyle = titleColor;
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(confName, confLogo ? 140 : 50, 95);

        ctx.font = 'bold 70px Arial';
        ctx.textAlign = 'center';
        wrapText(ctx, sessionTitle, 600, 220, 1100, 80);

        
        // We now call our new helper function to draw the date, time, and location.
        const dateTimeLocationText = `${sessionTime} • ${sessionLocation}`;
        fitTextOnLine(ctx, dateTimeLocationText, 600, 360, 1100, 40, accentColor);
        

        drawSpeakers(ctx, speakers, speakerColor);

        const qrCodeImage = await generateQRCode(sessionLink);
        ctx.drawImage(qrCodeImage, 970, 400, 180, 180);
        ctx.fillStyle = titleColor;
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Scan for Details', 1060, 610);

        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = 'session-card.png';
        downloadLink.classList.remove('disabled');

        shareContainer.style.display = 'block';

        if (navigator.share && navigator.canShare) {
            shareApiBtn.style.display = 'block';
            fallbackShare.style.display = 'none';
        } else {
            shareApiBtn.style.display = 'none';
            fallbackShare.style.display = 'block';
            updateFallbackLinks(sessionTitle, sessionLink);
        }

    } catch (error) {
        console.error("Failed to generate image:", error);
        alert("Oops! Something went wrong while creating the image. Please check your inputs and try again.");
    }
}



function drawSpeakers(ctx, speakers, textColor) {
    const totalSpeakers = speakers.length;
    if (totalSpeakers === 0) return;
    const canvasWidth = 950;
    const headshotSize = 150;
    const totalSpacing = 50 * (totalSpeakers - 1);
    const totalWidth = (headshotSize * totalSpeakers) + totalSpacing;
    let startX = (canvasWidth - totalWidth) / 2;
    const yPos = 480;
    speakers.forEach((speaker) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(startX + headshotSize / 2, yPos, headshotSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(speaker.headshot, startX, yPos - headshotSize / 2, headshotSize, headshotSize);
        ctx.restore();
        ctx.fillStyle = textColor;
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(speaker.name, startX + headshotSize / 2, yPos + headshotSize / 2 + 35);
        ctx.font = '22px Arial';
        ctx.fillStyle = '#dddddd';
        ctx.fillText(speaker.title, startX + headshotSize / 2, yPos + headshotSize / 2 + 65);
        startX += headshotSize + 50;
    });
}

function generateQRCode(link) {
    return new Promise((resolve) => {
        const qrElement = document.getElementById('qrcode');
        qrElement.innerHTML = '';
        new QRCode(qrElement, { text: link, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.H });
        setTimeout(() => {
            const qrCanvas = qrElement.querySelector('canvas');
            if (qrCanvas) {
                const qrImage = new Image();
                qrImage.src = qrCanvas.toDataURL();
                qrImage.onload = () => resolve(qrImage);
            }
        }, 50);
    });
}

function loadImage(fileOrSrc) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        if (typeof fileOrSrc === 'string') {
            img.src = fileOrSrc;
        } else {
            const reader = new FileReader();
            reader.onload = (event) => { img.src = event.target.result; };
            reader.readAsDataURL(fileOrSrc);
        }
    });
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}


/**
 * Draws text on a single line, reducing font size to make it fit.
 * @param {CanvasRenderingContext2D} ctx The canvas context.
 * @param {string} text The text to draw.
 * @param {number} x The horizontal center point.
 * @param {number} y The vertical position.
 * @param {number} maxWidth The maximum width the text can occupy.
 * @param {number} initialSize The starting font size.
 * @param {string} color The color of the text.
 */
function fitTextOnLine(ctx, text, x, y, maxWidth, initialSize, color) {
    let fontSize = initialSize;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';

    // Loop to reduce font size until it fits
    do {
        ctx.font = `${fontSize}px Arial`;
        fontSize -= 2; // Decrease font size for the next iteration if needed
    } while (ctx.measureText(text).width > maxWidth && fontSize > 10); // Stop if it fits or font is too small

    ctx.fillText(text, x, y);
}


shareApiBtn.addEventListener('click', async () => {
    const canvas = document.getElementById('social-card');
    const sessionTitle = document.getElementById('sessionTitle').value;
    const sessionLink = document.getElementById('sessionLink').value;
    canvas.toBlob(async (blob) => {
        const file = new File([blob], 'session-card.png', { type: 'image/png' });
        const shareData = {
            title: sessionTitle,
            text: `Check out this session: "${sessionTitle}"`,
            url: sessionLink,
            files: [file]
        };
        if (navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Share failed:', err.message);
            }
        } else {
            console.error("Can't share this data.");
        }
    }, 'image/png');
});

function updateFallbackLinks(title, url) {
    const text = `Check out this session: "${title}"!`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    document.getElementById('share-twitter').href = twitterUrl;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    document.getElementById('share-facebook').href = facebookUrl;
}