document.addEventListener('DOMContentLoaded', () => {
    const sticker = document.getElementById('sticker');
    const confirmButton = document.getElementById('confirm-button');
    const resetButton = document.getElementById('reset-button');
    const modal = document.getElementById('uploaded-images-modal');
    const closeButton = document.querySelector('.close-button');

    // 请求随机贴图
    const fetchSticker = () => {
        fetch('/random-sticker')
            .then(response => response.json())
            .then(data => {
                console.log('Random sticker data:', data); // 调试信息
                if (data.message) {
                    alert(data.message);
                } else {
                    sticker.src = data.sticker;
                    console.log('Sticker src set to:', sticker.src); // 调试信息
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
                console.log("ステッカーリストがリセットされました！");
                fetchSticker(); // 重置后重新获取贴图
            })
            .catch(error => {
                console.error('Error resetting stickers:', error);
            });
        });
    }
});
