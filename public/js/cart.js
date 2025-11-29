// Funcionalidades del carrito
class CartManager {
    constructor() {
        this.cartItems = document.querySelectorAll('.cart-item');
        this.totalElement = document.getElementById('cart-total');
        this.initializeEventListeners();
        this.updateTotal();
    }

    initializeEventListeners() {
        // Botones de cantidad
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleQuantityChange(e.target);
            });
        });

        // Botones de eliminar
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleRemoveItem(e.target);
            });
        });

        // Input de cantidad directa
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleDirectQuantityChange(e.target);
            });
        });
    }

    handleQuantityChange(button) {
        const item = button.closest('.cart-item');
        const input = item.querySelector('.quantity-input');
        let quantity = parseInt(input.value);
        
        if (button.classList.contains('increase')) {
            quantity++;
        } else if (button.classList.contains('decrease') && quantity > 1) {
            quantity--;
        }
        
        input.value = quantity;
        this.updateItemTotal(item);
        this.updateTotal();
        this.saveToSessionStorage();
    }

    handleDirectQuantityChange(input) {
        const quantity = parseInt(input.value);
        if (quantity < 1) {
            input.value = 1;
        }
        
        const item = input.closest('.cart-item');
        this.updateItemTotal(item);
        this.updateTotal();
        this.saveToSessionStorage();
    }

    handleRemoveItem(button) {
        const item = button.closest('.cart-item');
        item.style.animation = 'fadeOut 0.3s ease-out';
        
        setTimeout(() => {
            item.remove();
            this.updateTotal();
            this.saveToSessionStorage();
            
            if (document.querySelectorAll('.cart-item').length === 0) {
                this.showEmptyCart();
            }
        }, 300);
    }

    updateItemTotal(item) {
        const price = parseFloat(item.dataset.price);
        const quantity = parseInt(item.querySelector('.quantity-input').value);
        const total = price * quantity;
        
        item.querySelector('.item-total').textContent = `$${total.toFixed(2)}`;
    }

    updateTotal() {
        let total = 0;
        
        document.querySelectorAll('.cart-item').forEach(item => {
            const price = parseFloat(item.dataset.price);
            const quantity = parseInt(item.querySelector('.quantity-input').value);
            total += price * quantity;
        });
        
        if (this.totalElement) {
            this.totalElement.textContent = `$${total.toFixed(2)}`;
        }
    }

    showEmptyCart() {
        const cartContainer = document.querySelector('.cart-container');
        cartContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-shopping-cart fa-5x mb-3 text-muted"></i>
                <h3 class="text-muted">Tu carrito está vacío</h3>
                <p class="text-muted">Agrega algunos productos increíbles</p>
                <a href="/products" class="btn btn-primary mt-3">Ver Productos</a>
            </div>
        `;
    }

    saveToSessionStorage() {
        const cartData = [];
        document.querySelectorAll('.cart-item').forEach(item => {
            cartData.push({
                productId: item.dataset.productId,
                quantity: parseInt(item.querySelector('.quantity-input').value)
            });
        });
        sessionStorage.setItem('cartData', JSON.stringify(cartData));
    }

    loadFromSessionStorage() {
        const cartData = JSON.parse(sessionStorage.getItem('cartData') || '[]');
        // Implementar lógica para cargar datos del carrito
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.cart-container')) {
        new CartManager();
    }
});

// Funcionalidad para agregar al carrito
function addToCart(productId, productName) {
    // Verificar si el usuario está logueado
    fetch('/auth/check')
        .then(response => response.json())
        .then(data => {
            if (!data.loggedIn) {
                // Redirigir al login si no está logueado
                window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
                return;
            }

            // Agregar al carrito
            fetch('/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: 1
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification(`${productName} agregado al carrito`, 'success');
                    updateCartCounter(data.cartCount);
                } else {
                    showNotification('Error al agregar al carrito', 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error de conexión', 'danger');
            });
        })
        .catch(error => {
            console.error('Error:', error);
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        });
}

function updateCartCounter(count) {
    const cartCounter = document.getElementById('cart-counter');
    if (cartCounter) {
        cartCounter.textContent = count;
        cartCounter.classList.add('animate-pulse-slow');
        setTimeout(() => {
            cartCounter.classList.remove('animate-pulse-slow');
        }, 2000);
    }
}