<p>
    حالة الطلب:
    <span id="order-status"
          data-order-id="{{ $order->id }}">
        {{ $order->status }}
    </span>
</p>
@vite('resources/js/order-details.js')