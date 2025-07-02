document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('products-container');
    const headerSliderImages = document.querySelectorAll('.header-slider img');
    let currentSlide = 0;

    const favoritesLink = document.getElementById('favorites-link');
    const favoritesModal = document.getElementById('favorites-modal');
    const favoritesList = document.getElementById('favorites-list');
    const favoriteCountSpan = document.getElementById('favorite-count');

    const ordersLink = document.getElementById('orders-link');
    const ordersModal = document.getElementById('orders-modal');
    const ordersList = document.getElementById('orders-list');
    const orderCountSpan = document.getElementById('order-count');

    const orderFormModal = document.getElementById('order-form-modal');
    const orderProductImage = document.getElementById('order-product-image');
    const orderProductName = document.getElementById('order-product-name');
    const orderWhatsappForm = document.getElementById('order-whatsapp-form');
    let currentOrderingProduct = null;

    const closeButtons = document.querySelectorAll('.modal .close-button');
    const categoryLinks = document.querySelectorAll('.dropdown-content a');
    const themeToggle = document.getElementById('theme-toggle');

    let allProducts = [];
    let favoriteProducts = JSON.parse(localStorage.getItem('favoriteProducts')) || [];
    let orderedProducts = JSON.parse(localStorage.getItem('orderedProducts')) || [];

    // --- Ma'lumotlarni yuklash ---
    async function fetchProducts() {
        try {
            const response = await fetch('products.json'); // Sizning JSON faylingiz
            allProducts = await response.json();
            renderProducts(allProducts);
            updateFavoriteAndOrderCounts();
        } catch (error) {
            console.error('Mahsulotlarni yuklashda xato:', error);
            productsContainer.innerHTML = '<p>Mahsulotlar yuklanmadi. Iltimos, keyinroq urinib koʻring.</p>';
        }
    }

    // --- Mahsulotlarni sahifaga chiqarish ---
    function renderProducts(productsToRender) {
        productsContainer.innerHTML = ''; // Kontentni tozalash
        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            if (product.type === 'slider') {
                productCard.classList.add('has-slider');
            } else if (product.type === 'video') {
                productCard.classList.add('has-video');
            }

            const isFav = favoriteProducts.some(fav => fav.id === product.id);
            const heartClass = isFav ? 'fas fa-heart active' : 'far fa-heart'; // Solid heart for active, regular for inactive

            let imageHtml = '';
            if (product.type === 'video') {
                imageHtml = `<video controls muted loop preload="none">
                                <source src="${product.videoUrl}" type="video/mp4">
                                Your browser does not support the video tag.
                             </video>`;
            } else if (product.type === 'slider') {
                // Assuming product.images array exists for slider type, otherwise use main image
                const sliderImages = product.sliderImages || [product.image];
                imageHtml = sliderImages.map((img, index) =>
                    `<img src="${img}" alt="${product.name} ${index + 1}" class="${index === 0 ? 'active-slide' : ''}">`
                ).join('');
            } else {
                imageHtml = `<img src="${product.image}" alt="${product.name}">`;
            }

            const discountHtml = product.discount > 0 ? `<span class="product-discount">-${product.discount}%</span>` : '';

            productCard.innerHTML = `
                <div class="product-card-image-container">
                    ${imageHtml}
                    <i class="favorite-icon ${heartClass}" data-product-id="${product.id}"></i>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${product.price.toLocaleString('uz-UZ')} UZS ${discountHtml}</p>
                    <button class="order-button" data-product-id="${product.id}">Buyurtma berish</button>
                </div>
            `;
            productsContainer.appendChild(productCard);

            // Hover Slider Logic
            if (product.type === 'slider') {
                const sliderContainer = productCard.querySelector('.product-card-image-container');
                const images = sliderContainer.querySelectorAll('img');
                let currentHoverSlide = 0;
                let hoverInterval;

                productCard.addEventListener('mouseenter', () => {
                    if (images.length > 1) {
                        hoverInterval = setInterval(() => {
                            images[currentHoverSlide].classList.remove('active-slide');
                            currentHoverSlide = (currentHoverSlide + 1) % images.length;
                            images[currentHoverSlide].classList.add('active-slide');
                        }, 1000); // Har 1 soniyada rasm o'zgaradi
                    }
                });

                productCard.addEventListener('mouseleave', () => {
                    clearInterval(hoverInterval);
                    if (images.length > 1) {
                        images.forEach((img, index) => {
                            if (index !== 0) img.classList.remove('active-slide');
                            else img.classList.add('active-slide');
                        });
                        currentHoverSlide = 0;
                    }
                });
            }
        });
    }

    // --- Header Slider Funksiyasi ---
    function startHeaderSlider() {
        setInterval(() => {
            headerSliderImages[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % headerSliderImages.length;
            headerSliderImages[currentSlide].classList.add('active');
        }, 5000); // Har 5 soniyada rasm o'zgaradi
    }

    // --- Yuqori o'ng burchakdagi baholangan va buyurtma berilgan mahsulotlar sonini yangilash ---
    function updateFavoriteAndOrderCounts() {
        favoriteCountSpan.textContent = favoriteProducts.length;
        orderCountSpan.textContent = orderedProducts.length;
    }

    // --- Modal oynani ochish va yopish ---
    function openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // --- Baholangan mahsulotlarni ko'rsatish ---

    // function renderFavoriteProducts() {
    //     favoritesList.innerHTML = '';
    //     if (favoriteProducts.length === 0) {
    //         favoritesList.innerHTML = '<p>Hali hech qanday mahsulot baholanmagan.</p>';
    //         return;
    //     }
    //     favoriteProducts.forEach(product => {
    //         const productCard = document.createElement('div');
    //         productCard.classList.add('product-card');
    //         productCard.innerHTML = `
    //             <div class="product-card-image-container">
    //                 <img src="${product.image}" alt="${product.name}">
    //             </div>
    //             <div class="product-info">
    //                 <h3 class="product-name">${product.name}</h3>
    //                 <p class="product-price">${product.price.toLocaleString('uz-UZ')} UZS</p>
    //             </div>
    //         `;
    //         favoritesList.appendChild(productCard);
    //     });
    // }

    // 
function renderFavoriteProducts() {
    favoritesList.innerHTML = '';
    if (favoriteProducts.length === 0) {
        favoritesList.innerHTML = '<p>Hali hech qanday mahsulot baholanmagan.</p>';
        return;
    }
    favoriteProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.innerHTML = `
            <div class="product-card-image-container">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${product.price.toLocaleString('uz-UZ')} UZS</p>
                <button class="order-button" data-product-id="${product.id}">Buyurtma berish</button>
            </div>
        `;
        favoritesList.appendChild(productCard);
    });
}


    // --- Buyurtma berilgan mahsulotlarni ko'rsatish ---
    function renderOrderedProducts() {
        ordersList.innerHTML = '';
        if (orderedProducts.length === 0) {
            ordersList.innerHTML = '<p>Hali hech qanday buyurtma berilmagan.</p>';
            return;
        }
        orderedProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.innerHTML = `
                <div class="product-card-image-container">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${product.price.toLocaleString('uz-UZ')} UZS</p>
                </div>
            `;
            ordersList.appendChild(productCard);
        });
    }


    // --- Event Listeners ---

    // Favorites tugmasini bosish
    favoritesLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderFavoriteProducts();
        openModal('favorites-modal');
    });

    // Orders tugmasini bosish
    ordersLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderOrderedProducts();
        openModal('orders-modal');
    });

    // Modal yopish tugmalari
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            closeModal(e.target.closest('.modal').id);
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Favorite iconni bosish
    productsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('favorite-icon')) {
            const productId = parseInt(e.target.dataset.productId);
            const product = allProducts.find(p => p.id === productId);

            if (product) {
                const existingFavIndex = favoriteProducts.findIndex(fav => fav.id === productId);
                if (existingFavIndex > -1) {
                    favoriteProducts.splice(existingFavIndex, 1);
                    e.target.classList.remove('fas', 'active');
                    e.target.classList.add('far');
                } else {
                    favoriteProducts.push(product);
                    e.target.classList.remove('far');
                    e.target.classList.add('fas', 'active');
                }
                localStorage.setItem('favoriteProducts', JSON.stringify(favoriteProducts));
                updateFavoriteAndOrderCounts();
            }
        }
    });

    // Buyurtma berish tugmasini bosish
    productsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('order-button')) {
            const productId = parseInt(e.target.dataset.productId);
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                currentOrderingProduct = product;
                orderProductImage.src = "arzon-shop-zafarobod/" + product.image;
                orderProductName.textContent = product.name;
                document.getElementById('customer-phone').value = '';
                document.getElementById('customer-comment').value = '';
                openModal('order-form-modal');
            }
        }
    });

    // WhatsApp orqali buyurtma yuborish
    orderWhatsappForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentOrderingProduct) return;

        const phoneNumber = document.getElementById('customer-phone').value;
        const comment = document.getElementById('customer-comment').value;

        // const message = `Yangi buyurtma!%0A` +
        //                 `Mahsul: ${currentOrderingProduct.image}%0A` + 
        //                 `Mahsulot: ${currentOrderingProduct.name}%0A` +
        //                 `Narxi: ${currentOrderingProduct.price.toLocaleString('uz-UZ')} UZS%0A` +
        //                 `Telefon raqami: ${phoneNumber}%0A` +
        //                 `Izoh: ${comment || 'Yo‘q'}`;


const message = `Yangi buyurtma!%0A` +
                `Surati: ${window.location.origin}/${currentOrderingProduct.image}%0A` + // Bu yerda rasmning to'liq URL'ini qo'shing
                `Mahsulot: ${currentOrderingProduct.name}%0A` +
                `Narxi: ${currentOrderingProduct.price.toLocaleString('uz-UZ')} UZS%0A` +
                `Telefon raqami: ${phoneNumber}%0A` +
                `Izoh: ${comment || 'Yo‘q'}`;









        // WhatsApp raqamingizni kiriting
        const whatsappNumber = "992929712524"; // Masalan, +998901234567

        window.open(`https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${message}`, '_blank');

        // Buyurtma berilgan mahsulotni ro'yxatga qo'shish
        const isOrdered = orderedProducts.some(order => order.id === currentOrderingProduct.id);
        if (!isOrdered) {
            orderedProducts.push(currentOrderingProduct);
            localStorage.setItem('orderedProducts', JSON.stringify(orderedProducts));
            updateFavoriteAndOrderCounts();
        }

        closeModal('order-form-modal');
        alert('Buyurtmangiz WhatsApp orqali yuborildi!');
    });

    // Kategoriya bo'yicha filterlash
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.dataset.category;
            const filteredProducts = allProducts.filter(p => p.category === category);
            renderProducts(filteredProducts);
        });
    });

    // Kun/Tun rejimini almashtirish
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });

    // Sahifa yuklanganda kun/tun rejimini tekshirish
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }


    // --- Sayt yuklanganda ishga tushirish ---
    fetchProducts();
    startHeaderSlider();
});

// 


// 

function renderFavoriteProducts() {
    favoritesList.innerHTML = '';
    if (favoriteProducts.length === 0) {
        favoritesList.innerHTML = '<p>Hali hech qanday mahsulot baholanmagan.</p>';
        return;
    }
    favoriteProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.innerHTML = `
            <div class="product-card-image-container">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${product.price.toLocaleString('uz-UZ')} UZS</p>
                <button class="order-button" data-product-id="${product.id}">Buyurtma berish</button>
            </div>
        `;
        favoritesList.appendChild(productCard);
    });
}

function renderOrderedProducts() {
    ordersList.innerHTML = '';
    if (orderedProducts.length === 0) {
        ordersList.innerHTML = '<p>Hali hech qanday buyurtma berilmagan.</p>';
        return;
    }
    orderedProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.innerHTML = `
            <div class="product-card-image-container">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${product.price.toLocaleString('uz-UZ')} UZS</p>
                <button class="order-button" data-product-id="${product.id}">Buyurtma berish</button>
            </div>
        `;
        ordersList.appendChild(productCard);
    });
}
