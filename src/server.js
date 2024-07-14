const express = require('express');
const path = require('path');
const fs = require('fs'); // 确保导入 fs 模块
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// 配置AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// 配置multer存储
const storage = multer.memoryStorage(); // 使用内存存储
const upload = multer({ storage: storage });

// 初始化贴图列表
let stickers = fs.readdirSync(path.join(__dirname, '../public/stickers'));
const initialStickers = [...stickers]; // 保存初始贴图列表

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

    console.log('Uploading file to S3 with params:', params); // 添加日志以调试

    s3.upload(params, (err, data) => {
        if (err) {
            console.error('Error uploading to S3:', err); // 错误日志
            return res.status(500).json({ message: 'アップロードが失敗しました。' });
        }

        console.log('File uploaded successfully:', data); // 成功日志
        res.json({ message: '保存成功', filename: data.Key });
    });
});

// 随机贴图端点
app.get('/random-sticker', (req, res) => {
    if (stickers.length === 0) {
        return res.status(200).json({ message: '全てのぺッティカーが配れました。' });
    }

    const randomIndex = Math.floor(Math.random() * stickers.length);
    const selectedSticker = stickers.splice(randomIndex, 1)[0];
    res.json({ sticker: `/stickers/${selectedSticker}` });
});


// 重置贴图列表端点
app.post('/reset-stickers', (req, res) => {
    stickers = [...initialStickers];
    console.log("ステッカーリストがリセットされました！");
    res.json({ message: 'ステッカーリストがリセットされました。' });
});

// 返回index.html文件
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
