const Jimp = require('jimp');

async function makeTransparent() {
    console.log("Reading image...");
    const image = await Jimp.read(String.raw`C:\Users\sarve\.gemini\antigravity\brain\cfd0b8eb-1d10-4d5a-9d8d-d86e4f747afd\mentron_logo_1773336060149.png`);
    
    // Convert near-white and white pixels to transparent
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        const red   = this.bitmap.data[idx + 0];
        const green = this.bitmap.data[idx + 1];
        const blue  = this.bitmap.data[idx + 2];

        if (red > 235 && green > 235 && blue > 235) {
            this.bitmap.data[idx + 3] = 0; // Alpha channel to 0
        }
    });

    console.log("Saving new transparent image...");
    await image.writeAsync(String.raw`C:\Mentron_ap\mentron_new\mentron_flutter\assets\images\mentron_logo.png`);
    console.log("Mentron logo processed successfully.");
}

makeTransparent().catch(console.error);
