document.addEventListener('DOMContentLoaded', () => {
    const sticker = document.getElementById('sticker');
    const confirmButton = document.getElementById('confirm-button');
    const refreshStickerButton = document.getElementById('refresh-sticker-button');

    // 请求随机贴图
    const fetchSticker = () => {
        sticker.classList.add('fade'); // 添加动画类
        fetch('/random-sticker')
            .then(response => response.json())
            .then(data => {
                console.log('Random sticker data:', data); // 调试信息
                if (data.reset) {
                    // 自动刷新页面
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000); // 延迟2秒刷新
                } else if (data.message) {
                    alert(data.message);
                } else {
                    setTimeout(() => { // 等待动画完成后更新贴纸
                        sticker.src = data.sticker;
                        console.log('Sticker src set to:', sticker.src); // 调试信息
                        sticker.classList.remove('fade'); // 移除动画类
                    }, 500); // 动画持续时间为1s，因此设置为500ms
                }
            })
            .catch(error => {
                console.error('Error fetching random sticker:', error);
                // 贴图加载失败时重试
                setTimeout(fetchSticker, 2000);
            });
    };

    fetchSticker();

    // 使用 interact.js 实现拖放功能
    interact(sticker).draggable({
        listeners: {
            start(event) {
                console.log(event.type, event.target);
            },
            move(event) {
                const target = event.target;
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                target.style.transform = `translate(${x}px, ${y}px)`;

                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
            },
            end(event) {
                console.log(event.type, event.target);
            }
        }
    });

    confirmButton.addEventListener('click', () => {
        const photoContainer = document.getElementById('photo-container');
        html2canvas(photoContainer).then(canvas => {
            canvas.toBlob(blob => {
                const formData = new FormData();
                formData.append('image', blob, 'edited-photo.png');

                fetch('/upload', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    alert('ご参加ありがとうございます！');
                })
                .catch(error => {
                    console.error('Error uploading image:', error);
                });
            }, 'image/png');
        });

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    });

    refreshStickerButton.addEventListener('click', () => {
        fetchSticker();
    }); // 绑定刷新按钮事件

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            fetch('/reset-stickers', {
                method: 'POST'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
            })
            .catch(error => {
                console.error('Error resetting stickers:', error);
            });

            console.log("ステッカーリストがリセットされました！");
        });
    }
});
