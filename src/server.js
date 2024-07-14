const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

const app = express();
const PORT = process.env.PORT || 3000;
const USED_STICKERS_FILE = path.join(__dirname, 'usedStickers.json');

// 配置AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// 配置multer存储
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 初始化贴图列表和已使用贴图
let stickers = [];
let usedStickers = [];

// 获取贴图列表并存储到内存中
const fetchStickersFromS3 = async () => {
    const params = {
        Bucket: process.env.S3_BUCKET,
        Prefix: 'stickers/' // 假设贴纸存储在这个路径下
    };
    try {
        const data = await s3.listObjectsV2(params).promise();
        stickers = data.Contents.map(item => item.Key);
        console.log('Stickers fetched from S3:', stickers);
    } catch (error) {
        console.error('Error fetching stickers from S3:', error);
    }
};

// 从文件读取已使用的贴图列表
const loadUsedStickers = () => {
    if (fs.existsSync(USED_STICKERS_FILE)) {
        const data = fs.readFileSync(USED_STICKERS_FILE, 'utf8');
        usedStickers = JSON.parse(data);
    }
};

// 将已使用的贴图写入文件
const saveUsedStickers = () => {
    fs.writeFileSync(USED_STICKERS_FILE, JSON.stringify(usedStickers), 'utf8');
};

// 初始化
fetchStickersFromS3().catch(console.error);
loadUsedStickers();

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

// 顺序分配贴图端点
app.get('/random-sticker', (req, res) => {
    const availableStickers = stickers.filter(sticker => !usedStickers.includes(sticker));
    if (availableStickers.length === 0) {
        return res.status(200).json({ message: '全てのぺッティカーが配れました。' });
    }

    const selectedSticker = availableStickers[0];
    usedStickers.push(selectedSticker);
    saveUsedStickers();

    res.json({ sticker: `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${selectedSticker}` });
});

// 重置贴图列表端点
app.post('/reset-stickers', async (req, res) => {
    await fetchStickersFromS3(); // 重新获取贴图列表
    usedStickers = []; // 重置已使用贴图
    saveUsedStickers();
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
