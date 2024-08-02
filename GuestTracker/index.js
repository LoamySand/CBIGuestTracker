const jsqr = require('jsqr');

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#csvForm');
  const csvFileInput = document.querySelector('#csvInput');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const files = csvFileInput.files;
    if (files.length === 0) {
      alert('No files selected.');
      return;
    }

    const records = [];

    for (const file of files) {
      try {
        const content = await readQRCode(file);
        const datetime = await extractDateTime(file);
        records.push({ filename: file.name, content: content, datetime: datetime });
      } catch (error) {
        records.push({ filename: file.name, content: 'Error reading QR code', datetime: 'Unknown' });
      }
    }

    downloadCSV(records);
  });
});

const readQRCode = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsqr(imageData.data, imageData.width, imageData.height);
        if (qrCode) {
          resolve(qrCode.data);
        } else {
          reject(new Error('Failed to decode QR code'));
        }
      };
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const extractDateTime = (file) => {
  return new Promise((resolve) => {
    const datetime = file.lastModifiedDate || new Date();
    resolve(datetime.toISOString());
  });
};

const formatCSV = (records) => {
  const header = 'Filename,QR Code Content,Date/Time\n';
  const rows = records.map(record => `"${record.filename}","${record.content}","${record.datetime}"`).join('\n');
  return header + rows;
};

const downloadCSV = (records) => {
  const csvContent = formatCSV(records);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'qr_codes.csv';
  document.body.appendChild(link); // Required for Firefox
  link.click();
  document.body.removeChild(link); // Clean up
};
