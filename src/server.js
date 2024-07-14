const express = require('express');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 配置AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// 配置multer存储
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 初始化贴图列表
let stickers = [];
let availableStickers = [];

const initializeStickers = () => {
    const stickersDir = path.join(__dirname, '../public/stickers');
    stickers = fs.readdirSync(stickersDir).filter(file => file.startsWith('sticker') && file.endsWith('.png'));
    availableStickers = [...stickers];
    console.log('Stickers initialized:', stickers);
};

// 初始化贴图列表
initializeStickers();

// 设置静态文件夹
app.use(express.static(path.join(__dirname, '../public')));
app.use('/stickers', express.static(path.join(__dirname, '../public/stickers')));

// 文件上传端点
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        console.error('No file received');
        return res.status(400).json({ message: 'ファイルがアップロードされませんでした。' });
    }

    const params = {
        Bucket: process.env.S3_BUCKET,
        Key: `uploads/${uuidv4()}${path.extname(req.file.originalname)}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read'
    };

    console.log('Uploading file to S3 with params:', params);

    s3.upload(params, (err, data) => {
        if (err) {
            console.error('Error uploading to S3:', err);
            return res.status(500).json({ message: 'アップロードが失敗しました。', error: err.message });
        }

        console.log('File uploaded successfully:', data);
        res.json({ message: '保存成功', filename: data.Key });
    });
});

// 随机分配贴图端点
app.get('/random-sticker', (req, res) => {
    console.log('Received request for /random-sticker');

    if (availableStickers.length === 0) {
        availableStickers = [...stickers]; // 重置已使用的贴图
        console.log('All stickers have been used. Resetting available stickers.');
    }

    const randomIndex = Math.floor(Math.random() * availableStickers.length);
    const selectedSticker = availableStickers.splice(randomIndex, 1)[0];

    res.json({ sticker: `/stickers/${selectedSticker}` });
});

// 返回index.html文件
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
