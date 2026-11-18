const orderId = document.getElementById('order-status')?.dataset.orderId;

if (orderId) {
    window.Echo.private(`orders.${orderId}`)
        .listen('.order.status.updated', (event) => {

            console.log('Order Status Changed:', event.status);

            document.getElementById('order-status').textContent =
                event.status;
        });
}