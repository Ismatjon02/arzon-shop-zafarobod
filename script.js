
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. HTML elementlarni tanlab olish ---
    const productsContainer = document.getElementById('products-container');
    const headerSliderImages = document.querySelectorAll('.header-slider img');

    const favoritesLink = document.getElementById('favorites-link');
    const favoritesModal = document.getElementById('favorites-modal');
    const favoritesList = document.getElementById('favorites-list');
    const favoriteCountSpan = document.getElementById('favorite-count');
    const favoritesTotalCountSpan = document.getElementById('favorites-total-count');
    const favoritesTotalPriceSpan = document.getElementById('favorites-total-price');
    const orderAllFavoritesButton = document.getElementById('order-all-favorites-button');

    const ordersLink = document.getElementById('orders-link');
    const ordersModal = document.getElementById('orders-modal');
    const ordersList = document.getElementById('orders-list');
    const orderCountSpan = document.getElementById('order-count');

    const orderAgainAllButton = document.getElementById('order-again-all-button');
    const ordersTotalCountSpan = document.getElementById('orders-total-count');
    const ordersTotalPriceSpan = document.getElementById('orders-total-price');

    const orderFormModal = document.getElementById('order-form-modal');
    const orderProductImage = document.getElementById('order-product-image');
    const orderProductName = document.getElementById('order-product-name');
    const orderWhatsappForm = document.getElementById('order-whatsapp-form');
    let currentOrderingProduct = null;

    const closeButtons = document.querySelectorAll('.modal .close-button');
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('searchInput');

    // Yangi kategoriya elementlari
    const categoriesContainer = document.getElementById('categories-container');
    const leftArrow = document.querySelector('.category-arrow.left-arrow');
    const rightArrow = document.querySelector('.category-arrow.right-arrow');
    const dropdownContent = document.querySelector('.dropdown-content'); // Navbar dropdowndagi kategoriya ro'yxati

    // Global o'zgaruvchilar
    let currentSlide = 0; // Header slider uchun o'zgaruvchi
    
    let favoriteProducts = JSON.parse(localStorage.getItem('favoriteProducts')) || [];
    let orderedProducts = JSON.parse(localStorage.getItem('orderedProducts')) || [];

    // --- 2. Ma'lumotlarni yuklash (fetchProducts) ---
    async function fetchProducts() {
        try {


            const response = await fetch('products.json');
            let fetchedProducts = await response.json();

            // JSON dagi oxirgi elementni boshiga qo'yish uchun massivni teskari aylantirish
            allProducts = fetchedProducts.reverse();

            renderProducts(allProducts);
            updateFavoriteAndOrderCounts();
            renderCategories(); // Kategoriyalarni yuklash va chiqarish
        } catch (error) {
            console.error('Mahsulotlarni yuklashda xato:', error);
            productsContainer.innerHTML = '<p>Mahsulotlar yuklanmadi. Iltimos, keyinroq urinib koʻring.</p>';
        }
    }
    // const productsContainer = document.getElementById('products-container');

    // --- 3. Mahsulotlarni asosiy sahifaga chiqarish (renderProducts) ---
    function renderProducts(productsToRender) {
        productsContainer.innerHTML =``;

        if (productsToRender.length === 0) {
            productsContainer.innerHTML = '<p class="no-results-message">Товары не найдены.</p>';
            return;
        }

        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');

            let mediaHtml = '';
            if (product.type === 'video') {
                productCard.classList.add('has-video');
                mediaHtml = `<video controls muted loop preload="none">
                                <source src="${product.videoUrl}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>`;
            } else if (product.type === 'slider') {
                productCard.classList.add('has-slider');
                const sliderImages = product.sliderImages || [product.image];
                mediaHtml = sliderImages.map((img, index) =>
                    `<img src="${img}" alt="${product.name} ${index + 1}" class="${index === 0 ? 'active-slide' : ''}">`
                ).join('');
            } else {
                mediaHtml = `<img src="${product.image}" alt="${product.name}">`;
            }

            const isFav = favoriteProducts.some(fav => fav.id === product.id);
            const heartClass = isFav ? 'fas fa-heart active' : 'far fa-heart';

            const discountHtml = product.discount > 0 ? `<span class="product-discount">-${product.discount}%</span>` : '';
            const discountedPrice = product.price * (1 - (product.discount || 0) / 100);

            productCard.innerHTML = `
                 <div class="product-card-image-container">
        ${mediaHtml}
        <i class="favorite-icon ${heartClass}" data-product-id="${product.id}"></i>
    </div>
    <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${discountedPrice.toLocaleString('uz-UZ')} смн ${discountHtml}</p>
        <div class="product-actions">
            <button class="order-button" data-product-id="${product.id}">Заказ</button>
            <button class="new-more-info-button" data-product-id="${product.id}">Подробный</button>
        </div>
    </div>
            `;
            productsContainer.appendChild(productCard);

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
                        }, 1000);
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

    // --- YANGI: Kategoriyalarni yuklash va chiqarish (renderCategories) ---
    function renderCategories() {
        const categories = ['Barchasi']; // Barcha mahsulotlarni ko'rsatish uchun "Barchasi" kategoriyasi
        const categoryImages = {}; // Kategoriyalar uchun rasmlarni saqlash

        allProducts.forEach(product => {
            if (product.category && !categories.includes(product.category)) {
                categories.push(product.category);
                // Kategoriyaning birinchi mahsulotining rasmini meta rasm sifatida ishlatish
                categoryImages[product.category] = product.image;
            }
        });

        // categoriesContainer ni tozalash
        categoriesContainer.innerHTML = '';
        // Navbar dropdown ni tozalash (faqat "Barchasi" qoladi)
        dropdownContent.innerHTML = '<a href="#" data-category="all">Barchasi</a>';


        categories.forEach(category => {
            const categoryCard = document.createElement('div');
            categoryCard.classList.add('category-card');
            categoryCard.dataset.category = category; // Kategoriyani data atributiga saqlash

            let categoryImageUrl = '';
            if (category === 'Barchasi') {
                categoryImageUrl = 'images/all_products_icon.png'; // Barcha mahsulotlar uchun umumiy ikonka
            } else {
                categoryImageUrl = categoryImages[category] || 'images/default_category.png'; // Agar rasm topilmasa, default rasm
            }

            categoryCard.innerHTML = `
                <img src="${categoryImageUrl}" alt="${category}">
                <p>${category}</p>
            `;
            categoriesContainer.appendChild(categoryCard);

            // Navbar dropdown ga ham qo'shish
            const dropdownLink = document.createElement('a');
            dropdownLink.href = '#';
            dropdownLink.dataset.category = category;
            dropdownLink.textContent = category;
            dropdownContent.appendChild(dropdownLink);
        });

        // Kategoriyalarga click event listener qo'shish
        addCategoryEventListeners();
    }

    // YANGI: Kategoriya tugmalariga event listener qo'shish funksiyasi
    function addCategoryEventListeners() {
        // Asosiy kategoriya slayderi uchun
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                filterProductsByCategory(category);
            });
        });

        // Navbar dropdowndagi kategoriya havolalari uchun
        document.querySelectorAll('.dropdown-content a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Default harakatni bekor qilish
                const category = e.target.dataset.category;
                filterProductsByCategory(category);
            });
        });
    }

    // YANGI: Kategoriyalar bo'yicha mahsulotlarni filterlash funksiyasi
    function filterProductsByCategory(category) {
        let filteredProducts = [];
        if (category === 'Barchasi') {
            filteredProducts = allProducts;
        } else {
            filteredProducts = allProducts.filter(p => p.category === category);
        }
        renderProducts(filteredProducts);
        // Agar dropdown menyusi bo'lsa, uni yopish uchun qo'shimcha kod kerak bo'lishi mumkin
        // Masalan, dropdown-content ga "hide" klassini qo'shish
    }

    // YANGI: Kategoriya slayderi strelkalarini boshqarish
    if (leftArrow && rightArrow && categoriesContainer) { // Elementlar mavjudligini tekshirish
        leftArrow.addEventListener('click', () => {
            categoriesContainer.scrollBy({
                left: -categoriesContainer.offsetWidth / 2, // Konteyner kengligining yarmiga siljitish
                behavior: 'smooth'
            });
        });

        rightArrow.addEventListener('click', () => {
            categoriesContainer.scrollBy({
                left: categoriesContainer.offsetWidth / 2,
                behavior: 'smooth'
            });
        });
    }

    // --- 4. Header Slider Funksiyasi ---
    function startHeaderSlider() {
        if (headerSliderImages && headerSliderImages.length > 0) { // headerSliderImages mavjudligini tekshirish
            // Agar birinchi rasmda 'active' klassi bo'lmasa, uni qo'shish
            if (!headerSliderImages[currentSlide].classList.contains('active')) {
                headerSliderImages[currentSlide].classList.add('active');
            }

            setInterval(() => {
                headerSliderImages[currentSlide].classList.remove('active');
                currentSlide = (currentSlide + 1) % headerSliderImages.length;
                headerSliderImages[currentSlide].classList.add('active');
            }, 5000);
        } else {
            console.warn("Header slider rasmlari topilmadi yoki bo'sh."); // Agar rasmlar topilmasa ogohlantirish
        }
    }

    // --- 5. Yuqori o'ng burchakdagi va modal ichidagi hisoblarni yangilash ---
    function updateFavoriteAndOrderCounts() {
        favoriteCountSpan.textContent = favoriteProducts.length;
        orderCountSpan.textContent = orderedProducts.length;

        let totalFavoritePrice = 0;
        favoriteProducts.forEach(product => {
            totalFavoritePrice += product.price * (1 - (product.discount || 0) / 100);
        });
        favoritesTotalCountSpan.textContent = favoriteProducts.length;
        favoritesTotalPriceSpan.textContent = totalFavoritePrice.toLocaleString('uz-UZ') + ' UZS';

        let totalOrderedPrice = 0;
        orderedProducts.forEach(product => {
            totalOrderedPrice += product.price * (1 - (product.discount || 0) / 100);
        });
        if (ordersTotalCountSpan) ordersTotalCountSpan.textContent = orderedProducts.length;
        if (ordersTotalPriceSpan) ordersTotalPriceSpan.textContent = totalOrderedPrice.toLocaleString('uz-UZ') + ' UZS';
    }

    // --- 6. Modal oynani ochish va yopish ---
    function openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // --- 7. Baholangan mahsulotlarni modalda ko'rsatish (renderFavoriteProducts) ---
    function renderFavoriteProducts() {
        favoritesList.innerHTML = '';

        if (favoriteProducts.length === 0) {
            favoritesList.innerHTML = '<p>Hali hech qanday mahsulot baholanmagan.</p>';
            orderAllFavoritesButton.style.display = 'none';
            return;
        } else {
            orderAllFavoritesButton.style.display = 'block';
        }

        favoriteProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');

            const heartClass = 'fas fa-heart active';
            const discountedPrice = product.price * (1 - (product.discount || 0) / 100);

            productCard.innerHTML = `
                <div class="product-card-image-container">
                    <img src="${product.image}" alt="${product.name}">
                    <i class="favorite-icon ${heartClass}" data-product-id="${product.id}"></i>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${discountedPrice.toLocaleString('uz-UZ')} UZS</p>
                    <button class="order-button" data-product-id="${product.id}">Buyurtma berish</button>
                </div>
            `;
            favoritesList.appendChild(productCard);
        });

        updateFavoriteAndOrderCounts();
    }

    // --- 8. Buyurtma berilgan mahsulotlarni modalda ko'rsatish (renderOrderedProducts) ---
    function renderOrderedProducts() {
        ordersList.innerHTML = '';

        if (orderedProducts.length === 0) {
            ordersList.innerHTML = '<p>Hali hech qanday buyurtma berilmagan.</p>';
            if (orderAgainAllButton) orderAgainAllButton.style.display = 'none';
            if (ordersTotalCountSpan) ordersTotalCountSpan.textContent = '0';
            if (ordersTotalPriceSpan) ordersTotalPriceSpan.textContent = '0 UZS';
            updateFavoriteAndOrderCounts();
            return;
        } else {
            if (orderAgainAllButton) orderAgainAllButton.style.display = 'block';
        }

        let totalOrderedPrice = 0;
        orderedProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');

            const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
            totalOrderedPrice += discountedPrice;

            productCard.innerHTML = `
                <div class="product-card-image-container">
                    <img src="${product.image}" alt="${product.name}">
                    <i class="delete-icon fas fa-trash-alt" data-product-id="${product.id}"></i>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${discountedPrice.toLocaleString('uz-UZ')} UZS</p>
                    <button class="order-button" data-product-id="${product.id}">Buyurtma berish</button>
                </div>
            `;
            ordersList.appendChild(productCard);
        });

        if (ordersTotalCountSpan) ordersTotalCountSpan.textContent = orderedProducts.length;
        if (ordersTotalPriceSpan) ordersTotalPriceSpan.textContent = totalOrderedPrice.toLocaleString('uz-UZ') + ' UZS';

        updateFavoriteAndOrderCounts();
    }

    ordersModal.addEventListener('click', (e) => {
        const deleteIcon = e.target.closest('.delete-icon');
        if (deleteIcon) {
            const productId = parseInt(deleteIcon.dataset.productId);

            orderedProducts = orderedProducts.filter(order => order.id !== productId);
            localStorage.setItem('orderedProducts', JSON.stringify(orderedProducts));

            updateFavoriteAndOrderCounts();
            renderOrderedProducts();
            return;
        }

        if (e.target.classList.contains('order-button')) {
            const productId = parseInt(e.target.dataset.productId);
            const product = allProducts.find(p => p.id === productId);

            if (product) {
                currentOrderingProduct = product;
                orderProductImage.src = product.image;
                orderProductName.textContent = product.name;
                document.getElementById('customer-phone').value = '';
                document.getElementById('customer-comment').value = '';
                openModal('order-form-modal');
            }
        }
    });

    // --- 9. Qidiruv funksiyasi ---
    function searchProducts() {
        const term = searchInput.value.toLowerCase().trim();

        if (term === '') {
            renderProducts(allProducts);
            return;
        }

        const filtered = allProducts.filter(product =>
            product.name.toLowerCase().includes(term)
        );

        renderProducts(filtered);
    }

    // --- 10. Event Listeners ---

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
        // 
        // modal
        


        // 
        // 
    });
    
    

    productsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('order-button')) {
            const productId = parseInt(e.target.dataset.productId);
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                currentOrderingProduct = product;
                orderProductImage.src = product.image;
                orderProductName.textContent = product.name;
                document.getElementById('customer-phone').value = '';
                document.getElementById('customer-comment').value = '';
                openModal('order-form-modal');

                const isAlreadyOrdered = orderedProducts.some(order => order.id === product.id);
                if (!isAlreadyOrdered) {
                    orderedProducts.push(product);
                    localStorage.setItem('orderedProducts', JSON.stringify(orderedProducts));
                    updateFavoriteAndOrderCounts();
                }
            }
        }
    });

    favoritesLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderFavoriteProducts();
        openModal('favorites-modal');
    });

    ordersLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderOrderedProducts();
        openModal('orders-modal');
    });

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

    favoritesModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('order-button')) {
            const productId = parseInt(e.target.dataset.productId);
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                currentOrderingProduct = product;
                orderProductImage.src = product.image;
                orderProductName.textContent = product.name;
                document.getElementById('customer-phone').value = '';
                document.getElementById('customer-comment').value = '';
                openModal('order-form-modal');
            }
        }

        if (e.target.classList.contains('favorite-icon')) {
            const productId = parseInt(e.target.dataset.productId);

            favoriteProducts = favoriteProducts.filter(fav => fav.id !== productId);
            localStorage.setItem('favoriteProducts', JSON.stringify(favoriteProducts));
            updateFavoriteAndOrderCounts();

            renderFavoriteProducts();
        }
    });

    orderAllFavoritesButton.addEventListener('click', () => {
        if (favoriteProducts.length === 0) {
            alert("Buyurtma berish uchun baholangan mahsulotlar yo'q.");
            return;
        }
        orderProductImage.src = 'images/all_products_icon.png';
        orderProductName.textContent = 'Barcha baholangan mahsulotlar';
        document.getElementById('customer-phone').value = '';
        document.getElementById('customer-comment').value = '';
        openModal('order-form-modal');
        currentOrderingProduct = null; // Barcha mahsulotlar buyurtma qilinganda null qilinadi
        favoriteProducts.forEach(product => {
            const isAlreadyOrdered = orderedProducts.some(order => order.id === product.id);
            if (!isAlreadyOrdered) {
                orderedProducts.push(product);
            }
        });
        localStorage.setItem('orderedProducts', JSON.stringify(orderedProducts));
        updateFavoriteAndOrderCounts();
    });

    if (orderAgainAllButton) {
        orderAgainAllButton.addEventListener('click', () => {
            if (orderedProducts.length === 0) {
                alert("Qayta buyurtma berish uchun mahsulotlar yo'q.");
                return;
            }

            let message = '*Yangi Qayta Buyurtma!*%0A'; // Qalin shrift va yangi qator
            let totalOrderPrice = 0;

            message += `*Jami mahsulotlar soni:* ${orderedProducts.length}%0A`; // Qalin shrift va yangi qator

            orderedProducts.forEach((product, index) => {
                const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
                totalOrderPrice += discountedPrice;
                message += `${index + 1}. ${product.name} - ${discountedPrice.toLocaleString('uz-UZ')} UZS%0A`; // Yangi qator
                message += `Surati: ${window.location.origin}/${product.image}%0A`; // Rasm URL va yangi qator
            });

            message += `*Umumiy narx:* ${totalOrderPrice.toLocaleString('uz-UZ')} UZS%0A`; // Qalin shrift va yangi qator

            let whatsappNumber = "+992929712524";

            const phoneNumber = prompt("Iltimos, telefon raqamingizni kiriting (Misol: 99292XXXXXX):");

            if (phoneNumber) {
                message += `*Telefon raqami:* ${phoneNumber}`; // Qalin shrift
                window.open(`https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`, '_blank');
                alert('Qayta buyurtmangiz WhatsApp orqali yuborildi!');
            } else {
                alert('Telefon raqami kiritilmadi, buyurtma yuborilmadi.');
            }
        });
    }

    orderWhatsappForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const phoneNumber = document.getElementById('customer-phone').value;
        const comment = document.getElementById('customer-comment').value;

        let message = '';
        let whatsappNumber = "+992929712524";

        if (currentOrderingProduct) {
            // Faqat bitta mahsulot buyurtma berilayotgan bo'lsa
            const discountedPrice = currentOrderingProduct.price * (1 - (currentOrderingProduct.discount || 0) / 100);
            message = `*Yangi buyurtma! <br>` +
                      `*Mahsulot:* ${currentOrderingProduct.name}%0A` +
                      `*Narxi:* ${discountedPrice.toLocaleString('uz-UZ')} UZS%0A` +
                      `*Surati:* ${window.location.origin}/${currentOrderingProduct.image}%0A` +
                      `*Telefon raqami:* ${phoneNumber}%0A` +
                      `*Izoh:* ${comment || 'Yo‘q'}`;


            const isOrdered = orderedProducts.some(order => order.id === currentOrderingProduct.id);
            if (!isOrdered) {
                orderedProducts.push(currentOrderingProduct);
                localStorage.setItem('orderedProducts', JSON.stringify(orderedProducts));
                updateFavoriteAndOrderCounts();
            }

        } else {
            // HAMMASINI ZAKAS BERISH bosilganda
            let productsDetail = '';
            let totalOrderPrice = 0;
            let totalOrderCount = favoriteProducts.length;

            productsDetail += `*Buyurtma qilingan mahsulotlar ro'yxati:*%0A`;

            favoriteProducts.forEach((product, index) => {
                const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
                totalOrderPrice += discountedPrice;
                productsDetail += `${index + 1}. ${product.name} - ${discountedPrice.toLocaleString('uz-UZ')} UZS%0A`;
                // Har bir mahsulot rasmi uchun alohida qator qo'shamiz
                productsDetail += `Surati: ${window.location.origin}/${product.image}%0A`;
            });

            message = `*Yangi umumiy buyurtma!*%0A` +
                      `*Jami mahsulotlar soni:* ${totalOrderCount}%0A` +
                      `*Umumiy narx:* ${totalOrderPrice.toLocaleString('uz-UZ')} UZS%0A` +
                      `${productsDetail}` + // Yuqorida yig'ilgan mahsulotlar ro'yxati
                      `*Telefon raqami:* ${phoneNumber}%0A` +
                      `*Izoh:* ${comment || 'Yo‘q'}`;

            favoriteProducts.forEach(product => {
                const isOrdered = orderedProducts.some(order => order.id === product.id);
                if (!isOrdered) {
                    orderedProducts.push(product);
                }
            });
            localStorage.setItem('orderedProducts', JSON.stringify(orderedProducts));
            updateFavoriteAndOrderCounts();
        }

        window.open(`https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`, '_blank');

        closeModal('order-form-modal');
        alert('Buyurtmangiz WhatsApp orqali yuborildi!');
    });

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    searchInput.addEventListener('input', searchProducts);



    
    // --- Sayt yuklanganda ishga tushirish ---
    fetchProducts();
    startHeaderSlider();
});


// ////////////////


// 
// 




// // script.js faylingiz

// // ===========================================
// // Global o'zgaruvchilar va DOM elementlarini tanlash
// // ===========================================

// let allProducts = []; // Barcha mahsulotlar shu massivda saqlanadi

// // ====== Header Slider elementlari ======
// const headerSliderImagesContainer = document.querySelector('.header-slider');
// // headerSliderImages ni tekshirib tanlaymiz, chunki u mavjud bo'lmasa, xato bermasin
// const headerSliderImages = headerSliderImagesContainer ? headerSliderImagesContainer.querySelectorAll('.slide-item img') : [];
// let currentSlide = 0;
// let headerSliderInterval;

// // ====== Yangi sodda modal elementlari ======
// const newSimpleModal = document.getElementById('new-simple-modal');
// // Element topilmasa null bo'ladi, shuning uchun tekshiramiz
// const newCloseButton = newSimpleModal ? newSimpleModal.querySelector('.new-close-button') : null;
// const newModalImg = document.getElementById('new-modal-img');
// const newModalName = document.getElementById('new-modal-name');

// // span elementlarini tanlash
// const newModalPriceValue = document.getElementById('new-modal-price-value');
// const newModalModelValue = document.getElementById('new-modal-model-value');
// const newModalColorValue = document.getElementById('new-modal-color-value');
// const newModalDescriptionValue = document.getElementById('new-modal-description-value'); // Batafsil uchun
// const newModalSizeValue = document.getElementById('new-modal-size-value'); // Size uchun


// // Ota-ona <p> elementlarini tanlash (ularni yashirish/ko'rsatish uchun)
// // QuerySelector ishlatamiz, chunki ular ID emas, classga ega
// const newModalPriceParagraph = document.querySelector('.new-modal-price');
// const newModalModelParagraph = document.querySelector('.new-modal-model');
// const newModalColorParagraph = document.querySelector('.new-modal-color');
// const newModalDescriptionParagraph = document.querySelector('.new-modal-description'); // Batafsil uchun
// const newModalSizeParagraph = document.querySelector('.new-modal-size'); // Size uchun

// // //////////////////////////////


// // ///////////////////////////


//     // Modal ichidagi slayder elementlari
// const newModalSliderContainer = newSimpleModal ? newSimpleModal.querySelector('.new-modal-slider-container') : null;
// const newModalSlider = newSimpleModal ? newSimpleModal.querySelector('.new-modal-slider') : null;
// const newModalSliderPrevBtn = newSimpleModal ? newSimpleModal.querySelector('.new-modal-slider-prev-btn') : null;
// const newModalSliderNextBtn = newSimpleModal ? newSimpleModal.querySelector('.new-modal-slider-next-btn') : null;

// let currentModalSlideIndex = 0; // Modal slayderining joriy rasmi indeksi
// let currentModalImages = []; // Joriy mahsulot rasmlari massivi


// // ====== MODAL ICHIDAGI SLAYDERNI YANGILASH FUNKSIYASI ======
// function updateModalSlider() {
//     // Agar modal slayder elementlari topilmasa yoki rasm bo'lmasa, ishlamaymiz
//     if (!newModalSlider || !newModalSliderContainer || currentModalImages.length === 0) {
//         if (newModalSliderContainer) {
//             newModalSliderContainer.style.display = 'none'; // Slayderni yashiramiz
//         }
//         return;
//     }
    
//     newModalSliderContainer.style.display = 'block'; // Slayderni ko'rsatamiz

//     // Slayder ichini tozalab, joriy mahsulot rasmlarini qo'shamiz
//     newModalSlider.innerHTML = ''; // Oldingi rasmlarni o'chiramiz
//     currentModalImages.forEach(imagePath => {
//         const img = document.createElement('img'); // Yangi img tegi yaratamiz
//         img.src = imagePath; // Rasm manzilini o'rnatamiz
//         img.alt = "Mahsulot rasmi";
//         newModalSlider.appendChild(img); // Slayder diviga qo'shamiz
//     });

//     // Joriy indeksni rasm soniga moslashtiramiz (chegaradan chiqmasligi uchun)
//     if (currentModalSlideIndex >= currentModalImages.length) {
//         currentModalSlideIndex = 0; // Oxirgi rasmdan keyin birinchisiga o'tadi
//     }
//     if (currentModalSlideIndex < 0) {
//         currentModalSlideIndex = currentModalImages.length - 1; // Birinchi rasmdan oldin oxirgisiga o'tadi
//     }

//     // Slayderni surish (joriy rasm ko'rinishi uchun)
//     // Har bir rasm 100% kenglikda, shuning uchun (indeks * 100%) suramiz
//     newModalSlider.style.transform = `translateX(-${currentModalSlideIndex * 100}%)`;

//     // Slayderda bittadan ortiq rasm bo'lsa, oldinga/orqaga tugmalarini ko'rsatamiz
//     if (currentModalImages.length <= 1) {
//         if (newModalSliderPrevBtn) newModalSliderPrevBtn.style.display = 'none';
//         if (newModalSliderNextBtn) newModalSliderNextBtn.style.display = 'none';
//     } else {
//         if (newModalSliderPrevBtn) newModalSliderPrevBtn.style.display = 'block';
//         if (newModalSliderNextBtn) newModalSliderNextBtn.style.display = 'block';
//     }
// }






// // ///////////////////////

















// // //////////


// // Mahsulotlarni ko'rsatish uchun konteyner
// const productsContainer = document.getElementById('products-container'); // HTML'dagi ID'ga mos kelishi kerak

// // ===========================================
// // Funksiyalar
// // ===========================================

// // ====== Yangi sodda modalni ochish funksiyasi ======
// function openNewSimpleModal(product) {
//     if (!product) {
//         console.error("openNewSimpleModal: Mahsulot ma'lumotlari topilmadi!");
//         return;
//     }

//     console.log("Mufassal modal ochilmoqda...", product.name);

//     // Modal kontentini to'ldirish
//     if (newModalImg) newModalImg.src = product.image || '';
//     if (newModalName) newModalName.textContent = product.name || 'Nomsiz mahsulot';

//     // Narx
//     if (product.price) {
//         const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
//         if (newModalPriceValue) newModalPriceValue.textContent = discountedPrice.toLocaleString('uz-UZ') + ' СМН';
//         if (newModalPriceParagraph) newModalPriceParagraph.style.display = 'block';
//     } else {
//         if (newModalPriceParagraph) newModalPriceParagraph.style.display = 'none';
//     }

//     // Model
//     if (product.model) {
//         if (newModalModelValue) newModalModelValue.textContent = product.model;
//         if (newModalModelParagraph) newModalModelParagraph.style.display = 'block';
//     } else {
//         if (newModalModelParagraph) newModalModelParagraph.style.display = 'none';
//     }

//     // Rangi
//     if (product.color) { // JSONda 'color' maydoni bo'lishi shart
//         if (newModalColorValue) newModalColorValue.textContent = product.color;
//         if (newModalColorParagraph) newModalColorParagraph.style.display = 'block';
//     } else {
//         if (newModalColorParagraph) newModalColorParagraph.style.display = 'none';
//     }

//     // Batafsil (description)
//     if (product.description) { // JSONda 'description' maydoni bo'lishi shart
//         // TextContent bilan xavfsizlikni ta'minlaymiz
//         if (newModalDescriptionValue) newModalDescriptionValue.textContent = product.description;
//         if (newModalDescriptionParagraph) newModalDescriptionParagraph.style.display = 'block';
//     } else {
//         if (newModalDescriptionParagraph) newModalDescriptionParagraph.style.display = 'none';
//     }


//  // Размер 
//     if (product.size) { // JSONda 'description' maydoni bo'lishi shart
//         // TextContent bilan xavfsizlikni ta'minlaymiz
//         if (newModalSizeValue) newModalSizeValue.textContent = product.size;
//         if (newModalSizeParagraph) newModalSizeParagraph.style.display = 'block';
//     } else {
//         if (newModalSizeParagraph) newModalSizeParagraph.style.display = 'none';
//     }



    
//     // Modalni ko'rsatish
//     if (newSimpleModal) {
//         newSimpleModal.style.display = 'flex';
//         document.body.style.overflow = 'hidden'; // Orqa fonni skroll qilishni to'xtatish
//     } else {
//         console.error("newSimpleModal elementi topilmadi, modal ochilmadi.");
//     }
// }



// // ====== Yangi sodda modalni yopish funksiyasi ======
// function closeNewSimpleModal() {
//     if (newSimpleModal) { // newSimpleModal mavjudligini tekshirish
//         newSimpleModal.style.display = 'none'; // Modalni yashirish
//         document.body.style.overflow = ''; // Orqa fon skrollini qaytarish
//     }
// }



// // //////////

// function startHeaderSlider() {
//     if (headerSliderImages.length > 0) {
//         clearInterval(headerSliderInterval); // Oldingi taymerni to'xtatamiz

//         // Barcha rasmlardan 'active' klassini olib tashlaymiz
//         headerSliderImages.forEach(img => img.classList.remove('active'));

//         // Joriy indeksni tekshiramiz
//         if (currentSlide >= headerSliderImages.length || currentSlide < 0) {
//             currentSlide = 0; // Agar indeks chegaradan chiqsa, birinchisiga qaytaramiz
//         }

//         // Joriy rasmga 'active' klassini qo'shamiz
//         if (headerSliderImages[currentSlide]) {
//             headerSliderImages[currentSlide].classList.add('active');
//         } else {
//             console.warn(`startHeaderSlider: headerSliderImages[${currentSlide}] elementi topilmadi.`);
//             return;
//         }

//         // Slayderni avtomatik almashtirish uchun taymer o'rnatamiz
//         headerSliderInterval = setInterval(() => {
//             if (headerSliderImages[currentSlide]) {
//                 headerSliderImages[currentSlide].classList.remove('active');
//             }
//             currentSlide = (currentSlide + 1) % headerSliderImages.length; // Keyingi rasmga o'tamiz
//             if (headerSliderImages[currentSlide]) {
//                 headerSliderImages[currentSlide].classList.add('active');
//             }
//         }, 3000); // Har 3 sekundda
//     } else {
//         console.warn("Header slider images topilmadi yoki massiv bo'sh. Slayder ishga tushirilmadi.");
//     }
// }





// // 
// // /////////

// // ====== Mahsulotlarni sahifaga render qilish funksiyasi ======
// function renderProducts(productsToRender) {
//     if (!productsContainer) {
//         console.error("renderProducts: productsContainer elementi topilmadi!");
//         return;
//     }
//     productsContainer.innerHTML = ''; // Kontentni tozalash

//     productsToRender.forEach(product => {
//         const productCard = document.createElement('div');
//         productCard.classList.add('product-card');

//         // Rasm va media HTML (agar videolar bo'lsa)
//         let mediaHtml = '';
//         if (product.type === 'video' && product.video) {
//             mediaHtml = `<video src="${product.video}"   autoplay playsinline loop class="product-image"></video>`;
//         } else if (product.image) {
//             mediaHtml = `<img src="${product.image}" alt="${product.name}" class="product-image">`;
//         } else {
//             mediaHtml = `<div class="no-image-placeholder">Rasm yo'q</div>`;
//         }

//         // Sevimli ikonka klassi
//         const isFav = false; // Buni localStoragedan olishingiz kerak
//         const heartClass = isFav ? 'fas' : 'far'; // fas - to'liq, far - bo'sh

//         // Chegirma HTML
//         let discountHtml = '';
//         let discountedPrice = product.price;
//         if (product.discount && product.discount > 0) {
//             discountedPrice = product.price * (1 - product.discount / 100);
//             discountHtml = `<span class="original-price">${product.price.toLocaleString('uz-UZ')} UZS</span> <span class="discount-percentage">-${product.discount}%</span>`;
//         }

//         productCard.innerHTML = `
//             <div class="product-card-image-container">
//                 ${mediaHtml}
//                 <i class="favorite-icon ${heartClass}" data-product-id="${product.id}"></i>
//             </div>
//             <div class="product-info">
//                 <h3 class="product-name">${product.name}</h3>
//                 <p class="product-price">${discountedPrice.toLocaleString('uz-UZ')} СМН ${discountHtml}</p>
//                 <div class="product-actions">
//                     <button class="order-button" data-product-id="${product.id}">Заказ</button>
//                     <button class="new-more-info-button" data-product-id="${product.id}">Подробный</button>
//                 </div>
//             </div>
//         `;
//         productsContainer.appendChild(productCard);
//     });
// }


// // ===========================================
// // Event Listenerlar
// // ===========================================

// // Yopish tugmasiga click
// if (newCloseButton) {
//     newCloseButton.addEventListener('click', closeNewSimpleModal);
// } else {
//     console.warn("newCloseButton elementi topilmadi! 'new-close-button' klassini tekshiring.");
// }

// // Modalning o'ziga click (kontentga emas)
// if (newSimpleModal) {
//     newSimpleModal.addEventListener('click', (event) => {
//         if (event.target === newSimpleModal) {
//             closeNewSimpleModal();
//         }
//     });
// } else {
//     console.warn("newSimpleModal elementi topilmadi! 'new-simple-modal' ID'sini tekshiring.");
// }

// // ESC tugmasi bosilganda yopish
// document.addEventListener('keydown', (event) => {
//     if (newSimpleModal && event.key === 'Escape' && newSimpleModal.style.display === 'flex') {
//         closeNewSimpleModal();
//     }
// });

// // ===== `productsContainer` dagi click event listeneri (delegatsiya) =====
// // Bu event listener mahsulot kartalari ichidagi tugmalarni tinglaydi
// if (productsContainer) {
//     productsContainer.addEventListener('click', (e) => {
//         console.log("productsContainer click eventi ishga tushdi. Bosilgan element:", e.target);

//         // "Mufassal" tugmasiga bosilganda sodda modalni ochish
//         // e.target.closest() bilan tugmani yoki uning ota-onasini topamiz
//         const newMoreInfoButton = e.target.closest('.new-more-info-button');
//         if (newMoreInfoButton) {
//             console.log(" 'Mufassal' tugmasi bosildi.");
//             const productId = parseInt(newMoreInfoButton.dataset.productId);
//             console.log("Mahsulot ID:", productId);

//             const product = allProducts.find(p => p.id === productId);
//             if (product) {
//                 console.log("Topilgan mahsulot:", product);
//                 openNewSimpleModal(product); // Yangi sodda modalni ochamiz
//             } else {
//                 console.warn(`Mahsulot ID ${productId} allProducts massivida topilmadi.`);
//             }
//             e.stopPropagation(); // Boshqa eventlarning ishlashini to'xtatish
//             return;
//         }

//         // Sevimli ikonkasiga bosilganda (agar mavjud bo'lsa)
//         const favoriteIcon = e.target.closest('.favorite-icon');
//         if (favoriteIcon) {
//             e.stopPropagation();
//             const productId = parseInt(favoriteIcon.dataset.productId);
//             // toggleFavorite(productId); // Bu funksiyani o'zingiz yozishingiz kerak
//             console.log(`Favorite icon clicked for product ID: ${productId}`);
//             return;
//         }

//         // Buyurtma tugmasiga bosilganda (agar mavjud bo'lsa)
//         const orderButton = e.target.closest('.order-button');
//         if (orderButton) {
//             e.stopPropagation();
//             const productId = parseInt(orderButton.dataset.productId);
//             const product = allProducts.find(p => p.id === productId);
//             if (product) {
//                 // openOrderFormModal(product); // Bu funksiyani o'zingiz yozishingiz kerak
//                 console.log(`Order button clicked for product ID: ${productId}`);
//             }
//             return;
//         }
//     });
// } else {
//     console.error("productsContainer topilmadi! HTMLda ID 'products-container' mavjudligini tekshiring.");
// }

// // ===========================================
// // Ma'lumotlarni yuklash va init
// // ===========================================

// // Mahsulotlarni JSON faylidan yuklash
// fetch('products.json')
//     .then(response => {
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         return response.json();
//     })
//     .then(data => {
//         allProducts = data;
//         console.log("Mahsulotlar JSON dan yuklandi:", allProducts);
//         renderProducts(allProducts); // Mahsulotlarni sahifaga render qilish
//         startHeaderSlider(); // Header slayderni ma'lumotlar yuklangandan keyin ishga tushirish
//     }).catch(error => console.error('Mahsulotlarni yuklashda xato:', error));

    
    


    







// /////////////////////////////////////////////////////////////////////////////////










// script.js faylingiz

// ===========================================
// Global o'zgaruvchilar va DOM elementlarini tanlash
// ===========================================

let allProducts = []; // Barcha mahsulotlar shu massivda saqlanadi

// ====== Header Slider elementlari ======
// Agar header slayder HTMLda mavjud bo'lmasa, bu elementlar `null` yoki bo'sh bo'ladi.
// Bu qism sizning oldingi kodingizdan olingan. Agar header slayder butunlay keraksiz bo'lsa,
// bu o'zgaruvchilarni va `startHeaderSlider` funksiyasini ham olib tashlashingiz mumkin.
const headerSliderImagesContainer = document.querySelector('.header-slider');
const headerSliderImages = headerSliderImagesContainer ? headerSliderImagesContainer.querySelectorAll('.slide-item img') : [];
let currentSlide = 0;
let headerSliderInterval;

// ====== Yangi sodda modal elementlari ======
const newSimpleModal = document.getElementById('new-simple-modal');
const newCloseButton = newSimpleModal ? newSimpleModal.querySelector('.new-close-button') : null;

// Modal ichidagi slayder elementlari
const newModalSliderContainer = newSimpleModal ? newSimpleModal.querySelector('.new-modal-slider-container') : null;
const newModalSlider = newSimpleModal ? newSimpleModal.querySelector('.new-modal-slider') : null; // Xato tuzatildi: .olquerySelector -> .querySelector
const newModalSliderPrevBtn = newSimpleModal ? newSimpleModal.querySelector('.new-modal-slider-prev-btn') : null;
const newModalSliderNextBtn = newSimpleModal ? newSimpleModal.querySelector('.new-modal-slider-next-btn') : null;

let currentModalSlideIndex = 0; // Modal slayderining joriy rasmi indeksi
let currentModalImages = []; // Joriy mahsulot rasmlari massivi

// Modal ichidagi matn elementlari (spanlar)
const newModalName = document.getElementById('new-modal-name');
const newModalPriceValue = document.getElementById('new-modal-price-value');
const newModalModelValue = document.getElementById('new-modal-model-value');
const newModalColorValue = document.getElementById('new-modal-color-value');
const newModalDescriptionValue = document.getElementById('new-modal-description-value');
const newModalSizeValue = document.getElementById('new-modal-size-value');

// Ota-ona <p> elementlari (ularni yashirish/ko'rsatish uchun)
const newModalPriceParagraph = document.querySelector('.new-modal-price');
const newModalModelParagraph = document.querySelector('.new-modal-model');
const newModalColorParagraph = document.querySelector('.new-modal-color');
const newModalDescriptionParagraph = document.querySelector('.new-modal-description');
const newModalSizeParagraph = document.querySelector('.new-modal-size');

// Mahsulotlarni ko'rsatish uchun konteyner
const productsContainer = document.getElementById('products-container'); // HTML'dagi ID'ga mos kelishi kerak

// ===========================================
// Funksiyalar
// ===========================================

// ====== MODAL ICHIDAGI SLAYDERNI YANGILASH FUNKSIYASI ======
function updateModalSlider() {
    // Agar modal slayder elementlari topilmasa yoki rasm bo'lmasa, ishlamaymiz
    if (!newModalSlider || !newModalSliderContainer || currentModalImages.length === 0) {
        if (newModalSliderContainer) {
            newModalSliderContainer.style.display = 'none'; // Slayderni yashiramiz
        }
        return;
    }

    newModalSliderContainer.style.display = 'block'; // Slayderni ko'rsatamiz

    // Slayder ichini tozalab, joriy mahsulot rasmlarini qo'shamiz
    newModalSlider.innerHTML = ''; // Oldingi rasmlarni o'chiramiz
    currentModalImages.forEach(imagePath => {
        const img = document.createElement('img'); // Yangi img tegi yaratamiz
        img.src = imagePath; // Rasm manzilini o'rnatamiz
        img.alt = "Mahsulot rasmi";
        newModalSlider.appendChild(img); // Slayder diviga qo'shamiz
    });

    // Joriy indeksni rasm soniga moslashtiramiz (chegaradan chiqmasligi uchun)
    if (currentModalSlideIndex >= currentModalImages.length) {
        currentModalSlideIndex = 0; // Oxirgi rasmdan keyin birinchisiga o'tadi
    }
    if (currentModalSlideIndex < 0) {
        currentModalSlideIndex = currentModalImages.length - 1; // Birinchi rasmdan oldin oxirgisiga o'tadi
    }

    // Slayderni surish (joriy rasm ko'rinishi uchun)
    // Har bir rasm 100% kenglikda, shuning uchun (indeks * 100%) suramiz
    newModalSlider.style.transform = `translateX(-${currentModalSlideIndex * 100}%)`;

    // Slayderda bittadan ortiq rasm bo'lsa, oldinga/orqaga tugmalarini ko'rsatamiz
    if (currentModalImages.length <= 1) {
        if (newModalSliderPrevBtn) newModalSliderPrevBtn.style.display = 'none';
        if (newModalSliderNextBtn) newModalSliderNextBtn.style.display = 'none';
    } else {
        if (newModalSliderPrevBtn) newModalSliderPrevBtn.style.display = 'block';
        if (newModalSliderNextBtn) newModalSliderNextBtn.style.display = 'block';
    }
}

// ====== Yangi sodda modalni ochish funksiyasi ======
function openNewSimpleModal(product) {
    if (!product) {
        console.error("openNewSimpleModal: Mahsulot ma'lumotlari topilmadi!");
        return;
    }

    console.log("Mufassal modal ochilmoqda...", product.name);

    // Modal kontentini to'ldirish
    if (newModalName) newModalName.textContent = product.name || 'Nomsiz mahsulot';

    // Narx
    if (product.price) {
        const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
        if (newModalPriceValue) newModalPriceValue.textContent = discountedPrice.toLocaleString('uz-UZ') + ' СМН';
        if (newModalPriceParagraph) newModalPriceParagraph.style.display = 'block';
    } else {
        if (newModalPriceParagraph) newModalPriceParagraph.style.display = 'none';
    }

    // Model
    if (product.model) {
        if (newModalModelValue) newModalModelValue.textContent = product.model;
        if (newModalModelParagraph) newModalModelParagraph.style.display = 'block';
    } else {
        if (newModalModelParagraph) newModalModelParagraph.style.display = 'none';
    }

    // Rangi
    if (product.color) { // JSONda 'color' maydoni bo'lishi shart
        if (newModalColorValue) newModalColorValue.textContent = product.color;
        if (newModalColorParagraph) newModalColorParagraph.style.display = 'block';
    } else {
        if (newModalColorParagraph) newModalColorParagraph.style.display = 'none';
    }

    // Batafsil (description)
    if (product.description) { // JSONda 'description' maydoni bo'lishi shart
        if (newModalDescriptionValue) newModalDescriptionValue.textContent = product.description;
        if (newModalDescriptionParagraph) newModalDescriptionParagraph.style.display = 'block';
    } else {
        if (newModalDescriptionParagraph) newModalDescriptionParagraph.style.display = 'none';
    }

    // Размер (Size)
    if (product.size) {
        if (newModalSizeValue) newModalSizeValue.textContent = product.size;
        if (newModalSizeParagraph) newModalSizeParagraph.style.display = 'block';
    } else {
        if (newModalSizeParagraph) newModalSizeParagraph.style.display = 'none';
    }

    // Modal slayderini tayyorlash va ishga tushirish
    currentModalSlideIndex = 0; // Har safar modal ochilganda 1-rasmdan boshlaymiz
    // Agar `product.images` massivi bo'lsa, uni ishlatamiz. Aks holda, faqat `product.image`ni massivga solamiz.
    currentModalImages = product.images || (product.image ? [product.image] : []);
    updateModalSlider(); // Slayderni yangilaymiz

    // Modalni ko'rsatish
    if (newSimpleModal) {
        newSimpleModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Orqa fonni skroll qilishni to'xtatish
    } else {
        console.error("newSimpleModal elementi topilmadi, modal ochilmadi.");
    }
}

// ====== Yangi sodda modalni yopish funksiyasi ======
function closeNewSimpleModal() {
    if (newSimpleModal) { // newSimpleModal mavjudligini tekshirish
        newSimpleModal.style.display = 'none'; // Modalni yashirish
        document.body.style.overflow = ''; // Orqa fon skrollini qaytarish
    }
}

// ====== Header slayderini ishga tushirish funksiyasi ======
// Bu funksiya sizning so'rovingizga ko'ra qoldirildi, chunki siz uni olib tashlashni so'ramadingiz.
// Agar header slayder HTMLda mavjud bo'lmasa, bu ogohlantirish beradi va ishlamaydi.
function startHeaderSlider() {
    if (headerSliderImages.length > 0) {
        clearInterval(headerSliderInterval); // Oldingi taymerni to'xtatamiz

        // Barcha rasmlardan 'active' klassini olib tashlaymiz
        headerSliderImages.forEach(img => img.classList.remove('active'));

        // Joriy indeksni tekshiramiz
        if (currentSlide >= headerSliderImages.length || currentSlide < 0) {
            currentSlide = 0; // Agar indeks chegaradan chiqsa, birinchisiga qaytaramiz
        }

        // Joriy rasmga 'active' klassini qo'shamiz
        if (headerSliderImages[currentSlide]) {
            headerSliderImages[currentSlide].classList.add('active');
        } else {
            console.warn(`startHeaderSlider: headerSliderImages[${currentSlide}] elementi topilmadi.`);
            return;
        }

        // Slayderni avtomatik almashtirish uchun taymer o'rnatamiz
        headerSliderInterval = setInterval(() => {
            if (headerSliderImages[currentSlide]) {
                headerSliderImages[currentSlide].classList.remove('active');
            }
            currentSlide = (currentSlide + 1) % headerSliderImages.length; // Keyingi rasmga o'tamiz
            if (headerSliderImages[currentSlide]) {
                headerSliderImages[currentSlide].classList.add('active');
            }
        }, 3000); // Har 3 sekundda
    } else {
        console.warn("Header slider images topilmadi yoki massiv bo'sh. Slayder ishga tushirilmadi.");
    }
}

// ====== Mahsulotlarni sahifaga render qilish funksiyasi ======
function renderProducts(productsToRender) {
    if (!productsContainer) {
        console.error("renderProducts: productsContainer elementi topilmadi!");
        return;
    }
    productsContainer.innerHTML = ''; // Kontentni tozalash

    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');

        // Rasm va media HTML (agar videolar bo'lsa)
        let mediaHtml = '';
        if (product.type === 'video' && product.video) {
            mediaHtml = `<video src="${product.video}" controls autoplay loop class="product-image"></video>`;
        } else if (product.image) {
            mediaHtml = `<img src="${product.image}" alt="${product.name}" class="product-image">`;
        } else {
            mediaHtml = `<div class="no-image-placeholder">Rasm yo'q</div>`;
        }

        // Sevimli ikonka klassi (localStorage'dan olinadi)
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFav = favorites.includes(product.id);
        const heartClass = isFav ? 'fas' : 'far'; // fas - to'liq, far - bo'sh

        // Chegirma HTML
        let discountHtml = '';
        let discountedPrice = product.price;
        if (product.discount && product.discount > 0) {
            discountedPrice = product.price * (1 - product.discount / 100);
            discountHtml = `<span class="original-price">${product.price.toLocaleString('uz-UZ')} UZS</span> <span class="discount-percentage">-${product.discount}%</span>`;
        }

        productCard.innerHTML = `
            <div class="product-card-image-container">
                ${mediaHtml}
                <i class="favorite-icon ${heartClass}" data-product-id="${product.id}"></i>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${discountedPrice.toLocaleString('uz-UZ')} СМН ${discountHtml}</p>
                <div class="product-actions">
                    <button class="order-button" data-product-id="${product.id}">Заказ</button>
                    <button class="new-more-info-button" data-product-id="${product.id}">Подробный</button>
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
}

// ====== Favorit mahsulotlarni boshqarish funksiyasi (ilgari kommentariyada edi, endi to'liq) ======
function toggleFavorite(productId) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const index = favorites.indexOf(productId);

    if (index > -1) {
        favorites.splice(index, 1);
        console.log(`Mahsulot ID ${productId} favoritlardan olib tashlandi.`);
    } else {
        favorites.push(productId);
        console.log(`Mahsulot ID ${productId} favoritlarga qo'shildi.`);
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));

    // Sahifadagi va modal ichidagi favorit ikonkalarni yangilaymiz
    const productCardIcon = document.querySelector(`.product-card [data-product-id="${productId}"].favorite-icon`);
    if (productCardIcon) {
        if (favorites.includes(productId)) {
            productCardIcon.classList.remove('far');
            productCardIcon.classList.add('fas');
        } else {
            productCardIcon.classList.remove('fas');
            productCardIcon.classList.add('far');
        }
    }
    // Agar modal ochiq bo'lsa va joriy mahsulotga tegishli bo'lsa, uni ham yangilaymiz
    const favoriteIconModal = newSimpleModal ? newSimpleModal.querySelector('.favorite-icon-modal') : null;
    if (favoriteIconModal && parseInt(favoriteIconModal.dataset.productId) === productId) {
        if (favorites.includes(productId)) {
            favoriteIconModal.classList.remove('far');
            favoriteIconModal.classList.add('fas');
        } else {
            favoriteIconModal.classList.remove('fas');
            favoriteIconModal.classList.add('far');
        }
    }
}


// ===========================================
// Event Listenerlar
// ===========================================

// Yopish tugmasiga click
if (newCloseButton) {
    newCloseButton.addEventListener('click', closeNewSimpleModal);
} else {
    console.warn("newCloseButton elementi topilmadi! 'new-close-button' klassini tekshiring.");
}

// Modalning o'ziga click (kontentga emas)
if (newSimpleModal) {
    newSimpleModal.addEventListener('click', (event) => {
        if (event.target === newSimpleModal) {
            closeNewSimpleModal();
        }
    });
} else {
    console.warn("newSimpleModal elementi topilmadi! 'new-simple-modal' ID'sini tekshiring.");
}

// ESC tugmasi bosilganda yopish
document.addEventListener('keydown', (event) => {
    if (newSimpleModal && event.key === 'Escape' && newSimpleModal.style.display === 'flex') {
        closeNewSimpleModal();
    }
});

// ====== Modal slayderi navigatsiya tugmalari ======
if (newModalSliderPrevBtn) {
    newModalSliderPrevBtn.addEventListener('click', () => {
        currentModalSlideIndex--;
        updateModalSlider();
    });
}
if (newModalSliderNextBtn) {
    newModalSliderNextBtn.addEventListener('click', () => {
        currentModalSlideIndex++;
        updateModalSlider();
    });
}

// ===== `productsContainer` dagi click event listeneri (delegatsiya) =====
// Bu event listener mahsulot kartalari ichidagi tugmalarni tinglaydi
if (productsContainer) {
    productsContainer.addEventListener('click', (e) => {
        // "Mufassal" tugmasiga bosilganda sodda modalni ochish
        const newMoreInfoButton = e.target.closest('.new-more-info-button');
        if (newMoreInfoButton) {
            const productId = parseInt(newMoreInfoButton.dataset.productId);
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                openNewSimpleModal(product); // Yangi sodda modalni ochamiz
            } else {
                console.warn(`Mahsulot ID ${productId} allProducts massivida topilmadi.`);
            }
            e.stopPropagation(); // Boshqa eventlarning ishlashini to'xtatish
            return;
        }

        // Sevimli ikonkasiga bosilganda
        const favoriteIcon = e.target.closest('.favorite-icon');
        if (favoriteIcon) {
            e.stopPropagation();
            const productId = parseInt(favoriteIcon.dataset.productId);
            toggleFavorite(productId); // Favorit funksiyasini chaqiramiz
            return;
        }

        // Buyurtma tugmasiga bosilganda
        const orderButton = e.target.closest('.order-button');
        if (orderButton) {
            e.stopPropagation();
            const productId = parseInt(orderButton.dataset.productId);
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                // WhatsApp funksiyasi o'chirilgan, bu yerga boshqa buyurtma logikasini qo'shishingiz mumkin
                console.log(`Buyurtma tugmasi bosildi, mahsulot ID: ${productId}`);
            }
            return;
        }
    });
} else {
    console.error("productsContainer topilmadi! HTMLda ID 'products-container' mavjudligini tekshiring.");
}

// ====== Modal ichidagi "Favorit" ikonka ======
// Bu yerga ham event listener qo'shish kerak, chunki bu icon ham alohida bosilishi mumkin
const favoriteIconModal = newSimpleModal ? newSimpleModal.querySelector('.favorite-icon-modal') : null;
if (favoriteIconModal) {
    favoriteIconModal.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = parseInt(favoriteIconModal.dataset.productId);
        toggleFavorite(productId);
    });
}


// ====== Modal ichidagi "Buyurtma berish" tugmasi ======
const orderButtonModal = newSimpleModal ? newSimpleModal.querySelector('.order-button-modal') : null;
if (orderButtonModal) {
    orderButtonModal.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = parseInt(orderButtonModal.dataset.productId);
        const product = allProducts.find(p => p.id === productId);
        if (product) {
            // WhatsApp funksiyasi o'chirilgan, bu yerga boshqa buyurtma logikasini qo'shishingiz mumkin
            console.log(`Modal buyurtma tugmasi bosildi, mahsulot: ${product.name}`);
        }
    });
}


// ===========================================
// Ma'lumotlarni yuklash va init
// ===========================================




// Mahsulotlarni JSON faylidan yuklash
fetch('products.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        allProducts = data; // JSON fayli to'g'ridan-to'g'ri mahsulotlar massivi bo'ladi deb faraz qilinadi
        console.log("Mahsulotlar JSON dan yuklandi:", allProducts);
        renderProducts(allProducts); // Mahsulotlarni sahifaga render qilish
        startHeaderSlider(); // Header slayderni ma'lumotlar yuklangandan keyin ishga tushirish (agar mavjud bo'lsa)
    }).catch(error => console.error('Mahsulotlarni yuklashda xato:', error));




    // 
    // 

product.image



    