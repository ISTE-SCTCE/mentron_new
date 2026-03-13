const fs = require('fs');
const PNG = require('pngjs').PNG;

console.log("Reading image...");
fs.createReadStream(String.raw`C:\Users\sarve\.gemini\antigravity\brain\cfd0b8eb-1d10-4d5a-9d8d-d86e4f747afd\mentron_logo_1773336060149.png`)
  .pipe(new PNG({ filterType: 4 }))
  .on('parsed', function() {
    console.log("Processing pixels...");
    for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
            let idx = (this.width * y + x) << 2;

            if (this.data[idx] > 235 && this.data[idx+1] > 235 && this.data[idx+2] > 235) {
                this.data[idx+3] = 0; // Set alpha to 0 for white pixels
            }
        }
    }
    
    console.log("Saving new PNG...");
    this.pack().pipe(fs.createWriteStream(String.raw`C:\Mentron_ap\mentron_new\mentron_flutter\assets\images\mentron_logo.png`))
        .on('finish', () => console.log("Done!"));
  })
  .on('error', (err) => console.error("Error reading PNG:", err));
