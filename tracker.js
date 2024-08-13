const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const jsqr = require('jsqr');
const exifParser = require('exif-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


// Directory containing QR code images
const imagesDir = './images';

// Output CSV file
const outputCsv = './qr_codes.csv';

// Initialize CSV writer
const csvWriter = createCsvWriter({
  path: outputCsv,
  header: [
    { id: 'filename', title: 'Filename' },
    { id: 'content', title: 'QR Code Content' },
    { id: 'datetime', title: 'Date/Time' }
  ]
});

// Function to extract date/time from image metadata or file stats
const extractDateTime = async (filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let datetime;

    if (ext === '.jpg' || ext === '.jpeg') {
      const buffer = fs.readFileSync(filePath);
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      console.log(`EXIF data for ${filePath}:`, result.tags); // Log EXIF data for debugging

      if (result.tags.DateTimeOriginal) {
        datetime = new Date(result.tags.DateTimeOriginal * 1000); // EXIF dates are usually in seconds since epoch
      }
    }

    // If datetime is not found in EXIF data or for non-JPEG files, use file creation time
    if (!datetime) {
      const stats = fs.statSync(filePath);
      datetime = stats.birthtime;
    }

    return datetime.toISOString();
  } catch (error) {
    console.error(`Failed to extract date/time from ${filePath}: ${error.message}`);
    return 'Unknown';
  }
};

// Function to read QR code from an image
const readQRCode = async (filePath) => {
  try {
    const image = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { data, info } = image;
    const qrCode = jsqr(data, info.width, info.height);
    if (qrCode) {
      return qrCode.data;
    } else {
      throw new Error('Failed to decode QR code');
    }
  } catch (error) {
    throw new Error(`Failed to read QR code from ${filePath}: ${error.message}`);
  }
};

// Main function to process all images in the directory
const processImages = async () => {
  try {
    const files = fs.readdirSync(imagesDir).filter(file => {
      return ['.png', '.jpg', '.jpeg'].includes(path.extname(file).toLowerCase());
    });

    const records = [];

    for (const file of files) {
      const filePath = path.join(imagesDir, file);
      try {
        const content = await readQRCode(filePath);
        const datetime = await extractDateTime(filePath);
        records.push({ filename: file, content: content, datetime: datetime });
        console.log(`Processed: ${file}`);
      } catch (error) {
        console.error(`Error reading ${file}:`, error.message);
        records.push({ filename: file, content: 'Error reading QR code', datetime: 'Unknown' });
      }
    }

    await csvWriter.writeRecords(records);
    console.log('CSV file created successfully.');
  } catch (error) {
    console.error('Error processing images:', error.message);
  }
};


