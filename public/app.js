document.addEventListener('DOMContentLoaded', () => {
    const sticker = document.getElementById('sticker');
    const confirmButton = document.getElementById('confirm-button');
    const resetButton = document.getElementById('reset-button');
    const modal = document.getElementById('uploaded-images-modal');
    const closeButton = document.querySelector('.close-button');

    // 请求随机贴图
    fetch('/random-sticker')
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
            } else {
                sticker.src = data.sticker;
            }
        })
        .catch(error => {
            console.error('Error fetching random sticker:', error);
        });

    // 使用 interact.js 实现拖放功能
    interact(sticker).draggable({
        listeners: {
            start(event) {
                console.log(event.type, event.target);
                event.target.classList.add('sticker-dragging'); // 添加拖动类
                event.target.classList.remove('sticker-dropped'); // 移除动画类
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
                event.target.classList.remove('sticker-dragging'); // 移除拖动类
                event.target.classList.add('sticker-dropped'); // 添加动画类
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
                    if (data.message) {
                        alert(data.message);
                    }
                    loadUploadedImages(); // 上传成功后加载已上传的图片
                    modal.style.display = 'block'; // 显示模态对话框
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
            .then(response => response.json())
            .then(data => {
                alert(data.message);
            })
            .catch(error => {
                console.error('Error resetting stickers:', error);
            });

            console.log("ステッカーリストがリセットされました！");
        });
    }

    // 加载已上传的图片
    function loadUploadedImages() {
        fetch('/uploaded-images')
            .then(response => response.json())
            .then(data => {
                const uploadedImagesContainer = document.getElementById('uploaded-images');
                uploadedImagesContainer.innerHTML = '';
                data.images.forEach(image => {
                    const imgElement = document.createElement('img');
                    imgElement.src = image.url;
                    imgElement.alt = 'Uploaded Image';
                    imgElement.style.maxWidth = '100px';
                    imgElement.style.margin = '10px';
                    uploadedImagesContainer.appendChild(imgElement);
                });
            })
            .catch(error => {
                console.error('Error loading uploaded images:', error);
            });
    }

    // 关闭模态对话框
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // 初始加载已上传的图片
    loadUploadedImages();
});
