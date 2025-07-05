
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
    let allProducts = [];
    let favoriteProducts = JSON.parse(localStorage.getItem('favoriteProducts')) || [];
    let orderedProducts = JSON.parse(localStorage.getItem('orderedProducts')) || [];

    // --- 2. Ma'lumotlarni yuklash (fetchProducts) ---
    async function fetchProducts() {
        try {
            const response = await fetch('product-details.json');
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

    // --- 3. Mahsulotlarni asosiy sahifaga chiqarish (renderProducts) ---
    function renderProducts(productsToRender) {
        productsContainer.innerHTML = '';

        if (productsToRender.length === 0) {
            productsContainer.innerHTML = '<p class="no-results-message">Hech qanday mahsulot topilmadi.</p>';
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
                    <p class="product-price">${discountedPrice.toLocaleString('uz-UZ')} UZS ${discountHtml}</p>
                    <button class="order-button" data-product-id="${product.id}">Buyurtma berish</button>
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

            let whatsappNumber = "+992929642524";

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


// 
document.addEventListener('DOMContentLoaded', () => {
  const productsContainer = document.getElementById('products-container');

  productsContainer.addEventListener('click', () => {
    // Bu yerda siz yangi ochiladigan sahifa manzilini ko'rsatasiz
    window.location.href = 'index.html'; // o'rniga kerakli sahifa nomini yozing
  });
});









